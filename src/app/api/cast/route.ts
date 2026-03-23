import { NextRequest, NextResponse } from "next/server";
import type { CastInput, HexagramLine } from "@/types/casting";
import type { LinePosition } from "@/types/hexagram";
import type { Yao } from "@/types/trigram";
import { cast } from "@/lib/casting";
import { interpret } from "@/lib/explain";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const rawLines = body.lines;
  if (!Array.isArray(rawLines) || rawLines.length !== 6) {
    return NextResponse.json({ error: "需要恰好 6 条爻线数据" }, { status: 400 });
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

  return NextResponse.json(interpretation);
}
