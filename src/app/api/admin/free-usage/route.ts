import { NextRequest, NextResponse } from "next/server";
import { getSession, getFreeUsage, resetFreeUsage } from "@/lib/access/session";
import { ROLE_ADMIN } from "@/lib/access/roles";

export async function GET(req: NextRequest) {
  const token = (req.nextUrl.searchParams.get("access_token") ?? req.headers.get("x-access-token") ?? "").trim();
  const session = token ? getSession(token) : null;
  if (!session || session.role !== ROLE_ADMIN) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }
  return NextResponse.json(getFreeUsage());
}

// POST: reset free usage counter
export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = (body.access_token ?? req.headers.get("x-access-token") ?? "").trim();
  const session = token ? getSession(token) : null;
  if (!session || session.role !== ROLE_ADMIN) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  resetFreeUsage();
  return NextResponse.json({ message: "免费次数已重置", ...getFreeUsage() });
}
