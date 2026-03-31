import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/access/session";
import { ROLE_ADMIN } from "@/lib/access/roles";
import { exportResearchData } from "@/lib/research/store";
import { exportSpiritResearchData } from "@/lib/spirit/session";

function requireAdmin(req: NextRequest): boolean {
  const token = (
    req.nextUrl.searchParams.get("access_token") ??
    req.headers.get("x-access-token") ??
    ""
  ).trim();
  const session = token ? getSession(token) : null;
  return Boolean(session && session.role === ROLE_ADMIN);
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  return NextResponse.json({
    research: exportResearchData(),
    spirit: exportSpiritResearchData(),
  });
}
