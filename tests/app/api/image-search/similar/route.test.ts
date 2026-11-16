// @vitest-environment node
//
// The photo search route: a picture becomes a vector (Gemini), and the
// catalogue (search backend) answers with the nearest products. Both calls are
// replaced; the query builder and the result mapping are real.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({
  search: vi.fn(),
  embed: vi.fn(),
  rateLimit: vi.fn(),
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  LogServerError: vi.fn(),
}));
vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: { search: io.search },
  elasticSearchComment: {},
}));
vi.mock("serverRequests/radis", () => ({
  fixedWindowRateLimit: io.rateLimit,
  RedisGet: io.cacheGet,
  RedisSet: io.cacheSet,
}));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: io.LogServerError }));
vi.mock("utils/server/qaMode", () => ({ qaMode: async () => false }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("utils/server/imageEmbedding", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  embedImage: io.embed,
}));

import { POST } from "app/api/image-search/similar/route";
import { EmbeddingError } from "utils/server/imageEmbedding";

const jpeg = () => new File([new Uint8Array([1, 2, 3])], "a.jpg", { type: "image/jpeg" });

const request = (fields: { file?: File; language?: string; country?: string; cookie?: string | null; filters?: string }) => {
  const form = new FormData();
  if (fields.file) form.append("file", fields.file);
  if (fields.language) form.append("language", fields.language);
  if (fields.country) form.append("country", fields.country);
  if (fields.filters) form.append("filters", fields.filters);
  const cookie = fields.cookie === undefined ? "MARKET-TOKEN=session" : fields.cookie;
  return new NextRequest("https://trydos.test/api/image-search/similar", {
    method: "POST",
    body: form,
    headers: cookie ? { cookie } : {},
  });
};
const good = () => request({ file: jpeg(), language: "en", country: "sy" });

const vector = Array.from({ length: 768 }, (_, i) => (i === 0 ? 1 : 0));
const hit = {
  _id: "18",
  _score: 0.99,
  _source: {
    id: 18,
    images: JSON.stringify(["a.jpg", "b.jpg"]),
    colors: [{ name: "Black" }, { name: "Blue" }],
    sync_color_images: JSON.stringify([
      { color_name: "Black", images: ["a.jpg"] },
      { color_name: "Blue", images: ["b.jpg"] },
    ]),
    offered_price: 10,
    unit_price: 12,
    custom_products: [{ product_id: 18, name: "Jacket", slug: "jacket", language_code: "en" }],
  },
  inner_hits: { color_image_vectors: { hits: { hits: [{ _source: { image: "b.jpg" } }] } } },
};

beforeEach(() => {
  vi.clearAllMocks();
  io.rateLimit.mockResolvedValue({ allowed: true, remaining: 9, ttl: 60 });
  io.embed.mockResolvedValue(vector);
  io.search.mockResolvedValue({ hits: { hits: [hit] } });
  io.cacheGet.mockResolvedValue(null);
  io.cacheSet.mockResolvedValue(undefined);
});

describe("the photo search route", () => {
  it("refuses a caller with no session before any paid call", async () => {
    const response = await POST(request({ file: jpeg(), language: "en", country: "sy", cookie: null }));
    expect(response.status, "a caller with no session was let through").toBe(401);
    expect(io.embed, "Gemini was called for a caller with no session").not.toHaveBeenCalled();
  });

  it("refuses a caller over the limit before any paid call", async () => {
    io.rateLimit.mockResolvedValue({ allowed: false, remaining: 0, ttl: 30 });
    expect((await POST(good())).status, "a caller over the limit was let through").toBe(429);
    expect(io.embed, "Gemini was called over the limit").not.toHaveBeenCalled();
  });

  it.each([
    ["no file", { language: "en", country: "sy" }],
    ["no country", { file: jpeg(), language: "en" }],
    ["an unknown language", { file: jpeg(), language: "fr", country: "sy" }],
  ])("refuses %s", async (_name, fields: any) => {
    const response = await POST(request(fields));
    expect(response.status, "a request with missing fields was not refused").toBe(400);
    expect(io.embed, "Gemini was called for a bad request").not.toHaveBeenCalled();
  });

  it("refuses a file that is not a picture", async () => {
    const response = await POST(request({ file: new File(["x"], "a.pdf", { type: "application/pdf" }), language: "en", country: "sy" }));
    expect(response.status, "a PDF was not refused").toBe(400);
    expect((await response.json()).error, "the refusal is not the translated key").toBe("Invalid file type");
  });

  it("answers the matched products, best first, with the matched photo and color", async () => {
    const response = await POST(good());
    const body = await response.json();
    expect(response.status, `the route failed (${response.status})`).toBe(200);
    expect(response.headers.get("cache-control"), "a photo answer must not be cached").toBe("no-store");
    expect(body.products?.[0]?.slug, "the matched product is missing").toBe("jacket");
    expect(body.products[0].images[0].file_path, "the card does not show the matched photo").toBe("/product/b.jpg");
    expect(body.products[0].color, "the card does not open on the matched color").toBe("Blue");
  });

  it("sends the vector to the search backend with the shopper's country rules", async () => {
    await POST(good());
    const query = io.search.mock.calls[0]?.[0];
    expect(query?.knn?.query_vector, "the search backend did not get the vector").toBe(vector);
    expect(JSON.stringify(query.knn.filter), "the country block was not applied").toContain('"countries_iso.iso":"SY"');
  });

  it("sends the shopper's filters inside the search, beside the country rules", async () => {
    await POST(request({ file: jpeg(), language: "en", country: "sy", filters: JSON.stringify({ brands: ["new-brand-4"], priceRange: [9, 55] }) }));
    const filter = JSON.stringify(io.search.mock.calls[0]?.[0]?.knn?.filter);
    expect(filter, "the brand filter did not reach the search backend").toContain('"custom_brands.slug.keyword":["new-brand-4"]');
    expect(filter, "the price filter did not reach the search backend").toContain('"gte":9,"lte":55');
    expect(filter, "the country block was lost when filters were sent").toContain('"countries_iso.iso":"SY"');
  });

  it("ignores broken filters instead of failing", async () => {
    const response = await POST(request({ file: jpeg(), language: "en", country: "sy", filters: "{not json" }));
    expect(response.status, "broken filters made the route fail").toBe(200);
    expect(JSON.stringify(io.search.mock.calls[0]?.[0]?.knn?.filter), "broken filters added a rule").not.toContain("custom_brands");
  });

  it("keeps a new vector for 10 minutes, under a hash of the photo", async () => {
    await POST(good());
    const [key, value, seconds] = io.cacheSet.mock.calls[0] ?? [];
    expect(key, "the vector was not stored under a photo hash").toMatch(/^photo-search:vector:[0-9a-f]{64}$/);
    expect(value, "the stored value is not the vector").toBe(vector);
    expect(seconds, "the vector must be kept 600 seconds").toBe(600);
  });

  it("uses a stored vector and does not call Gemini again (a filter change)", async () => {
    io.cacheGet.mockResolvedValue(vector);
    const response = await POST(good());
    expect(response.status, "the route failed with a stored vector").toBe(200);
    expect(io.embed, "Gemini was called although the vector was stored").not.toHaveBeenCalled();
    expect(io.search.mock.calls[0]?.[0]?.knn?.query_vector, "the stored vector was not searched").toEqual(vector);
    expect(io.cacheSet, "a stored vector was written again").not.toHaveBeenCalled();
  });

  it("asks Gemini when the stored value is not a vector", async () => {
    io.cacheGet.mockResolvedValue({ broken: true });
    await POST(good());
    expect(io.embed, "a broken stored value was used instead of asking Gemini").toHaveBeenCalled();
  });

  it("still refuses a caller over the limit when the vector is stored", async () => {
    io.cacheGet.mockResolvedValue(vector);
    io.rateLimit.mockResolvedValue({ allowed: false, remaining: 0, ttl: 30 });
    expect((await POST(good())).status, "a stored vector let a caller over the limit through").toBe(429);
  });

  it("answers an empty list when nothing is near enough", async () => {
    io.search.mockResolvedValue({ hits: { hits: [] } });
    const response = await POST(good());
    expect(response.status, "an empty answer must still be a success").toBe(200);
    expect((await response.json()).products, "an empty answer must be an empty list").toEqual([]);
  });

  it.each([
    ["a picture the model cannot read", "invalid-image", 400, "We could not read this image. Please try another photo."],
    ["the model's quota", "quota", 429, "Too many requests. Please try again in a moment."],
    ["any other model failure", "refused", 502, "failed to search with image"],
  ])("answers %s with a shopper message", async (_name, kind: any, status, message) => {
    io.embed.mockRejectedValue(new EmbeddingError(kind, "x"));
    const response = await POST(good());
    expect(response.status, `Gemini's ${kind} failure got the wrong status`).toBe(status);
    expect((await response.json()).error, `Gemini's ${kind} failure got the wrong message`).toBe(message);
    expect(io.search, "the search backend was called without a vector").not.toHaveBeenCalled();
  });

  it("logs a search backend failure and answers 500", async () => {
    io.search.mockRejectedValue(new Error("es down"));
    const response = await POST(good());
    expect(response.status, "a search backend failure was not a 500").toBe(500);
    expect(io.LogServerError, "the search backend failure was not logged").toHaveBeenCalled();
  });
});
