import { runDailyJob } from "@/lib/jobs/daily";

export const maxDuration = 60;

function isAuthorized(request: Request) {
  // Keep local development simple. Production always requires either the
  // Vercel Cron secret or the dashboard's Basic-Auth credentials.
  if (process.env.NODE_ENV !== "production") return true;
  const authorization = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET;
  const dashboardPassword = process.env.DASHBOARD_PASSWORD;
  const isCron = Boolean(cronSecret) && authorization === `Bearer ${cronSecret}`;
  const isDashboard = request.method === "POST" && Boolean(dashboardPassword) && authorization === `Basic ${btoa(`atlas:${dashboardPassword}`)}`;
  return isCron || isDashboard;
}

async function run(request: Request) {
  if (!isAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await runDailyJob());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Daily job failed" }, { status: 500 });
  }
}

// Vercel Cron invokes this route with GET. The dashboard uses POST when opened.
export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
