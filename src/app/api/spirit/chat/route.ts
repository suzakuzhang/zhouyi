import { NextRequest, NextResponse } from "next/server";
import {
  getSpiritSession,
  getCastContext,
  canChat,
  addMessage,
  consumeRound,
  getRecentMessages,
} from "@/lib/spirit/session";
import { generateSpiritReply } from "@/lib/llm/spiritLlm";
import { buildSpiritSystemPrompt, buildSpiritReplyPrompt } from "@/lib/spirit/prompts";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sessionId = (body.sessionId ?? "").trim();
  const userMessage = (body.message ?? "").trim();
  const locale: "zh" | "en" = body.locale === "en" ? "en" : "zh";

  if (!sessionId || !userMessage) {
    return NextResponse.json({ error: "缺少 sessionId 或 message" }, { status: 400 });
  }

  if (userMessage.length > 300) {
    return NextResponse.json({ error: "消息过长，请控制在 300 字以内" }, { status: 400 });
  }

  const session = getSpiritSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "会话不存在或已过期" }, { status: 404 });
  }

  if (!canChat(session)) {
    return NextResponse.json({
      error: session.status === "expired" ? "会话已超时" : "对话轮次已用完",
      status: session.status,
      remainingRounds: session.remainingRounds,
    }, { status: 403 });
  }

  const ctx = getCastContext(session.castId);
  if (!ctx) {
    return NextResponse.json({ error: "演卦上下文丢失" }, { status: 500 });
  }

  addMessage(sessionId, "user", userMessage);

  const recent = getRecentMessages(sessionId, 8);
  const systemPrompt = buildSpiritSystemPrompt(locale);
  const replyPrompt = buildSpiritReplyPrompt(
    ctx.hexagramFullName,
    ctx.guaCi,
    ctx.xiangOverall,
    ctx.question,
    recent.map((m) => ({ role: m.role, content: m.content })),
    userMessage,
    locale
  );

  let reply: string;
  try {
    reply = await generateSpiritReply(systemPrompt, replyPrompt);
  } catch {
    reply =
      locale === "en"
        ? `"${ctx.guaCi.slice(0, 20)}" — this hexagram does not answer you directly, yet it keeps pointing the same way. Perhaps try saying it from another angle.`
        : `"${ctx.guaCi.slice(0, 20)}"——这个卦没有直接回答你，但它一直在指向同一个方向。也许你可以换个角度再说说看。`;
  }

  addMessage(sessionId, "assistant", reply);
  consumeRound(sessionId);

  const updated = getSpiritSession(sessionId)!;

  return NextResponse.json({
    reply,
    remainingRounds: updated.remainingRounds,
    status: updated.status,
    expiresAt: updated.expiresAt,
  });
}
