import { NextRequest, NextResponse } from "next/server";
import { getSession, getUsageLogs } from "@/lib/access/session";
import { ROLE_ADMIN } from "@/lib/access/roles";

export async function GET(req: NextRequest) {
  const token = (
    req.nextUrl.searchParams.get("access_token") ??
    req.headers.get("x-access-token") ??
    ""
  ).trim();
  const session = token ? getSession(token) : null;
  if (!session || session.role !== ROLE_ADMIN) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10);
  const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10);

  return NextResponse.json(getUsageLogs(limit, offset));
}
