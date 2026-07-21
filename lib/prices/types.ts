export type Quote = { symbol: string; price: number; currency: string; source: string; capturedAt: Date };
export interface PriceProvider { getQuote(symbol: string): Promise<Quote>; }
