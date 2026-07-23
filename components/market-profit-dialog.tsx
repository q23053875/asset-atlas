"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { twd } from "@/lib/utils";

type MarketProfit = {
  name: string;
  cost: number;
  value: number;
  unrealized: number;
  realized: number;
  totalProfit: number;
};

function Profit({ value }: { value: number }) {
  return <span className={value >= 0 ? "text-emerald-500" : "text-rose-500"}>{value >= 0 ? "+" : ""}{twd(value)}</span>;
}

export function MarketProfitDialog({ items }: { items: MarketProfit[] }) {
  const [open, setOpen] = useState(false);

  return <>
    <button className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-ink" onClick={() => setOpen(true)} type="button">查看現在總損益</button>
    {open && <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-labelledby="market-profit-title" onMouseDown={() => setOpen(false)}>
      <section className="w-full max-w-4xl rounded-2xl border bg-panel shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b p-5"><div><h2 className="font-semibold" id="market-profit-title">現在總損益</h2><p className="mt-1 text-sm text-muted">依市場彙整，金額皆換算為新台幣。</p></div><button aria-label="關閉" className="rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-800" onClick={() => setOpen(false)} type="button"><X size={18} /></button></header>
        <div className="overflow-x-auto p-5"><table className="w-full min-w-[680px] text-sm"><thead className="border-b text-left text-xs text-muted"><tr><th className="pb-3 font-medium">市場</th><th className="pb-3 text-right font-medium">持有成本</th><th className="pb-3 text-right font-medium">目前市值</th><th className="pb-3 text-right font-medium">未實現損益</th><th className="pb-3 text-right font-medium">已實現損益</th><th className="pb-3 text-right font-medium">目前總損益</th></tr></thead><tbody>{items.map((item) => <tr className="border-b last:border-0" key={item.name}><td className="py-4 font-medium">{item.name}</td><td className="py-4 text-right">{twd(item.cost)}</td><td className="py-4 text-right">{twd(item.value)}</td><td className="py-4 text-right"><Profit value={item.unrealized} /></td><td className="py-4 text-right"><Profit value={item.realized} /></td><td className="py-4 text-right font-semibold"><Profit value={item.totalProfit} /></td></tr>)}</tbody></table></div>
      </section>
    </div>}
  </>;
}
