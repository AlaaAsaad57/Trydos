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

import { describe, expect, it, vi } from "vitest";

// Neither is used by anything under test, but both are loaded when the file is
// loaded, and the search client opens a connection as soon as it is built.
vi.mock("next/headers", () => ({ headers: () => new Map() }));
vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: {},
  elasticSearchComment: {},
}));

import {
  buildBaseConditions,
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
