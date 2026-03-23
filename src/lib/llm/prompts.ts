import type { ReadingStrategy } from "@/types/reading";
import type { StructureLayer } from "@/types/explain";

export function buildInterpretSystemPrompt(): string {
  return `你是一个基于《周易本义》的结构化文本摘要助手。

你的任务是：将给定的卦象结构、经文和传文整合成简明可读的自然语言说明。

你不是占卜师，不是心灵导师，不是玄学聊天机器人。你是文本转述器。

必须遵守：
1. 克制：不说"一定会""命中注定""此事必成/必败"。
2. 文本锚定：每个判断都要有来源经传文本支持，不凭空发挥。
3. 分层清晰：先说结构事实，再说经文重点，最后给保守总结。
4. 不替代现实决策，不渲染命运感。
5. 可以说"从卦辞看，更强调……""按此阅读策略，重点在……""经文更提示……而非……"。
6. 不可以说"你应该辞职/分手/投资"或任何绝对预测。
7. 不把缺失的古义用 AI 想当然补出，不确定处标明"此处有传统分歧"。

输出格式（合法 JSON）：
{
  "overview": "卦象概述（2-3句，客观结构）",
  "keyTexts": "经文要点（基于阅读策略提取的核心文本及简要释义）",
  "summary": "综合提示（1-2句保守、留有余地的总结）"
}`;
}

export function buildInterpretUserPrompt(
  structure: StructureLayer,
  strategy: ReadingStrategy,
  question?: string
): string {
  const primaryTextsBlock = strategy.primaryTexts
    .map((t) => `[${t.layer}] ${t.label}: ${t.content}`)
    .join("\n");

  const secondaryTextsBlock = strategy.secondaryTexts
    .map((t) => `[${t.layer}] ${t.label}: ${t.content}`)
    .join("\n");

  return `请根据以下卦象信息生成结构化摘要 JSON：

本卦：${structure.originalHexagramName}（第${structure.originalHexagramId}卦）
上卦：${structure.upperTrigram}  下卦：${structure.lowerTrigram}
阴阳分布：阳${structure.yinYangDistribution.yang} 阴${structure.yinYangDistribution.yin}
${structure.dynamicStaticRelation}
${structure.changedHexagramName ? `变卦：${structure.changedHexagramName}（第${structure.changedHexagramId}卦）` : "无变卦"}

阅读策略：${strategy.rationale}

主读文本：
${primaryTextsBlock}

次读文本：
${secondaryTextsBlock}

${question ? `用户问题：${question}` : ""}

要求：
1. overview 只写客观结构事实，不加主观判断。
2. keyTexts 紧扣阅读策略选出的主读文本，给出简要释义，必须引用原文。
3. summary 保守、留有余地，不做绝对预测。
4. 若用户提供了问题，summary 中可简要回应，但不替用户做决定。
5. 输出合法 JSON，不输出 JSON 以外的内容。`;
}
