import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  listInviteCodes,
  createInviteCode,
  updateInviteCode,
  toggleInviteCodeActive,
  deleteInviteCode,
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

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }
  return NextResponse.json({ items: listInviteCodes() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const adminId = requireAdmin(req, body);
  if (!adminId) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const action = (body.action ?? "create") as string;

  if (action === "create") {
    const type = body.type === "whitelist" ? "whitelist" as const : "quota" as const;
    try {
      const item = createInviteCode({
        createdBy: adminId,
        type,
        maxUses: parseInt(body.maxUses ?? "10", 10),
        code: body.code as string | undefined,
        label: (body.label ?? "") as string,
      });
      return NextResponse.json(item);
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
  }

  if (action === "update") {
    const code = (body.code ?? "").trim();
    const item = updateInviteCode(code, {
      maxUses: body.maxUses != null ? parseInt(body.maxUses, 10) : undefined,
      resetUsed: Boolean(body.resetUsed),
      label: body.label as string | undefined,
      type: body.type === "whitelist" || body.type === "quota" ? body.type : undefined,
    });
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

  if (action === "delete") {
    const code = (body.code ?? "").trim();
    const ok = deleteInviteCode(code);
    if (!ok) return NextResponse.json({ error: "邀请码不存在" }, { status: 404 });
    return NextResponse.json({ deleted: true });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
