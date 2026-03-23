import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  listInviteCodes,
  createInviteCode,
  updateInviteCodeQuota,
  toggleInviteCodeActive,
} from "@/lib/access/session";
import { ROLE_ADMIN } from "@/lib/access/roles";

function requireAdmin(req: NextRequest, body?: Record<string, unknown>): string | null {
  const token = (
    body?.access_token as string ??
    req.nextUrl.searchParams.get("access_token") ??
    req.headers.get("x-access-token") ??
    ""
  ).trim();
  const session = token ? getSession(token) : null;
  if (!session || session.role !== ROLE_ADMIN) return null;
  return session.userId;
}

// GET: list all invite codes
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }
  return NextResponse.json({ items: listInviteCodes() });
}

// POST: create / update / toggle invite code
export async function POST(req: NextRequest) {
  const body = await req.json();
  const adminId = requireAdmin(req, body);
  if (!adminId) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const action = (body.action ?? "create") as string;

  if (action === "create") {
    const maxUses = parseInt(body.maxUses ?? "10", 10);
    const code = body.code as string | undefined;
    try {
      const item = createInviteCode(adminId, maxUses, code);
      return NextResponse.json(item);
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
  }

  if (action === "update_quota") {
    const code = (body.code ?? "").trim();
    const maxUses = parseInt(body.maxUses ?? "10", 10);
    const resetUsed = Boolean(body.resetUsed);
    const item = updateInviteCodeQuota(code, maxUses, resetUsed);
    if (!item) return NextResponse.json({ error: "邀请码不存在" }, { status: 404 });
    return NextResponse.json(item);
  }

  if (action === "toggle") {
    const code = (body.code ?? "").trim();
    const isActive = Boolean(body.isActive);
    const item = toggleInviteCodeActive(code, isActive);
    if (!item) return NextResponse.json({ error: "邀请码不存在" }, { status: 404 });
    return NextResponse.json(item);
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
