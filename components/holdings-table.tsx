"use client";

import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Landmark, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { pct, twd } from "@/lib/utils";
import type { AwaitedReturn } from "@/types";

type Holding = AwaitedReturn["holdings"][number];
type SortKey = "symbol" | "category" | "quantity" | "averageCost" | "price" | "cost" | "value" | "unrealized" | "returnRate" | "dailyChange";
type Direction = "asc" | "desc";

function Money({ value }: { value: number }) { return <span>{twd(value)}</span>; }
function Change({ value }: { value: number }) { return <span className={value >= 0 ? "text-emerald-500" : "text-rose-500"}>{pct(value)}</span>; }

function SortHeader({ label, sortKey, activeKey, direction, onSort, align = "right" }: { label: string; sortKey: SortKey; activeKey: SortKey; direction: Direction; onSort: (key: SortKey) => void; align?: "left" | "right" }) {
  const active = sortKey === activeKey;
  return <th className={`px-4 py-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}><button className={`inline-flex items-center gap-1 hover:text-ink ${align === "right" ? "justify-end" : ""}`} onClick={() => onSort(sortKey)} type="button">{label}{active && (direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th>;
}

export function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [direction, setDirection] = useState<Direction>("desc");
  const active = useMemo(() => holdings.filter((holding) => Math.abs(holding.quantity) > 0.00000001).sort((left, right) => {
    const leftValue = left[sortKey];
    const rightValue = right[sortKey];
    const comparison = typeof leftValue === "string" && typeof rightValue === "string" ? leftValue.localeCompare(rightValue, "zh-Hant") : Number(leftValue) - Number(rightValue);
    return direction === "asc" ? comparison : -comparison;
  }), [direction, holdings, sortKey]);
  const total = active.reduce((sum, holding) => sum + holding.value, 0);
  const sort = (key: SortKey) => {
    if (key === sortKey) setDirection((value) => value === "asc" ? "desc" : "asc");
    else { setSortKey(key); setDirection(key === "symbol" || key === "category" ? "asc" : "desc"); }
  };

  return <main className="mx-auto max-w-[1500px] p-5 md:p-8">
    <header className="mb-8 flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-accent p-2 text-white"><WalletCards size={22} /></div><div><p className="text-sm text-muted">Asset Atlas</p><h1 className="text-2xl font-semibold">持有資產</h1></div></div><Link href="/" className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><ArrowLeft size={16} />返回 Dashboard</Link></header>
    <div className="mb-5 grid gap-4 sm:grid-cols-3"><Card className="p-5"><p className="text-sm text-muted">目前持有商品</p><p className="mt-2 text-2xl font-semibold">{active.length}</p></Card><Card className="p-5"><p className="text-sm text-muted">持有市值</p><p className="mt-2 text-2xl font-semibold"><Money value={total} /></p></Card><Card className="p-5"><p className="text-sm text-muted">未實現損益</p><p className={active.reduce((sum, holding) => sum + holding.unrealized, 0) >= 0 ? "mt-2 text-2xl font-semibold text-emerald-500" : "mt-2 text-2xl font-semibold text-rose-500"}><Money value={active.reduce((sum, holding) => sum + holding.unrealized, 0)} /></p></Card></div>
    <Card className="overflow-hidden"><div className="border-b px-5 py-4"><div className="flex items-center gap-2"><Landmark size={18} className="text-accent" /><h2 className="font-semibold">商品明細</h2></div><p className="mt-1 text-sm text-muted">點選欄位名稱可排序；所有數值均由交易紀錄與最新價格自動計算。</p></div>{active.length === 0 ? <p className="p-8 text-center text-muted">目前尚無持有資產。請先新增交易紀錄。</p> : <div className="overflow-x-auto"><table className="min-w-[1170px] w-full text-left text-sm"><thead className="bg-canvas text-xs text-muted"><tr><SortHeader label="商品" sortKey="symbol" activeKey={sortKey} direction={direction} onSort={sort} align="left" /><SortHeader label="產業／類別" sortKey="category" activeKey={sortKey} direction={direction} onSort={sort} align="left" /><SortHeader label="持有數量" sortKey="quantity" activeKey={sortKey} direction={direction} onSort={sort} /><SortHeader label="平均成本" sortKey="averageCost" activeKey={sortKey} direction={direction} onSort={sort} /><SortHeader label="目前價格" sortKey="price" activeKey={sortKey} direction={direction} onSort={sort} /><SortHeader label="總成本" sortKey="cost" activeKey={sortKey} direction={direction} onSort={sort} /><SortHeader label="目前市值" sortKey="value" activeKey={sortKey} direction={direction} onSort={sort} /><SortHeader label="未實現損益" sortKey="unrealized" activeKey={sortKey} direction={direction} onSort={sort} /><SortHeader label="總報酬率" sortKey="returnRate" activeKey={sortKey} direction={direction} onSort={sort} /><SortHeader label="今日漲跌" sortKey="dailyChange" activeKey={sortKey} direction={direction} onSort={sort} /></tr></thead><tbody>{active.map((holding) => <tr key={holding.id} className="border-t transition-colors hover:bg-canvas"><td className="px-5 py-4"><p className="font-semibold">{holding.symbol}</p><p className="mt-0.5 text-xs text-muted">{holding.name} · {holding.type}</p></td><td className="px-4 py-4"><span className="rounded-full bg-canvas px-2 py-1 text-xs text-muted">{holding.category}</span></td><td className="px-4 py-4 text-right tabular-nums">{holding.quantity.toLocaleString("zh-TW", { maximumFractionDigits: 8 })}</td><td className="px-4 py-4 text-right tabular-nums"><Money value={holding.averageCost} /></td><td className="px-4 py-4 text-right tabular-nums"><Money value={holding.price} /></td><td className="px-4 py-4 text-right tabular-nums"><Money value={holding.cost} /></td><td className="px-4 py-4 text-right font-medium tabular-nums"><Money value={holding.value} /></td><td className={holding.unrealized >= 0 ? "px-4 py-4 text-right tabular-nums text-emerald-500" : "px-4 py-4 text-right tabular-nums text-rose-500"}><Money value={holding.unrealized} /></td><td className="px-4 py-4 text-right tabular-nums"><Change value={holding.returnRate} /></td><td className="px-5 py-4 text-right tabular-nums"><Change value={holding.dailyChange} /></td></tr>)}</tbody></table></div>}</Card>
  </main>;
}
