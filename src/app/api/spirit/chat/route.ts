import { NextRequest, NextResponse } from "next/server";
import {
  getSpiritSession,
  getCastContext,
  canChat,
  addMessage,
  consumeRound,
  getRecentMessages,
} from "@/lib/spirit/session";
import { generateGeminiReply, GeminiClientError } from "@/lib/llm/gemini";
import { buildSpiritSystemPrompt, buildSpiritReplyPrompt } from "@/lib/spirit/prompts";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sessionId = (body.sessionId ?? "").trim();
  const userMessage = (body.message ?? "").trim();

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

  // Record user message
  addMessage(sessionId, "user", userMessage);

  // Build prompt
  const recent = getRecentMessages(sessionId, 8);
  const systemPrompt = buildSpiritSystemPrompt();
  const replyPrompt = buildSpiritReplyPrompt(
    ctx.hexagramFullName,
    ctx.guaCi,
    ctx.xiangOverall,
    ctx.question,
    recent.map((m) => ({ role: m.role, content: m.content })),
    userMessage
  );

  let reply: string;
  try {
    reply = await generateGeminiReply(systemPrompt, replyPrompt);
  } catch (err) {
    if (err instanceof GeminiClientError) {
      reply = "这个卦暂时沉默了。也许你可以换一个角度再问一次。";
    } else {
      return NextResponse.json({ error: "卦灵回复生成失败" }, { status: 502 });
    }
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
