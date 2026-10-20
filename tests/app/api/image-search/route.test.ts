// @vitest-environment node
//
// The image-search route: a picture goes to the image model over HTTP, a
// short product description comes back. The model name is an env value; the
// old hardcoded one was retired by Google, so every photo search failed.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));
const rateLimit = vi.fn();
vi.mock("serverRequests/radis", () => ({
  fixedWindowRateLimit: (...a: unknown[]) => rateLimit(...a),
}));

const fetchMock = vi.fn();

import { POST } from "app/api/image-search/route";

// Every request carries the session cookie unless a test says otherwise: the
// route refuses a caller with no session before it spends a paid call.
const request = (fields: { file?: File; language?: string; cookie?: string | null }) => {
  const form = new FormData();
  if (fields.file) form.append("file", fields.file);
  if (fields.language) form.append("language", fields.language);
  const cookie = fields.cookie === undefined ? "MARKET-TOKEN=session" : fields.cookie;
  return new NextRequest("https://trydos.test/api/image-search", {
    method: "POST",
    body: form,
    headers: cookie ? { cookie } : {},
  });
};

const png = () => new File([new Uint8Array([1, 2, 3])], "a.png", { type: "image/png" });

/** A Gemini answer whose first candidate says `text`. */
const modelSays = (text: string) =>
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );

/** A Gemini refusal: the status and the body text it answered with. */
const modelRefuses = (status: number, body: string) =>
  fetchMock.mockResolvedValue(new Response(body, { status }));

/** The JSON body the route sent to the model on its first call. */
const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body as string);
const sentParts = () => sentBody().contents[0].parts as any[];
const sentPrompt = () => sentParts()[0].text as string;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GEMINI_API_KEY", "test-key");
  rateLimit.mockResolvedValue({ allowed: true, remaining: 9, ttl: 60 });
  modelSays(" T-shirt black xxl ");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("the image-search route", () => {
  it("refuses a caller with no session before calling the model", async () => {
    const response = await POST(request({ file: png(), language: "en", cookie: null }));

    expect(response.status, "a caller with no session reached the paid model").toBe(401);
    expect(fetchMock, "the model was called for a caller with no session").not.toHaveBeenCalled();
  });

  it("refuses a caller over the limit before calling the model", async () => {
    rateLimit.mockResolvedValue({ allowed: false, remaining: 0, ttl: 30 });

    const response = await POST(request({ file: png(), language: "en" }));

    expect(response.status, "a caller over the limit reached the paid model").toBe(429);
    expect(rateLimit.mock.calls[0][0], "the limiter key does not name image search").toMatch(/^paid:image-search:rl:/);
    expect(fetchMock, "the model was called for a caller over the limit").not.toHaveBeenCalled();
  });

  it("refuses a picture over the size cap before calling the model", async () => {
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });

    const response = await POST(request({ file: big, language: "en" }));

    expect(response.status, "a picture over the cap reached the paid model").toBe(413);
    expect(fetchMock, "the model was called for a picture over the cap").not.toHaveBeenCalled();
  });

  it("refuses a request with no language", async () => {
    const response = await POST(request({ file: png() }));

    expect(response.status, "a request with no language was accepted").toBe(400);
    expect(fetchMock, "the model was called for a refused request").not.toHaveBeenCalled();
  });

  it("refuses a file that is not an image", async () => {
    const response = await POST(
      request({ file: new File(["x"], "a.txt", { type: "text/plain" }), language: "en" }),
    );

    await expect(response.json(), "a text file was not refused as the wrong type").resolves.toMatchObject({
      error: "Invalid file type",
    });
    expect(fetchMock, "the model was called for a file that is not an image").not.toHaveBeenCalled();
  });

  it("calls the model from the env value, with the key in a header and never in the address", async () => {
    await POST(request({ file: png(), language: "en" }));

    const [url, init] = fetchMock.mock.calls[0];
    // The isolated test env sets no model, so the default must be used.
    expect(url, "the model address is not the default image model").toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
    );
    expect(String(url), "the API key was put in the address").not.toContain("test-key");
    expect(init.headers["x-goog-api-key"], "the API key was not sent in the header").toBe("test-key");
    expect(init.cache, "the model call may be cached").toBe("no-store");
  });

  it("sends the picture as base64 with its type and returns the trimmed description", async () => {
    const response = await POST(request({ file: png(), language: "en" }));

    expect(sentParts()[1], "the picture was not sent as base64 with its type").toEqual({
      inlineData: { mimeType: "image/png", data: "AQID" },
    });
    expect(sentPrompt(), "the English request did not ask for English").toContain("(Please respond in English)");
    await expect(response.json(), "the description did not come back trimmed").resolves.toEqual({
      success: true,
      response: "T-shirt black xxl",
    });
  });

  it.each([
    ["ar", "(Please respond in Arabic)"],
    ["tr", "(Please respond in Turkish)"],
  ])("asks for the right language for %s", async (language, phrase) => {
    await POST(request({ file: png(), language }));

    expect(sentPrompt(), `the ${language} request did not ask for the right language`).toContain(phrase);
  });

  it.each(["NO_PRODUCT_FOUND", "There is no product here", "I cannot identify it", "This is not a product", "no clear product", ""])(
    "answers 400 when the model says %j",
    async (text) => {
      modelSays(text);

      const response = await POST(request({ file: png(), language: "en" }));

      expect(response.status, `the model answer "${text}" was not taken as no product`).toBe(400);
      await expect(response.json(), `the model answer "${text}" got the wrong label`).resolves.toMatchObject({
        error: "No product detected",
      });
    },
  );

  it("answers 400 when the model blocked the picture for safety", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ finishReason: "SAFETY", content: { parts: [] } }] }), {
        status: 200,
      }),
    );

    const response = await POST(request({ file: png(), language: "en" }));

    expect(response.status, "a safety block got the wrong status").toBe(400);
    await expect(response.json(), "a safety block got the wrong label").resolves.toMatchObject({
      error: "Content Safety Error",
    });
  });

  it("answers 400 when the model blocked the whole prompt", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ promptFeedback: { blockReason: "SAFETY" } }), { status: 200 }),
    );

    const response = await POST(request({ file: png(), language: "en" }));

    expect(response.status, "a blocked prompt got the wrong status").toBe(400);
    await expect(response.json(), "a blocked prompt got the wrong label").resolves.toMatchObject({
      error: "Content Safety Error",
    });
  });

  it("passes the model's own quota refusal on as 429", async () => {
    modelRefuses(429, JSON.stringify({ error: { message: "quota exceeded" } }));

    const response = await POST(request({ file: png(), language: "en" }));

    expect(response.status, "the model's quota refusal got the wrong status").toBe(429);
    await expect(response.json(), "the model's quota refusal got no shopper message").resolves.toMatchObject({
      error: "Too many requests. Please try again in a moment.",
      success: false,
    });
  });

  it.each([
    [400, "API key not valid. Please pass a valid API key.", 500, "API Configuration Error"],
    [403, "The API key is missing", 500, "API Configuration Error"],
    [500, "boom", 500, "Internal server error"],
  ])("maps a model refusal %s %j", async (status, body, expectedStatus, error) => {
    modelRefuses(status, body);

    const response = await POST(request({ file: png(), language: "en" }));

    expect(response.status, `the model refusal ${status} got the wrong status`).toBe(expectedStatus);
    await expect(response.json(), `the model refusal ${status} got the wrong label`).resolves.toMatchObject({ error });
    expect(LogServerError, "the model refusal was not reported").toHaveBeenCalled();
  });

  it("answers 500 with the error text when the call itself fails", async () => {
    fetchMock.mockRejectedValue(new Error("socket hang up"));

    const response = await POST(request({ file: png(), language: "en" }));

    expect(response.status, "a failed call got the wrong status").toBe(500);
    await expect(response.json(), "a failed call did not carry its error text").resolves.toEqual({
      error: "Internal server error",
      details: "socket hang up",
    });
    expect(LogServerError, "the failed call was not reported").toHaveBeenCalled();
  });

  it("uses a fallback text when the error has no message", async () => {
    fetchMock.mockRejectedValue({});

    const response = await POST(request({ file: png(), language: "en" }));

    await expect(response.json(), "an error with no message did not get the fallback text").resolves.toEqual({
      error: "Internal server error",
      details: "An unexpected error occurred",
    });
  });
});
