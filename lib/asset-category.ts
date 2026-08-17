import { AssetType, Market } from "@prisma/client";

type CategorizedAsset = { symbol: string; type: AssetType; market: Market; category: string | null };

const genericCategories = new Set(["台灣股票", "美國股票", "台股 ETF", "美股 ETF", "穩定幣", "乙太鏈系列", "迷因幣", "Solana 生態", "比特幣", "其他虛擬幣", "現金", "其他"]);

const categoriesBySymbol: Record<string, string> = {
  "2330": "晶圓代工／半導體",
  "8112": "電子通路",
  "5243": "電子零組件／機構件",
  "3029": "資訊服務／系統整合",
  "2883": "金融控股",
  "0050": "台灣大型權值 ETF",
  "00919": "台股高股息 ETF",
  "00403A": "主動式台股 ETF",
  NVDA: "AI／半導體",
  OXY: "石油／天然氣",
  FANG: "石油／天然氣",
  LMT: "軍工／國防航太",
  RTX: "軍工／國防航太",
  SPCX: "太空／航太",
  BTC: "比特幣",
  ETH: "以太坊主網原生幣",
  ADA: "Cardano 生態系原生幣",
  BNB: "幣安生態系原生加密貨幣",
  XPL: "穩定幣支付 Layer 1",
  MITO: "DeFi／流動性協議",
  SPCXB: "代幣化私募股權／太空",
  USDT: "美元穩定幣",
};

export function inferAssetCategory(asset: CategorizedAsset) {
  const symbol = asset.symbol.toUpperCase();
  const savedCategory = asset.category?.trim();
  if (savedCategory && !genericCategories.has(savedCategory)) return savedCategory;
  if (categoriesBySymbol[symbol]) return categoriesBySymbol[symbol];
  if (asset.market === Market.CRYPTO) {
    return "其他虛擬幣";
  }
  if (asset.market === Market.TW) return asset.type === AssetType.ETF ? "台股 ETF" : "台灣股票";
  if (asset.market === Market.US) return asset.type === AssetType.ETF ? "美股 ETF" : "美國股票";
  if (asset.market === Market.CASH) return "現金";
  return "其他";
}
