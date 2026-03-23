import { NextRequest, NextResponse } from "next/server";
import { getSession, getFreeUsage, resetFreeUsage } from "@/lib/access/session";
import { ROLE_ADMIN } from "@/lib/access/roles";

function requireAdmin(req: NextRequest, body?: Record<string, unknown>): boolean {
  const token = (
    body?.access_token as string ??
    req.nextUrl.searchParams.get("access_token") ??
    req.headers.get("x-access-token") ??
    ""
  ).trim();
  const session = token ? getSession(token) : null;
  return !!(session && session.role === ROLE_ADMIN);
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }
  return NextResponse.json(getFreeUsage());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!requireAdmin(req, body as Record<string, unknown>)) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }
  resetFreeUsage();
  return NextResponse.json({ message: "免费次数已重置", ...getFreeUsage() });
}
