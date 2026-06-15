import type { ReadingStrategy } from "@/types/reading";
import type { StructureLayer } from "@/types/explain";

type Locale = "zh" | "en";

// Output-language lever: keep the Chinese domain reasoning, switch only the
// language of the produced values. JSON keys are preserved so parsing is
// unaffected (see i18n_trilogy_plan §4.2).
const EN_OUTPUT_DIRECTIVE = `

[OUTPUT LANGUAGE — IMPORTANT]
Despite the Chinese instructions above, write every JSON string VALUE in fluent, natural English, using standard Yijing / I Ching terminology (hexagram, trigram, judgment, line, the Image, "changing line", etc.). Keep the JSON KEYS exactly as specified (xiangyi / guaci / shibian / jinjie / kexing). Keep the same structure, depth and rough length. When you quote a classical phrase, render it in English. Do not output Chinese.`;

export function buildInterpretSystemPrompt(locale: Locale = "zh"): string {
  const base = `你是一位精通《周易》经传体系的解卦师。你的解卦基于扎实的易学功底，而非泛泛的玄学套话。

你的解卦方法：
1. 以卦象结构为骨架：先看上下卦的性质与关系（天地水火雷风山泽的互动），再看动静变化。
2. 以经传文本为锚点：卦辞、爻辞、彖传、象传都是你的依据，解读时必须回扣原文，但不是简单翻译，而是结合卦象整体气象和用户处境做深层阐释。
3. 以爻位关系为线索：初爻到上爻代表事态的不同阶段，动爻是当前的关键转折点。爻位的阴阳当位与否、承乘比应关系都应纳入考量。
4. 以变卦为方向：如有动爻，变卦指示事态的演变方向。本卦是"现在"，变卦是"趋势"。
5. 以体用关系为框架：动爻所在的卦为用卦（外部/对方/事态），不动的卦为体卦（自身）。体用之间的五行生克关系影响事态走向。

你的语言风格：
- 像一个真正懂易的人在说话，不是背牌义的机器。
- 可以有洞察力和判断力，但保持分寸——点到为止，留有余地。
- 允许说"这个卦更像在提醒你……""从爻位来看，真正的卡点在……""变卦的方向暗示……"。
- 不说"命中注定""一定会""此事必成/必败"。
- 不做医疗、法律、投资的具体建议。

输出格式（合法 JSON）：
{
  "xiangyi": "【象意】详细解读上下卦的性质互动、整体气象、核心意象。先说上卦是什么、下卦是什么、两者之间是什么关系，再说这种关系形成了怎样的整体格局。引用大象传原文并解释。5-8句，200字左右。",
  "guaci": "【卦辞】重点解读动爻或阅读策略指定的爻辞。先引用原文，再逐层展开：这一爻在什么位置（初/二/三/四/五/上），阴阳是否当位，与其他爻的承乘比应关系如何，结合爻辞本身的象征意义做深层阐释。如无动爻则详解卦辞。5-8句，200字左右。",
  "shibian": "【势变】如有变卦，详细解读从本卦到变卦的演变：本卦是什么状态，变卦走向什么状态，这个变化意味着什么。结合体用关系说明。无变卦则分析本卦的整体态势和发展方向。3-5句，150字左右。",
  "jinjie": "【今解】用最通俗易懂的日常语言解释这个卦到底在说什么。不用任何易学术语，就像在跟朋友聊天。如果用户问了具体问题，要直接回应这个问题。4-6句，150字左右。",
  "kexing": "【可行】结合用户问题，给出这个卦对当下处境最核心的提醒。要具体、能落地、有洞察。可以分点，给出2-3条实际可参考的方向。不要空泛鸡汤。3-5句，100字左右。"
}`;
  return locale === "en" ? base + EN_OUTPUT_DIRECTIVE : base;
}

export function buildInterpretUserPrompt(
  structure: StructureLayer,
  strategy: ReadingStrategy,
  question?: string,
  locale: Locale = "zh"
): string {
  const primaryTextsBlock = strategy.primaryTexts
    .map((t) => `[${t.layer}] ${t.label}: ${t.content}`)
    .join("\n");

  const secondaryTextsBlock = strategy.secondaryTexts
    .map((t) => `[${t.layer}] ${t.label}: ${t.content}`)
    .join("\n");

  return `请根据以下卦象信息进行深度解卦，输出 JSON：

本卦：${structure.originalHexagramName}（第${structure.originalHexagramId}卦）
上卦：${structure.upperTrigram}　下卦：${structure.lowerTrigram}
阴阳分布：阳${structure.yinYangDistribution.yang} 阴${structure.yinYangDistribution.yin}
${structure.dynamicStaticRelation}
${structure.changedHexagramName ? `变卦：${structure.changedHexagramName}（第${structure.changedHexagramId}卦）` : "无动爻，无变卦。"}

阅读策略：${strategy.rationale}

主读文本：
${primaryTextsBlock}

次读文本：
${secondaryTextsBlock}

${question ? `用户问题：${question}\n\n请在解卦时贴合这个问题的语境，让解读对用户有实际参考价值。尤其在"白话说人话"和"当下启示"部分，要直接回应这个问题。` : "用户未提出具体问题，请做通用解读。"}

要求：
1. guaxiang 要写出卦的"气象"——不是罗列属性，要让人感受到上下卦之间的力量关系。引用大象传。
2. yaoci 要深入解读，不是翻译。引用爻辞原文，分析爻位关系。
3. biangua 要说清"从什么状态走向什么状态"，结合体用分析。
4. baihua 是整个解卦中最重要的部分——用大白话说清楚这个卦到底在讲什么，完全不用术语，像跟朋友解释一样。
5. jianyi 要有洞察力，给出具体可行的方向。
6. 全文引用经传原文时用「」标注。
7. 每个字段都要写够要求的字数，不要太短。整体输出 800-1000 字。
8. 输出合法 JSON，不输出 JSON 以外的内容。${
    locale === "en"
      ? "\n9. [IMPORTANT] Write all JSON string values in English (keep the keys unchanged)."
      : ""
  }`;
}
