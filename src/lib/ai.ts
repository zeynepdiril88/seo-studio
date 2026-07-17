// Google Gemini (Generative Language API) client via fetch — no SDK, free-tier friendly.
// Get a free key at https://aistudio.google.com/apikey

export type Msg = { role: "user" | "assistant"; content: string };

export async function generate(opts: {
  system?: string;
  messages: Msg[];
  maxTokens?: number;
  temperature?: number;
  think?: boolean;
  json?: boolean;
  search?: boolean;
}): Promise<string> {
  const key = process.env.GEMINI_API_KEY || process.env.GeminiKey;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey and add it to .env.local."
    );
  }
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const contents = opts.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const generationConfig: Record<string, unknown> = {
    temperature: opts.temperature ?? 0.4,
    maxOutputTokens: opts.maxTokens ?? 4096,
  };
  // JSON mode by default; pass json:false for prose output (e.g. a full markdown article).
  if (opts.json !== false) generationConfig.responseMimeType = "application/json";
  // gemini-flash-latest is a thinking model. Disable thinking by default (fast, more output
  // tokens for JSON). Enable it (opts.think) where analysis depth matters, e.g. the audit —
  // pass a higher maxTokens so both the reasoning and the JSON answer fit.
  if (!opts.think) generationConfig.thinkingConfig = { thinkingBudget: 0 };

  const body: Record<string, unknown> = { contents, generationConfig };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
  // Google Search grounding — Gemini searches the live web and grounds its answer in real results.
  if (opts.search) body.tools = [{ google_search: {} }];

  const payload = JSON.stringify(body);
  let lastErr = "";
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
    });

    if (res.ok) {
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      return (data.candidates?.[0]?.content?.parts ?? [])
        .map((p) => p.text ?? "")
        .join("")
        .trim();
    }

    lastErr = await res.text();
    // Retry transient capacity / rate errors (common on the free tier).
    if ((res.status === 503 || res.status === 429) && attempt < 4) {
      await new Promise((r) => setTimeout(r, attempt * 1500));
      continue;
    }
    throw new Error(`Gemini API error ${res.status}: ${lastErr.slice(0, 400)}`);
  }
  throw new Error(`Gemini API error: ${lastErr.slice(0, 400)}`);
}

// Responses come back as JSON (responseMimeType); parse defensively anyway.
export function extractJson<T = unknown>(text: string): T {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  return JSON.parse(s) as T;
}
