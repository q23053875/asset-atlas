import { AssetType, PrismaClient, TransactionSide } from "@prisma/client";
import { toTwd } from "../lib/fx";

const prisma = new PrismaClient();
const dayMs = 86_400_000;
const num = (value: { toString(): string }) => Number(value.toString());

function datesBetween(from: Date, to: Date) {
  const result: Date[] = [];
  for (let time = from.getTime(); time <= to.getTime(); time += dayMs) result.push(new Date(time));
  return result;
}

function lastPriceBefore(prices: Map<number, number>, cutoff: Date) {
  return [...prices.entries()].filter(([time]) => time < cutoff.getTime()).sort(([a], [b]) => b - a)[0]?.[1];
}

async function twseHistory(symbol: string, from: Date, to: Date) {
  const months = new Set(datesBetween(from, to).map((day) => `${day.getUTCFullYear()}${String(day.getUTCMonth() + 1).padStart(2, "0")}15`));
  const records = await Promise.all([...months].map(async (date) => {
    const response = await fetch(`https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date=${date}&stockNo=${symbol}&response=json`);
    if (!response.ok) return [] as [number, number][];
    const payload = (await response.json()) as { data?: string[][] };
    return (payload.data ?? []).flatMap((row) => {
      const match = row[0]?.match(/(\d+)\/(\d+)\/(\d+)/);
      const price = Number(row[6]?.replaceAll(",", ""));
      if (!match || !Number.isFinite(price) || price <= 0) return [];
      return [[Date.UTC(Number(match[1]) + 1911, Number(match[2]) - 1, Number(match[3])), price] as [number, number]];
    });
  }));
  return new Map(records.flat());
}

async function yahooHistory(symbol: string, from: Date, to: Date) {
  const period1 = Math.floor((from.getTime() - 3 * dayMs) / 1000);
  const period2 = Math.floor((to.getTime() + dayMs) / 1000);
  const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`);
  if (!response.ok) return new Map<number, number>();
  const result = ((await response.json()) as { chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> } }).chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  return new Map(timestamps.flatMap((timestamp, index) => closes[index] ? [[timestamp * 1000, closes[index]!] as [number, number]] : []));
}

async function binanceHistory(symbol: string, from: Date, to: Date) {
  if (symbol === "USDT") return new Map(datesBetween(from, to).map((day) => [day.getTime() - dayMs, 1]));
  const startTime = from.getTime() - 3 * dayMs;
  const endTime = to.getTime() + dayMs;
  const response = await fetch(`${process.env.BINANCE_BASE_URL ?? "https://api.binance.com"}/api/v3/klines?symbol=${symbol}USDT&interval=1d&startTime=${startTime}&endTime=${endTime}`);
  if (!response.ok) return new Map<number, number>();
  const rows = (await response.json()) as Array<[number, string, string, string, string]>;
  return new Map(rows.map((row) => [row[0], Number(row[4])]));
}

export async function backfillSnapshots(start: Date, end: Date) {
  if (start > end) throw new Error("Start date must be before end date.");
  const assets = await prisma.asset.findMany({ include: { transactions: { orderBy: { date: "asc" } } } });
  const histories = new Map<string, Map<number, number>>();
  await Promise.all(assets.map(async (asset) => {
    try {
      const history = asset.type === AssetType.CASH ? new Map(datesBetween(start, end).map((day) => [day.getTime() - dayMs, 1])) : asset.market === "TW" ? await twseHistory(asset.symbol, start, end) : asset.market === "US" ? await yahooHistory(asset.symbol, start, end) : asset.market === "CRYPTO" ? await binanceHistory(asset.symbol, start, end) : new Map<number, number>();
      histories.set(asset.id, history);
    } catch { histories.set(asset.id, new Map()); }
  }));

  for (const day of datesBetween(start, end)) {
    const values = { cash: 0, stock: 0, etf: 0, crypto: 0, other: 0 };
    for (const asset of assets) {
      let quantity = 0;
      for (const tx of asset.transactions.filter((transaction) => transaction.date <= day)) {
        const q = num(tx.quantity);
        if (tx.side === TransactionSide.BUY || tx.side === TransactionSide.DEPOSIT) quantity += q;
        if (tx.side === TransactionSide.SELL || tx.side === TransactionSide.WITHDRAWAL) quantity -= q;
      }
      if (!quantity) continue;
      const historicalPrice = lastPriceBefore(histories.get(asset.id) ?? new Map(), day);
      const fallbackPrice = num(asset.transactions.filter((transaction) => transaction.date <= day).at(-1)?.unitPrice ?? { toString: () => "0" });
      const price = historicalPrice ?? fallbackPrice;
      await prisma.price.upsert({ where: { assetId_capturedAt: { assetId: asset.id, capturedAt: day } }, update: { price, currency: asset.currency, source: historicalPrice ? "historical" : "transaction-fallback" }, create: { assetId: asset.id, price, currency: asset.currency, source: historicalPrice ? "historical" : "transaction-fallback", capturedAt: day } });
      const value = quantity * await toTwd(price, asset.currency, day);
      if (asset.type === AssetType.CASH) values.cash += value;
      else if (asset.type === AssetType.STOCK) values.stock += value;
      else if (asset.type === AssetType.ETF) values.etf += value;
      else if (asset.type === AssetType.CRYPTO) values.crypto += value;
      else values.other += value;
    }
    const totalValue = values.cash + values.stock + values.etf + values.crypto + values.other;
    await prisma.dailySnapshot.upsert({ where: { date: day }, update: { totalValue, cashValue: values.cash, stockValue: values.stock, etfValue: values.etf, cryptoValue: values.crypto, otherValue: values.other }, create: { date: day, totalValue, cashValue: values.cash, stockValue: values.stock, etfValue: values.etf, cryptoValue: values.crypto, otherValue: values.other } });
  }
  return { count: datesBetween(start, end).length, from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

if (process.argv[1]?.includes("backfill-snapshots")) {
  const start = new Date(`${process.argv[2] ?? "2026-07-13"}T00:00:00.000Z`);
  const end = new Date(`${process.argv[3] ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
  backfillSnapshots(start, end).then((result) => console.log(`Backfilled ${result.count} snapshots from ${result.from} to ${result.to}.`)).finally(() => prisma.$disconnect());
}
