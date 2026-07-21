import { prisma } from "@/lib/db";
import { backfillSnapshots } from "@/scripts/backfill-snapshots";

export async function POST() {
  const firstTransaction = await prisma.transaction.findFirst({ orderBy: { date: "asc" }, select: { date: true } });
  if (!firstTransaction) return Response.json({ count: 0, message: "No transactions to backfill." });
  const firstSnapshot = await prisma.dailySnapshot.findFirst({ orderBy: { date: "asc" }, select: { date: true } });
  if (firstSnapshot && firstSnapshot.date <= firstTransaction.date) return Response.json({ count: 0, message: "History is already complete." });
  const start = new Date(firstTransaction.date); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(); end.setUTCHours(0, 0, 0, 0);
  try { return Response.json(await backfillSnapshots(start, end)); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Historical backfill failed" }, { status: 500 }); }
}
