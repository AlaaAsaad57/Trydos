// The search helpers: the price maths, the sort order and the filter lists
// behind every listing page.
//
// This is the largest block of untested logic in the app, and it decides what a
// shopper sees on a listing: which price is shown, which products fall inside a
// chosen price band, what order they come in, and which brands, boutiques and
// colours appear in the filter panel. Almost all of it is plain input-to-output
// rules, so it can be driven directly without a search server.
//
// The country price rules are the part worth the most. A product can carry a
// price for one country that differs from its ordinary one, and that price is
// stored in two different shapes depending on how old the record is. Reading
// either shape wrongly shows the wrong price on a card.
//
// What is left out: the functions that talk to the search server
// (logSearchTerm, getPopularSearchTerms, getChildrenAndGrandchildren). Those
// belong with the tests that stand a server up.

import { beforeEach, describe, expect, it, vi } from "vitest";

// The search client opens a connection as soon as it is built, so it is
// replaced. The request headers and the search client are only read by the
// search-log helpers at the end of this file; everything else ignores them.
const io = vi.hoisted(() => ({
  headers: vi.fn(),
  search: vi.fn(),
  logServerError: vi.fn(),
}));
vi.mock("next/headers", () => ({ headers: io.headers }));
vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: { search: io.search },
  elasticSearchComment: {},
}));
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: io.logServerError,
}));

import {
  buildBaseConditions,
  buildPriceHistogramAggregation,
  buildPriceStatsAggregation,
  getPopularSearchTerms,
  logSearchTerm,
  processCategoriesAggregation,
  processRelatedCategories,
  buildCountryAwarePriceRangeCondition,
  computeFlashActive,
  buildSortClause,
  calculateDiscountedPrice,
  calculatePriceRange,
  deriveEqualCountCards,
  extractFilters,
  getSourceFields,
  mergePriceHistogram,
  mergePriceStats,
  normalizeCustomProducts,
  paginateFilters,
  PopulateCategories,
  PRICE_CARD_COUNT,
  PRICE_HISTOGRAM_BUCKETS,
  priceHistogramInterval,
  processBoutiquesAggregation,
  processBrandsAggregation,
  processCustomProduct,
  resolveOfferPriceForCountry,
  resolveUnitPriceForCountry,
  sortColorsByFilteredColor,
  sortSyncColorImagesByFilteredColor,
} from "services/elastic/helpers";

describe("asking the search server for the right fields (getSourceFields)", () => {
  it("leaves the heavy fields out for the website", () => {
    const fields = getSourceFields();
    expect(fields).toContain("offered_price");
    expect(fields).not.toContain("custom_products.details");
  });

  it("adds the heavy fields back for the phone app", () => {
    const fields = getSourceFields(true);
    expect(fields).toContain("custom_products.details");
    expect(fields).toContain("custom_boutiques.banners");
  });

  it("asks for both price shapes, so a country price can be read", () => {
    const fields = getSourceFields();
    expect(fields).toContain("country_offer_prices");
    expect(fields).toContain("extra_price_for_country");
  });
});

describe("putting a listing in order (buildSortClause)", () => {
  const lastRule = (clause: any[]) => clause[clause.length - 1];

  it("falls back to best match when no order was asked for", () => {
    expect(buildSortClause(undefined, "en")[0]).toEqual({
      _score: { order: "desc" },
    });
    // The caller hands this straight from a query string, which gives null as
    // often as it gives nothing at all.
    expect(buildSortClause(null, "en")[0]).toEqual({
      _score: { order: "desc" },
    });
  });

  it("falls back to best match for an order it does not know", () => {
    expect(buildSortClause("cheapest_ever", "en")[0]).toEqual({
      _score: { order: "desc" },
    });
  });

  it("orders by how much has sold when the shopper asks for best selling", () => {
    expect(buildSortClause("best_selling", "en")[0]).toMatchObject({
      orders_count: { order: "desc" },
    });
  });

  it("orders by date, newest or oldest first", () => {
    expect(buildSortClause("newest", "en")[0]).toMatchObject({
      created_at: { order: "desc" },
    });
    expect(buildSortClause("oldest", "en")[0]).toMatchObject({
      created_at: { order: "asc" },
    });
  });

  it("orders by price, cheapest or dearest first", () => {
    expect(buildSortClause("price_asc", "en")[0]).toMatchObject({
      offered_price: { order: "asc" },
    });
    expect(buildSortClause("price_desc", "en")[0]).toMatchObject({
      offered_price: { order: "desc" },
    });
  });

  it("orders by the name in the shopper's own language", () => {
    const clause: any = buildSortClause("name_asc", "ar")[0];
    expect(clause._script.nested.filter.term["custom_products.language_code"]).toBe(
      "ar",
    );
    expect(clause._script.order).toBe("asc");
  });

  it("keeps a product with no name in the shopper's language at the end, either way", () => {
    const asc: any = buildSortClause("name_asc", "en")[0];
    const desc: any = buildSortClause("name_desc", "en")[0];
    expect(asc._script.script.params.missing).toBe("￿");
    expect(desc._script.script.params.missing).toBe("");
  });

  it("always ends on the same tie-breaker, so paging never repeats a product", () => {
    for (const key of [
      undefined,
      "best_selling",
      "newest",
      "oldest",
      "price_asc",
      "price_desc",
      "name_asc",
      "name_desc",
    ]) {
      expect(lastRule(buildSortClause(key, "en"))).toEqual({ id: { order: "asc" } });
    }
  });

  it("survives a field the search server has never been told about", () => {
    expect(buildSortClause("price_asc", "en")[0]).toMatchObject({
      offered_price: { unmapped_type: "double" },
    });
  });
});

describe("taking money off a price (calculateDiscountedPrice)", () => {
  it("takes a share off for a percentage discount", () => {
    expect(calculateDiscountedPrice(200, 25, "percent")).toBe(150);
  });

  it("takes a fixed amount off for a flat discount", () => {
    expect(calculateDiscountedPrice(200, 25, "flat")).toBe(175);
  });

  it("never lets a discount take a price below zero", () => {
    expect(calculateDiscountedPrice(20, 50, "flat")).toBe(0);
  });
});

describe("the price a shopper in one country pays (resolveOfferPriceForCountry)", () => {
  it("uses the ordinary price when the product has no country prices", () => {
    expect(resolveOfferPriceForCountry({ offered_price: 100 }, "GB")).toBe(100);
  });

  it("falls back to the full price when there is no offer price", () => {
    expect(resolveOfferPriceForCountry({ unit_price: 80 }, "GB")).toBe(80);
  });

  it("uses the country's own price when there is one", () => {
    expect(
      resolveOfferPriceForCountry(
        {
          offered_price: 100,
          country_offer_prices: [{ country_iso: "SY", offer_price: 28 }],
        },
        "SY",
      ),
    ).toBe(28);
  });

  it("reads the country prices when they arrive as text rather than a list", () => {
    expect(
      resolveOfferPriceForCountry(
        {
          offered_price: 100,
          country_offer_prices: '[{"country_iso":"SY","offer_price":28}]',
        },
        "SY",
      ),
    ).toBe(28);
  });

  it("ignores the country prices of every other country", () => {
    expect(
      resolveOfferPriceForCountry(
        {
          offered_price: 100,
          country_offer_prices: [{ country_iso: "SY", offer_price: 28 }],
        },
        "GB",
      ),
    ).toBe(100);
  });

  it("matches the country however it is written", () => {
    expect(
      resolveOfferPriceForCountry(
        {
          offered_price: 100,
          country_offer_prices: [{ country_iso: " sy ", offer_price: 28 }],
        },
        "sy",
      ),
    ).toBe(28);
  });

  it("adds the country's extra charge when only the older shape is stored", () => {
    expect(
      resolveOfferPriceForCountry(
        {
          offered_price: 100,
          extra_price_for_country: [{ country_iso: "TR", extra_price: 15 }],
        },
        "TR",
      ),
    ).toBe(115);
  });

  it("uses the ordinary price when no country was asked for", () => {
    expect(
      resolveOfferPriceForCountry(
        {
          offered_price: 100,
          country_offer_prices: [{ country_iso: "SY", offer_price: 28 }],
        },
        "",
      ),
    ).toBe(100);
  });

  it("ignores a country price entry with no country on it", () => {
    expect(
      resolveOfferPriceForCountry(
        {
          offered_price: 100,
          country_offer_prices: [{ offer_price: 28 }],
        },
        "SY",
      ),
    ).toBe(100);
  });

  it("ignores a country price that is not a number", () => {
    expect(
      resolveOfferPriceForCountry(
        {
          offered_price: 100,
          country_offer_prices: [{ country_iso: "SY", offer_price: "cheap" }],
        },
        "SY",
      ),
    ).toBe(100);
  });

  it("ignores country prices stored as text that cannot be read", () => {
    expect(
      resolveOfferPriceForCountry(
        { offered_price: 100, country_offer_prices: "{not-a-list" },
        "SY",
      ),
    ).toBe(100);
  });

  it("keeps the last entry when a country is listed twice", () => {
    expect(
      resolveOfferPriceForCountry(
        {
          offered_price: 100,
          country_offer_prices: [
            { country_iso: "SY", offer_price: 28 },
            { country_iso: "SY", offer_price: 35 },
          ],
        },
        "SY",
      ),
    ).toBe(35);
  });
});

describe("the price a product is struck through at (resolveUnitPriceForCountry)", () => {
  it("uses the ordinary full price when there are no country prices", () => {
    expect(resolveUnitPriceForCountry({ unit_price: 120 }, "GB")).toBe(120);
  });

  it("adds the country's extra charge to the full price", () => {
    expect(
      resolveUnitPriceForCountry(
        {
          unit_price: 120,
          offered_price: 100,
          country_offer_prices: [
            { country_iso: "SY", offer_price: 128, extra_price: 28 },
          ],
        },
        "SY",
      ),
    ).toBe(148);
  });

  it("works the charge out from the country price when none is stored", () => {
    // The country pays 128 where everyone else pays 100, so the full price rises
    // by the same 28, to 148.
    //
    // This step could not run before: the reading step filled in a charge of 0
    // whenever the record had none, and 0 reads as an answer, so the branch above
    // it always won and the full price came back unchanged. What a shopper saw
    // was a price paid of 128 with 120 struck through beside it — the old price
    // looked cheaper than the new one. Absent and zero are kept apart now.
    expect(
      resolveUnitPriceForCountry(
        {
          unit_price: 120,
          offered_price: 100,
          country_offer_prices: [{ country_iso: "SY", offer_price: 128 }],
        },
        "SY",
      ),
    ).toBe(148);
  });

  it("still treats a stored charge of zero as no charge at all", () => {
    // The other half of that fix: a record that really says "no extra charge for
    // this country" must keep the full price as it is, rather than falling
    // through to the derived branch and inventing one.
    expect(
      resolveUnitPriceForCountry(
        {
          unit_price: 120,
          offered_price: 100,
          country_offer_prices: [
            { country_iso: "SY", offer_price: 128, extra_price: 0 },
          ],
        },
        "SY",
      ),
    ).toBe(120);
  });

  it("never lets a country's charge push the full price below zero", () => {
    expect(
      resolveUnitPriceForCountry(
        {
          unit_price: 10,
          offered_price: 10,
          country_offer_prices: [{ country_iso: "SY", offer_price: 0, extra_price: -50 }],
        },
        "SY",
      ),
    ).toBe(0);
  });

  it("falls back to the older extra-charge shape", () => {
    expect(
      resolveUnitPriceForCountry(
        {
          unit_price: 120,
          extra_price_for_country: '[{"country_iso":"TR","extra_price":15}]',
        },
        "TR",
      ),
    ).toBe(135);
  });

  it("uses the ordinary full price when no country was asked for", () => {
    expect(
      resolveUnitPriceForCountry(
        {
          unit_price: 120,
          country_offer_prices: [{ country_iso: "SY", offer_price: 128 }],
        },
        "",
      ),
    ).toBe(120);
  });
});

describe("finding the products inside a chosen price band (buildCountryAwarePriceRangeCondition)", () => {
  it("matches on the ordinary price when no country was asked for", () => {
    expect(buildCountryAwarePriceRangeCondition([10, 50], "")).toEqual({
      range: { offered_price: { gte: 10, lte: 50 } },
    });
  });

  it("treats a band with only a lower end as that one price", () => {
    expect(buildCountryAwarePriceRangeCondition([25], "")).toEqual({
      range: { offered_price: { gte: 25, lte: 25 } },
    });
  });

  it("looks at the country's own price first and the ordinary one otherwise", () => {
    const condition: any = buildCountryAwarePriceRangeCondition([10, 50], "sy");
    expect(condition.bool.should).toHaveLength(2);
    const asText = JSON.stringify(condition);
    expect(asText).toContain("country_offer_prices");
    expect(asText).toContain('"SY"');
  });

  it("does not fall over when the product has no country prices at all", () => {
    const asText = JSON.stringify(
      buildCountryAwarePriceRangeCondition([10, 50], "SY"),
    );
    expect(asText).toContain("ignore_unmapped");
  });
});

describe("the price band shown on a listing (calculatePriceRange)", () => {
  const products = [
    { offered_price: 10 },
    { offered_price: 50 },
    { offered_price: 30 },
  ];

  it("reports the cheapest and dearest products on the page", () => {
    const range = calculatePriceRange(products, "");
    expect(range.min_price).toBe(10);
    expect(range.max_price).toBe(50);
  });

  it("splits the band into four bands the shopper can pick from", () => {
    const range = calculatePriceRange(products, "");
    expect(range.priceRanges).toHaveLength(4);
    expect(range.priceRanges[0].min_price).toBe(10);
    expect(range.priceRanges[3].max_price).toBe(50);
  });

  it("reports zero when there are no products", () => {
    expect(calculatePriceRange([], "")).toEqual({
      min_price: 0,
      max_price: 0,
      priceRanges: [],
    });
  });

  it("offers no bands when every product costs the same", () => {
    const range = calculatePriceRange([{ offered_price: 20 }, { offered_price: 20 }], "");
    expect(range.min_price).toBe(20);
    expect(range.priceRanges).toEqual([]);
  });

  it("ignores a product with no price at all", () => {
    const range = calculatePriceRange(
      [{ offered_price: 0 }, { offered_price: 40 }],
      "",
    );
    expect(range.min_price).toBe(40);
  });

  it("uses the country's prices when a country was asked for", () => {
    const range = calculatePriceRange(
      [
        {
          offered_price: 100,
          country_offer_prices: [{ country_iso: "SY", offer_price: 28 }],
        },
        { offered_price: 60 },
      ],
      "SY",
    );
    expect(range.min_price).toBe(28);
    expect(range.max_price).toBe(60);
  });
});

describe("the price slider and the price cards (the whole-catalog figures)", () => {
  it("splits the whole price span into a fixed number of steps", () => {
    expect(priceHistogramInterval(0, 200)).toBe(200 / PRICE_HISTOGRAM_BUCKETS);
  });

  it("falls back to a step of one when every product costs the same", () => {
    expect(priceHistogramInterval(50, 50)).toBe(1);
    expect(priceHistogramInterval(80, 20)).toBe(1);
  });

  it("merges the ordinary prices and the country prices into one span", () => {
    expect(
      mergePriceStats({
        base_stats: { stats: { count: 10, min: 5, max: 90 } },
        country_stats: { matched: { stats: { count: 4, min: 2, max: 60 } } },
      }),
    ).toEqual({ min_price: 2, max_price: 90, total: 14 });
  });

  it("uses whichever of the two has products in it", () => {
    expect(
      mergePriceStats({
        base_stats: { stats: { count: 0, min: null, max: null } },
        country_stats: { matched: { stats: { count: 3, min: 7, max: 20 } } },
      }),
    ).toEqual({ min_price: 7, max_price: 20, total: 3 });
  });

  it("reports zero when nothing matched at all", () => {
    expect(mergePriceStats({})).toEqual({ min_price: 0, max_price: 0, total: 0 });
  });

  it("adds the two counts together where the price steps line up", () => {
    const merged = mergePriceHistogram(
      {
        base_hist: { hist: { buckets: [{ key: 0, doc_count: 3 }] } },
        country_hist: { matched: { hist: { buckets: [{ key: 0, doc_count: 2 }] } } },
      },
      10,
    );
    expect(merged).toEqual([{ min_price: 0, max_price: 10, count: 5 }]);
  });

  it("puts the price steps in order, cheapest first", () => {
    const merged = mergePriceHistogram(
      { base_hist: { hist: { buckets: [{ key: 20, doc_count: 1 }, { key: 0, doc_count: 1 }] } } },
      10,
    );
    expect(merged.map((b) => b.min_price)).toEqual([0, 20]);
  });

  it("gives an empty distribution back when nothing matched", () => {
    expect(mergePriceHistogram({}, 10)).toEqual([]);
  });

  it("gives every price card roughly the same number of products", () => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      min_price: i * 10,
      max_price: i * 10 + 10,
      count: 10,
    }));
    const cards = deriveEqualCountCards(buckets, 5);
    expect(cards).toHaveLength(5);
    for (const card of cards) {
      expect(card.products_count).toBe(20);
    }
  });

  it("runs the cards from the cheapest product to the dearest", () => {
    const buckets = [
      { min_price: 0, max_price: 10, count: 5 },
      { min_price: 10, max_price: 20, count: 5 },
    ];
    const cards = deriveEqualCountCards(buckets, 2);
    expect(cards[0].min_price).toBe(0);
    expect(cards[cards.length - 1].max_price).toBe(20);
  });

  it("stays balanced when nearly every product sits in one wide band", () => {
    const cards = deriveEqualCountCards(
      [
        { min_price: 0, max_price: 100, count: 100 },
        { min_price: 900, max_price: 1000, count: 1 },
      ],
      4,
    );
    expect(cards.length).toBeGreaterThan(1);
    expect(cards[0].max_price).toBeLessThan(100);
  });

  it("offers a single card when there is only one product", () => {
    const cards = deriveEqualCountCards(
      [{ min_price: 30, max_price: 40, count: 1 }],
      5,
    );
    expect(cards).toEqual([{ min_price: 30, max_price: 40, products_count: 1 }]);
  });

  it("offers no cards when there is nothing to show", () => {
    expect(deriveEqualCountCards([], 5)).toEqual([]);
    expect(deriveEqualCountCards([{ min_price: 0, max_price: 10, count: 0 }], 5)).toEqual(
      [],
    );
  });

  it("offers five cards unless told otherwise", () => {
    expect(PRICE_CARD_COUNT).toBe(5);
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      min_price: i,
      max_price: i + 1,
      count: 10,
    }));
    expect(deriveEqualCountCards(buckets)).toHaveLength(PRICE_CARD_COUNT);
  });
});

describe("the filter lists in the side panel", () => {
  it("shows the brand's name and logo when the details came back", () => {
    expect(
      processBrandsAggregation(
        [
          {
            key: 7,
            doc_count: 3,
            brand_details: { hits: { hits: [{ _source: { name: "Nike", slug: "nike", icon: "i.png" } }] } },
          },
        ],
        1,
      ),
    ).toEqual([{ id: 7, name: "Nike", slug: "nike", icon: "i.png" }]);
  });

  it("still lists a brand whose details are missing, with its count", () => {
    expect(processBrandsAggregation([{ key: 7, doc_count: 3 }], 1)).toEqual([
      { id: 7, doc_count: 3 },
    ]);
  });

  it("shows the boutique's first banner that has not been deleted", () => {
    const result: any = processBoutiquesAggregation(
      [
        {
          key: 2,
          boutique_details: {
            hits: {
              hits: [
                {
                  _source: {
                    name: "Shop A",
                    slug: "shop-a",
                    banners: [
                      { id: 1, deleted_at: "2026-01-01" },
                      { id: 2, deleted_at: null },
                    ],
                  },
                },
              ],
            },
          },
        },
      ],
      1,
    );
    expect(result[0].banner.id).toBe(2);
  });

  it("does not tell the page when a banner was deleted", () => {
    const result: any = processBoutiquesAggregation(
      [
        {
          key: 2,
          boutique_details: {
            hits: { hits: [{ _source: { name: "Shop A", banners: [{ id: 2, deleted_at: null }] } }] },
          },
        },
      ],
      1,
    );
    expect(result[0].banner).not.toHaveProperty("deleted_at");
  });

  it("shows no banner when the boutique has none", () => {
    const result: any = processBoutiquesAggregation(
      [{ key: 2, boutique_details: { hits: { hits: [{ _source: { name: "Shop A" } }] } } }],
      1,
    );
    expect(result[0].banner).toBeNull();
  });

  it("still lists a boutique whose details are missing, with its count", () => {
    expect(processBoutiquesAggregation([{ key: 2, doc_count: 4 }], 1)).toEqual([
      { id: 2, doc_count: 4 },
    ]);
  });

  it("shows ten filters per page", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    expect(paginateFilters(items, 1)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(paginateFilters(items, 3)).toEqual([20, 21, 22, 23, 24]);
  });

  it("shows the first page rather than nothing when the page number is wrong", () => {
    expect(paginateFilters([1, 2, 3], 0)).toEqual([1, 2, 3]);
  });

  it("lists a category's children alongside the category itself", () => {
    expect(
      PopulateCategories({
        categories: [
          { id: 1, childes: [{ id: 2 }, { id: 3 }] },
          { id: 4, childes: [] },
        ] as any,
      }).map((c: any) => c.id),
    ).toEqual([2, 3, 1, 4]);
  });
});

describe("putting the chosen colour first", () => {
  it("moves the chosen colour to the front of the product's colours", () => {
    const products: any = [
      {
        colors: [
          { color: "#00FF00", name: "Green" },
          { color: "#FF0000", name: "Red" },
        ],
      },
    ];
    sortColorsByFilteredColor(products, { colors: ["#ff0000"] } as any);
    expect(products[0].colors[0].name).toBe("Red");
  });

  it("leaves the colours alone when none was chosen", () => {
    const products: any = [{ colors: [{ color: "#00FF00", name: "Green" }] }];
    sortColorsByFilteredColor(products, {} as any);
    expect(products[0].colors[0].name).toBe("Green");
  });

  it("moves the chosen colour's pictures to the front", () => {
    const result: any = sortSyncColorImagesByFilteredColor(
      [
        {
          colors: [
            { color: "#00FF00", name: "Green" },
            { color: "#FF0000", name: "Red" },
          ],
          sync_color_images: [{ color_name: "Green" }, { color_name: "Red" }],
        } as any,
      ],
      { colors: ["#ff0000"] } as any,
    );
    expect(result[0].sync_color_images[0].color_name).toBe("Red");
  });

  it("leaves a product's pictures alone when it has none of the chosen colours", () => {
    const result: any = sortSyncColorImagesByFilteredColor(
      [
        {
          colors: [{ color: "#00FF00", name: "Green" }],
          sync_color_images: [{ color_name: "Green" }],
        } as any,
      ],
      { colors: ["#ff0000"] } as any,
    );
    expect(result[0].sync_color_images[0].color_name).toBe("Green");
  });

  it("leaves the pictures alone when no colour was chosen", () => {
    const products: any = [{ colors: [], sync_color_images: [] }];
    expect(sortSyncColorImagesByFilteredColor(products, {} as any)).toBe(products);
  });

  it("does not change the list it was given", () => {
    const original = [{ color_name: "Green" }, { color_name: "Red" }];
    sortSyncColorImagesByFilteredColor(
      [
        {
          colors: [
            { color: "#00FF00", name: "Green" },
            { color: "#FF0000", name: "Red" },
          ],
          sync_color_images: original,
        } as any,
      ],
      { colors: ["#ff0000"] } as any,
    );
    expect(original[0].color_name).toBe("Green");
  });
});

describe("turning a search result into a product card (processCustomProduct)", () => {
  const base = {
    unit_price: 120,
    offered_price: 100,
    current_stock: "5",
    boutique_id: 9,
    images: ["a.jpg"],
    thumbnail: "t.jpg",
  };
  const custom = { language_code: "en", name: "Blue shirt", slug: "blue-shirt" };

  it("shows both the price paid and the price struck through", () => {
    const card: any = processCustomProduct(base, custom, "en", false, "");
    expect(card.price).toBe(120);
    expect(card.offer_price).toBe(100);
  });

  it("uses the country's prices when a country was asked for", () => {
    const card: any = processCustomProduct(
      { ...base, country_offer_prices: [{ country_iso: "SY", offer_price: 128 }] },
      custom,
      "en",
      false,
      "SY",
    );
    expect(card.offer_price).toBe(128);
  });

  it("marks the product as in stock only when there is stock", () => {
    expect(processCustomProduct(base, custom, "en", false, "").in_stock).toBe(true);
    expect(
      processCustomProduct({ ...base, current_stock: "0" }, custom, "en", false, "")
        .in_stock,
    ).toBe(false);
  });

  // These two used to assert that processCustomProduct decided whether a flash
  // deal was running. It no longer does, and that is the point of the change:
  // deciding needs the clock, and this function runs inside a cached scope on
  // the homepage, where a clock read is not refused - it is run once and frozen
  // into the stored output. The window and the price still come through here;
  // whether it is running is now computeFlashActive's job, above, and the caller
  // supplies the moment.
  it("carries the flash-deal window and price through without deciding if it is running", () => {
    const card: any = processCustomProduct(
      {
        ...base,
        flash_deal_status: 1,
        flash_deal_price: 70,
        start_date: "2000-01-01",
        end_date: "2999-01-01",
      },
      custom,
      "en",
      false,
      "",
    );
    expect(
      card.flash_deal_price,
      "the flash-deal price did not survive processCustomProduct, so a card would show the ordinary price during a deal",
    ).toBe(70);
    expect(
      [card.flash_deal_start_date, card.flash_deal_end_date],
      "the flash-deal window did not survive processCustomProduct, so nothing downstream can work out whether the deal is running",
    ).toEqual(["2000-01-01", "2999-01-01"]);
    expect(
      card.is_flash_deal_active,
      "processCustomProduct set is_flash_deal_active again. It reads the clock to do that, and this function runs inside a cached scope on the homepage, so the answer would freeze at the moment the cache entry was written (finding 6)",
    ).toBeUndefined();
  });

  it("leaves a finished deal's window intact for the caller to judge", () => {
    const card: any = processCustomProduct(
      {
        ...base,
        flash_deal_status: 1,
        start_date: "2000-01-01",
        end_date: "2000-02-01",
      },
      custom,
      "en",
      false,
      "",
    );
    expect(
      computeFlashActive(card, new Date("2026-08-15T12:00:00Z")),
      "a deal that ended in 2000 was reported as running in 2026",
    ).toBe(false);
  });

  it("ignores a flash deal that was switched off", () => {
    const card: any = processCustomProduct(
      {
        ...base,
        flash_deal_status: 0,
        start_date: "2000-01-01",
        end_date: "2999-01-01",
      },
      custom,
      "en",
      false,
      "",
    );
    expect(card.is_flash_deal_active).toBeUndefined();
  });

  it("shows the reward price only when the product has one", () => {
    expect(
      processCustomProduct({ ...base, redeem_price: 40 }, custom, "en", false, "")
        .luck_price,
    ).toBe(40);
    expect(
      processCustomProduct({ ...base, redeem_price: 0 }, custom, "en", false, "")
        .luck_price,
    ).toBeUndefined();
  });

  it("takes the brand written in the shopper's language", () => {
    const card: any = processCustomProduct(
      {
        ...base,
        brand: { is_verified: 1 },
        custom_brands: [
          { language_code: "ar", name: "نايك" },
          { language_code: "en", name: "Nike" },
        ],
      },
      custom,
      "en",
      false,
      "",
    );
    expect(card.brand.name).toBe("Nike");
    expect(card.brand.is_verified).toBe(1);
  });

  it("treats a brand as unverified unless the record says otherwise", () => {
    const card: any = processCustomProduct(
      { ...base, custom_brands: [{ language_code: "en", name: "Nike" }] },
      custom,
      "en",
      false,
      "",
    );
    expect(card.brand.is_verified).toBe(0);
  });
});

describe("collecting the cards for a listing (extractFilters)", () => {
  const product = {
    unit_price: 120,
    offered_price: 100,
    current_stock: "1",
    images: [],
    custom_products: [
      { language_code: "en", name: "Blue shirt" },
      { language_code: "ar", name: "قميص أزرق" },
    ],
  };

  it("keeps only the wording in the shopper's language", () => {
    const result = extractFilters([product], "ar", false, "");
    expect(result.custom_products).toHaveLength(1);
    expect(result.custom_products[0].name).toBe("قميص أزرق");
  });

  it("skips a product with nothing written in the shopper's language", () => {
    expect(extractFilters([product], "ku", false, "").custom_products).toHaveLength(0);
  });

  it("skips a product with no wording at all", () => {
    expect(extractFilters([{ unit_price: 10 }], "en", false, "").custom_products).toHaveLength(
      0,
    );
  });

  it("reports the price band across everything it collected", () => {
    const result = extractFilters([product], "en", false, "");
    expect(result.prices.min_price).toBe(100);
  });
});

describe("tidying the pictures on a card (normalizeCustomProducts)", () => {
  it("drops the picture sets for colours the product no longer has", () => {
    const result = normalizeCustomProducts({
      custom_products: [
        {
          colors: [{ name: "Red", color: "#FF0000" }],
          sync_color_images: [
            { color_name: "Red", images: ["a.jpg"] },
            { color_name: "Green", images: ["b.jpg"] },
          ],
          images: [],
        } as any,
      ],
      prices: {} as any,
    });
    expect(result.custom_products[0].sync_color_images).toHaveLength(1);
  });

  it("turns a picture name into an address the page can load", () => {
    const result = normalizeCustomProducts({
      custom_products: [{ colors: [], sync_color_images: [], images: ["a.jpg"] } as any],
      prices: {} as any,
    });
    expect(result.custom_products[0].images).toEqual([
      { file_path: "/product/a.jpg" },
    ]);
  });

  it("reads the picture sets when they arrive as text rather than a list", () => {
    const result = normalizeCustomProducts({
      custom_products: [
        {
          colors: [{ name: "Red", color: "#FF0000" }],
          sync_color_images: '[{"color_name":"Red","images":["a.jpg"]}]',
          images: [],
        } as any,
      ],
      prices: {} as any,
    });
    expect(result.custom_products[0].sync_color_images[0].images).toEqual([
      { file_path: "/product/a.jpg" },
    ]);
  });

  it("says plainly whether a colour is a trending one", () => {
    const result = normalizeCustomProducts({
      custom_products: [
        {
          colors: [{ name: "Red", color: "#FF0000" }],
          sync_color_images: [{ color_name: "Red", images: [], color_trend: 1 }],
          images: [],
        } as any,
      ],
      prices: {} as any,
    });
    expect(result.custom_products[0].sync_color_images[0].color_trend).toBe(true);
  });

  it("does nothing when there are no products to tidy", () => {
    const input = { custom_products: [], prices: {} as any };
    expect(normalizeCustomProducts(input)).toBe(input);
  });
});

// The flash-deal window, and the clock it used to read.
//
// Both of these used to call `new Date()` deep inside code the homepage runs.
// The homepage now runs that code inside a `use cache` scope, and a cached scope
// does not refuse a clock read — it runs it once and freezes the answer into the
// stored output. Measured on this repo: a cached component that built this very
// query prerendered with `{"range":{"start_date":{"lte":"08/31/2026"}}}` written
// into static HTML. So the bound has to come from somewhere that is not a
// JavaScript clock inside the cached call.
describe("computeFlashActive", () => {
  const window = {
    flash_deal_start_date: "2026-08-01T00:00:00Z",
    flash_deal_end_date: "2026-08-31T23:59:59Z",
  };

  it("is true for a moment inside the window", () => {
    expect(
      computeFlashActive(window, new Date("2026-08-15T12:00:00Z")),
      "a flash deal that is running was reported as finished, so the mobile app would hide a live offer",
    ).toBe(true);
  });

  it("is false before the window opens", () => {
    expect(
      computeFlashActive(window, new Date("2026-07-31T23:59:59Z")),
      "a flash deal that has not started yet was reported as running, so the mobile app would advertise a price nobody can pay",
    ).toBe(false);
  });

  it("is false after the window closes", () => {
    expect(
      computeFlashActive(window, new Date("2026-09-01T00:00:01Z")),
      "a finished flash deal was reported as running",
    ).toBe(false);
  });

  it("is false when the dates cannot be read", () => {
    expect(
      computeFlashActive(
        { flash_deal_start_date: "not a date", flash_deal_end_date: "" },
        new Date("2026-08-15T12:00:00Z"),
      ),
      "an unreadable flash-deal window was reported as running instead of falling back to false",
    ).toBe(false);
  });

  it("takes the moment as an argument and never reads the clock itself", () => {
    const first = computeFlashActive(window, new Date("2026-08-15T12:00:00Z"));
    const second = computeFlashActive(window, new Date("2026-09-15T12:00:00Z"));
    expect(
      [first, second],
      "computeFlashActive gave the same answer for two different moments, so it is reading the clock itself rather than the moment it was given — and a cached scope would freeze whichever moment ran first",
    ).toEqual([true, false]);
  });
});

describe("the flash-deal range bound in buildBaseConditions", () => {
  const flashClause = (country = "sy") => {
    const built: any = buildBaseConditions({ flashdeal: true } as any, country);
    return built.must
      .flatMap((condition: any) => condition?.bool?.must ?? [])
      .filter((condition: any) => condition?.range);
  };

  it("bounds the window with the search engine's own date math, not a JavaScript clock", () => {
    const ranges = flashClause();
    expect(
      ranges.map((r: any) => r.range.start_date?.lte ?? r.range.end_date?.gte),
      "the flash-deal query still carries a fixed day string. Inside a cached scope that day is whatever the clock said when the entry was written, so deals that start later never appear and deals that ended keep showing (finding 6)",
    ).toEqual(["now/d", "now/d"]);
  });

  it("builds the same query twice, so nothing about it depends on when it ran", () => {
    expect(
      JSON.stringify(flashClause()),
      "two calls built two different flash-deal queries, which means something inside still reads the clock",
    ).toBe(JSON.stringify(flashClause()));
  });
});

// ---------------------------------------------------------------------------
// The QA lock (AC-1).
//
// The end-to-end suite creates a real shop on a real environment, and the mark
// that keeps it away from shoppers travels inside the row: the shop's slug
// starts `trydos-qa-`. This is the clause that acts on that mark in the main
// catalogue builder — the one behind search, listing and recommended.
// ---------------------------------------------------------------------------

describe("the QA shop clause in buildBaseConditions", () => {
  const qaClauses = (qaView?: boolean) => {
    const built: any = buildBaseConditions({} as any, "sy", qaView);
    return built.must_not.filter(
      (condition: any) => condition?.nested?.path === "custom_boutiques",
    );
  };

  it("hides the QA shop from a normal search", () => {
    const clauses = qaClauses();

    expect(
      clauses.length,
      "a catalogue query carried no clause excluding QA shops, so a test shop created by the e2e suite would appear in search, listing and recommended results for real customers",
    ).toBe(1);

    expect(
      clauses[0].nested.query.prefix["custom_boutiques.slug.keyword"],
      "the QA clause is present but does not match a shop slug by prefix on custom_boutiques.slug.keyword, so it would exclude nothing",
    ).toEqual({ value: "trydos-qa-", case_insensitive: true });
  });

  it("drops the clause when the request proved it is in QA mode", () => {
    expect(
      qaClauses(true).length,
      "QA mode was on and the catalogue query still excluded QA shops, so the e2e suite can never see the product it created",
    ).toBe(0);
  });

  it("keeps the clause when the caller says nothing", () => {
    // The default is the shopper-facing answer on purpose: eight call sites
    // pass no third argument, and every one of them must stay filtered.
    expect(
      qaClauses(false).length,
      "buildBaseConditions unfiltered QA shops for a caller that passed qaView=false, which is the shopper-facing default",
    ).toBe(1);
  });

  it("ignores letter case, because the backend keeps the capitals", () => {
    // The backend builds a shop's slug from its name and keeps the case: a
    // boutique named "Trydos QA 1" gets the slug `Trydos-QA-1-57`. `.keyword`
    // is not analysed, so without this the lowercase prefix matches nothing
    // and every QA shop stays visible -- silently.
    expect(
      qaClauses()[0].nested.query.prefix["custom_boutiques.slug.keyword"]
        .case_insensitive,
      "the QA clause matches the shop slug case-sensitively, so a slug the backend capitalised (Trydos-QA-1-57) is not excluded and the shop is visible to every customer",
    ).toBe(true);
  });

  it("excludes the QA shop without also excluding a real one", () => {
    const clause = qaClauses()[0];
    expect(
      clause.nested.query.prefix["custom_boutiques.slug.keyword"].value,
      "the QA clause matches a prefix that a real seller's slug could start with, which would hide that seller's whole shop from the catalogue",
    ).toBe("trydos-qa-");
  });
});

// ---------------------------------------------------------------------------
// The category parts of a product card.
//
// processCustomProduct reads three things from the product's categories: the
// deepest category (the one with the highest position), every category that is
// switched on, and the category tree shown as a "Women | Dresses" line. Each
// reads the shopper's own language and ignores a category that is switched off.
// ---------------------------------------------------------------------------

describe("the categories on a product card (processCustomProduct)", () => {
  const product = {
    unit_price: 50,
    offered_price: 40,
    thumbnail: "thumb.jpg",
    images: '["one.jpg","two.jpg"]',
    category_ids: [
      { id: 1, position: 0 },
      { id: 2, position: 1 },
      { id: 3, position: 2 },
      { position: -1 },
      { id: 4 },
    ],
    categories: [
      { id: 1, status: 1, parent_id: 0, num_available_product: 12 },
      { id: 2, status: 1, parent_id: 1 },
      { id: 3, status: 1, parent_id: 2, num_available_product: 3 },
      { id: 4, status: 0 },
    ],
    custom_categories: [
      { id: 101, category_id: 1, language_code: "en", name: "Women" },
      { id: 102, category_id: 2, language_code: "en", name: "Dresses" },
      {
        id: 103,
        category_id: 3,
        language_code: "en",
        name: "Evening",
        description: "long text",
        banner_photo_path: "b.png",
        bio: "bio",
      },
      { id: 201, category_id: 1, language_code: "ar", name: "نساء" },
    ],
  };

  it("uses the deepest category, without its heavy fields, for the website", () => {
    const card: any = processCustomProduct(product, { language_code: "en" }, "en", true);

    expect(card.category?.name, "the deepest category was not chosen").toBe("Evening");
    expect(
      card.category?.num_available_product,
      "the deepest category lost its product count",
    ).toBe(3);
    expect(
      card.category?.most_viewed_product_thumbnail,
      "the deepest category did not get the product's thumbnail",
    ).toBe("thumb.jpg");
    expect(
      [card.category?.description, card.category?.bio, card.category?.banner_photo_path],
      "the website card still carries the category's heavy fields",
    ).toEqual([undefined, undefined, undefined]);
  });

  it("lists every switched-on category in the shopper's language", () => {
    const card: any = processCustomProduct(product, { language_code: "en" }, "en", false);

    expect(
      card.categories.map((c: any) => c.name),
      "the switched-on categories are wrong: a switched-off one or another language slipped in",
    ).toEqual(["Women", "Dresses", "Evening"]);
    expect(
      card.categories[1].num_available_product,
      "a category with no product count did not fall back to null",
    ).toBeNull();
    expect(
      card.category?.description,
      "the phone app card lost the category's description",
    ).toBe("long text");
  });

  it("builds the category hierarchy and the tree line from parent to child", () => {
    const card: any = processCustomProduct(product, { language_code: "en" }, "en", false);

    expect(
      [
        card.category_hierarchy.main_category?.name,
        card.category_hierarchy.sub_category?.name,
        card.category_hierarchy.sub_sub_category?.name,
      ],
      "the category hierarchy is not in position order",
    ).toEqual(["Women", "Dresses", "Evening"]);
    expect(card.categories_tree, "the category tree line is wrong").toBe(
      "Women | Dresses | Evening",
    );
    expect(card.images, "the pictures stored as text were not read").toEqual([
      "one.jpg",
      "two.jpg",
    ]);
  });

  it("gives no category when the deepest one is switched off or has no wording", () => {
    const off: any = processCustomProduct(
      { ...product, category_ids: [{ id: 4, position: 5 }] },
      {},
      "en",
      true,
    );
    expect(off.category, "a switched-off deepest category was still shown").toBeNull();

    const noWording: any = processCustomProduct(
      { ...product, category_ids: [{ id: 1, position: 5 }], custom_categories: undefined },
      {},
      "en",
      true,
    );
    expect(noWording.category, "a category with no wording was still shown").toBeNull();
    expect(noWording.categories, "categories with no wording were still listed").toEqual([]);

    const noCategories: any = processCustomProduct(
      { ...product, category_ids: [{ id: 1, position: 5 }], categories: undefined },
      {},
      "en",
      false,
    );
    expect(
      noCategories.category,
      "a category the product does not list as its own was shown",
    ).toBeNull();
  });

  it("gives empty categories when the product has none or none with a position", () => {
    const none: any = processCustomProduct({ unit_price: 1 }, {}, "en", false);
    expect(none.category, "a product with no categories got a category").toBeNull();
    expect(none.categories, "a product with no categories listed some").toEqual([]);
    expect(none.categories_tree, "a product with no categories got a tree line").toBe("");

    const noPosition: any = processCustomProduct(
      { ...product, category_ids: [{ id: 1 }] },
      {},
      "en",
      false,
    );
    expect(
      noPosition.category,
      "a category with no position was taken as the deepest one",
    ).toBeNull();
  });

  it("reads no pictures from text that is not a list or cannot be read", () => {
    expect(
      (processCustomProduct({ images: '{"a":1}' }, {}, "en", false) as any).images,
      "pictures stored as a text object were used as a list",
    ).toEqual([]);
    expect(
      (processCustomProduct({ images: "not json" }, {}, "en", false) as any).images,
      "unreadable picture text broke the card",
    ).toEqual([]);
    expect(
      (processCustomProduct({ images: { a: 1 } }, {}, "en", false) as any).images,
      "a picture object that is not a list was used as a list",
    ).toEqual([]);
  });
});

describe("the older extra-charge shape stored as text", () => {
  it("ignores extra-charge text that cannot be read", () => {
    expect(
      resolveUnitPriceForCountry(
        { unit_price: 100, offered_price: 90, extra_price_for_country: "{broken" },
        "SY",
      ),
      "unreadable extra-charge text changed the full price",
    ).toBe(100);
  });
});

describe("the whole-catalog price aggregations", () => {
  it("asks for the country prices only when a country was asked for", () => {
    const withCountry = buildPriceStatsAggregation([{ a: 1 }], [{ b: 1 }], " sy ");
    expect(
      withCountry.aggs.country_stats?.aggs.matched.filter.term[
        "country_offer_prices.country_iso"
      ],
      "the country stats did not ask for the upper-cased country",
    ).toBe("SY");
    expect(
      withCountry.aggs.base_stats.filter.bool.must_not[0].nested.path,
      "the ordinary-price stats did not leave out products with a country price",
    ).toBe("country_offer_prices");
    expect(withCountry.filter.bool, "the non-price filters were not re-applied").toEqual({
      must: [{ a: 1 }],
      must_not: [{ b: 1 }],
    });

    const noCountry = buildPriceStatsAggregation([], [], "");
    expect(noCountry.aggs.country_stats, "country stats were asked for with no country").toBeUndefined();
    expect(noCountry.aggs.base_stats.filter, "the ordinary-price stats were filtered with no country").toEqual({
      match_all: {},
    });
  });

  it("lines both histograms up on the same step, and never on a step of zero", () => {
    const hist = buildPriceHistogramAggregation([], [], "iq", 2.5, 10);
    expect(
      hist.aggs.country_hist?.aggs.matched.aggs.hist.histogram,
      "the country histogram does not share the ordinary one's step and offset",
    ).toMatchObject({ interval: 2.5, offset: 10 });
    expect(
      hist.aggs.base_hist.aggs.hist.histogram,
      "the ordinary histogram lost its step and offset",
    ).toMatchObject({ interval: 2.5, offset: 10 });

    const flat = buildPriceHistogramAggregation([], [], "", 0, 0);
    expect(flat.aggs.base_hist.aggs.hist.histogram.interval, "a zero step reached the search server").toBe(1);
    expect(flat.aggs.country_hist, "a country histogram was asked for with no country").toBeUndefined();
    expect(flat.aggs.base_hist.filter, "the ordinary histogram was filtered with no country").toEqual({
      match_all: {},
    });
  });

  it("counts a single-price step inside a card", () => {
    // The split point lands on 10 itself, so the empty 10-10 card is dropped and
    // one card holds all four products: the two at exactly 10 and the two above.
    const cards = deriveEqualCountCards(
      [
        { min_price: 10, max_price: 10, count: 2 },
        { min_price: 20, max_price: 30, count: 2 },
      ],
      2,
    );
    expect(
      cards,
      "the two products at exactly 10 were not counted in the card that starts at 10",
    ).toEqual([{ min_price: 10, max_price: 30, products_count: 4 }]);
  });
});

describe("the filters a shopper picks (buildBaseConditions)", () => {
  const built: any = buildBaseConditions(
    {
      categories: ["dresses"],
      related_categories: ["dresses", "shoes"],
      brands: ["acme"],
      boutiques: ["shop-a"],
      sizes: ["M", "L"],
      priceRange: [10, 50],
      tags_names: ["summer"],
      featured: true,
    } as any,
    "sy",
  );
  const json = JSON.stringify(built.must);

  it("filters by category, once per slug", () => {
    const categoryClause = built.must.find(
      (c: any) => c?.bool?.must?.[1]?.nested?.path === "custom_categories",
    );
    expect(
      categoryClause?.bool.must[1].nested.query.terms["custom_categories.slug.keyword"],
      "the category filter did not merge the chosen and related slugs once each",
    ).toEqual(["dresses", "shoes"]);
  });

  it("filters by brand, boutique, size and tag", () => {
    expect(json, "the brand filter is missing").toContain('"custom_brands.slug.keyword":["acme"]');
    expect(json, "the boutique filter is missing").toContain(
      '"custom_boutiques.slug.keyword":["shop-a"]',
    );
    expect(json, "the size filter is missing a size").toContain('{"match_phrase":{"available_size":"L"}}');
    expect(json, "the tag filter is missing").toContain('{"terms":{"tags_names":["summer"]}}');
  });

  it("filters by the country-aware price band", () => {
    expect(json, "the price band filter is missing").toContain("country_offer_prices");
  });

  it("shows featured products only, and leaves flash deals out", () => {
    expect(json, "the featured filter is missing").toContain('{"term":{"featured":1}}');
    expect(
      JSON.stringify(built.must_not),
      "featured products still include flash deals",
    ).toContain('{"exists":{"field":"flash_deal"}}');
  });

  it("ignores a price band that holds no number", () => {
    const noPrice: any = buildBaseConditions({ priceRange: [NaN] } as any, "sy");
    expect(
      JSON.stringify(noPrice.must),
      "a price band with no number still filtered the prices",
    ).not.toContain("country_offer_prices");
  });
});

describe("the category filter lists (processCategoriesAggregation)", () => {
  const origHit = (source: any) => ({
    orig_category_details: { hits: { hits: [{ _source: source }] } },
  });
  const transBucket = (key: number, source: any, thumbnail?: string) => ({
    key,
    category_details: { hits: { hits: [{ _source: source }] } },
    ...(thumbnail
      ? { to_product: { product_thumbnail: { hits: { hits: [{ _source: { thumbnail } }] } } } }
      : {}),
  });

  it("nests each child under its parent and reads the gender and age pairs", () => {
    const result = processCategoriesAggregation(
      [
        transBucket(1, { id: 11, category_id: 1, name: "Women", slug: "women" }),
        transBucket(2, { id: 12, category_id: 2, name: "Dresses", slug: "dresses" }, "dress.jpg"),
        transBucket(3, {}),
      ],
      [
        origHit({ id: 1, num_available_product: 7, gender: 2, group_age: 5 }),
        origHit({ id: 2, parent_id: 1, most_viewed_product_thumbnail: null }),
        origHit({}),
        {},
      ],
      1,
    );

    expect(
      result.categories.map((c: any) => c.name),
      "only the top-level categories belong in the list",
    ).toEqual(["Women", ""]);
    const women: any = result.categories[0];
    expect(women.childes.map((c: any) => c.slug), "the child was not nested under its parent").toEqual([
      "dresses",
    ]);
    expect(women.num_available_product, "the parent lost its product count").toBe(7);
    expect(
      women.childes[0].most_viewed_product_thumbnail,
      "a child with no thumbnail of its own did not use the product's thumbnail",
    ).toBe("dress.jpg");
    expect(
      result.categories[1],
      "a category with no details did not fall back to its key",
    ).toMatchObject({ id: 3, category_id: 3, num_available_product: 0, parent_id: null });
    expect(result.genderAgePairs, "the gender and age pair was not read").toEqual({
      "2_5": { gender: 2, group_age: 5 },
    });
  });
});

describe("the related category list (processRelatedCategories)", () => {
  const related = (buckets: any[], custom: any[]) => ({
    related_categories: { categories_with_gender_age: { buckets } },
    related_custom_categories: {
      filtered_categories: { categories_by_id: { buckets: custom } },
    },
  });
  const orig = (source: any) => ({
    category_details: { hits: { hits: [{ _source: source }] } },
  });
  const custom = (key: number, source: any, thumbnail?: string) => ({
    key,
    category_details: { hits: { hits: [{ _source: source }] } },
    ...(thumbnail
      ? { to_product: { product_thumbnail: { hits: { hits: [{ _source: { thumbnail } }] } } } }
      : {}),
  });

  it("answers nothing when the listing has no gender and age pair", () => {
    expect(
      processRelatedCategories(related([], []), {}, 1),
      "related categories were offered with nothing to relate them to",
    ).toEqual([]);
  });

  it("keeps only the categories for the same gender and age, and nests children", () => {
    const result: any[] = processRelatedCategories(
      related(
        [
          orig({ id: 5, gender: 2, group_age: 5, num_available_product: 4 }),
          orig({ id: 6, gender: 2, group_age: 5, parent_id: 5, most_viewed_product_thumbnail: "six.jpg" }),
          orig({ id: 7, gender: 1, group_age: 5 }),
          orig({ id: 8 }),
          orig({}),
          {},
        ],
        [
          custom(5, { id: 55, category_id: 5, name: "Shoes", slug: "shoes" }, "shoe.jpg"),
          custom(6, { id: 66, category_id: 6, name: "Heels", slug: "heels" }),
          custom(7, { name: "Men shoes" }),
          custom(8, { name: "No gender" }),
          custom(9, { name: "Unknown" }),
          { key: 10 },
        ],
      ),
      { "2_5": { gender: 2, group_age: 5 } },
      1,
    );

    expect(
      result.map((c) => c.slug),
      "the related list has a category for another gender or age, or lost one",
    ).toEqual(["shoes", "heels"]);
    expect(result[0].childes.map((c: any) => c.slug), "the child was not nested under its parent").toEqual([
      "heels",
    ]);
    expect(result[0].most_viewed_product_thumbnail, "the parent did not use the product's thumbnail").toBe(
      "shoe.jpg",
    );
    expect(result[1].most_viewed_product_thumbnail, "the child lost its own thumbnail").toBe("six.jpg");
  });

  it("falls back to the bucket key and empty text when the details are missing", () => {
    const result: any[] = processRelatedCategories(
      {
        related_categories: { categories_with_gender_age: { buckets: [orig({ id: 5, gender: 1, group_age: 1 })] } },
        related_custom_categories: {
          filtered_categories: { categories_by_id: { buckets: [{ key: 5 }] } },
        },
      },
      { "1_1": { gender: 1, group_age: 1 } },
      1,
    );
    expect(result[0], "a related category with no details did not fall back to its key").toMatchObject({
      id: 5,
      category_id: 5,
      name: "",
      most_viewed_product_thumbnail: null,
    });

    expect(
      processRelatedCategories({}, { "1_1": { gender: 1, group_age: 1 } }, 1),
      "an answer with no related aggregations broke the list",
    ).toEqual([]);
  });
});

describe("putting the chosen colour first — the less common products", () => {
  it("leaves a product with no colours or no pictures alone", () => {
    const bare = { name: "bare" } as any;
    const result: any = sortSyncColorImagesByFilteredColor([bare], { colors: ["#ff0000"] } as any);
    expect(result[0], "a product with no colours was changed").toBe(bare);

    const noColors = { name: "flat" } as any;
    sortColorsByFilteredColor([noColors], { colors: ["#ff0000"] } as any);
    expect(noColors.colors, "a product with no colours got a colour list").toBeUndefined();
  });

  it("keeps the chosen colour's pictures first wherever they started, and reads text", () => {
    const result: any = sortSyncColorImagesByFilteredColor(
      [
        {
          colors: [{ color: "#FF0000", name: "Red" }, { name: "No code" }],
          sync_color_images: JSON.stringify([
            { color_name: "Green" },
            { color_name: "Red" },
            { color_name: "Blue" },
          ]),
        } as any,
      ],
      { colors: ["#ff0000"] } as any,
    );
    expect(
      result[0].sync_color_images.map((s: any) => s.color_name),
      "the red pictures stored as text did not move to the front",
    ).toEqual(["Red", "Green", "Blue"]);
  });

  it("moves the chosen colour forward from any place and leaves the rest in order", () => {
    const products: any = [
      {
        colors: [
          { color: "#FF0000", name: "Red" },
          { name: "No code" },
          { color: "#0000FF", name: "Blue" },
          { color: "#ff0000", name: "Red again" },
        ],
      },
    ];
    sortColorsByFilteredColor(products, { colors: ["#FF0000"] } as any);
    expect(
      products[0].colors.map((c: any) => c.name),
      "the chosen colour did not come first with the others kept in order",
    ).toEqual(["Red", "Red again", "No code", "Blue"]);
  });
});

// ---------------------------------------------------------------------------
// The search log: what the listing writes after a search, and what the
// "popular searches" list reads back. Both talk to the search backend, which is
// replaced here (io.search) together with the request headers (io.headers).
// ---------------------------------------------------------------------------

describe("writing a search to the search log (logSearchTerm)", () => {
  const headerBag = (values: Record<string, string>) => ({
    get: (name: string) => values[name] ?? null,
  });

  beforeEach(() => {
    io.headers.mockReset();
    io.logServerError.mockReset();
  });

  it("does not log a search that is too short or found nothing", async () => {
    const client = { search: vi.fn(), index: vi.fn() };

    await logSearchTerm({ searchText: " ab ", userData: null, productsCount: 3, client });
    await logSearchTerm({ searchText: "dress", userData: null, productsCount: 0, client });

    expect(client.search, "a short or empty search was still looked up in the log").not.toHaveBeenCalled();
  });

  it("logs a new search with the shopper's address and browser from the request", async () => {
    io.headers.mockResolvedValue(
      headerBag({ "x-forwarded-for": "10.0.0.1, 10.0.0.2", "user-agent": "Browser/1" }),
    );
    const client = {
      search: vi.fn(async () => ({ hits: { hits: [] } })),
      index: vi.fn(async () => ({})),
    };

    await logSearchTerm({
      searchText: "  Red Dress ",
      userData: { id: 77 },
      productsCount: 4,
      client,
    });

    const lookup: any = (client.search.mock.calls[0] as any[])[0];
    expect(
      lookup.body.query.bool.should,
      "the duplicate check did not use the user, the first forwarded address and the browser",
    ).toEqual([
      { term: { user_id: 77 } },
      { term: { ip: "10.0.0.1" } },
      { term: { user_agent: "Browser/1" } },
    ]);
    const written: any = (client.index.mock.calls[0] as any[])[0];
    expect(written.body, "the new search log entry is wrong").toMatchObject({
      search_term: "red dress",
      user_id: 77,
      ip: "10.0.0.1",
      user_agent: "Browser/1",
      products_count: 4,
    });
    expect(
      written.body.timestamp,
      "the log time is not in the 'YYYY-MM-DD HH:MM:SS' shape the log expects",
    ).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it("does not log a search that is already in the log", async () => {
    io.headers.mockResolvedValue(headerBag({ "x-real-ip": "10.0.0.9" }));
    const client = {
      search: vi.fn(async () => ({ hits: { hits: [{ _id: "old" }] } })),
      index: vi.fn(),
    };

    await logSearchTerm({ searchText: "dress", userData: { userId: 5 }, productsCount: 2, client });

    expect(client.index, "a search already in the log was logged again").not.toHaveBeenCalled();
  });

  it("falls back to the stored address and browser when the request headers cannot be read", async () => {
    io.headers.mockRejectedValue(new Error("outside a request"));
    const client = {
      search: vi.fn(async () => ({ hits: { hits: [] } })),
      index: vi.fn(async () => ({})),
    };

    await logSearchTerm({
      searchText: "dress",
      userData: { ip: "10.1.1.1", userAgent: "App/2" },
      productsCount: 2,
      client,
    });

    expect(
      io.logServerError.mock.calls.map((c: any[]) => c[0]?.scenario),
      "the unreadable request headers were not reported",
    ).toContain("logSearchTerm could not read the request headers");
    expect((client.index.mock.calls[0] as any[])[0].body, "the stored address and browser were not used").toMatchObject({
      ip: "10.1.1.1",
      user_agent: "App/2",
    });
  });

  it("reads the address from the other proxy headers, and logs with no identity at all", async () => {
    io.headers.mockResolvedValue(headerBag({ "cf-connecting-ip": "10.2.2.2" }));
    const client = {
      search: vi.fn(async () => ({ hits: { hits: [] } })),
      index: vi.fn(async () => ({})),
    };
    await logSearchTerm({ searchText: "dress", userData: null, productsCount: 1, client });
    expect((client.index.mock.calls[0] as any[])[0].body.ip, "the proxy's address header was not read").toBe(
      "10.2.2.2",
    );

    io.headers.mockResolvedValue(headerBag({}));
    client.search.mockClear();
    await logSearchTerm({ searchText: "dress", userData: null, productsCount: 1, client });
    expect(
      (client.search.mock.calls[0] as any[])[0].body.query.bool.should,
      "a duplicate check with no identity still asked for identity matches",
    ).toBeUndefined();
  });

  it(
    "BUG-data-1: a search with only one identity (just the address) can still be found as a duplicate",
    async () => {
      io.headers.mockResolvedValue(headerBag({ "x-real-ip": "10.0.0.9" }));
      const client = {
        search: vi.fn(async () => ({ hits: { hits: [] } })),
        index: vi.fn(async () => ({})),
      };

      await logSearchTerm({ searchText: "dress", userData: null, productsCount: 2, client });

      const query: any = (client.search.mock.calls[0] as any[])[0].body.query.bool;
      expect(
        query.minimum_should_match,
        `the duplicate check needs ${query.minimum_should_match} identity matches but only ` +
          `${query.should.length} identity is known, so it can never match and every search is logged again`,
      ).toBeLessThanOrEqual(query.should.length);
    },
  );

  it("reports and passes on a failed log write", async () => {
    io.headers.mockResolvedValue(headerBag({}));
    const client = {
      search: vi.fn(async () => {
        throw new Error("search log down");
      }),
      index: vi.fn(),
    };

    await expect(
      logSearchTerm({ searchText: "dress", userData: null, productsCount: 1, client }),
      "a failed search log write was hidden from the caller",
    ).rejects.toThrow("search log down");
    expect(
      io.logServerError.mock.calls.map((c: any[]) => c[0]?.scenario),
      "the failed search log write was not reported",
    ).toContain("logSearchTerm failed");
  });
});

describe("the popular searches list (getPopularSearchTerms)", () => {
  beforeEach(() => {
    io.search.mockReset();
    io.logServerError.mockReset();
  });

  it("lists the terms most searched, trimmed, and skips a blank one", async () => {
    io.search.mockResolvedValue({
      aggregations: {
        top_search_terms: {
          buckets: [
            { key: " dress ", doc_count: 9 },
            { key: 404, doc_count: 5 },
            { key: "   ", doc_count: 4 },
          ],
        },
      },
    });

    const terms = await getPopularSearchTerms(3);

    expect(terms, "the popular terms are wrong").toEqual([
      { term: "dress", count: 9 },
      { term: "404", count: 5 },
    ]);
    expect(
      io.search.mock.calls[0][0].aggs.top_search_terms.terms.size,
      "the list did not ask for the number of terms it was given",
    ).toBe(3);
  });

  it("answers an empty list when the log has no terms", async () => {
    io.search.mockResolvedValue({});
    expect(await getPopularSearchTerms(), "an empty log did not give an empty list").toEqual([]);
  });

  it("answers an empty list, and reports it, when the search backend fails", async () => {
    io.search.mockRejectedValue(new Error("search backend down"));

    expect(await getPopularSearchTerms(), "a failed lookup did not give an empty list").toEqual([]);
    expect(
      io.logServerError.mock.calls.map((c: any[]) => c[0]?.scenario),
      "the failed lookup was not reported",
    ).toContain("getPopularSearchTerms failed");
  });
});
