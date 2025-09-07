import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const apiKey = process.env.AUTH_KEY;
  const clientKey = req.headers.get("authorization");
  if (req.nextUrl.pathname.startsWith("/api") && clientKey !== apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.next();
}
