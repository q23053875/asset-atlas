import { Dashboard } from "@/components/dashboard";
import { DashboardRefresh } from "@/components/dashboard-refresh";
import { prisma } from "@/lib/db";
import { getPortfolio } from "@/lib/portfolio";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [data, insight] = await Promise.all([getPortfolio(), prisma.dailyInsight.findFirst({ orderBy: { date: "desc" } })]);
  return <><Dashboard data={data} insight={insight?.summary} /><DashboardRefresh /></>;
}
