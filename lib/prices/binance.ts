import type { PriceProvider, Quote } from "./types";
export class BinanceProvider implements PriceProvider {
  async getQuote(symbol: string): Promise<Quote> {
    const base = process.env.BINANCE_BASE_URL ?? "https://api.binance.com";
    const response = await fetch(`${base}/api/v3/ticker/price?symbol=${symbol.toUpperCase()}USDT`, { next: { revalidate: 0 } });
    if (!response.ok) throw new Error(`Binance quote unavailable for ${symbol}`);
    const data = (await response.json()) as { price: string };
    return { symbol, price: Number(data.price), currency: "USDT", source: "binance", capturedAt: new Date() };
  }

  /** Opening price of the first minute at 00:00 in Taiwan (UTC+8). */
  async getTaipeiMidnightPrice(symbol: string, at: Date): Promise<Quote> {
    if (symbol.toUpperCase() === "USDT") {
      return { symbol, price: 1, currency: "USDT", source: "binance-midnight", capturedAt: at };
    }
    const base = process.env.BINANCE_BASE_URL ?? "https://api.binance.com";
    const response = await fetch(`${base}/api/v3/klines?symbol=${symbol.toUpperCase()}USDT&interval=1m&startTime=${at.getTime()}&limit=1`, { next: { revalidate: 0 } });
    if (!response.ok) throw new Error(`Binance midnight price unavailable for ${symbol}`);
    const row = (await response.json()) as Array<[number, string]>;
    const price = Number(row[0]?.[1]);
    if (!Number.isFinite(price) || price <= 0) throw new Error(`Binance midnight price missing for ${symbol}`);
    return { symbol, price, currency: "USDT", source: "binance-midnight", capturedAt: at };
  }
}
