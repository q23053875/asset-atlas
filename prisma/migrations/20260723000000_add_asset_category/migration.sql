ALTER TABLE "Asset" ADD COLUMN "category" TEXT;

UPDATE "Asset"
SET "category" = CASE
  WHEN "market" = 'CRYPTO' AND UPPER("symbol") IN ('USDT', 'USDC', 'DAI', 'FDUSD', 'TUSD', 'BUSD', 'USDE') THEN '穩定幣'
  WHEN "market" = 'CRYPTO' AND UPPER("symbol") IN ('ETH', 'WETH', 'STETH', 'LDO', 'AAVE', 'UNI', 'LINK', 'MKR', 'ARB', 'OP') THEN '乙太鏈系列'
  WHEN "market" = 'CRYPTO' AND UPPER("symbol") IN ('DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'TRUMP', 'MELANIA') THEN '迷因幣'
  WHEN "market" = 'CRYPTO' AND UPPER("symbol") IN ('SOL', 'JUP', 'RAY', 'PYTH', 'JTO') THEN 'Solana 生態'
  WHEN "market" = 'CRYPTO' AND UPPER("symbol") = 'BTC' THEN '比特幣'
  WHEN "market" = 'CRYPTO' THEN '其他虛擬幣'
  WHEN "market" = 'TW' AND "type" = 'ETF' THEN '台股 ETF'
  WHEN "market" = 'TW' THEN '台灣股票'
  WHEN "market" = 'US' AND "type" = 'ETF' THEN '美股 ETF'
  WHEN "market" = 'US' THEN '美國股票'
  WHEN "market" = 'CASH' THEN '現金'
  ELSE '其他'
END
WHERE "category" IS NULL;
