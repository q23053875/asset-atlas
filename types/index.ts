import type { getPortfolio } from "@/lib/portfolio";
export type AwaitedReturn = Awaited<ReturnType<typeof getPortfolio>>;
