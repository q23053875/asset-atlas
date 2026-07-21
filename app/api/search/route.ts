import { prisma } from "@/lib/db";
export async function GET(request: Request) { const q = new URL(request.url).searchParams.get("q")?.trim() ?? ""; if (!q) return Response.json([]); return Response.json(await prisma.asset.findMany({ where: { OR: [{ symbol: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] }, take: 10 })); }
