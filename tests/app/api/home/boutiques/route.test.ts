// @vitest-environment node
//
// The home boutiques JSON route (mobile / external callers).
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getBoutiques = vi.fn();
vi.mock("@/services/elastic/elasticsearch-reader.service", () => ({
  ElasticsearchReader: class {
    getBoutiques = getBoutiques;
  },
}));
const qaMode = vi.fn(async () => false);
vi.mock("utils/server/qaMode", () => ({ qaMode: () => qaMode() }));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET } from "app/api/home/boutiques/route";

const request = (query = "", headers: Record<string, string> = {}) =>
  new NextRequest(`https://trydos.test/api/home/boutiques${query}`, { headers });

beforeEach(() => {
  vi.clearAllMocks();
  getBoutiques.mockResolvedValue({ boutiques: [{ id: 1 }], searchAfter: [5] });
});

describe("the home boutiques route", () => {
  it("reads country, language, limit, category and offset and returns the page", async () => {
    const response = await GET(
      request(
        `?limit=5&offset=${encodeURIComponent("[3]")}&category_slugs=${encodeURIComponent('["shoes"]')}`,
        { country: "iq", language: "ar" },
      ),
    );

    expect(response.status, "a good request did not answer 200").toBe(200);
    expect(getBoutiques.mock.calls[0][0], "Elasticsearch was not asked for what the request said").toEqual({
      country: "iq",
      language: "ar",
      limit: 5,
      qaView: false,
      category: "shoes",
      searchAfter: [3],
    });
    await expect(response.json(), "the answer did not carry the boutiques and the next offset").resolves.toEqual({
      data: { total: 1, limit: 5, offset: [5], boutiques: [{ id: 1 }], category_slug: "shoes" },
    });
    expect(response.headers.get("cache-control"), "the boutique list may be cached").toContain("no-store");
  });

  it("uses Syria, English, 10 and no offset when the request says nothing", async () => {
    getBoutiques.mockResolvedValue({ searchAfter: null });

    const response = await GET(request());

    expect(getBoutiques.mock.calls[0][0], "the defaults were not applied").toMatchObject({
      country: "sy",
      language: "en",
      limit: 10,
      searchAfter: null,
      category: undefined,
    });
    await expect(response.json(), "an answer with no boutiques did not become an empty list").resolves.toMatchObject({
      data: { total: 0, boutiques: [] },
    });
  });

  it("keeps a category given as a plain JSON string", async () => {
    await GET(request(`?category_slugs=${encodeURIComponent('"bags"')}`));

    expect(getBoutiques.mock.calls[0][0].category, "a single JSON-string category was lost").toBe('"bags"');
  });

  it.each(["0", "101"])("refuses a limit of %s", async (limit) => {
    const response = await GET(request(`?limit=${limit}`));

    expect(response.status, `a limit of ${limit} was accepted`).toBe(400);
    expect(getBoutiques, "Elasticsearch was asked although the limit was refused").not.toHaveBeenCalled();
  });

  it("answers 404 when Elasticsearch returns nothing", async () => {
    getBoutiques.mockResolvedValue(null);

    const response = await GET(request());

    expect(response.status, "an empty Elasticsearch answer did not become 404").toBe(404);
  });

  it("answers 500 and reports when Elasticsearch throws", async () => {
    getBoutiques.mockRejectedValue(new Error("es down"));

    const response = await GET(request());

    expect(response.status, "an Elasticsearch failure did not become 500").toBe(500);
    expect(LogServerError, "the Elasticsearch failure was not reported").toHaveBeenCalled();
  });
});
