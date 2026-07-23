import { AssetType, Market } from "@prisma/client";

type CategorizedAsset = { symbol: string; type: AssetType; market: Market; category: string | null };

const stablecoins = new Set(["USDT", "USDC", "DAI", "FDUSD", "TUSD", "BUSD", "USDE"]);
const ethereumEcosystem = new Set(["ETH", "WETH", "STETH", "LDO", "AAVE", "UNI", "LINK", "MKR", "ARB", "OP"]);
const memecoins = new Set(["DOGE", "SHIB", "PEPE", "FLOKI", "BONK", "WIF", "TRUMP", "MELANIA"]);
const solanaEcosystem = new Set(["SOL", "JUP", "RAY", "PYTH", "JTO"]);

export function inferAssetCategory(asset: CategorizedAsset) {
  if (asset.category?.trim()) return asset.category.trim();
  const symbol = asset.symbol.toUpperCase();
  if (asset.market === Market.CRYPTO) {
    if (stablecoins.has(symbol)) return "穩定幣";
    if (ethereumEcosystem.has(symbol)) return "乙太鏈系列";
    if (memecoins.has(symbol)) return "迷因幣";
    if (solanaEcosystem.has(symbol)) return "Solana 生態";
    if (symbol === "BTC") return "比特幣";
    return "其他虛擬幣";
  }
  if (asset.market === Market.TW) return asset.type === AssetType.ETF ? "台股 ETF" : "台灣股票";
  if (asset.market === Market.US) return asset.type === AssetType.ETF ? "美股 ETF" : "美國股票";
  if (asset.market === Market.CASH) return "現金";
  return "其他";
}
