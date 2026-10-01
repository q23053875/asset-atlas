import type { PriceProvider, Quote } from "./types";

type TwseRow = { Code: string; ClosingPrice: string };
type TwseRealtimeRow = { c?: string; z?: string; y?: string };
let cachedQuotes: Map<string, number> | undefined;
let cacheExpiresAt = 0;

async function loadLatestQuotes() {
  if (cachedQuotes && Date.now() < cacheExpiresAt) return cachedQuotes;
  const response = await fetch("https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL", {
    next: { revalidate: 60 },
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error("TWSE closing-price feed is unavailable");
  const data = (await response.json()) as TwseRow[];
  cachedQuotes = new Map(
    data
      .map((row) => [row.Code, Number(row.ClosingPrice.replaceAll(",", ""))] as const)
      .filter(([, price]) => Number.isFinite(price) && price > 0)
  );
  cacheExpiresAt = Date.now() + 60_000;
  return cachedQuotes;
}

/** Official TWSE end-of-day prices for listed Taiwan stocks and ETFs. */
export class TwseProvider implements PriceProvider {
  async getQuote(symbol: string): Promise<Quote> {
    const normalized = symbol.toUpperCase();
    try {
      const response = await fetch(`https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${normalized}.tw&json=1&delay=0`, { next: { revalidate: 0 } });
      if (response.ok) {
        const payload = (await response.json()) as { msgArray?: TwseRealtimeRow[] };
        const row = payload.msgArray?.find((item) => item.c === normalized);
        const price = Number(row?.z);
        const previousClose = Number(row?.y);
        if (Number.isFinite(price) && price > 0 && Number.isFinite(previousClose) && previousClose > 0) {
          return { symbol, price, previousClose, currency: "TWD", source: "twse-realtime", capturedAt: new Date() };
        }
      }
    } catch { /* Fall back to the official end-of-day feed below. */ }
    const prices = await loadLatestQuotes();
    const price = prices.get(normalized);
    if (!price) throw new Error(`TWSE has no latest closing price for ${symbol}`);
    return { symbol, price, currency: "TWD", source: "twse", capturedAt: new Date() };
  }
}
