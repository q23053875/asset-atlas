import type { PriceProvider, Quote } from "./types";
export class YahooFinanceProvider implements PriceProvider {
  async getQuote(symbol: string): Promise<Quote> {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=1d`, { next: { revalidate: 0 } });
    if (!response.ok) throw new Error(`Yahoo Finance quote unavailable for ${symbol}`);
    const payload = (await response.json()) as { chart: { result: Array<{ meta: { regularMarketPrice?: number; currency?: string } }> } };
    const meta = payload.chart.result[0]?.meta;
    if (!meta?.regularMarketPrice) throw new Error(`Yahoo Finance quote missing for ${symbol}`);
    return { symbol, price: meta.regularMarketPrice, currency: meta.currency ?? "USD", source: "yahoo-finance", capturedAt: new Date() };
  }
}
