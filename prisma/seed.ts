import { AssetType, Market, PrismaClient, TransactionSide } from "@prisma/client";
const prisma = new PrismaClient();
const d = (value: string) => new Date(value);
async function main() {
  await prisma.price.deleteMany(); await prisma.transaction.deleteMany(); await prisma.asset.deleteMany();
  const assets = await Promise.all([
    prisma.asset.create({ data: { symbol: "TWD", name: "新台幣現金", type: AssetType.CASH, currency: "TWD", market: Market.CASH } }),
    prisma.asset.create({ data: { symbol: "2330", name: "台積電", type: AssetType.STOCK, currency: "TWD", market: Market.TW } }),
    prisma.asset.create({ data: { symbol: "0050", name: "元大台灣50", type: AssetType.ETF, currency: "TWD", market: Market.TW } }),
    prisma.asset.create({ data: { symbol: "BTC", name: "Bitcoin", type: AssetType.CRYPTO, currency: "USDT", market: Market.CRYPTO } }),
    prisma.asset.create({ data: { symbol: "ETH", name: "Ethereum", type: AssetType.CRYPTO, currency: "USDT", market: Market.CRYPTO } })
  ]);
  const [cash, tsmc, etf, btc, eth] = assets;
  await prisma.transaction.createMany({ data: [
    { assetId: cash.id, date: d("2025-01-02"), side: TransactionSide.DEPOSIT, unitPrice: 1, quantity: 2500000, currency: "TWD", fee: 0, tax: 0 },
    { assetId: tsmc.id, date: d("2025-02-10"), side: TransactionSide.BUY, unitPrice: 910, quantity: 500, currency: "TWD", fee: 640, tax: 0 },
    { assetId: etf.id, date: d("2025-03-03"), side: TransactionSide.BUY, unitPrice: 184, quantity: 3000, currency: "TWD", fee: 788, tax: 0 },
    { assetId: btc.id, date: d("2025-04-01"), side: TransactionSide.BUY, unitPrice: 82000, quantity: 0.12, currency: "USDT", fee: 10, tax: 0 },
    { assetId: eth.id, date: d("2025-04-01"), side: TransactionSide.BUY, unitPrice: 1800, quantity: 2, currency: "USDT", fee: 4, tax: 0 }
  ] });
  await prisma.price.createMany({ data: [
    { assetId: cash.id, price: 1, currency: "TWD", source: "manual", capturedAt: new Date() }, { assetId: tsmc.id, price: 1035, currency: "TWD", source: "demo", capturedAt: new Date() }, { assetId: etf.id, price: 205.5, currency: "TWD", source: "demo", capturedAt: new Date() }, { assetId: btc.id, price: 96500, currency: "USDT", source: "demo", capturedAt: new Date() }, { assetId: eth.id, price: 2650, currency: "USDT", source: "demo", capturedAt: new Date() }
  ] });
}
main().finally(() => prisma.$disconnect());
