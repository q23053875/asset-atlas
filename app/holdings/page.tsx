import { HoldingsTable } from "@/components/holdings-table";
import { DashboardRefresh } from "@/components/dashboard-refresh";
import { getPortfolio } from "@/lib/portfolio";
export const dynamic = "force-dynamic";
export default async function HoldingsPage() { const { holdings } = await getPortfolio(); return <><HoldingsTable holdings={holdings} /><DashboardRefresh /></>; }
