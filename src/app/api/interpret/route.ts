import { NextRequest, NextResponse } from "next/server";
import { buildInterpretSystemPrompt, buildInterpretUserPrompt } from "@/lib/llm/prompts";
import { callDeepSeek, DeepSeekError } from "@/lib/llm/deepseek";
import { getSession, addUsageLog } from "@/lib/access/session";
import { ROLE_NORMAL } from "@/lib/access/roles";
import type { Role } from "@/lib/access/roles";
import type { StructureLayer } from "@/types/explain";
import type { ReadingStrategy } from "@/types/reading";
import { saveResearchInterpretation } from "@/lib/research/store";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const structure: StructureLayer | undefined = body.structure;
  const readingStrategy: ReadingStrategy | undefined = body.readingStrategy;
  const question: string | undefined = body.question;
  const castId = String(body.castId ?? "").trim();

  if (!structure || !readingStrategy) {
    return NextResponse.json(
      { error: "缺少 structure 或 readingStrategy" },
      { status: 400 }
    );
  }

  // Resolve role
  const token = (body.access_token as string ?? req.headers.get("x-access-token") ?? "").trim();
  let role: Role = ROLE_NORMAL;
  let userId = "anonymous";
  if (token) {
    const session = getSession(token);
    if (session) {
      role = session.role as Role;
      userId = session.userId;
    }
  }

  const systemPrompt = buildInterpretSystemPrompt();
  const userPrompt = buildInterpretUserPrompt(structure, readingStrategy, question);

  try {
    const result = await callDeepSeek(systemPrompt, userPrompt);

    addUsageLog({
      action: "interpret",
      role,
      userId,
      hexagramName: structure.originalHexagramName,
      question: question ?? "",
      ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "",
    });

    if (castId) {
      try {
        saveResearchInterpretation({
          castId,
          role,
          userId,
          question: question ?? "",
          model: "deepseek-chat",
          promptVersion: "zhouyi-interpret-v1",
          structure,
          readingStrategy,
          systemPrompt,
          userPrompt,
          result,
        });
      } catch {
        // Research persistence should not block product flow.
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof DeepSeekError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: "解读生成失败" }, { status: 500 });
  }
}
