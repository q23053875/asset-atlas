import { AssetType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPortfolio } from "@/lib/portfolio";
import { providerFor } from "@/lib/prices";
import { BinanceProvider } from "@/lib/prices/binance";
function taipeiCalendarDate() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts();
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
}
function taipeiMidnight() {
  const day = taipeiCalendarDate();
  // 00:00 Asia/Taipei is 16:00 UTC on the preceding calendar day.
  return new Date(day.getTime() - 8 * 60 * 60 * 1000);
}
export async function runDailyJob() {
  const today = taipeiCalendarDate();
  const assets = await prisma.asset.findMany({ where: { isActive: true, type: { not: AssetType.CASH } } });
  const currentPoint = new Date(today.getTime() + 1);
  const previousClosePoint = new Date(today.getTime() + 2);
  const midnight = taipeiMidnight();
  const updates = await Promise.allSettled(assets.map(async (asset) => {
    const quote = await providerFor(asset.market).getQuote(asset.symbol);
    await prisma.price.upsert({ where: { assetId_capturedAt: { assetId: asset.id, capturedAt: currentPoint } }, update: { price: quote.price, currency: quote.currency, source: `current:${quote.source}` }, create: { assetId: asset.id, price: quote.price, currency: quote.currency, source: `current:${quote.source}`, capturedAt: currentPoint } });
    if (asset.market === "TW" || asset.market === "US") {
      if (quote.previousClose && quote.previousClose > 0) {
        await prisma.price.upsert({ where: { assetId_capturedAt: { assetId: asset.id, capturedAt: previousClosePoint } }, update: { price: quote.previousClose, currency: quote.currency, source: "market:previous-close" }, create: { assetId: asset.id, price: quote.previousClose, currency: quote.currency, source: "market:previous-close", capturedAt: previousClosePoint } });
      }
    }
    if (asset.type === AssetType.CRYPTO) {
      const midnightQuote = await new BinanceProvider().getTaipeiMidnightPrice(asset.symbol, midnight);
      await prisma.price.upsert({ where: { assetId_capturedAt: { assetId: asset.id, capturedAt: midnight } }, update: { price: midnightQuote.price, currency: midnightQuote.currency, source: "crypto:midnight" }, create: { assetId: asset.id, price: midnightQuote.price, currency: midnightQuote.currency, source: "crypto:midnight", capturedAt: midnight } });
    }
  }));
  const portfolio = await getPortfolio();
  const map = (type: AssetType) => portfolio.holdings.filter((h) => h.type === type).reduce((s, h) => s + h.value, 0);
  await prisma.dailySnapshot.upsert({ where: { date: today }, update: { totalValue: portfolio.total, cashValue: map(AssetType.CASH), stockValue: map(AssetType.STOCK), etfValue: map(AssetType.ETF), cryptoValue: map(AssetType.CRYPTO), otherValue: map(AssetType.BOND) + map(AssetType.OTHER) }, create: { date: today, totalValue: portfolio.total, cashValue: map(AssetType.CASH), stockValue: map(AssetType.STOCK), etfValue: map(AssetType.ETF), cryptoValue: map(AssetType.CRYPTO), otherValue: map(AssetType.BOND) + map(AssetType.OTHER) } });
  const leader = [...portfolio.holdings].sort((a, b) => b.dailyChange - a.dailyChange)[0];
  await prisma.dailyInsight.upsert({ where: { date: today }, update: { summary: `今日總資產為 NT$${Math.round(portfolio.total).toLocaleString("zh-TW")}；${leader ? `${leader.name} 今日 ${leader.dailyChange >= 0 ? "上漲" : "下跌"} ${Math.abs(leader.dailyChange).toFixed(2)}%，為主要變動來源。` : "尚無可分析的持倉。"}` }, create: { date: today, summary: `今日總資產為 NT$${Math.round(portfolio.total).toLocaleString("zh-TW")}。` } });
  return { updated: updates.filter((x) => x.status === "fulfilled").length, failed: updates.filter((x) => x.status === "rejected").length };
}
