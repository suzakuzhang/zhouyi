export interface DeepSeekResponse {
  overview: string;
  keyTexts: string;
  summary: string;
}

export class DeepSeekError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeepSeekError";
  }
}

export async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string
): Promise<DeepSeekResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new DeepSeekError("未检测到 DEEPSEEK_API_KEY 环境变量");
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
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new DeepSeekError(`DeepSeek API 错误 (${response.status}): ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new DeepSeekError("DeepSeek 返回为空");
  }

  try {
    return JSON.parse(content) as DeepSeekResponse;
  } catch {
    throw new DeepSeekError("DeepSeek 返回的 JSON 无法解析");
  }
}
