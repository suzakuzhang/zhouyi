import { NextRequest, NextResponse } from "next/server";
import {
  registerCast,
  getCastContext,
  createSpiritSession,
  addMessage,
} from "@/lib/spirit/session";
import { generateSpiritReply } from "@/lib/llm/spiritLlm";
import { buildSpiritSystemPrompt, buildSpiritOpeningPrompt } from "@/lib/spirit/prompts";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const castId = (body.castId ?? "").trim();
  const locale: "zh" | "en" = body.locale === "en" ? "en" : "zh";

  if (!castId) {
    return NextResponse.json({ error: "缺少 castId" }, { status: 400 });
  }

  // Register cast context if provided
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

  const systemPrompt = buildSpiritSystemPrompt(locale);
  const openingPrompt = buildSpiritOpeningPrompt(
    ctx.hexagramFullName,
    ctx.guaCi,
    ctx.tuan,
    ctx.xiangOverall,
    ctx.question,
    ctx.changingLines,
    ctx.changedHexagramName,
    locale
  );

  let openingMessage: string;
  try {
    openingMessage = await generateSpiritReply(systemPrompt, openingPrompt);
  } catch {
    // All LLMs failed — use a quality fallback based on actual card data
    const xiangQuote = ctx.xiangOverall ? `"${ctx.xiangOverall}"` : "";
    openingMessage =
      locale === "en"
        ? `${xiangQuote}${xiangQuote ? " — " : ""}the atmosphere of ${ctx.hexagramFullName} is laid out here; it is in no hurry to hand you an answer. But within this hexagram's structure, there is one place in your question worth pausing on. Where do you think it is?`
        : `${xiangQuote}${xiangQuote ? "——" : ""}${ctx.hexagramFullName}的气象摆在这里，它不急着给你答案。但你刚才带来的这个问题，在这个卦的结构里，有一处最值得你停下来多看一眼。你觉得是哪里？`;
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
