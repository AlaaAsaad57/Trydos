// @vitest-environment node
//
// The search text analyser (services/elastic/analyzeSearchText.ts).
//
// It asks Gemini to split a search like "red dress XL" into a
// product name, colours and sizes. It is best effort: it never throws, it gives
// up after a time budget, and a failure is returned as `{ error }` so the search
// runs on the raw text instead.
//
// The AI service (global fetch), the colour/size list and the error reporter are
// replaced. Nothing here reaches the real service.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({
  colorsAndSizes: vi.fn(),
  logServerError: vi.fn(),
  redisGet: vi.fn(),
  redisSet: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("serverRequests/analyticsUtility", () => ({ GetColorAndSizes: io.colorsAndSizes }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: io.logServerError }));
vi.mock("serverRequests/radis", () => ({
  RedisGet: io.redisGet,
  RedisSet: io.redisSet,
  fixedWindowRateLimit: io.rateLimit,
}));

import AnalyzeSearchText from "services/elastic/analyzeSearchText";

const fetchMock = vi.fn();

/** An answer from Gemini carrying `text` as its first part. */
const aiAnswer = (content: string | undefined) => ({
  ok: true,
  status: 200,
  json: async () => ({ candidates: [{ content: { parts: [{ text: content }] } }] }),
});

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  io.colorsAndSizes.mockResolvedValue({ colors: "#ff0000, #0000ff", sizes: "S, M, XL" });
  io.redisGet.mockResolvedValue(null);
  io.redisSet.mockResolvedValue(undefined);
  io.rateLimit.mockResolvedValue({ allowed: true, remaining: 10, ttl: 60 });
  vi.stubEnv("GEMINI_API_KEY", "not-a-real-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("analysing a search", () => {
  it("sends the allowed colours and sizes and returns what the service found", async () => {
    fetchMock.mockResolvedValue(
      aiAnswer('{"name":"dress","color":["#ff0000"],"size":[],"extra":"Unknown","note":"","gone":null}'),
    );

    const result = await AnalyzeSearchText("red%20dress");

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const prompt: string = body.contents[0].parts[0].text;
    expect(prompt, "the allowed colours were not sent without spaces").toContain(
      "ALLOWED_COLORS (hex): #ff0000,#0000ff",
    );
    expect(prompt, "the search was not decoded before it was sent").toContain('QUERY: "red dress"');
    expect(fetchMock.mock.calls[0][0], "the call did not go to Gemini").toContain(
      "generativelanguage.googleapis.com",
    );
    expect(fetchMock.mock.calls[0][0], "the API key leaked into the URL").not.toContain("key=");
    expect(
      fetchMock.mock.calls[0][1].headers["x-goog-api-key"],
      "the API key was not sent in the header",
    ).toBe("not-a-real-key");
    expect(body.generationConfig?.responseMimeType, "JSON output was not forced").toBe("application/json");
    expect(result, "the analysis is wrong or kept empty fields").toMatchObject({
      name: "dress",
      color: ["#ff0000"],
      model: "gemini-2.5-flash-lite",
    });
    expect(Object.keys(result), "an empty or 'Unknown' field was kept").not.toContain("size");
    expect(Object.keys(result), "an 'Unknown' field was kept").not.toContain("extra");
    expect(typeof result.analyzeTime, "the time taken was not measured").toBe("number");
  });

  it("reads an answer wrapped in a code fence or in prose", async () => {
    fetchMock.mockResolvedValueOnce(aiAnswer('```json\n{"name":"hat"}\n```'));
    expect((await AnalyzeSearchText("a hat")).name, "a fenced answer was not read").toBe("hat");

    fetchMock.mockResolvedValueOnce(aiAnswer('Sure! {"name":"shoe"} hope it helps'));
    expect((await AnalyzeSearchText("a shoe")).name, "an answer inside prose was not read").toBe("shoe");
  });

  it("returns nothing found for an answer it cannot read, or no answer at all", async () => {
    io.colorsAndSizes.mockResolvedValue(null);
    fetchMock.mockResolvedValueOnce(aiAnswer("no json here"));
    const unreadable = await AnalyzeSearchText("x y");
    expect(unreadable.name, "an unreadable answer gave a product name").toBeUndefined();
    expect(unreadable.error, "an unreadable answer was treated as a failure").toBeUndefined();

    fetchMock.mockResolvedValueOnce(aiAnswer("{broken {json}"));
    expect((await AnalyzeSearchText("x y")).name, "a broken answer gave a product name").toBeUndefined();

    fetchMock.mockResolvedValueOnce(aiAnswer(undefined));
    expect((await AnalyzeSearchText("x y")).error, "no answer was treated as a failure").toBeUndefined();
  });

  it("says plainly when the AI quota is reached", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 });

    expect(await AnalyzeSearchText("red dress"), "a quota hit was not named as one").toEqual({
      error: "AI quota reached — not a bug (Gemini rate limit)",
      rateLimited: true,
    });
  });

  it("returns the service's refusal, and reports it", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 402, text: async () => "payment required" })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => {
          throw new Error("no body");
        },
      });

    const refused = await AnalyzeSearchText("red dress");
    const noBody = await AnalyzeSearchText("red dress");

    expect(refused.error, "the refusal did not carry the status and the body").toBe(
      "Gemini API error: 402 — payment required",
    );
    expect(noBody.error, "a refusal with no body did not carry the status").toBe("Gemini API error: 500 — ");
    expect(
      io.logServerError.mock.calls[0]?.[0]?.scenario,
      "the refusal was not reported",
    ).toBe("AnalyzeSearchText in services/elastic/analyzeSearchText");
  });

  it("reports a non-error failure as text", async () => {
    fetchMock.mockRejectedValue("socket closed");

    const result = await AnalyzeSearchText("red dress");

    expect(io.logServerError.mock.calls[0]?.[0]?.error, "the failure was not reported as text").toBe(
      "socket closed",
    );
    expect(result.error, "a non-error failure did not give an error field").toBe("undefined");
  });

  it("stores a good answer, so the same search is not a second paid call", async () => {
    fetchMock.mockResolvedValue(aiAnswer('{"name":"dress","color":["#ff0000"]}'));

    await AnalyzeSearchText("Red%20Dress");

    const [key, value, ttl] = io.redisSet.mock.calls[0] ?? [];
    expect(key, "the answer was not stored under a search-analysis key").toMatch(/^search:analyze:v1:[0-9a-f]{40}$/);
    expect(key, "the raw search text was written into the Redis key").not.toContain("dress");
    expect(value, "the stored answer is not the parsed result").toEqual({ name: "dress", color: ["#ff0000"] });
    expect(ttl, "the stored answer has no lifetime").toBeGreaterThan(0);
  });

  it("answers from the store without calling the AI, and ignores case and spaces", async () => {
    io.redisGet.mockResolvedValue({ name: "dress", color: ["#ff0000"] });

    const result = await AnalyzeSearchText("  RED dress ");

    expect(fetchMock, "a stored search still called the AI").not.toHaveBeenCalled();
    expect(result, "the stored answer was not returned").toMatchObject({ name: "dress", color: ["#ff0000"], cached: true });
    expect(io.redisGet.mock.calls[0][0], "the key does not fold case and spaces").toMatch(/^search:analyze:v1:[0-9a-f]{40}$/);
  });

  it("does not store a refusal or an unreadable answer", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => "boom" });

    await AnalyzeSearchText("red dress");

    expect(io.redisSet, "a refused analysis was stored").not.toHaveBeenCalled();
  });

  it("skips the AI when the calls-per-minute budget is spent, so the search runs on the raw text", async () => {
    io.rateLimit.mockResolvedValue({ allowed: false, remaining: 0, ttl: 20 });

    const result = await AnalyzeSearchText("red dress");

    expect(fetchMock, "the AI was called over the budget").not.toHaveBeenCalled();
    expect(result.rateLimited, "an over-budget search was not marked as rate limited").toBe(true);
    expect(result.error, "the over-budget message does not say the search still ran").toContain("raw text");
    expect(io.rateLimit.mock.calls[0][0], "the budget is not one shared counter").toBe("search:analyze:rl:global");
  });

  it("skips the AI when the limiter is not available, so a paid call never runs uncapped", async () => {
    io.rateLimit.mockResolvedValue({ allowed: true, remaining: 10, ttl: 0 });

    const result = await AnalyzeSearchText("red dress");

    expect(fetchMock, "the AI was called with the limiter down").not.toHaveBeenCalled();
    expect(result.skipped, "a skipped analysis was not marked as skipped").toBe(true);
  });

  it("gives up after the time budget so the search is never held", async () => {
    vi.stubEnv("SEARCH_ANALYZE_TIMEOUT_MS", "20");
    fetchMock.mockImplementation(() => new Promise(() => {}));

    const result = await AnalyzeSearchText("red dress");

    expect(result.timedOut, "a hung analysis held the search").toBe(true);
    expect(result.error, "the time-out did not name its budget").toContain("gave up after 20ms");
  });
});
