"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Plus, ReceiptText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Asset = { id: string; symbol: string; name: string; type: string; currency: string; market: string; category: string | null };
const input = "mt-1 w-full rounded-lg border bg-canvas px-3 py-2 text-sm outline-none focus:border-accent";
const label = "text-sm font-medium";
export function TransactionManager({ assets }: { assets: Asset[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  async function createAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(undefined);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch("/api/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false); if (!response.ok) return setMessage("商品建立失敗：請確認代號與市場沒有重複。");
    setMessage("商品已建立，現在可在下方新增交易。"); event.currentTarget.reset(); router.refresh();
  }
  async function createTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(undefined);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false); if (!response.ok) return setMessage("交易儲存失敗：請檢查必填欄位與數值。");
    setMessage("交易已記錄，Dashboard 已依交易重新計算持倉。"); event.currentTarget.reset(); router.refresh();
  }
  return <main className="mx-auto max-w-5xl p-5 md:p-8"><header className="mb-8 flex items-center justify-between"><div><p className="text-sm text-muted">Asset Atlas</p><h1 className="text-2xl font-semibold">交易與商品管理</h1></div><Link href="/" className="rounded-lg border px-3 py-2 text-sm">返回 Dashboard</Link></header>{message && <p className="mb-5 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm">{message}</p>}<div className="grid gap-5 lg:grid-cols-2"><Card className="p-5"><div className="mb-5 flex gap-2"><Plus className="text-accent" size={20} /><div><h2 className="font-semibold">新增投資商品</h2><p className="text-sm text-muted">交易前先建立商品；例如 2330、0050、BTC。</p></div></div><form onSubmit={createAsset} className="grid gap-4 sm:grid-cols-2"><label className={label}>商品名稱<input name="name" required placeholder="例如：台積電" className={input} /></label><label className={label}>代號<input name="symbol" required placeholder="例如：2330 或 BTC" className={input} /></label><label className={label}>類型<select name="type" defaultValue="STOCK" className={input}><option value="STOCK">股票 Stock</option><option value="ETF">ETF</option><option value="CRYPTO">加密貨幣 Crypto</option><option value="CASH">現金 Cash</option><option value="BOND">債券 Bond</option><option value="OTHER">其他 Other</option></select></label><label className={label}>市場<select name="market" defaultValue="TW" className={input}><option value="TW">台灣 TW</option><option value="US">美國 US</option><option value="CRYPTO">Crypto</option><option value="CASH">現金</option><option value="OTHER">其他</option></select></label><label className={label}>交易幣別<input name="currency" required defaultValue="TWD" maxLength={3} className={input} /></label><label className={label}>產業／類別<input name="category" placeholder="選填；例如：半導體、穩定幣" className={input} /></label><div className="sm:col-span-2 flex items-end"><Button disabled={busy} type="submit" className="w-full">建立商品</Button></div></form></Card><Card className="p-5"><div className="mb-5 flex gap-2"><ReceiptText className="text-accent" size={20} /><div><h2 className="font-semibold">新增交易紀錄</h2><p className="text-sm text-muted">持倉與損益將從所有交易自動計算。</p></div></div>{assets.length === 0 ? <p className="rounded-lg bg-canvas p-4 text-sm text-muted">請先在左側建立第一個商品。</p> : <form onSubmit={createTransaction} className="grid gap-4 sm:grid-cols-2"><label className={label}>日期<input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={input} /></label><label className={label}>商品<select name="assetId" required className={input}>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.symbol} — {asset.name}</option>)}</select></label><label className={label}>買／賣<select name="side" defaultValue="BUY" className={input}><option value="BUY">買入 Buy</option><option value="SELL">賣出 Sell</option><option value="DEPOSIT">存入 Deposit（現金）</option><option value="WITHDRAWAL">提領 Withdrawal（現金）</option><option value="DIVIDEND">股利 Dividend</option></select></label><label className={label}>幣別<input name="currency" required defaultValue="TWD" maxLength={3} className={input} /></label><label className={label}>單價<input name="unitPrice" type="number" min="0" step="any" required placeholder="例如：1035" className={input} /></label><label className={label}>數量／股數<input name="quantity" type="number" min="0.00000001" step="any" required placeholder="例如：100" className={input} /></label><label className={label}>手續費<input name="fee" type="number" min="0" step="any" defaultValue="0" className={input} /></label><label className={label}>稅金<input name="tax" type="number" min="0" step="any" defaultValue="0" className={input} /></label><label className={`${label} sm:col-span-2`}>備註<input name="note" placeholder="選填" className={input} /></label><div className="sm:col-span-2"><Button disabled={busy} type="submit" className="w-full">儲存交易</Button></div></form>}</Card></div></main>;
}
