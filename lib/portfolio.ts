import { AssetType, Market, TransactionSide } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toTwd } from "@/lib/fx";
import { inferAssetCategory } from "@/lib/asset-category";

export type Holding = { id: string; symbol: string; name: string; type: AssetType; market: Market; category: string; quantity: number; averageCost: number; cost: number; price: number; value: number; unrealized: number; realized: number; returnRate: number; dailyChange: number };
type HistoryPoint = { date: string; value: number };
type MarketHistory = { tw: HistoryPoint[]; us: HistoryPoint[]; crypto: HistoryPoint[] };
const n = (x: { toString(): string } | number) => Number(x.toString());
const taipeiDay = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
export async function getHoldings(): Promise<Holding[]> {
  const assets = await prisma.asset.findMany({ where: { isActive: true }, include: { transactions: { orderBy: { date: "asc" } }, prices: { orderBy: { capturedAt: "desc" } } } });
  return Promise.all(assets.map(async (asset) => {
    let quantity = 0, cost = 0, realized = 0;
    for (const tx of asset.transactions) {
      const rate = await toTwd(1, tx.currency, tx.date);
      const q = n(tx.quantity), unit = n(tx.unitPrice) * rate, fees = (n(tx.fee) + n(tx.tax)) * rate;
      if (tx.side === TransactionSide.BUY || tx.side === TransactionSide.DEPOSIT) { quantity += q; cost += q * unit + fees; }
      if (tx.side === TransactionSide.SELL || tx.side === TransactionSide.WITHDRAWAL) { const avg = quantity ? cost / quantity : 0; realized += q * unit - fees - q * avg; cost -= q * avg; quantity -= q; }
      if (tx.side === TransactionSide.DIVIDEND) realized += q * unit - fees;
    }
    // A refresh creates a `current:` point.  Stocks/ETFs are compared with the
    // last price saved before today (the previous market close); crypto is
    // compared with the dedicated Taiwan-midnight point saved by the job.
    const today = taipeiDay(new Date());
    const currentPrice = asset.prices.find((item) => item.source.startsWith("current:") && taipeiDay(item.capturedAt) === today) ?? asset.prices[0];
    const comparisonPrice = asset.type === AssetType.CRYPTO
      ? asset.prices.find((item) => item.source === "crypto:midnight" && taipeiDay(item.capturedAt) === today)
      : asset.prices.find((item) => !item.source.startsWith("current:") && taipeiDay(item.capturedAt) < today);
    const price = asset.type === AssetType.CASH ? 1 : currentPrice ? await toTwd(n(currentPrice.price), currentPrice.currency, currentPrice.capturedAt) : 0;
    const previous = asset.type === AssetType.CASH ? 1 : comparisonPrice ? await toTwd(n(comparisonPrice.price), comparisonPrice.currency, comparisonPrice.capturedAt) : price;
    const value = quantity * price, averageCost = quantity ? cost / quantity : 0;
    return { id: asset.id, symbol: asset.symbol, name: asset.name, type: asset.type, market: asset.market, category: inferAssetCategory(asset), quantity, averageCost, cost, price, value, unrealized: value - cost, realized, returnRate: cost ? ((value - cost) / cost) * 100 : 0, dailyChange: previous ? ((price - previous) / previous) * 100 : 0 };
  }));
}

async function historicalUsdTwdRates(dates: Date[]) {
  const result = new Map<string, number>();
  if (!dates.length) return result;
  const start = Math.floor((dates[0].getTime() - 7 * 86_400_000) / 1000);
  const end = Math.floor((dates.at(-1)!.getTime() + 86_400_000) / 1000);
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/TWD=X?period1=${start}&period2=${end}&interval=1d`, { next: { revalidate: 86_400 } });
    if (!response.ok) throw new Error("Exchange-rate history unavailable");
    const payload = (await response.json()) as { chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> } };
    const source = payload.chart?.result?.[0];
    const quotes = (source?.timestamp ?? []).flatMap((timestamp, index) => {
      const rate = source?.indicators?.quote?.[0]?.close?.[index];
      return rate ? [{ date: new Date(timestamp * 1000), rate }] : [];
    });
    let index = 0;
    let latest = quotes[0]?.rate ?? 30;
    for (const date of dates) {
      while (index < quotes.length && quotes[index].date.getTime() <= date.getTime() + 86_400_000) latest = quotes[index++].rate;
      result.set(date.toISOString().slice(0, 10), latest);
    }
  } catch {
    for (const date of dates) result.set(date.toISOString().slice(0, 10), 30);
  }
  return result;
}

async function getMarketHistory(snapshotDates: Date[]): Promise<MarketHistory> {
  const history: MarketHistory = { tw: [], us: [], crypto: [] };
  if (!snapshotDates.length) return history;
  const assets = await prisma.asset.findMany({ where: { isActive: true, market: { in: [Market.TW, Market.US, Market.CRYPTO] } }, include: { transactions: { orderBy: { date: "asc" } }, prices: { orderBy: { capturedAt: "asc" } } } });
  const rates = await historicalUsdTwdRates(snapshotDates);
  const states = assets.map((asset) => ({ asset, quantity: 0, transactionIndex: 0, priceIndex: 0, latestPrice: undefined as typeof asset.prices[number] | undefined, latestTransaction: undefined as typeof asset.transactions[number] | undefined }));

  for (const date of snapshotDates) {
    const cutoff = date.getTime() + 86_400_000 - 1;
    const totals = { tw: 0, us: 0, crypto: 0 };
    for (const state of states) {
      while (state.transactionIndex < state.asset.transactions.length && state.asset.transactions[state.transactionIndex].date.getTime() <= cutoff) {
        const transaction = state.asset.transactions[state.transactionIndex++];
        const quantity = n(transaction.quantity);
        if (transaction.side === TransactionSide.BUY || transaction.side === TransactionSide.DEPOSIT) state.quantity += quantity;
        if (transaction.side === TransactionSide.SELL || transaction.side === TransactionSide.WITHDRAWAL) state.quantity -= quantity;
        state.latestTransaction = transaction;
      }
      while (state.priceIndex < state.asset.prices.length && state.asset.prices[state.priceIndex].capturedAt.getTime() <= cutoff) state.latestPrice = state.asset.prices[state.priceIndex++];
      if (Math.abs(state.quantity) < 0.00000001) continue;
      const rawPrice = state.latestPrice ? n(state.latestPrice.price) : state.latestTransaction ? n(state.latestTransaction.unitPrice) : 0;
      const currency = state.latestPrice?.currency ?? state.latestTransaction?.currency ?? state.asset.currency;
      const rate = currency === "TWD" ? 1 : rates.get(date.toISOString().slice(0, 10)) ?? 30;
      const value = state.quantity * rawPrice * rate;
      if (state.asset.market === Market.TW) totals.tw += value;
      if (state.asset.market === Market.US) totals.us += value;
      if (state.asset.market === Market.CRYPTO) totals.crypto += value;
    }
    const point = { date: date.toISOString().slice(0, 10) };
    history.tw.push({ ...point, value: totals.tw });
    history.us.push({ ...point, value: totals.us });
    history.crypto.push({ ...point, value: totals.crypto });
  }
  return history;
}
export async function getPortfolio() {
  const holdings = await getHoldings();
  const byType = (type: AssetType) => holdings.filter((h) => h.type === type).reduce((s, h) => s + h.value, 0);
  const total = holdings.reduce((s, h) => s + h.value, 0);
  const cost = holdings.reduce((s, h) => s + h.cost, 0);
  const [snapshots, firstTransaction] = await Promise.all([prisma.dailySnapshot.findMany({ orderBy: { date: "asc" } }), prisma.transaction.findFirst({ orderBy: { date: "asc" }, select: { date: true } })]);
  const needsHistoryBackfill = Boolean(firstTransaction && (!snapshots[0] || snapshots[0].date > firstTransaction.date));
  const marketHistory = await getMarketHistory(snapshots.map((snapshot) => snapshot.date));
  return { holdings, total, cost, unrealized: total - cost, realized: holdings.reduce((s, h) => s + h.realized, 0), allocation: [{ name: "現金", value: byType(AssetType.CASH) }, { name: "台股", value: byType(AssetType.STOCK) }, { name: "ETF", value: byType(AssetType.ETF) }, { name: "Crypto", value: byType(AssetType.CRYPTO) }, { name: "其他", value: byType(AssetType.BOND) + byType(AssetType.OTHER) }].filter((x) => x.value > 0), snapshots: snapshots.map((s) => ({ date: s.date.toISOString().slice(0, 10), value: n(s.totalValue) })), marketHistory, needsHistoryBackfill };
}
