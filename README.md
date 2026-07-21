# Asset Atlas

個人使用的投資資產儀表板。交易紀錄是唯一來源；持有數量、損益、資產配置與每日快照都由交易資料和價格紀錄計算。

## 本機啟動

```powershell
Copy-Item .env.example .env
docker compose up -d db
corepack pnpm install
corepack pnpm exec prisma migrate dev
corepack pnpm run db:seed
corepack pnpm run dev
```

開啟 `http://localhost:3000`。

## 免費雲端部署：Vercel + Neon

這個組合可以在電腦關機時仍讓手機開啟網站，並每天自動更新一次價格。

1. 在 GitHub 建立**私人**儲存庫，將本專案推送上去。不要提交 `.env` 或資料庫備份。
2. 到 Neon 建立免費 PostgreSQL 專案，複製它提供的連線字串。
3. 到 Vercel 用 GitHub 匯入該儲存庫。Framework 選 Next.js，維持預設的 Root Directory。
4. 在 Vercel 的 **Settings → Environment Variables** 設定：

   | 名稱 | 值 |
   | --- | --- |
   | `DATABASE_URL` | Neon 的 PostgreSQL 連線字串（須含 `sslmode=require`） |
   | `CRON_SECRET` | 自訂一組長度至少 16 的隨機英數字串 |
   | `DASHBOARD_PASSWORD` | 自訂網站密碼，建議只用英文字母、數字與符號 |
   | `BINANCE_BASE_URL` | `https://api.binance.com` |

5. 按 Deploy。Vercel 會執行 Prisma migration，建立資料表。部署完成後，用 Vercel 提供的網址從手機開啟；瀏覽器會要求帳號 `atlas` 與你設定的 `DASHBOARD_PASSWORD`。

`vercel.json` 已設定每日 `0 0 * * *` 的 UTC 排程，也就是台灣時間約 08:00。Vercel 免費 Hobby 排程一天僅能一次，且可能在 08:00–08:59 之間執行。

> 雲端 Neon 是一個全新的資料庫。若要保留目前本機輸入的商品與交易紀錄，請先備份並匯入資料庫後再切換使用；不要在尚未備份前刪除本機 Docker 資料庫。

## 排程與價格規則

- 開啟 Dashboard 時，價格在背景更新，不會阻塞畫面顯示。
- 台股、美股、ETF：目前價格與前一個交易日收盤價比較。
- Crypto：目前價格與台灣時間當日 00:00 的 Binance 價格比較。
- Vercel Cron 呼叫 `GET /api/jobs/daily`；排程端點由 `CRON_SECRET` 保護。

## 常用指令

```powershell
corepack pnpm exec prisma generate
corepack pnpm run snapshot
corepack pnpm run snapshot:backfill -- 2026-07-13 2026-07-20
```
