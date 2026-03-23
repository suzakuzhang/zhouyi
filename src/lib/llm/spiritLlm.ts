import { generateGeminiReply, GeminiClientError } from "./gemini";
import { callDeepSeek } from "./deepseek";

function normalizeSpiritReply(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  // If provider stops mid-sentence, add a soft landing instead of exposing hard cutoff.
  if (/[。！？!?”"』》）)]$/.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}。`;
}

/**
 * 卦灵对话 LLM 调用，优先 Gemini，Gemini 不可用时降级到 DeepSeek。
 */
export async function generateSpiritReply(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  // Try Gemini first
  try {
    const reply = await generateGeminiReply(systemPrompt, userPrompt);
    return normalizeSpiritReply(reply);
  } catch (err) {
    if (err instanceof GeminiClientError) {
      console.log(`[卦灵] Gemini 不可用 (${err.message}), 降级到 DeepSeek`);
    } else {
      console.log("[卦灵] Gemini 未知错误, 降级到 DeepSeek");
    }
  }

  // Fallback to DeepSeek
  try {
    const dsSystem = systemPrompt + "\n\n输出要求：直接输出回复文本，不要输出 JSON。";
    const response = await callDeepSeekText(dsSystem, userPrompt);
    return normalizeSpiritReply(response);
  } catch {
    throw new Error("Gemini 和 DeepSeek 均不可用");
  }
}

/**
 * DeepSeek plain text mode (not JSON)
 */
async function callDeepSeekText(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("未检测到 DEEPSEEK_API_KEY");
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek error: ${response.status}`);
  }

  const data = await response.json();
  return (data.choices?.[0]?.message?.content ?? "").trim();
}
