// @vitest-environment node
//
// The catalog search JSON route: products and filters from Elasticsearch, plus
// an inline suggestion when there is search text.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getProductsAndFiltersFromElastic = vi.fn();
vi.mock("services/elastic/elasticSearch", () => ({
  getProductsAndFiltersFromElastic: (...a: unknown[]) => getProductsAndFiltersFromElastic(...a),
}));
const GetSearchSuggestion = vi.fn();
vi.mock("serverRequests/Search", () => ({
  GetSearchSuggestion: (...a: unknown[]) => GetSearchSuggestion(...a),
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET } from "app/api/products/searchInCatalog/route";

const request = (query = "", init: { method?: string; headers?: Record<string, string> } = {}) =>
  new NextRequest(`https://trydos.test/api/products/searchInCatalog${query}`, init);

const asked = () => getProductsAndFiltersFromElastic.mock.calls[0][0];

beforeEach(() => {
  vi.clearAllMocks();
  getProductsAndFiltersFromElastic.mockResolvedValue({ products: [{ id: 1 }] });
  GetSearchSuggestion.mockResolvedValue({ suggestion: "red shoes" });
});

describe("the catalog search route", () => {
  it("answers a preflight with 204", async () => {
    const response = await GET(request("", { method: "OPTIONS" }));

    expect(response.status, "the preflight did not answer 204").toBe(204);
  });

  it("searches with the defaults and asks for no suggestion when there is no text", async () => {
    const response = await GET(request());

    expect(asked(), "the defaults were not applied").toEqual({
      limit: 20,
      search_after: [],
      filters: {},
      filters_offset: 1,
      country: "sy",
      language_code: "en",
      userId: undefined,
      recommended_offset: 0,
      sort: undefined,
      fullSource: true,
      usePit: false,
      pit_id: null,
    });
    expect(GetSearchSuggestion, "a suggestion was asked for with no text").not.toHaveBeenCalled();
    await expect(response.json(), "the products were not returned with an empty suggestion").resolves.toEqual({
      data: { products: [{ id: 1 }] },
      appliedFilters: {},
      suggestion: "",
    });
  });

  it("reads every filter, the paging switches and the shopper, and returns the suggestion", async () => {
    const q = new URLSearchParams({
      category_slugs: "[shoes]",
      boutique_slugs: "b1",
      brand_slugs: "nike",
      colors: "red",
      tags_names: "new",
      price: "10-20",
      "flash-deal": "true",
      search_text: '"red sh"',
      attributes: '[{"options":["M"]}]',
      featured: "true",
      limit: "5",
      offset: "[3]",
      filters_offset: "2",
      recommended_offset: "4",
      sort: "price_asc",
      use_pit: "true",
      pit_id: "pit-1",
    });

    const response = await GET(request(`?${q}`, { headers: { country: "iq", lang: "ar", uid: " 7 " } }));

    expect(asked(), "a search setting from the request was lost").toMatchObject({
      limit: 5,
      search_after: [3],
      filters_offset: 2,
      country: "iq",
      language_code: "ar",
      userId: "7",
      recommended_offset: 4,
      sort: "price_asc",
      usePit: true,
      pit_id: "pit-1",
      filters: {
        categories: ["shoes"],
        boutiques: ["b1"],
        brands: ["nike"],
        colors: ["red"],
        tags_names: ["new"],
        priceRange: [10, 20],
        prices: [10, 20],
        flashdeal: true,
        search_text: "red sh",
        sizes: ["M"],
        featured: true,
      },
    });
    expect(GetSearchSuggestion.mock.calls[0][0], "the suggestion was not asked for the search text").toMatchObject({
      language: "ar",
      country: "iq",
      search_text: "red sh",
    });
    expect((await response.json()).suggestion, "the suggestion was not returned").toBe("red shoes");
  });

  it("still answers when the suggestion fails", async () => {
    GetSearchSuggestion.mockRejectedValue(new Error("suggest down"));

    const response = await GET(request("?search_text=shoe"));

    expect(response.status, "a failed suggestion failed the search").toBe(200);
    expect((await response.json()).suggestion, "a failed suggestion was not empty").toBe("");
  });

  it("keeps a value that cannot be decoded as it came", async () => {
    await GET(request(`?brand_slugs=${encodeURIComponent("%E0%A4%A")}`));

    expect(asked().filters.brands, "a value that cannot be decoded was not kept").toEqual(["%E0%A4%A"]);
  });

  it("answers 500 with the error text, or a fallback", async () => {
    getProductsAndFiltersFromElastic.mockRejectedValueOnce(new Error("es down"));
    const failed = await GET(request());
    expect(failed.status, "an Elasticsearch failure did not become 500").toBe(500);
    expect((await failed.json()).error, "the error text was not used").toBe("es down----{}");

    getProductsAndFiltersFromElastic.mockRejectedValueOnce({});
    expect((await (await GET(request())).json()).error, "the fallback text was not used").toBe(
      "error in getting products from elastic----{}",
    );
    expect(LogServerError, "the failures were not reported").toHaveBeenCalled();
  });
});
