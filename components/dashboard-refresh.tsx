"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Updates quotes only after the saved dashboard has rendered. */
export function DashboardRefresh() {
  const router = useRouter();
  const started = useRef(false);
  const [status, setStatus] = useState<"updating" | "done" | "failed">("updating");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetch("/api/jobs/daily", { method: "POST" })
      .then((response) => {
        if (!response.ok) throw new Error("Price refresh failed");
        setStatus("done");
        router.refresh();
      })
      .catch(() => setStatus("failed"));
  }, [router]);

  const message = status === "updating" ? "正在背景更新價格…" : status === "failed" ? "部分價格暫時無法更新" : "價格已更新";
  const color = status === "failed" ? "text-amber-600" : "text-muted";
  return <span className={`fixed bottom-4 right-4 z-50 rounded-full border bg-panel px-3 py-2 text-xs shadow-sm ${color}`}>{message}</span>;
}
