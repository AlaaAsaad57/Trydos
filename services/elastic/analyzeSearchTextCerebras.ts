import { GetColorAndSizes } from "serverRequests/analyticsUtility";
import { LogServerError } from "utils/serverErrorReporter";

// Cerebras variant of AnalyzeSearchText. Same return contract as the Gemini
// version ({ name?, color?, size?, error? }) so callers need no logic changes.
// Returns a clear, non-cryptic error on a 429 so QA can tell a quota hit from a
// real bug.

const API_URL = "https://api.cerebras.ai/v1/chat/completions";
// Flip the model without a redeploy via CEREBRAS_MODEL (e.g. "gemma-4-31b").
const MODEL = process.env.CEREBRAS_MODEL || "gpt-oss-120b";

// Hard ceiling on the whole analysis — **this is the only part of the search
// route that could run without one.**
//
// The analysis is best-effort: `services/elastic/elasticSearch.ts` catches the
// error this returns and searches with the raw text instead. So a slow analysis
// must give up and let the search run. It must never hold it.
//
// Everything else on `/api/products/searchInCatalog` is already bounded —
// Elasticsearch at `requestTimeout: 8000` with two retries, `fetchServerData`
// at 15 000 ms. This call was not, in three places: `GetColorAndSizes` reads
// Redis with no command timeout, then fetches with no abort signal, and the
// Cerebras call below had no signal either. Any one of them could stall for
// ever.
//
// It did. On CI runs 35499149467 and 35529493739 the browser case QA-09e failed
// with `page.goto: Timeout 45000ms exceeded` on that route. The request logged
// nothing at all — not even the Cerebras error the route always prints — so it
// was still inside this function when the browser gave up 45 seconds later. The
// same case passed in 3.3 s on run 35504570850, with the same Cerebras 402 in
// the log, which is what says the AI failure was never the problem.
//
// 6 seconds: generous for a working call (a healthy one answers in about two),
// and it keeps the route's worst case near 14 s, well inside the 45 s a browser
// or the mobile app will wait. Tunable without a redeploy, like the model above.
const DEFAULT_ANALYZE_TIMEOUT_MS = 6000;
const analyzeBudgetMs = () =>
  Number(process.env.SEARCH_ANALYZE_TIMEOUT_MS) || DEFAULT_ANALYZE_TIMEOUT_MS;

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

/** Analyse a search query, and give up rather than hold the search.
 *
 *  A wrapper over `runAnalysis` that does nothing but enforce the deadline
 *  above. It keeps the same return contract — `{ name?, color?, size?, error? }`
 *  and never throws — so the two callers need no change. */
export default async function AnalyzeSearchTextCerebras(query): Promise<any> {
  const budgetMs = analyzeBudgetMs();
  let giveUp: ReturnType<typeof setTimeout> | undefined;

  const deadline = new Promise<any>((resolve) => {
    giveUp = setTimeout(
      () =>
        resolve({
          error:
            `search analysis gave up after ${budgetMs}ms — the search ran on ` +
            `the raw text, so this is a slow dependency, not a broken search`,
          timedOut: true,
        }),
      budgetMs,
    );
  });

  try {
    return await Promise.race([runAnalysis(query, budgetMs), deadline]);
  } finally {
    // Stops the timer holding the process open once the analysis has answered.
    clearTimeout(giveUp);
  }
}

async function runAnalysis(query, budgetMs: number): Promise<any> {
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
      // The deadline above already stops a slow call holding the search. This
      // drops the socket as well, so a hung Cerebras never leaves a request
      // running behind a search that has already answered.
      signal: AbortSignal.timeout(budgetMs),
    });

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
