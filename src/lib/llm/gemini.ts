export class GeminiClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiClientError";
  }
}

export async function generateGeminiReply(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiClientError("未检测到 GEMINI_API_KEY 环境变量");
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `[系统设定]\n${systemPrompt}\n\n[用户输入]\n${userPrompt}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new GeminiClientError(`Gemini API 错误 (${response.status}): ${text}`);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts
      .map((part: { text?: unknown }) =>
        typeof part?.text === "string" ? part.text : ""
      )
      .join("")
      .trim()
    : "";
  if (!text) {
    throw new GeminiClientError("Gemini 返回为空");
  }
  return text;
}
