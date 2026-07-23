import { z } from "zod";
import { AssetType, Market } from "@prisma/client";
import { prisma } from "@/lib/db";
const schema = z.object({ symbol: z.string().min(1).max(24), name: z.string().min(1), type: z.nativeEnum(AssetType), currency: z.string().length(3), market: z.nativeEnum(Market), category: z.string().trim().max(60).optional().transform((value) => value || undefined), isActive: z.boolean().optional() });
export async function GET() { return Response.json(await prisma.asset.findMany({ orderBy: { createdAt: "desc" } })); }
export async function POST(request: Request) { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 }); try { return Response.json(await prisma.asset.create({ data: parsed.data }), { status: 201 }); } catch { return Response.json({ error: "商品代號與市場組合已存在" }, { status: 409 }); } }
