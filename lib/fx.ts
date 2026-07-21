const cache = new Map<string, number>();

/** USD/TWD reference rate. USDT is treated as USD for portfolio reporting. */
export async function usdTwdRate(at?: Date) {
  const key = at ? at.toISOString().slice(0, 10) : "latest";
  const cached = cache.get(key);
  if (cached) return cached;
  if (!at) {
    const response = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/TWD=X?range=5d&interval=1d", { next: { revalidate: 300 } });
    if (!response.ok) throw new Error("USD/TWD exchange rate is unavailable");
    const payload = (await response.json()) as { chart: { result: Array<{ meta: { regularMarketPrice?: number } }> } };
    const rate = payload.chart.result[0]?.meta.regularMarketPrice;
    if (!rate) throw new Error("USD/TWD rate missing");
    cache.set(key, rate); return rate;
  }
  const start = Math.floor((at.getTime() - 7 * 86_400_000) / 1000);
  const end = Math.floor((at.getTime() + 86_400_000) / 1000);
  const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/TWD=X?period1=${start}&period2=${end}&interval=1d`, { next: { revalidate: 86_400 } });
  if (!response.ok) return usdTwdRate();
  const payload = (await response.json()) as { chart: { result: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> } };
  const result = payload.chart.result[0];
  const cutoff = at.getTime();
  const rate = (result?.timestamp ?? []).map((timestamp, index) => ({ time: timestamp * 1000, rate: result.indicators?.quote?.[0]?.close?.[index] ?? null })).filter((item): item is { time: number; rate: number } => item.rate !== null && item.time <= cutoff).sort((a, b) => b.time - a.time)[0]?.rate;
  if (!rate) return usdTwdRate();
  cache.set(key, rate); return rate;
}

export async function toTwd(value: number, currency: string, at?: Date) {
  return currency === "TWD" ? value : value * await usdTwdRate(at);
}
