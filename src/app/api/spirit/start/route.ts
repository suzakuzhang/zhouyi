import { NextRequest, NextResponse } from "next/server";
import {
  registerCast,
  getCastContext,
  createSpiritSession,
} from "@/lib/spirit/session";
import { addMessage } from "@/lib/spirit/session";
import { generateGeminiReply, GeminiClientError } from "@/lib/llm/gemini";
import { buildSpiritSystemPrompt, buildSpiritOpeningPrompt } from "@/lib/spirit/prompts";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const castId = (body.castId ?? "").trim();

  if (!castId) {
    return NextResponse.json({ error: "缺少 castId" }, { status: 400 });
  }

  // Register cast context if provided in request (first time)
  if (body.hexagramName) {
    registerCast({
      castId,
      hexagramName: body.hexagramName,
      hexagramFullName: body.hexagramFullName ?? body.hexagramName,
      question: body.question ?? "",
      guaCi: body.guaCi ?? "",
      tuan: body.tuan ?? "",
      xiangOverall: body.xiangOverall ?? "",
      changingLines: body.changingLines ?? [],
      changedHexagramName: body.changedHexagramName,
    });
  }

  const ctx = getCastContext(castId);
  if (!ctx) {
    return NextResponse.json({ error: "未找到演卦记录，请先起卦" }, { status: 404 });
  }

  const session = createSpiritSession(castId);
  if (!session) {
    return NextResponse.json({ error: "创建卦灵会话失败" }, { status: 500 });
  }

  // Generate opening message
  const systemPrompt = buildSpiritSystemPrompt();
  const openingPrompt = buildSpiritOpeningPrompt(
    ctx.hexagramFullName,
    ctx.guaCi,
    ctx.tuan,
    ctx.xiangOverall,
    ctx.question,
    ctx.changingLines,
    ctx.changedHexagramName
  );

  let openingMessage: string;
  try {
    openingMessage = await generateGeminiReply(systemPrompt, openingPrompt);
  } catch (err) {
    if (err instanceof GeminiClientError) {
      // Fallback opening
      openingMessage = `我是${ctx.hexagramFullName}。"${ctx.xiangOverall}"——这是这个卦给你的第一句话。你刚才问的这件事，在这个卦里，真正值得你留意的会是哪一处？`;
    } else {
      return NextResponse.json({ error: "卦灵开场生成失败" }, { status: 502 });
    }
  }

  addMessage(session.sessionId, "assistant", openingMessage);

  return NextResponse.json({
    session: {
      sessionId: session.sessionId,
      hexagramFullName: session.hexagramFullName,
      remainingRounds: session.remainingRounds,
      status: session.status,
      expiresAt: session.expiresAt,
    },
    openingMessage,
  });
}
