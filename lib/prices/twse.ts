import type { PriceProvider, Quote } from "./types";

type TwseRow = { Code: string; ClosingPrice: string };
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
    const prices = await loadLatestQuotes();
    const price = prices.get(symbol.toUpperCase());
    if (!price) throw new Error(`TWSE has no latest closing price for ${symbol}`);
    return { symbol, price, currency: "TWD", source: "twse", capturedAt: new Date() };
  }
}
