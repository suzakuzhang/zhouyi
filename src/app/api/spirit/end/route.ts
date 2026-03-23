import { NextRequest, NextResponse } from "next/server";
import { getSpiritSession, endSession } from "@/lib/spirit/session";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sessionId = (body.sessionId ?? "").trim();

  if (!sessionId) {
    return NextResponse.json({ error: "缺少 sessionId" }, { status: 400 });
  }

  const session = getSpiritSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  }

  endSession(sessionId);

  return NextResponse.json({
    status: "ended",
    farewell: `${session.hexagramFullName}的视角到此暂止。回头再看时，也许会有新的发现。`,
  });
}
