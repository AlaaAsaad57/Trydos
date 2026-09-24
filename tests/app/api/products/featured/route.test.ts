// @vitest-environment node
//
// The featured-products JSON route (mobile): reads the listing filters from the
// query string and asks Elasticsearch for featured products only.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getProductsAndFiltersFromElastic = vi.fn();
vi.mock("services/elastic/elasticSearch", () => ({
  getProductsAndFiltersFromElastic: (...a: unknown[]) => getProductsAndFiltersFromElastic(...a),
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET } from "app/api/products/featured/route";

const request = (query = "", init: { method?: string; headers?: Record<string, string> } = {}) =>
  new NextRequest(`https://trydos.test/api/products/featured${query}`, init);

/** What the route asked Elasticsearch for on its first call. */
const asked = () => getProductsAndFiltersFromElastic.mock.calls[0][0];

beforeEach(() => {
  vi.clearAllMocks();
  getProductsAndFiltersFromElastic.mockResolvedValue({ products: [{ id: 1 }] });
});

describe("the featured-products route", () => {
  it("answers a preflight with 204", async () => {
    const response = await GET(request("", { method: "OPTIONS" }));

    expect(response.status, "the preflight did not answer 204").toBe(204);
  });

  it("asks for featured products only, with the defaults, when the query says nothing", async () => {
    const response = await GET(request());

    expect(asked(), "the defaults were not applied").toEqual({
      limit: 20,
      search_after: [],
      filters: { featured: true },
      filters_offset: 1,
      country: "sy",
      language_code: "en",
      fullSource: true,
    });
    await expect(response.json(), "the products were not returned with the applied filters").resolves.toEqual({
      data: { products: [{ id: 1 }] },
      appliedFilters: { featured: true },
    });
  });

  it("reads every filter the query string carries", async () => {
    const q = new URLSearchParams({
      category_slugs: '["shoes","bags"]',
      boutique_slugs: "b1",
      brand_slugs: "[nike]",
      colors: '["red"]',
      tags_names: "[new,,hot]",
      price: '["10-20"]',
      "flash-deal": "true",
      search_text: '"red shoe"',
      attributes: `'[{"options":["M","L"]}]'`,
      limit: "5",
      offset: "[3,x,4]",
      filters_offset: "2",
    });

    await GET(request(`?${q}`, { headers: { country: "iq", lang: "ar" } }));

    expect(asked(), "a filter from the query string was lost or misread").toEqual({
      limit: 5,
      search_after: [3, 4],
      filters: {
        categories: ["shoes", "bags"],
        boutiques: ["b1"],
        brands: ["nike"],
        colors: ["red"],
        tags_names: ["new", "hot"],
        priceRange: [10, 20],
        prices: [10, 20],
        flashdeal: true,
        search_text: "red shoe",
        sizes: ["M", "L"],
        featured: true,
      },
      filters_offset: 2,
      country: "iq",
      language_code: "ar",
      fullSource: true,
    });
  });

  it("keeps a value that cannot be decoded as it came", async () => {
    await GET(request(`?category_slugs=${encodeURIComponent("%E0%A4%A")}`));

    expect(asked().filters.categories, "a value that cannot be decoded was not kept as it came").toEqual([
      "%E0%A4%A",
    ]);
  });

  it("answers 500 with the filters in the error when Elasticsearch throws", async () => {
    getProductsAndFiltersFromElastic.mockRejectedValue(new Error("es down"));

    const response = await GET(request("?flash-deal=false"));

    expect(response.status, "an Elasticsearch failure did not become 500").toBe(500);
    await expect(response.json(), "the 500 did not carry the error and the filters").resolves.toEqual({
      error: 'es down----{"flashdeal":false,"featured":true}',
      appliedFilters: { flashdeal: false, featured: true },
    });
    expect(LogServerError, "the failure was not reported").toHaveBeenCalled();
  });

  it("uses a fallback text when the error has no message", async () => {
    getProductsAndFiltersFromElastic.mockRejectedValue({});

    const body = await (await GET(request())).json();

    expect(body.error, "the fallback text was not used").toBe(
      'error getting featured product data from elestic----{"featured":true}',
    );
  });
});
