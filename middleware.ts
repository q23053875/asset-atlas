import { NextRequest, NextResponse } from "next/server";

/**
 * A small access gate for a personal dashboard. It is inactive locally until
 * DASHBOARD_PASSWORD is configured in the hosting environment.
 */
export function middleware(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password || request.nextUrl.pathname.startsWith("/api/jobs/daily")) return NextResponse.next();

  const expected = `Basic ${btoa(`atlas:${password}`)}`;
  if (request.headers.get("authorization") === expected) return NextResponse.next();

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Asset Atlas", charset="UTF-8"' }
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
