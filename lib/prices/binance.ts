import type { PriceProvider, Quote } from "./types";

async function fetchPublicMarketData(path: string) {
  const configuredBase = process.env.BINANCE_BASE_URL ?? "https://api.binance.com";
  const bases = [...new Set([configuredBase, "https://data-api.binance.vision"])];
  let lastError = "Binance market data unavailable";
  for (const base of bases) {
    try {
      const response = await fetch(`${base}${path}`, { next: { revalidate: 0 } });
      if (response.ok) return response;
      lastError = `Binance market data unavailable (${response.status})`;
    } catch (error) { lastError = error instanceof Error ? error.message : lastError; }
  }
  throw new Error(lastError);
}

export class BinanceProvider implements PriceProvider {
  async getQuote(symbol: string): Promise<Quote> {
    if (symbol.toUpperCase() === "USDT") return { symbol, price: 1, currency: "USDT", source: "binance-stablecoin", capturedAt: new Date() };
    const response = await fetchPublicMarketData(`/api/v3/ticker/price?symbol=${symbol.toUpperCase()}USDT`);
    const data = (await response.json()) as { price: string };
    return { symbol, price: Number(data.price), currency: "USDT", source: "binance", capturedAt: new Date() };
  }

  /** Opening price of the first minute at 00:00 in Taiwan (UTC+8). */
  async getTaipeiMidnightPrice(symbol: string, at: Date): Promise<Quote> {
    if (symbol.toUpperCase() === "USDT") {
      return { symbol, price: 1, currency: "USDT", source: "binance-midnight", capturedAt: at };
    }
    const response = await fetchPublicMarketData(`/api/v3/klines?symbol=${symbol.toUpperCase()}USDT&interval=1m&startTime=${at.getTime()}&limit=1`);
    const row = (await response.json()) as Array<[number, string]>;
    const price = Number(row[0]?.[1]);
    if (!Number.isFinite(price) || price <= 0) throw new Error(`Binance midnight price missing for ${symbol}`);
    return { symbol, price, currency: "USDT", source: "binance-midnight", capturedAt: at };
  }
}
