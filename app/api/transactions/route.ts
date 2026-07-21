import { z } from "zod";
import { TransactionSide } from "@prisma/client";
import { prisma } from "@/lib/db";
const schema = z.object({ assetId: z.string().cuid(), date: z.coerce.date(), side: z.nativeEnum(TransactionSide), unitPrice: z.coerce.number().nonnegative(), quantity: z.coerce.number().positive(), fee: z.coerce.number().nonnegative().default(0), tax: z.coerce.number().nonnegative().default(0), currency: z.string().length(3), note: z.string().max(500).optional() });
export async function GET() { return Response.json(await prisma.transaction.findMany({ include: { asset: true }, orderBy: { date: "desc" } })); }
export async function POST(request: Request) { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 }); const asset = await prisma.asset.findUnique({ where: { id: parsed.data.assetId } }); if (!asset) return Response.json({ error: "商品不存在" }, { status: 404 }); return Response.json(await prisma.transaction.create({ data: parsed.data }), { status: 201 }); }
