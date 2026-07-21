import { getPortfolio } from "@/lib/portfolio";
export async function GET() { return Response.json(await getPortfolio()); }
