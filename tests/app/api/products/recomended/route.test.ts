// @vitest-environment node
//
// The recommended-products JSON route (mobile).
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetRecomendationsForUser = vi.fn();
vi.mock("services/elastic/elasticSearch", () => ({
  GetRecomendationsForUser: (...a: unknown[]) => GetRecomendationsForUser(...a),
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET } from "app/api/products/recomended/route";

const request = (query = "", init: { method?: string; headers?: Record<string, string> } = {}) =>
  new NextRequest(`https://trydos.test/api/products/recomended${query}`, init);

const asked = () => GetRecomendationsForUser.mock.calls[0][0];

beforeEach(() => {
  vi.clearAllMocks();
  GetRecomendationsForUser.mockResolvedValue({ products: [{ id: 1 }] });
});

describe("the recommended-products route", () => {
  it("answers a preflight with 204", async () => {
    const response = await GET(request("", { method: "OPTIONS" }));

    expect(response.status, "the preflight did not answer 204").toBe(204);
  });

  it("asks for recommendations with the defaults when the query says nothing", async () => {
    const response = await GET(request());

    expect(asked(), "the defaults were not applied").toEqual({
      country: "sy",
      language: "en",
      userId: null,
      limit: 20,
      search_after: [],
      fullSource: true,
    });
    await expect(response.json(), "the recommendations were not returned").resolves.toEqual({
      data: { products: [{ id: 1 }] },
      appliedFilters: {},
    });
  });

  it("reads the shopper, the page size, the offset and the filters from the request", async () => {
    const q = new URLSearchParams({
      user_id: "7",
      limit: "5",
      offset: "[3,4]",
      page: "2",
      category_slugs: '["shoes"]',
      boutique_slugs: "b1",
      brand_slugs: "nike",
      colors: "red",
      tags_names: "new",
      price: "10-20",
      "flash-deal": "yes",
      search_text: "shoe",
      attributes: '[{"options":["M"]}]',
    });

    const response = await GET(request(`?${q}`, { headers: { country: "iq", language: "tr" } }));

    expect(asked(), "the shopper, page size and offset were not passed on").toEqual({
      country: "iq",
      language: "tr",
      userId: "7",
      limit: 5,
      search_after: [3, 4],
      fullSource: true,
    });
    expect((await response.json()).appliedFilters, "the filters were not read from the query").toEqual({
      categories: ["shoes"],
      boutiques: ["b1"],
      brands: ["nike"],
      colors: ["red"],
      tags_names: ["new"],
      priceRange: [10, 20],
      prices: [10, 20],
      flashdeal: false,
      search_text: "shoe",
      sizes: ["M"],
    });
  });

  it("keeps a value that cannot be decoded as it came", async () => {
    const response = await GET(request(`?colors=${encodeURIComponent("%E0%A4%A")}`));

    expect((await response.json()).appliedFilters.colors, "a value that cannot be decoded was not kept").toEqual([
      "%E0%A4%A",
    ]);
  });

  it("answers 500 with the error text, or a fallback", async () => {
    GetRecomendationsForUser.mockRejectedValueOnce(new Error("es down"));
    const failed = await GET(request());
    expect(failed.status, "an Elasticsearch failure did not become 500").toBe(500);
    expect((await failed.json()).error, "the error text was not used").toBe("es down----{}");

    GetRecomendationsForUser.mockRejectedValueOnce({});
    expect((await (await GET(request())).json()).error, "the fallback text was not used").toBe(
      "error getting recomended products data from elestic----{}",
    );
    expect(LogServerError, "the failures were not reported").toHaveBeenCalled();
  });
});
