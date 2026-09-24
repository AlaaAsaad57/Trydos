// @vitest-environment node
//
// The search box's server actions (serverRequests/Search.tsx).
//
//   GetSearchSuggestion — the grey "ghost text" completion while the shopper
//                         types. Best effort: it never throws.
//   GetSearchData       — the search results panel: the text analyser first
//                         (for searches of two words or more), then one search
//                         query, then the filter lists built from its
//                         aggregations.
//
// The search backend, the text analyser and the QA-mode header read are
// replaced. The query builders and the aggregation readers in helpers.ts are the
// real ones, except the two that talk to the search backend themselves
// (getChildrenAndGrandchildren and logSearchTerm).
import { beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({
  search: vi.fn(),
  analyze: vi.fn(),
  qaMode: vi.fn(),
  logServerError: vi.fn(),
  children: vi.fn(),
  logSearchTerm: vi.fn(),
}));

vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: { search: io.search },
  elasticSearchComment: {},
}));
vi.mock("services/elastic/analyzeSearchTextCerebras", () => ({ default: io.analyze }));
vi.mock("utils/server/qaMode", () => ({ qaMode: io.qaMode }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: io.logServerError }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("services/elastic/helpers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("services/elastic/helpers")>()),
  getChildrenAndGrandchildren: io.children,
  logSearchTerm: io.logSearchTerm,
}));

import { GetSearchData, GetSearchSuggestion } from "serverRequests/Search";

const scenarios = () => io.logServerError.mock.calls.map((call: any[]) => call[0]?.scenario);

beforeEach(() => {
  vi.clearAllMocks();
  io.search.mockReset();
  io.analyze.mockReset();
  io.qaMode.mockResolvedValue(false);
  io.children.mockResolvedValue({});
});

describe("the ghost-text completion (GetSearchSuggestion)", () => {
  /** A product hit whose matching names came back as inner hits. */
  const hit = (names: { name?: string; language_code: string }[]) => ({
    inner_hits: {
      custom_products: { hits: { hits: names.map((n) => ({ _source: n })) } },
    },
  });

  it("suggests nothing, and asks nobody, for an empty box", async () => {
    expect(
      await GetSearchSuggestion({ language: "en", country: "sy", search_text: "   " }),
      "an empty search box got a suggestion",
    ).toEqual({ suggestion: "" });
    expect(io.search, "the search backend was asked about an empty box").not.toHaveBeenCalled();
  });

  it("prefers a name in the shopper's language that starts with what was typed", async () => {
    io.search.mockResolvedValue({
      hits: {
        hits: [
          hit([
            { name: "Big red dress", language_code: "ar" },
            { name: "Red dress", language_code: "en" },
            { language_code: "ar" },
          ]),
          { inner_hits: {} },
          hit([{ name: "red فستان", language_code: "ar" }]),
        ],
      },
    });

    const result = await GetSearchSuggestion({
      language: "ar",
      country: "sy",
      search_text: " Red ",
      filters: { search_text: "old text", brands: ["acme"] },
    });

    expect(result, "the completion did not prefer the shopper's language").toEqual({
      suggestion: "red فستان",
    });
    const sent = JSON.stringify(io.search.mock.calls[0][0].query);
    expect(sent, "the applied brand filter did not scope the completion").toContain("acme");
    expect(sent, "the old search text leaked into the completion query").not.toContain("old text");
    expect(sent, "the completion did not match on the start of the name").toContain(
      '"custom_products.name.exact":{"query":"Red"}',
    );
  });

  it("falls back to English, then to any language", async () => {
    io.search.mockResolvedValue({
      hits: { hits: [hit([{ name: "Red hat", language_code: "tr" }, { name: "Red shoe", language_code: "en" }])] },
    });
    expect(
      await GetSearchSuggestion({ language: "ku", country: "sy", search_text: "red" }),
      "the completion did not fall back to English",
    ).toEqual({ suggestion: "Red shoe" });

    io.search.mockResolvedValue({ hits: { hits: [hit([{ name: "Red hat", language_code: "tr" }])] } });
    expect(
      await GetSearchSuggestion({ language: "ku", country: "sy", search_text: "red" }),
      "the completion did not fall back to any language",
    ).toEqual({ suggestion: "Red hat" });

    io.search.mockResolvedValue({ hits: { hits: [hit([{ name: "Blue hat", language_code: "en" }])] } });
    expect(
      await GetSearchSuggestion({ language: "en", country: "sy", search_text: "red" }),
      "a name that does not start with the typed text was suggested",
    ).toEqual({ suggestion: "" });
  });

  it("suggests nothing, and reports it, when the search fails", async () => {
    io.search.mockRejectedValue(new Error("down"));

    expect(
      await GetSearchSuggestion({ language: "en", country: "sy", search_text: "red" }),
      "a failed completion search broke typing",
    ).toEqual({ suggestion: "" });
    expect(scenarios(), "the failed completion search was not reported").toContain(
      "Error In GetSearchSuggestion in serverRequest/Search",
    );
  });
});

describe("the search results panel (GetSearchData)", () => {
  const categoryHit = (source: any) => ({ category_details: { hits: { hits: [{ _source: source }] } } });

  /** A search answer with one product, one brand, one boutique and categories. */
  const answer = (total = 3) => ({
    hits: {
      total: { value: total },
      hits: [
        {
          _source: {
            id: 1,
            unit_price: 20,
            offered_price: 15,
            images: ["a.jpg"],
            colors: [{ color: "#FF0000", name: "Red" }, { color: "#0000FF", name: "Blue" }],
            sync_color_images: [
              { color_name: "Blue", images: ["b.jpg"] },
              { color_name: "Red", images: ["r.jpg"] },
            ],
            custom_products: [{ language_code: "en", name: "Red dress", slug: "red-dress" }],
          },
        },
        { _source: { id: 2, images: [], custom_products: [{ language_code: "ar", name: "x" }] } },
      ],
    },
    aggregations: {
      filtered_results: {
        top_categories: {
          filtered_categories: {
            categories_by_id: {
              buckets: [
                { key: 10, ...categoryHit({ id: 110, category_id: 10, name: "Women", slug: "women" }) },
                { key: 11, ...categoryHit({ id: 111, category_id: 11, name: "Shoes", slug: "shoes" }) },
              ],
            },
          },
        },
        top_orig_categories: {
          orig_categories_by_id: {
            buckets: [
              { orig_category_details: { hits: { hits: [{ _source: { id: 10, gender: 2, group_age: 6 } }] } } },
              { orig_category_details: { hits: { hits: [{ _source: { id: 11, gender: 2, group_age: 6 } }] } } },
              // Not on the page itself, but its gender and age pair makes the
              // related category with the same pair eligible.
              { orig_category_details: { hits: { hits: [{ _source: { id: 12, gender: 7, group_age: 99 } }] } } },
            ],
          },
        },
        top_brands: {
          filtered_brands: {
            brands_by_id: {
              buckets: [{ key: 5, brand_details: { hits: { hits: [{ _source: { name: "Acme", slug: "acme" } }] } } }],
            },
          },
        },
        top_boutiques: {
          filtered_boutiques: {
            boutiques_by_id: {
              buckets: [{ key: 8, boutique_details: { hits: { hits: [{ _source: { name: "Shop", slug: "shop" } }] } } }],
            },
          },
        },
      },
      global_related_scope: {
        related_filtered_results: {
          related_categories: {
            categories_with_gender_age: {
              buckets: [
                categoryHit({ id: 10, gender: 2, group_age: 6 }),
                categoryHit({ id: 12, gender: 7, group_age: 99 }),
                categoryHit({ id: 13, gender: 99, group_age: 6 }),
              ],
            },
          },
          related_custom_categories: {
            filtered_categories: {
              categories_by_id: {
                buckets: [
                  { key: 10, ...categoryHit({ slug: "women", name: "Women" }) },
                  { key: 12, ...categoryHit({ slug: "odd-age", name: "Odd age" }) },
                  { key: 13, ...categoryHit({ name: "No slug" }) },
                ],
              },
            },
          },
        },
      },
    },
  });

  it("returns the cards and every filter list for a one-word search, and logs the search", async () => {
    io.search.mockResolvedValue(answer());
    io.qaMode.mockResolvedValue(true);

    const result: any = await GetSearchData({
      language: "en",
      country: "sy",
      filters: { search_text: "dress", colors: ["#ff0000"] },
      noProducts: false,
      filters_offset: 1,
      userId: 42,
    });

    expect(io.analyze, "a one-word search was sent to the text analyser").not.toHaveBeenCalled();
    expect(result.total_size, "the result count is wrong").toBe(3);
    expect(result.products, "the product cards are wrong").toEqual([
      expect.objectContaining({
        name: "Red dress",
        slug: "red-dress",
        color: "Red",
        images: [{ file_path: "/product/r.jpg" }],
        price: 20,
        offer_price: 15,
      }),
    ]);
    expect(result.brands.map((b: any) => b.slug), "the brand filter is wrong").toEqual(["acme"]);
    expect(result.boutiques.map((b: any) => b.slug), "the boutique filter is wrong").toEqual(["shop"]);
    expect(result.categories.map((c: any) => c.slug), "the category filter is wrong").toEqual(["women", "shoes"]);
    expect(result.related_categories, "the related categories are wrong").toEqual([
      expect.objectContaining({
        slug: "women",
        gender: "Female",
        group_age: "Adult (26-40 years)",
        realted: ["women", "shoes"],
      }),
      expect.objectContaining({ slug: "odd-age", gender: 7, group_age: 99, realted: [] }),
    ]);
    expect(result.isAnalyzed, "a one-word search claimed to be analysed").toBe(false);
    expect(io.logSearchTerm, "a search with results was not logged").toHaveBeenCalledWith(
      expect.objectContaining({ searchText: "dress", productsCount: 3, userData: { id: 42 } }),
    );
    expect(
      JSON.stringify(io.search.mock.calls[0][0].query),
      "QA mode did not reach the results query",
    ).not.toContain("trydos-qa-");
  });

  it("leaves a category the shopper already chose out of the related list", async () => {
    io.search.mockResolvedValue(answer());

    const result: any = await GetSearchData({
      language: "en",
      country: "sy",
      filters: { categories: ["women"] },
      noProducts: false,
      filters_offset: 1,
      userId: null,
    });

    expect(
      result.related_categories.map((c: any) => c.slug),
      "a chosen category was offered again as related",
    ).toEqual(["odd-age"]);
    expect(io.logSearchTerm, "a search with no text was logged").not.toHaveBeenCalled();
  });

  it("does not log a text search that found nothing, and answers empty lists", async () => {
    // What the search backend sends for no match: the aggregations are there,
    // with no buckets in them.
    io.search.mockResolvedValue({
      hits: { total: { value: 0 }, hits: [] },
      aggregations: {
        filtered_results: {
          top_categories: { filtered_categories: { categories_by_id: { buckets: [] } } },
        },
      },
    });
    io.children.mockResolvedValue({
      top_categories: { filtered_categories: { categories_by_id: { buckets: [] } } },
      top_orig_categories: { orig_categories_by_id: { buckets: [] } },
    });

    const result: any = await GetSearchData({
      language: "en",
      country: "sy",
      filters: { search_text: "zzz" },
      noProducts: false,
      filters_offset: 1,
      userId: 1,
    });

    expect(io.logSearchTerm, "a search that found nothing was logged").not.toHaveBeenCalled();
    expect(
      [result.total_size, result.products, result.categories, result.brands, result.related_categories],
      "a search that found nothing did not answer empty lists",
    ).toEqual([0, [], [], [], []]);
  });

  it("uses what the text analyser found in a longer search", async () => {
    io.search.mockResolvedValue(answer());
    io.analyze
      .mockResolvedValueOnce({ name: "dress", color: "#ff0000", size: ["M", "L"] })
      .mockResolvedValueOnce({ color: ["#00ff00"], size: "S" });

    const first: any = await GetSearchData({
      language: "en",
      country: "sy",
      filters: { search_text: "red dress medium", sizes: ["M"] },
      noProducts: false,
      filters_offset: 1,
      userId: 1,
    });
    expect(first.applied, "the analysed name, colour and sizes were not applied").toMatchObject({
      search_text: "dress",
      colors: ["#ff0000"],
      sizes: ["M", "L"],
    });
    expect(first.isAnalyzed, "the analyser's answer was not passed back").toMatchObject({ name: "dress" });

    const second: any = await GetSearchData({
      language: "en",
      country: "sy",
      filters: { search_text: "green small", colors: ["#00ff00"] },
      noProducts: false,
      filters_offset: 1,
      userId: 1,
    });
    expect(second.applied, "a list of colours or a single size was not applied").toMatchObject({
      search_text: "green small",
      colors: ["#00ff00"],
      sizes: ["S"],
    });
  });

  it("still searches, and reports it, when the analyser refuses or fails", async () => {
    io.search.mockResolvedValue(answer());
    io.analyze.mockResolvedValueOnce({ error: "rate limited" }).mockRejectedValueOnce(new Error("offline"));

    const refused: any = await GetSearchData({
      language: "en",
      country: "sy",
      filters: { search_text: "red dress" },
      noProducts: false,
      filters_offset: 1,
      userId: 1,
    });
    expect(refused.isAnalyzed, "the analyser's refusal was not passed back").toBe("rate limited");
    expect(scenarios(), "the analyser's refusal was not reported").toContain(
      "GetSearchData: the search analyser refused the text",
    );

    const failed: any = await GetSearchData({
      language: "en",
      country: "sy",
      filters: { search_text: "red dress" },
      noProducts: false,
      filters_offset: 1,
      userId: 1,
    });
    expect(failed.products, "a failed analyser stopped the search").toHaveLength(1);
    expect(failed.isAnalyzed, "a failed analyser claimed an analysis").toBe(false);
  });

  it("throws a readable error, and reports it, when the search fails", async () => {
    io.search.mockRejectedValueOnce(new Error("index down")).mockRejectedValueOnce("plain");
    const ask = () =>
      GetSearchData({
        language: "en",
        country: "sy",
        filters: {},
        noProducts: false,
        filters_offset: 1,
        userId: 1,
      });

    await expect(ask(), "a failed search was hidden").rejects.toThrow("Search failed: index down");
    await expect(ask(), "a non-error failure was hidden").rejects.toThrow("Search failed: Unknown error");
    expect(scenarios(), "the failed search was not reported").toContain(
      "Error In GetSearchData in serverRequest/Search",
    );
  });
});
