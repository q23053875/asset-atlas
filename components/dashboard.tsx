import { ArrowDownRight, ArrowUpRight, BarChart3, BriefcaseBusiness, Search } from "lucide-react";
import Link from "next/link";
import { AllocationChart, HistoryChart } from "./dashboard-charts";
import { Card } from "./ui/card";
import { ThemeToggle } from "./theme-toggle";
import { pct, twd } from "@/lib/utils";
import type { AwaitedReturn } from "@/types";

type Data = AwaitedReturn;

function Metric({ label, value, trend }: { label: string; value: string; trend?: number }) {
  return <Card className="p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>{trend !== undefined && <p className={trend >= 0 ? "mt-2 flex items-center text-sm text-emerald-500" : "mt-2 flex items-center text-sm text-rose-500"}>{trend >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{pct(trend)}</p>}</Card>;
}

export function Dashboard({ data, insight }: { data: Data; insight?: string }) {
  const gainers = [...data.holdings].sort((a, b) => b.dailyChange - a.dailyChange);
  const history = data.snapshots.length ? data.snapshots : [{ date: "今日", value: data.total }];
  const dailyProfit = data.holdings.reduce((sum, holding) => sum + holding.value * holding.dailyChange / 100, 0);

  return <main className="mx-auto max-w-[1500px] p-5 md:p-8">
    <header className="mb-8 flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-accent p-2 text-white"><BriefcaseBusiness size={22} /></div><div><h1 className="font-semibold">Asset Atlas</h1><p className="text-sm text-muted">個人投資資產管理平台</p></div></div><div className="flex gap-2"><Link href="/holdings" className="rounded-lg border px-3 py-2 text-sm font-medium">持有資產</Link><Link href="/transactions" className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-panel">新增交易</Link><button className="rounded-lg border p-2 text-muted" aria-label="搜尋"><Search size={17} /></button><ThemeToggle /></div></header>
    <div className="mb-7"><p className="text-sm text-muted">總資產</p><h2 className="mt-1 text-4xl font-semibold tracking-tight">{twd(data.total)}</h2><p className={data.unrealized >= 0 ? "mt-2 text-emerald-500" : "mt-2 text-rose-500"}>未實現損益 {twd(data.unrealized)} ({pct(data.cost ? data.unrealized / data.cost * 100 : 0)})</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric label="總投入本金" value={twd(data.cost)} /><Metric label="目前市值" value={twd(data.total)} /><Metric label="未實現損益" value={twd(data.unrealized)} trend={data.cost ? data.unrealized / data.cost * 100 : 0} /><Metric label="已實現損益" value={twd(data.realized)} /><Metric label="今日損益" value={twd(dailyProfit)} /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-3"><Card className="p-5 xl:col-span-2"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-semibold">每日資產曲線</h3><p className="text-sm text-muted">由每日 Snapshot 產生</p></div><div className="rounded-lg border px-3 py-1 text-xs text-muted">全部</div></div><HistoryChart data={history} needsBackfill={data.needsHistoryBackfill} /></Card><Card className="p-5"><h3 className="font-semibold">資產配置</h3><AllocationChart data={data.allocation} /><div className="space-y-2">{data.allocation.map((item, index) => <div className="flex justify-between text-sm" key={item.name}><span className="text-muted"><i className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: ["#4f7cff", "#53c68c", "#f3ae4c", "#a878ff", "#697386"][index] }} />{item.name}</span><span>{data.total ? (item.value / data.total * 100).toFixed(1) : 0}%</span></div>)}</div></Card></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-3"><Card className="p-5 xl:col-span-2"><div className="mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-accent" /><h3 className="font-semibold">今日投資摘要</h3></div><p className="leading-7 text-muted">{insight ?? "尚未產生今日分析。執行每日排程後將自動建立摘要。"}</p><p className="mt-4 text-xs text-muted">目前為規則式摘要；可在 daily job 接入 OpenAI 後替換為 AI 分析。</p></Card><Card className="p-5"><h3 className="font-semibold">今日排行榜</h3><div className="mt-3 space-y-3">{gainers.slice(0, 4).map((holding) => <div className="flex items-center justify-between" key={holding.id}><div><p className="text-sm font-medium">{holding.symbol}</p><p className="text-xs text-muted">{holding.name}</p></div><span className={holding.dailyChange >= 0 ? "text-sm text-emerald-500" : "text-sm text-rose-500"}>{pct(holding.dailyChange)}</span></div>)}</div></Card></div>
  </main>;
}
