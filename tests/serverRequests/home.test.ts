// @vitest-environment node
//
// The home page's server actions (serverRequests/home.tsx): the recommended
// products row, the boutique row (and its next pages), and the featured and
// flash-deal rows.
//
// The search layer (services/elastic/elasticSearch and the boutique reader) is
// replaced, and so is the boutique card component. The parameter helpers and
// the card normaliser are the real ones.
import { beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({
  recommendations: vi.fn(),
  productsAndFilters: vi.fn(),
  getBoutiques: vi.fn(),
}));

vi.mock("services/elastic/elasticSearch", () => ({
  GetRecomendationsForUser: io.recommendations,
  getProductsAndFiltersFromElastic: io.productsAndFilters,
}));
vi.mock("services/elastic/elasticsearch-reader.service", () => ({
  ElasticsearchReader: class {
    getBoutiques = io.getBoutiques;
  },
}));
vi.mock("components/ServerWrapper/BoutiqueWrapper", () => ({ default: () => null }));
// The barrel pulls in every translation table. The two helpers used here are
// the real ones from the pure helpers file.
vi.mock("utils/server", async () => {
  const helpers = await import("utils/server/helpers");
  return {
    NormalizeSearchParamsForSearchRequest: helpers.NormalizeSearchParamsForSearchRequest,
    parseNumberArray: helpers.parseNumberArray,
  };
});

import {
  GetFeaturedProducts,
  GetFlashDealProducts,
  GetHomeBoutiques,
  GetNextBoutiques,
  GetNextRecommendations,
  GetRecommedndedProducts,
} from "serverRequests/home";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("the recommended products row", () => {
  for (const [name, action] of [
    ["GetNextRecommendations", GetNextRecommendations],
    ["GetRecommedndedProducts", GetRecommedndedProducts],
  ] as const) {
    it(`${name} reads the cursor as numbers and returns product cards`, async () => {
      io.recommendations.mockResolvedValue({
        products: [{ product_id: 5, slug: "hat" }],
        offset: [9, 10],
      });

      const result: any = await (action as any)({
        language: "en",
        country: "sy",
        offset: "[3,4]",
        userId: 8,
        limit: 6,
      });

      expect(io.recommendations.mock.calls[0][0], "the recommendation request is wrong").toEqual({
        country: "sy",
        language: "en",
        limit: 6,
        userId: 8,
        search_after: [3, 4],
      });
      expect(result.items.map((p: any) => p.slug), "the product cards are wrong").toEqual(["hat"]);
      expect(result.offset, "the next cursor is wrong").toEqual([9, 10]);
    });
  }
});

describe("the boutique row (GetHomeBoutiques)", () => {
  it("asks for the first category of a JSON list and continues from the cursor", async () => {
    io.getBoutiques.mockResolvedValue({ boutiques: [{ slug: "shop-a" }], searchAfter: [1, 42] });

    const result = await GetHomeBoutiques({
      language: "en",
      country: "sy",
      category: '["dresses","shoes"]',
      offset: "[0,7]",
    });

    expect(io.getBoutiques.mock.calls[0][0], "the boutique request is wrong").toEqual({
      country: "sy",
      language: "en",
      limit: 10,
      category: "dresses",
      searchAfter: [0, 7],
    });
    expect(result.data, "the boutique row is wrong").toEqual({
      total: 1,
      limit: 10,
      searchAfter: [1, 42],
      offset: [1, 42],
      boutiques: [{ slug: "shop-a" }],
      category: "dresses",
    });
  });

  it("keeps a plain category name, an empty list, or no category at all", async () => {
    io.getBoutiques.mockResolvedValue({});

    await GetHomeBoutiques({ language: "en", country: "sy", category: "dresses" });
    await GetHomeBoutiques({ language: "en", country: "sy", category: "[]" });
    const none = await GetHomeBoutiques({ language: "en", country: "sy", category: undefined as any });

    expect(
      io.getBoutiques.mock.calls.map((call) => call[0].category),
      "a plain, empty or missing category was not passed on as it is",
    ).toEqual(["dresses", [], null]);
    expect(none.data, "an empty answer did not give an empty row").toMatchObject({
      total: 0,
      boutiques: [],
      searchAfter: undefined,
    });
    expect(io.getBoutiques.mock.calls[0][0].searchAfter, "a missing cursor was not null").toBeNull();
  });
});

describe("the next boutique page (GetNextBoutiques)", () => {
  it("returns one boutique card per shop, in the page's locale, and the next cursor", async () => {
    io.getBoutiques.mockResolvedValue({ boutiques: [{ slug: "shop-a" }, { slug: "shop-b" }], searchAfter: [2, 9] });

    const result: any = await GetNextBoutiques({
      language: "ar",
      country: "iq",
      category: null,
      offset: "[1,4]",
    });

    expect(
      result.boutiques.map((card: any) => [card.key, card.props.lang, card.props.boutique.slug]),
      "the boutique cards are wrong",
    ).toEqual([
      ["shop-a", "iq-ar", "shop-a"],
      ["shop-b", "iq-ar", "shop-b"],
    ]);
    expect(result.offset, "the next cursor is wrong").toEqual([2, 9]);
  });
});

describe("the featured and flash-deal rows", () => {
  it("asks for featured products in the chosen category, products only", async () => {
    io.productsAndFilters.mockResolvedValue({ products: [1] });

    const result = await GetFeaturedProducts({
      country: "sy",
      language: "en",
      category: "dresses",
      limit: "4" as any,
      offset: "[5]",
    });

    expect(io.productsAndFilters.mock.calls[0][0], "the featured request is wrong").toEqual({
      limit: 4,
      search_after: [5],
      filters: { categories: ["dresses"], featured: true },
      filters_offset: 1,
      country: "sy",
      language_code: "en",
      noFilters: true,
    });
    expect(result, "the featured answer was not passed back").toEqual({ data: { products: [1] } });
  });

  it("asks for flash-deal products, products only", async () => {
    io.productsAndFilters.mockResolvedValue({ products: [] });

    await GetFlashDealProducts({ country: "iq", language: "ar", category: undefined });

    expect(io.productsAndFilters.mock.calls[0][0], "the flash-deal request is wrong").toEqual({
      limit: 10,
      search_after: [],
      filters: { flashdeal: true },
      filters_offset: 1,
      country: "iq",
      language_code: "ar",
      noFilters: true,
    });
  });
});
