import { Market } from "@prisma/client";
import { BinanceProvider } from "./binance";
import { TwseProvider } from "./twse";
import { YahooFinanceProvider } from "./yahoo";
import type { PriceProvider } from "./types";
export function providerFor(market: Market): PriceProvider {
  if (market === Market.CRYPTO) return new BinanceProvider();
  if (market === Market.TW) return new TwseProvider();
  if (market === Market.US) return new YahooFinanceProvider();
  throw new Error(`No price provider configured for ${market}`);
}
