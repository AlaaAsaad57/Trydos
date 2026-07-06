import { GetColorAndSizes } from "serverRequests/analyticsUtility";
import { setAiRateLimits } from "serverRequests/radis";
import { LogServerError } from "utils/serverErrorReporter";

// Cerebras variant of AnalyzeSearchText. Same return contract as the Gemini
// version ({ name?, color?, size?, error? }) so callers need no logic changes.
// Extras: captures Cerebras' x-ratelimit-* headers into Redis on every call
// (surfaced by the "Show AI Rate Limits" debug modal) and returns a clear,
// non-cryptic error on a 429 so QA can tell a quota hit from a real bug.

const API_URL = "https://api.cerebras.ai/v1/chat/completions";
// Flip the model without a redeploy via CEREBRAS_MODEL (e.g. "gemma-4-31b").
const MODEL = process.env.CEREBRAS_MODEL || "gpt-oss-120b";

// Pull every x-ratelimit-* header (robust to Cerebras adding/renaming ones) and
// persist a small snapshot so the debug modal can show the live org-level quota.
async function captureRateLimits(response: Response, ok: boolean) {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    if (key.toLowerCase().startsWith("x-ratelimit")) {
      headers[key.toLowerCase()] = value;
    }
  });
  if (Object.keys(headers).length === 0) return;
  await setAiRateLimits({
    provider: "cerebras",
    model: MODEL,
    status: response.status,
    ok,
    updatedAt: new Date().toISOString(),
    headers,
  });
}

// gpt-oss is a reasoning model; even with response_format the content is the
// final answer, but strip any stray markdown fence and fall back to the first
// {...} block so a formatting hiccup never crashes search.
function safeParseJson(text: string): Record<string, any> {
  if (!text) return {};
  let t = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(t);
  } catch {
    const match = t.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* fall through */
      }
    }
    return {};
  }
}

export default async function AnalyzeSearchTextCerebras(query): Promise<any> {
  const modifiedQuery = decodeURIComponent(query);
  const start = process.hrtime.bigint();
  const data = await GetColorAndSizes();

  // Minified input: bare comma lists (no JSON.stringify wrapping) to spend
  // fewer tokens. HEX codes must stay — the model returns them as the answer.
  const colors = (data?.colors || "").replace(/,\s+/g, ",");
  const sizes = (data?.sizes || "").replace(/,\s+/g, ",");

  const prompt = `Parse this e-commerce search query into JSON.

ALLOWED_COLORS (hex): ${colors}
ALLOWED_SIZES: ${sizes}

Return ONLY this JSON, no markdown, no prose:
{"name": string, "color": string[], "size": string[]}

Rules:
- name: the product only. Strip color/size/material words. A word that looks like a color can still be the product (e.g. "باذنجان ابيض" → name "باذنجان", color white). Omit if there is no product.
- color: hex codes from ALLOWED_COLORS matching the query's color in ANY language. Prefer the standard hex (e.g. #000000) over custom codes. Map "dark"/"light" to the closest. Omit if none.
- size: values from ALLOWED_SIZES. Map terms like "extra large"/"كبير جدا" → XL/XXL, "small" → S, "medium" → M. Omit if none.
- Omit any field you cannot determine — never output "Unknown".

QUERY: "${modifiedQuery}"`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    // Capture quota headers first — they arrive on 429s too (with reset info).
    await captureRateLimits(response, response.ok);

    if (response.status === 429) {
      return {
        error: "AI quota reached — not a bug (Cerebras rate limit)",
        rateLimited: true,
      };
    }
    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      throw new Error(
        `Cerebras API error: ${response.status} — ${bodyText.slice(0, 200)}`,
      );
    }

    const result: any = await response.json();
    const outputText =
      result?.choices?.[0]?.message?.content?.trim() || "{}";
    const parsed = safeParseJson(outputText);

    // Drop empties so the caller's `if (CleanSearchText?.x)` guards stay clean.
    const filtered = Object.fromEntries(
      Object.entries(parsed).filter(([_, v]) => {
        if (v === "Unknown" || v === "" || v == null) return false;
        if (Array.isArray(v) && v.length === 0) return false;
        return true;
      }),
    );

    const end = process.hrtime.bigint();
    return { ...filtered, cerebrasTime: Number(end - start) / 1_000_000, model: MODEL };
  } catch (error) {
    LogServerError({
      scenario: "AnalyzeSearchTextCerebras in services/analyzeSearchTextCerebras",
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: `${error?.message}`, details: error.message };
  }
}
