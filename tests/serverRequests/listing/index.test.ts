// @vitest-environment node
//
// The listing page's server actions (serverRequests/listing/index.tsx).
//
//   GetFilters          — the filter panel on the first load
//   GetNextPageFilters  — the filter panel while it scrolls (related categories
//                         are joined onto the category list here)
//   GetProducts         — one page of product cards
//   GetRelatedProducts  — one page of the "related products" row
//
// Each one calls the search layer (services/elastic/elasticSearch), which is
// replaced. What is checked is what each action asks for and what it makes of
// the answer. Every action answers something safe when the search fails.
import { beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({
  search: vi.fn(),
  related: vi.fn(),
  logServerError: vi.fn(),
}));

vi.mock("services/elastic/elasticSearch", () => ({
  getProductsAndFiltersFromElastic: io.search,
  getRelatedProducts: io.related,
}));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: io.logServerError }));
// The barrel pulls in every translation table. Only the one pure helper is used.
vi.mock("utils/server", async () => ({
  combineCategoriesWithRelated: (await import("utils/server/helpers")).combineCategoriesWithRelated,
}));

import {
  GetFilters,
  GetNextPageFilters,
  GetProducts,
  GetRelatedProducts,
} from "serverRequests/listing";

const scenarioOf = (index = 0) => io.logServerError.mock.calls[index]?.[0]?.scenario;

/** A search answer with every filter list filled. */
const fullAnswer = {
  categories: [{ slug: "women", childes: [] }],
  related_categories: [{ slug: "shoes", childes: [] }],
  brands: [{ slug: "acme" }],
  colors: ["#fff"],
  attributes: [{ id: 1, name: "Size", options: ["M"] }],
  prices: { min_price: 1, max_price: 9, priceRanges: [{ min_price: 1, max_price: 9 }] },
  total_size: 12,
};

beforeEach(() => {
  vi.clearAllMocks();
  io.search.mockReset();
  io.related.mockReset();
});

describe("the first filter panel (GetFilters)", () => {
  it("asks for filters only and returns every list the answer carried", async () => {
    io.search.mockResolvedValue(fullAnswer);

    const result = await GetFilters({
      language: "ar",
      country: "sy",
      filters: { featured: true },
    });

    expect(io.search.mock.calls[0][0], "the filter panel did not ask for filters only").toMatchObject({
      country: "sy",
      language_code: "ar",
      filters_offset: 1,
      noProducts: true,
    });
    expect(result, "the filter panel lists are wrong").toEqual({
      categories: [{ slug: "women", childes: [] }],
      brands: [{ slug: "acme" }],
      colors: ["#fff"],
      sizes: ["M"],
      prices: fullAnswer.prices,
      total_size: 12,
    });
  });

  it("returns empty lists when the answer carried none", async () => {
    io.search.mockResolvedValue({ categories: [], total_size: 0 });

    const result = await GetFilters({ language: "en", country: "sy", filters: { flashdeal: true } });
    await GetFilters({ language: "en", country: "sy", filters: undefined as any, filter_offset: 2 });

    expect(result, "empty answers did not give empty lists").toEqual({
      categories: [],
      brands: [],
      colors: [],
      sizes: [],
      prices: undefined,
      total_size: 0,
    });
    expect(io.search.mock.calls[1][0].filters_offset, "the asked filter page was not sent").toBe(2);
  });

  it("answers nothing, and reports it, when the search fails", async () => {
    io.search.mockRejectedValue(new Error("down"));

    expect(await GetFilters({ language: "en", country: "sy", filters: {} }), "a failed search gave filters").toBeUndefined();
    expect(scenarioOf(), "the failed filter search was not reported").toBe(
      "Error In GetFilters in serverRequest/listing",
    );
  });
});

describe("the scrolling filter panel (GetNextPageFilters)", () => {
  it("joins the related categories onto the list and returns the price cards", async () => {
    io.search.mockResolvedValue(fullAnswer);

    const result: any = await GetNextPageFilters({
      language: "en",
      country: "sy",
      filters: {},
      params: {},
      filter_offset: 3,
    });

    expect(
      result.categories.map((c: any) => c.slug),
      "the related categories were not joined onto the category list",
    ).toEqual(["women", "shoes"]);
    expect(result.prices, "the price cards were not returned").toEqual(fullAnswer.prices.priceRanges);
    expect([result.brands, result.colors, result.sizes], "the other lists are wrong").toEqual([
      [{ slug: "acme" }],
      ["#fff"],
      ["M"],
    ]);
    expect(io.search.mock.calls[0][0].filters_offset, "the asked filter page was not sent").toBe(3);
  });

  it("returns empty lists when the answer carried none, and keeps a price pair as it is", async () => {
    io.search.mockResolvedValue({ prices: [0, 10] });

    const result = await GetNextPageFilters({ language: "en", country: "sy", filters: {}, params: {} });

    expect(result, "empty answers did not give empty lists").toEqual({
      categories: [],
      brands: [],
      colors: [],
      sizes: [],
      prices: [],
      total_size: undefined,
    });
  });

  it("answers nothing, and reports it, when the search fails", async () => {
    io.search.mockRejectedValue(new Error("down"));

    expect(
      await GetNextPageFilters({ language: "en", country: "sy", filters: {}, params: {} }),
      "a failed search gave filters",
    ).toBeUndefined();
    expect(scenarioOf(), "the failed filter search was not reported").toBe(
      "Error In GetNextPageFilters in serverRequest/listing",
    );
  });
});

describe("one page of product cards (GetProducts)", () => {
  it("asks for products only, inside the session snapshot, and returns cards with their analytics", async () => {
    io.search.mockResolvedValue({
      products: [
        {
          product_id: 7,
          name: "Red dress",
          slug: "red-dress",
          category: { id: 3, name: "Dresses" },
          brand: { id: 4, name: "Acme" },
        },
      ],
      offset: [99],
      recommended_offset: 5,
      pit_id: "pit-2",
      isAnalyzed: { name: "dress" },
    });

    const result = await GetProducts({
      language: "en",
      country: "sy",
      offset: [42],
      parsedFilters: { colors: ["#fff"] },
      currency: "USD",
      userId: 8,
      recomended_offset: 4,
      pit_id: "pit-1",
      sort: "price_asc",
    });

    expect(io.search.mock.calls[0][0], "the page request is wrong").toMatchObject({
      noFilters: true,
      search_after: [42],
      recommended_offset: 4,
      userId: 8,
      sort: "price_asc",
      usePit: true,
      pit_id: "pit-1",
    });
    expect(result.products.map((p: any) => p.slug), "the cards are wrong").toEqual(["red-dress"]);
    expect(result.productIds, "the card ids are wrong").toEqual(["7"]);
    expect(
      [result.offset, result.recomended_offset, result.pit_id, result.isAnalyzed],
      "the paging details are wrong",
    ).toEqual([[99], 5, "pit-2", { name: "dress" }]);
    expect(result.GA_PRODUCTS_LIST, "the analytics list is wrong").toEqual([
      {
        item_id: 7,
        item_name: "Red dress",
        category: "Dresses",
        category_id: 3,
        brand: "Acme",
        brand_id: 4,
      },
    ]);
  });

  it("answers no snapshot id and no analysis when the search gave none", async () => {
    io.search.mockResolvedValue({ products: [] });

    const result = await GetProducts({
      language: "en",
      country: "sy",
      offset: [],
      parsedFilters: {},
      currency: "USD",
    });

    expect([result.pit_id, result.isAnalyzed], "missing values did not become null").toEqual([null, null]);
  });

  it("answers an empty page, and reports it, when the search fails", async () => {
    io.search.mockRejectedValue(new Error("down"));

    const result = await GetProducts({
      language: "en",
      country: "sy",
      offset: [],
      parsedFilters: {},
      currency: "USD",
    });

    expect(result, "a failed search did not give an empty page").toEqual({
      products: [],
      offset: undefined,
      recomended_offset: undefined,
      pit_id: null,
      isAnalyzed: null,
      productIds: [],
      GA_PRODUCTS_LIST: [],
    });
    expect(scenarioOf(), "the failed page search was not reported").toBe("GetProducts (elastic) failed");
  });
});

describe("one page of related products (GetRelatedProducts)", () => {
  it("asks for three related products inside the snapshot and returns their cards", async () => {
    io.related.mockResolvedValue({
      products: [{ product_id: 3, slug: "hat" }],
      offset: [7],
      total_size: 9,
      pit_id: "pit-r",
    });

    const result = await GetRelatedProducts({
      language: "en",
      country: "sy",
      productId: 11,
      offset: [2],
      currency: "USD",
      pit_id: "pit-0",
    });

    expect(io.related.mock.calls[0][0], "the related request is wrong").toMatchObject({
      productId: 11,
      limit: 3,
      search_after: [2],
      usePit: true,
      pit_id: "pit-0",
    });
    expect(result, "the related page is wrong").toMatchObject({
      offset: [7],
      total_size: 9,
      pit_id: "pit-r",
      productIds: ["3"],
    });
  });

  it("answers no snapshot id when the search gave none", async () => {
    io.related.mockResolvedValue({ products: [], total_size: 0 });

    const result = await GetRelatedProducts({
      language: "en",
      country: "sy",
      productId: 11,
      offset: [],
      currency: "USD",
    });

    expect(result.pit_id, "a missing snapshot id did not become null").toBeNull();
  });

  it("answers an empty page, and reports it, when the search fails", async () => {
    io.related.mockRejectedValue(new Error("down"));

    const result = await GetRelatedProducts({
      language: "en",
      country: "sy",
      productId: 11,
      offset: [],
      currency: "USD",
    });

    expect(result, "a failed search did not give an empty page").toEqual({
      products: [],
      offset: [],
      total_size: 0,
      pit_id: null,
      productIds: [],
    });
    expect(scenarioOf(), "the failed related search was not reported").toBe(
      "Error In GetRelatedProducts in serverRequest/listing",
    );
  });
});
