import { NextRequest, NextResponse } from "next/server";
import { buildInterpretSystemPrompt, buildInterpretUserPrompt } from "@/lib/llm/prompts";
import { callDeepSeek, DeepSeekError } from "@/lib/llm/deepseek";
import type { StructureLayer } from "@/types/explain";
import type { ReadingStrategy } from "@/types/reading";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const structure: StructureLayer | undefined = body.structure;
  const readingStrategy: ReadingStrategy | undefined = body.readingStrategy;
  const question: string | undefined = body.question;

  if (!structure || !readingStrategy) {
    return NextResponse.json(
      { error: "缺少 structure 或 readingStrategy" },
      { status: 400 }
    );
  }

  const systemPrompt = buildInterpretSystemPrompt();
  const userPrompt = buildInterpretUserPrompt(structure, readingStrategy, question);

  try {
    const result = await callDeepSeek(systemPrompt, userPrompt);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof DeepSeekError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: "解读生成失败" }, { status: 500 });
  }
}
