// @vitest-environment node
//
// The image-search route: a picture goes to the image model, a short product
// description comes back.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();
const getGenerativeModel = vi.fn(() => ({ generateContent }));
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel = getGenerativeModel;
  },
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { POST } from "app/api/image-search/route";

const request = (fields: { file?: File; language?: string }) => {
  const form = new FormData();
  if (fields.file) form.append("file", fields.file);
  if (fields.language) form.append("language", fields.language);
  return new NextRequest("https://trydos.test/api/image-search", {
    method: "POST",
    body: form,
  });
};

const png = () => new File([new Uint8Array([1, 2, 3])], "a.png", { type: "image/png" });

const modelSays = (text: string) =>
  generateContent.mockResolvedValue({ response: Promise.resolve({ text: () => text }) });

/** The prompt the route sent to the model on its first call. */
const sentPrompt = () => generateContent.mock.calls[0][0][0] as string;

beforeEach(() => {
  vi.clearAllMocks();
  modelSays(" T-shirt black xxl ");
});

describe("the image-search route", () => {
  it("refuses a request with no language", async () => {
    const response = await POST(request({ file: png() }));

    expect(response.status, "a request with no language was accepted").toBe(400);
    expect(generateContent, "the model was called for a refused request").not.toHaveBeenCalled();
  });

  it("refuses a file that is not an image", async () => {
    const response = await POST(
      request({ file: new File(["x"], "a.txt", { type: "text/plain" }), language: "en" }),
    );

    await expect(response.json(), "a text file was not refused as the wrong type").resolves.toMatchObject({
      error: "Invalid file type",
    });
  });

  it("sends the picture as base64 and returns the trimmed description", async () => {
    const response = await POST(request({ file: png(), language: "en" }));

    expect(
      generateContent.mock.calls[0][0][1],
      "the picture was not sent as base64 with its type",
    ).toEqual({ inlineData: { data: "AQID", mimeType: "image/png" } });
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

  it.each(["NO_PRODUCT_FOUND", "There is no product here", "I cannot identify it", "This is not a product", "no clear product"])(
    "answers 400 when the model says %s",
    async (text) => {
      modelSays(text);

      const response = await POST(request({ file: png(), language: "en" }));

      expect(response.status, `the model answer "${text}" was not taken as no product`).toBe(400);
    },
  );

  it.each([
    ["API_KEY invalid", 500, "API Configuration Error"],
    ["blocked by SAFETY", 400, "Content Safety Error"],
    ["boom", 500, "Internal server error"],
  ])("maps the model error %s", async (message, status, error) => {
    generateContent.mockRejectedValue(new Error(message));

    const response = await POST(request({ file: png(), language: "en" }));

    expect(response.status, `the model error "${message}" got the wrong status`).toBe(status);
    await expect(response.json(), `the model error "${message}" got the wrong label`).resolves.toMatchObject({ error });
    expect(LogServerError, "the model error was not reported").toHaveBeenCalled();
  });

  it("uses a fallback text when the error has no message", async () => {
    generateContent.mockRejectedValue({});

    const response = await POST(request({ file: png(), language: "en" }));

    await expect(response.json(), "an error with no message did not get the fallback text").resolves.toEqual({
      error: "Internal server error",
      details: "An unexpected error occurred",
    });
  });
});
