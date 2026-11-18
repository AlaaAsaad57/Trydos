// @vitest-environment node
//
// One picture -> one vector from the embedding model (Gemini). Every setting
// must match the backend job that wrote the catalogue vectors, or the
// comparison is random. The call itself is replaced here.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EmbeddingError, embedImage, toUnitLength } from "utils/server/imageEmbedding";

const fetchMock = vi.fn();
const picture = Buffer.from([1, 2, 3]);

const modelSends = (values: unknown, status = 200) =>
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(status === 200 ? { embedding: { values } } : values), { status }),
  );
const sent = () => ({ url: fetchMock.mock.calls[0][0] as string, init: fetchMock.mock.calls[0][1], body: JSON.parse(fetchMock.mock.calls[0][1].body) });
const failure = async () => {
  try {
    await embedImage(picture, "image/jpeg");
  } catch (e) {
    return e as EmbeddingError;
  }
  throw new Error("embedImage did not fail");
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GEMINI_EMBEDDING_API_KEY", "embed-key");
  vi.stubEnv("GEMINI_API_KEY", "shared-key");
  modelSends(Array.from({ length: 768 }, () => 2));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("embedImage", () => {
  it("asks the same model and size as the backend job, with one picture part and no task_type", async () => {
    await embedImage(picture, "image/jpeg");
    const { url, body } = sent();
    expect(url, "the wrong model was called").toContain("/models/gemini-embedding-2:embedContent");
    expect(body.output_dimensionality, "the size must be 768, or the model sends 3072 numbers").toBe(768);
    expect(body.content.parts, "several parts would give one combined vector").toHaveLength(1);
    expect(body.content.parts[0].inline_data, "the picture was not sent inline").toEqual({ mime_type: "image/jpeg", data: picture.toString("base64") });
    expect(body.task_type, "task_type must not be sent").toBeUndefined();
  });

  it("sends its own key in the header, never in the URL", async () => {
    await embedImage(picture, "image/jpeg");
    expect(sent().init.headers["x-goog-api-key"], "the photo search key was not used").toBe("embed-key");
    expect(sent().url, "the key is in the URL").not.toContain("key=");
  });

  it("falls back to the shared key, and refuses with no key at all", async () => {
    vi.stubEnv("GEMINI_EMBEDDING_API_KEY", "");
    await embedImage(picture, "image/jpeg");
    expect(sent().init.headers["x-goog-api-key"], "the shared key was not the fallback").toBe("shared-key");
    vi.stubEnv("GEMINI_API_KEY", "");
    expect((await failure()).kind, "a call with no key was not refused").toBe("no-key");
  });

  it("returns a unit vector", async () => {
    const v = await embedImage(picture, "image/jpeg");
    const length = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(length, "the vector is not unit length").toBeCloseTo(1, 10);
  });

  it.each([
    ["quota", 429, { error: { message: "quota" } }],
    ["invalid-image", 400, { error: { message: "Provided image is not valid." } }],
    ["refused", 400, { error: { message: "User location is not supported for the API use." } }],
    ["refused", 500, { error: { message: "boom" } }],
  ])("names a %s failure (status %s)", async (kind, status, body) => {
    modelSends(body, status);
    expect((await failure()).kind, `the ${status} answer was named wrongly`).toBe(kind);
  });

  it("refuses a vector that is not 768 numbers", async () => {
    modelSends(Array.from({ length: 3072 }, () => 1));
    expect((await failure()).kind, "a 3072-number vector was accepted").toBe("bad-vector");
    modelSends([...Array.from({ length: 767 }, () => 1), "x"]);
    expect((await failure()).kind, "a vector with a non-number was accepted").toBe("bad-vector");
  });
});

describe("toUnitLength", () => {
  it("divides by the length, and leaves a zero vector alone", () => {
    expect(toUnitLength([3, 4]), "the vector was not divided by its length").toEqual([0.6, 0.8]);
    expect(toUnitLength([0, 0]), "a zero vector must not become NaN").toEqual([0, 0]);
  });
});
