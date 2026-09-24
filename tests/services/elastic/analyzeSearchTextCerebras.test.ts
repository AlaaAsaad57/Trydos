// @vitest-environment node
//
// The search text analyser (services/elastic/analyzeSearchTextCerebras.ts).
//
// It asks the Cerebras AI service to split a search like "red dress XL" into a
// product name, colours and sizes. It is best effort: it never throws, it gives
// up after a time budget, and a failure is returned as `{ error }` so the search
// runs on the raw text instead.
//
// The AI service (global fetch), the colour/size list and the error reporter are
// replaced. Nothing here reaches the real service.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({ colorsAndSizes: vi.fn(), logServerError: vi.fn() }));

vi.mock("serverRequests/analyticsUtility", () => ({ GetColorAndSizes: io.colorsAndSizes }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: io.logServerError }));

import AnalyzeSearchTextCerebras from "services/elastic/analyzeSearchTextCerebras";

const fetchMock = vi.fn();

/** An answer from the AI service carrying `content` as its message. */
const aiAnswer = (content: string | undefined) => ({
  ok: true,
  status: 200,
  json: async () => ({ choices: [{ message: { content } }] }),
});

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  io.colorsAndSizes.mockResolvedValue({ colors: "#ff0000, #0000ff", sizes: "S, M, XL" });
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

    const result = await AnalyzeSearchTextCerebras("red%20dress");

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const prompt: string = body.messages[0].content;
    expect(prompt, "the allowed colours were not sent without spaces").toContain(
      "ALLOWED_COLORS (hex): #ff0000,#0000ff",
    );
    expect(prompt, "the search was not decoded before it was sent").toContain('QUERY: "red dress"');
    expect(result, "the analysis is wrong or kept empty fields").toMatchObject({
      name: "dress",
      color: ["#ff0000"],
      model: "gpt-oss-120b",
    });
    expect(Object.keys(result), "an empty or 'Unknown' field was kept").not.toContain("size");
    expect(Object.keys(result), "an 'Unknown' field was kept").not.toContain("extra");
    expect(typeof result.cerebrasTime, "the time taken was not measured").toBe("number");
  });

  it("reads an answer wrapped in a code fence or in prose", async () => {
    fetchMock.mockResolvedValueOnce(aiAnswer('```json\n{"name":"hat"}\n```'));
    expect((await AnalyzeSearchTextCerebras("a hat")).name, "a fenced answer was not read").toBe("hat");

    fetchMock.mockResolvedValueOnce(aiAnswer('Sure! {"name":"shoe"} hope it helps'));
    expect((await AnalyzeSearchTextCerebras("a shoe")).name, "an answer inside prose was not read").toBe("shoe");
  });

  it("returns nothing found for an answer it cannot read, or no answer at all", async () => {
    io.colorsAndSizes.mockResolvedValue(null);
    fetchMock.mockResolvedValueOnce(aiAnswer("no json here"));
    const unreadable = await AnalyzeSearchTextCerebras("x y");
    expect(unreadable.name, "an unreadable answer gave a product name").toBeUndefined();
    expect(unreadable.error, "an unreadable answer was treated as a failure").toBeUndefined();

    fetchMock.mockResolvedValueOnce(aiAnswer("{broken {json}"));
    expect((await AnalyzeSearchTextCerebras("x y")).name, "a broken answer gave a product name").toBeUndefined();

    fetchMock.mockResolvedValueOnce(aiAnswer(undefined));
    expect((await AnalyzeSearchTextCerebras("x y")).error, "no answer was treated as a failure").toBeUndefined();
  });

  it("says plainly when the AI quota is reached", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 });

    expect(await AnalyzeSearchTextCerebras("red dress"), "a quota hit was not named as one").toEqual({
      error: "AI quota reached — not a bug (Cerebras rate limit)",
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

    const refused = await AnalyzeSearchTextCerebras("red dress");
    const noBody = await AnalyzeSearchTextCerebras("red dress");

    expect(refused.error, "the refusal did not carry the status and the body").toBe(
      "Cerebras API error: 402 — payment required",
    );
    expect(noBody.error, "a refusal with no body did not carry the status").toBe("Cerebras API error: 500 — ");
    expect(
      io.logServerError.mock.calls[0]?.[0]?.scenario,
      "the refusal was not reported",
    ).toBe("AnalyzeSearchTextCerebras in services/analyzeSearchTextCerebras");
  });

  it("reports a non-error failure as text", async () => {
    fetchMock.mockRejectedValue("socket closed");

    const result = await AnalyzeSearchTextCerebras("red dress");

    expect(io.logServerError.mock.calls[0]?.[0]?.error, "the failure was not reported as text").toBe(
      "socket closed",
    );
    expect(result.error, "a non-error failure did not give an error field").toBe("undefined");
  });

  it("gives up after the time budget so the search is never held", async () => {
    vi.stubEnv("SEARCH_ANALYZE_TIMEOUT_MS", "20");
    fetchMock.mockImplementation(() => new Promise(() => {}));

    const result = await AnalyzeSearchTextCerebras("red dress");

    expect(result.timedOut, "a hung analysis held the search").toBe(true);
    expect(result.error, "the time-out did not name its budget").toContain("gave up after 20ms");
  });
});
