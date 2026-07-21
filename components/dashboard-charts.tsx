"use client";

import { Brush, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const colors = ["#4f7cff", "#53c68c", "#f3ae4c", "#a878ff", "#697386"];

export function AllocationChart({ data }: { data: { name: string; value: number }[] }) {
  return <ResponsiveContainer width="100%" height={230}><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={85} paddingAngle={4}>{data.map((x, i) => <Cell key={x.name} fill={colors[i % colors.length]} />)}</Pie><Tooltip formatter={(v) => `NT$${Number(v).toLocaleString("zh-TW")}`} /></PieChart></ResponsiveContainer>;
}

type Period = "daily" | "weekly" | "monthly";
function bucket(date: string, period: Period) {
  const value = new Date(`${date}T00:00:00Z`);
  if (period === "daily") return date;
  if (period === "monthly") return date.slice(0, 7);
  const monday = new Date(value);
  monday.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

export function HistoryChart({ data, needsBackfill }: { data: { date: string; value: number }[]; needsBackfill?: boolean }) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("daily");
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const fillHistory = () => {
    setLoading(true);
    fetch("/api/history/backfill", { method: "POST" })
      .then((response) => response.json())
      .then((result) => { if (result.count) router.refresh(); })
      .finally(() => setLoading(false));
  };
  const series = useMemo(() => Object.values(data.reduce<Record<string, { date: string; value: number }>>((result, point) => {
    result[bucket(point.date, period)] = { ...point, date: bucket(point.date, period) };
    return result;
  }, {})), [data, period]);
  const visibleCount = Math.max(2, Math.ceil(series.length / zoom));
  const visibleSeries = series.slice(-visibleCount);
  return <><div className="mb-3 flex flex-wrap items-center gap-2">
    {([ ["daily", "每日"], ["weekly", "每週"], ["monthly", "每月"] ] as [Period, string][]).map(([value, label]) => <button key={value} onClick={() => { setPeriod(value); setZoom(1); }} className={period === value ? "rounded-lg bg-ink px-3 py-1 text-xs text-panel" : "rounded-lg border px-3 py-1 text-xs text-muted"}>{label}</button>)}
    <span className="ml-2 text-xs text-muted">縮放</span>
    <button onClick={() => setZoom((value) => Math.max(1, value / 2))} disabled={zoom === 1} className="rounded-lg border px-2 py-1 text-xs disabled:opacity-40">－</button>
    <button onClick={() => setZoom((value) => Math.min(16, value * 2))} className="rounded-lg border px-2 py-1 text-xs">＋</button>
    {needsBackfill && <button onClick={fillHistory} disabled={loading} className="rounded-lg border px-3 py-1 text-xs text-muted disabled:opacity-40">{loading ? "正在補齊歷史…" : "補齊歷史資料"}</button>}
  </div><ResponsiveContainer width="100%" height={300}><LineChart data={visibleSeries} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}><XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(value) => value.slice(5)} minTickGap={24} /><YAxis width={74} tick={{ fontSize: 11 }} tickFormatter={(value) => `${Math.round(Number(value) / 10000)} 萬`} /><Tooltip labelFormatter={(label) => `日期：${label}`} formatter={(value) => [`NT$${Number(value).toLocaleString("zh-TW")}`, "總資產"]} /><Line type="monotone" dataKey="value" stroke="#4f7cff" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />{visibleSeries.length > 10 && <Brush dataKey="date" height={22} stroke="#4f7cff" />}</LineChart></ResponsiveContainer></>;
}
