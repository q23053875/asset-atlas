export type Quote = { symbol: string; price: number; previousClose?: number; currency: string; source: string; capturedAt: Date };
export interface PriceProvider { getQuote(symbol: string): Promise<Quote>; }
