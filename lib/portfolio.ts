import { AssetType, Market, TransactionSide } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toTwd } from "@/lib/fx";

export type Holding = { id: string; symbol: string; name: string; type: AssetType; market: Market; quantity: number; averageCost: number; cost: number; price: number; value: number; unrealized: number; realized: number; returnRate: number; dailyChange: number };
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
    const currentPrice = asset.prices.find((item) => item.source.startsWith("current:")) ?? asset.prices[0];
    const comparisonPrice = asset.type === AssetType.CRYPTO
      ? asset.prices.find((item) => item.source === "crypto:midnight" && taipeiDay(item.capturedAt) === today)
      : asset.prices.find((item) => taipeiDay(item.capturedAt) < today);
    const price = asset.type === AssetType.CASH ? 1 : currentPrice ? await toTwd(n(currentPrice.price), currentPrice.currency, currentPrice.capturedAt) : 0;
    const previous = asset.type === AssetType.CASH ? 1 : comparisonPrice ? await toTwd(n(comparisonPrice.price), comparisonPrice.currency, comparisonPrice.capturedAt) : price;
    const value = quantity * price, averageCost = quantity ? cost / quantity : 0;
    return { id: asset.id, symbol: asset.symbol, name: asset.name, type: asset.type, market: asset.market, quantity, averageCost, cost, price, value, unrealized: value - cost, realized, returnRate: cost ? ((value - cost) / cost) * 100 : 0, dailyChange: previous ? ((price - previous) / previous) * 100 : 0 };
  }));
}
export async function getPortfolio() {
  const holdings = await getHoldings();
  const byType = (type: AssetType) => holdings.filter((h) => h.type === type).reduce((s, h) => s + h.value, 0);
  const total = holdings.reduce((s, h) => s + h.value, 0);
  const cost = holdings.reduce((s, h) => s + h.cost, 0);
  const [snapshots, firstTransaction] = await Promise.all([prisma.dailySnapshot.findMany({ orderBy: { date: "asc" } }), prisma.transaction.findFirst({ orderBy: { date: "asc" }, select: { date: true } })]);
  const needsHistoryBackfill = Boolean(firstTransaction && (!snapshots[0] || snapshots[0].date > firstTransaction.date));
  return { holdings, total, cost, unrealized: total - cost, realized: holdings.reduce((s, h) => s + h.realized, 0), allocation: [{ name: "現金", value: byType(AssetType.CASH) }, { name: "台股", value: byType(AssetType.STOCK) }, { name: "ETF", value: byType(AssetType.ETF) }, { name: "Crypto", value: byType(AssetType.CRYPTO) }, { name: "其他", value: byType(AssetType.BOND) + byType(AssetType.OTHER) }].filter((x) => x.value > 0), snapshots: snapshots.map((s) => ({ date: s.date.toISOString().slice(0, 10), value: n(s.totalValue) })), needsHistoryBackfill };
}
