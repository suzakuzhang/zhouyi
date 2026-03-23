import { NextRequest, NextResponse } from "next/server";
import type { CastInput, HexagramLine } from "@/types/casting";
import type { LinePosition } from "@/types/hexagram";
import type { Yao } from "@/types/trigram";
import { cast } from "@/lib/casting";
import { interpret } from "@/lib/explain";
import { getSession, consumeFreeUse, getFreeUsage, addUsageLog } from "@/lib/access/session";
import { ROLE_NORMAL, ROLE_INVITE, ROLE_PILOT, ROLE_ADMIN } from "@/lib/access/roles";
import type { Role } from "@/lib/access/roles";

function extractRole(req: NextRequest, body: Record<string, unknown>): { role: Role; userId: string } {
  const token = (body.access_token as string ?? req.headers.get("x-access-token") ?? "").trim();
  if (token) {
    const session = getSession(token);
    if (session) {
      return { role: session.role as Role, userId: session.userId };
    }
  }
  return { role: ROLE_NORMAL, userId: "anonymous" };
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const rawLines = body.lines;
  if (!Array.isArray(rawLines) || rawLines.length !== 6) {
    return NextResponse.json({ error: "需要恰好 6 条爻线数据" }, { status: 400 });
  }

  // Check access
  const { role, userId } = extractRole(req, body);

  if (role === ROLE_NORMAL) {
    // Free mode: check global counter
    const usage = getFreeUsage();
    if (usage.remaining <= 0) {
      return NextResponse.json({
        error: "免费体验次数已用完，请使用邀请码激活。",
        code: "FREE_LIMIT_REACHED",
        freeUsage: usage,
      }, { status: 403 });
    }
    consumeFreeUse();
  }

  const lines: HexagramLine[] = rawLines.map(
    (l: { position: number; value: number; changing: boolean }, i: number) => ({
      position: (l.position ?? i + 1) as LinePosition,
      value: (l.value === 1 ? 1 : 0) as Yao,
      changing: Boolean(l.changing),
    })
  );

  const input: CastInput = {
    method: body.method ?? "manual",
    lines,
    question: body.question ?? "",
  };

  const policy = body.policy === "compatible" ? "compatible" as const : "default_classic" as const;
  const castResult = cast(input, policy);
  if (!castResult) {
    return NextResponse.json({ error: "无法识别卦象，请检查输入" }, { status: 400 });
  }

  const interpretation = interpret(castResult);

  // Log usage
  addUsageLog({
    action: "cast",
    role,
    userId,
    hexagramName: castResult.originalHexagram.fullName,
    question: input.question ?? "",
    ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "",
    extra: {
      method: input.method,
      changingLines: castResult.changingLines,
      changedHexagram: castResult.changedHexagram?.fullName ?? null,
      policy,
    },
  });

  // Attach free usage info for normal users
  const response: Record<string, unknown> = { ...interpretation };
  if (role === ROLE_NORMAL) {
    response.freeUsage = getFreeUsage();
  }

  return NextResponse.json(response);
}
