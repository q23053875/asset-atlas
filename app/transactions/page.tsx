import { TransactionManager } from "@/components/transaction-manager";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function TransactionsPage() { const assets = await prisma.asset.findMany({ where: { isActive: true }, orderBy: [{ market: "asc" }, { symbol: "asc" }] }); return <TransactionManager assets={assets} />; }
