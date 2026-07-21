import type { PriceProvider, Quote } from "./types";
const prices: Record<string, number> = { "2330": 1035, "0050": 205.5, TWD: 1 };
export class DemoTaiwanProvider implements PriceProvider { async getQuote(symbol: string): Promise<Quote> { const price = prices[symbol]; if (!price) throw new Error(`No demo quote configured: ${symbol}`); return { symbol, price, currency: "TWD", source: "demo", capturedAt: new Date() }; } }
