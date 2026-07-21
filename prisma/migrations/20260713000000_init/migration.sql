CREATE TYPE "AssetType" AS ENUM ('STOCK', 'ETF', 'CRYPTO', 'CASH', 'BOND', 'OTHER');
CREATE TYPE "TransactionSide" AS ENUM ('BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL', 'FEE', 'DIVIDEND');
CREATE TYPE "Market" AS ENUM ('TW', 'US', 'CRYPTO', 'CASH', 'OTHER');

CREATE TABLE "Asset" (
  "id" TEXT NOT NULL, "symbol" TEXT NOT NULL, "name" TEXT NOT NULL, "type" "AssetType" NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TWD', "market" "Market" NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Transaction" (
  "id" TEXT NOT NULL, "date" TIMESTAMP(3) NOT NULL, "assetId" TEXT NOT NULL, "side" "TransactionSide" NOT NULL,
  "unitPrice" DECIMAL(20,8) NOT NULL, "quantity" DECIMAL(20,8) NOT NULL, "fee" DECIMAL(20,8) NOT NULL DEFAULT 0,
  "tax" DECIMAL(20,8) NOT NULL DEFAULT 0, "currency" TEXT NOT NULL, "note" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Price" (
  "id" TEXT NOT NULL, "assetId" TEXT NOT NULL, "price" DECIMAL(20,8) NOT NULL, "currency" TEXT NOT NULL,
  "source" TEXT NOT NULL, "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DailySnapshot" (
  "id" TEXT NOT NULL, "date" DATE NOT NULL, "totalValue" DECIMAL(20,2) NOT NULL, "cashValue" DECIMAL(20,2) NOT NULL,
  "stockValue" DECIMAL(20,2) NOT NULL, "etfValue" DECIMAL(20,2) NOT NULL, "cryptoValue" DECIMAL(20,2) NOT NULL,
  "otherValue" DECIMAL(20,2) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DailySnapshot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DailyInsight" (
  "id" TEXT NOT NULL, "date" DATE NOT NULL, "summary" TEXT NOT NULL, "payload" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DailyInsight_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Asset_symbol_market_key" ON "Asset"("symbol", "market");
CREATE INDEX "Asset_name_idx" ON "Asset"("name");
CREATE INDEX "Transaction_assetId_date_idx" ON "Transaction"("assetId", "date");
CREATE UNIQUE INDEX "Price_assetId_capturedAt_key" ON "Price"("assetId", "capturedAt");
CREATE INDEX "Price_assetId_capturedAt_idx" ON "Price"("assetId", "capturedAt");
CREATE UNIQUE INDEX "DailySnapshot_date_key" ON "DailySnapshot"("date");
CREATE UNIQUE INDEX "DailyInsight_date_key" ON "DailyInsight"("date");
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Price" ADD CONSTRAINT "Price_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
