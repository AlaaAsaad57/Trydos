// @vitest-environment node
//
// The boutique reader, and the QA lock inside it (AC-3).
//
// This file exists because of one gap. The catalogue base query is written out
// **six times** in this repository, and `ElasticsearchReader` owns two of them.
// The clause that hides QA shops had to go into each copy separately, so each
// copy needs its own proof — a test of `helpers.ts` says nothing about this
// class.
//
// The boutique path is the one this file owns. It is the query behind the home
// page's shop row and the shops listing, and it is the one place a QA **shop**
// would appear as itself rather than through one of its products.
//
// **The filter here has a QA-mode switch**, like the product search. The QA
// boutique has to be visible to a request that proved it is in QA mode, and
// invisible to everybody else. It was unconditional at first, which hid the
// shop from the tests that own it as well as from shoppers — so both
// directions are checked below, and a one-sided check would pass for a filter
// that simply never ran.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const search = vi.fn();

vi.mock("services/elastic/elasticsearch.config", () => ({
  elasticSearchClient: {
    search: (...args: unknown[]) => search(...args),
    indices: { exists: vi.fn(), stats: vi.fn() },
    count: vi.fn(),
  },
  elasticSearchComment: {},
}));

// The reader reports its own failures. Stood in so a broken case fails as
// itself rather than as a network call to the error backend.
const LogServerError = vi.fn(async () => undefined);
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...args: unknown[]) => LogServerError(...(args as [])),
  default: (...args: unknown[]) => LogServerError(...(args as [])),
}));

import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";

/** An answer with one boutique bucket, so the flow completes rather than
 *  falling into its catch. A query check against a flow that threw would be
 *  reading a query the app never meant to send. */
const oneBoutique = {
  aggregations: {
    boutiques_composite: {
      after_key: null,
      buckets: [
        {
          key: { boutique_position: 1, boutique_id: 42 },
          doc_count: 3,
          boutique_data: {
            hits: {
              hits: [
                {
                  _source: {
                    boutique_id: 42,
                    custom_boutiques: [
                      {
                        id: 7,
                        boutique_id: 42,
                        language_code: "en",
                        name: "A real shop",
                        slug: "a-real-shop",
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      ],
    },
  },
  hits: { hits: [] },
};

/** Every QA clause anywhere inside a query. Walks the whole object, because the
 *  reader nests its query one level deeper than the other builders do. */
const qaClausesIn = (node: unknown): any[] => {
  const found: any[] = [];
  const walk = (value: any): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (
      value?.nested?.path === "custom_boutiques" &&
      value?.nested?.query?.prefix
    ) {
      found.push(value);
    }
    Object.values(value).forEach(walk);
  };
  walk(node);
  return found;
};

beforeEach(() => {
  vi.clearAllMocks();
  search.mockResolvedValue(oneBoutique);
});

describe("boutique rows hide the QA shop", () => {
  it("excludes QA shops from the boutique list", async () => {
    const reader = new ElasticsearchReader();

    const result = await reader.getBoutiques({ language: "en", limit: 10 });

    // A real shop came back, so an empty answer cannot make the query check
    // below pass for the wrong reason.
    expect(
      result?.boutiques?.length,
      "the boutique reader answered with no shops, so it fell into its catch and the query checked below is not the one the app sends",
    ).toBeGreaterThan(0);

    const sent = search.mock.calls[0]?.[0];
    const clauses = qaClausesIn(sent);

    expect(
      clauses.length,
      "the boutique query carried no clause excluding QA shops, so the shop the e2e suite creates would appear in the home page's shop row",
    ).toBeGreaterThan(0);

    expect(
      clauses[0].nested.query.prefix["custom_boutiques.slug.keyword"].value,
      "the boutique query excludes shops by a prefix that is not the QA mark, so it would hide the wrong shops or none",
    ).toBe("trydos-qa-");
  });

  it("puts the clause in must_not, not in must", async () => {
    // A clause in the wrong half inverts the whole rule: the boutique list
    // would show the QA shop and nothing else.
    const reader = new ElasticsearchReader();
    await reader.getBoutiques({ language: "en", limit: 10 });

    const sent: any = search.mock.calls[0]?.[0];
    const bool = sent?.body?.query?.bool ?? sent?.query?.bool;

    expect(
      qaClausesIn(bool?.must_not).length,
      "the QA clause is not in the query's must_not half",
    ).toBeGreaterThan(0);
    expect(
      qaClausesIn(bool?.must).length,
      "the QA clause landed in the query's must half, which shows ONLY QA shops to every customer",
    ).toBe(0);
  });

  it("shows QA shops to a request that proved it is in QA mode", async () => {
    const reader = new ElasticsearchReader();

    await reader.getBoutiques({ language: "en", limit: 10, qaView: true });

    const sent = search.mock.calls[0]?.[0];
    expect(
      qaClausesIn(sent).length,
      "QA mode was on and the boutique query still excluded QA shops, so the suite can never see the shop it created",
    ).toBe(0);
  });

  it("keeps the clause when the caller says nothing", async () => {
    // The default is the shopper-facing answer. Every caller that forgets the
    // switch must stay filtered, which is what makes forgetting it safe.
    const reader = new ElasticsearchReader();

    await reader.getBoutiques({ language: "en", limit: 10 });

    expect(
      qaClausesIn(search.mock.calls[0]?.[0]).length,
      "a boutique query with no qaView argument was unfiltered, so the default is the wrong way round",
    ).toBeGreaterThan(0);
  });

  it("excludes QA shops from a single boutique's own page data", async () => {
    // `getBoutiqueInfo` reads through the same builder. It is a second caller,
    // so it needs its own check: a shopper reaching a QA shop's page by address
    // is a different path from a shopper browsing to it.
    const reader = new ElasticsearchReader();

    await reader.getBoutiqueInfo({
      language: "en",
      country: "sy",
      slug: "a-real-shop",
    } as any);

    const sent = search.mock.calls[0]?.[0];
    expect(
      qaClausesIn(sent).length,
      "the single-boutique query carried no clause excluding QA shops",
    ).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// The rest of the reader: the category list, the full boutique row (shops, their
// categories, and the most-viewed products that fill a shop with too few
// categories), and a single boutique's page data.
//
// The reader sends several kinds of query. The router below answers each one by
// what it asks for, so a case only states the data.
// ---------------------------------------------------------------------------

type ReaderAnswers = {
  boutiques?: any;
  categories?: any;
  /** Views per boutique id: the product ids, the total, or an Error. */
  views?: Record<string, { ids: any[]; total?: any } | Error | ((from: number) => any)>;
  /** Catalogue products by id, for the "is it still for sale" check. */
  catalog?: Record<string, any>;
  /** Fallback products per boutique id. */
  fallback?: Record<string, any[]>;
};

function routeReader(answers: ReaderAnswers) {
  search.mockImplementation(async (params: any) => {
    const body = params.body ?? {};
    if (body.aggs?.boutiques_composite) return answers.boutiques ?? {};
    if (body.aggs?.filtered_results) return answers.categories ?? {};
    if (params.index === "product_views_develop") {
      const view = answers.views?.[String(body.query.term.boutique_id)];
      if (view instanceof Error) throw view;
      if (typeof view === "function") return view(body.from);
      return {
        hits: {
          hits: (view?.ids ?? []).map((id: any) => ({ _source: { product_id: id } })),
          total: view?.total,
        },
      };
    }
    if (body.sort?.[0]?.id) {
      const boutiqueId = body.query.bool.must.at(-1).term.boutique_id;
      return {
        hits: {
          hits: (answers.fallback?.[String(boutiqueId)] ?? []).map((p) => ({ _source: p })),
        },
      };
    }
    const idClause = body.query?.bool?.must?.find((c: any) => c?.terms?.id);
    if (idClause) {
      return {
        hits: {
          hits: [
            { _source: null },
            ...idClause.terms.id
              .filter((id: any) => answers.catalog?.[String(id)])
              .map((id: any) => ({ _source: answers.catalog![String(id)] })),
          ],
        },
      };
    }
    return { hits: { hits: [] } };
  });
}

/** One boutique bucket from the composite aggregation. */
const shopBucket = (source: any) => ({
  boutique_data: { hits: { hits: source ? [{ _source: source }] : [] } },
});

/** A catalogue product, as the fallback and the validation read it. */
const product = (id: number, customProducts?: any[], images: string | null = '["p.jpg"]') => ({
  id,
  custom_products: customProducts,
  images,
});

describe("the category list (getCategories)", () => {
  it("asks for 20 categories in Syria by default, and for the given size and country", async () => {
    const reader = new ElasticsearchReader();
    search.mockResolvedValue({ hits: { hits: [] } });

    await reader.getCategories({});
    await reader.getCategories({ country: "iq", size: 4000 });

    const [first, second] = search.mock.calls.map((call) => call[0]);
    expect(first.size, "the default category count is not 20").toBe(20);
    expect(JSON.stringify(first.query), "the default country is not Syria").toContain('"SY"');
    expect(second.size, "the asked-for category count was not used").toBe(4000);
    expect(JSON.stringify(second.query), "the asked-for country was not used").toContain('"IQ"');
  });

  it("reports and throws a failed category search", async () => {
    const reader = new ElasticsearchReader();
    search.mockRejectedValue(new Error("index down"));

    await expect(reader.getCategories({}), "a failed category search was hidden").rejects.toThrow(
      "Search failed: Error: index down",
    );
    search.mockRejectedValue("plain");
    await expect(reader.getCategories({}), "a thrown string was not passed on").rejects.toThrow(
      "Search failed: plain",
    );
    expect(
      LogServerError.mock.calls.map((call: any[]) => call[0]?.error),
      "the failed category searches were not reported",
    ).toEqual(["index down", "plain"]);
  });
});

describe("the boutique row (getBoutiques)", () => {
  afterEach(() => vi.unstubAllEnvs());

  const shopA = {
    boutique_id: 1,
    boutique_position: 0,
    custom_boutiques: [
      {
        id: 11,
        language_code: "en",
        name: "Shop A",
        slug: "shop-a",
        banners: [{ file_path: "a.jpg", deleted_at: null }, { file_path: "old.jpg", deleted_at: "2026-01-01" }],
      },
      { id: 12, language_code: "ar", name: "متجر", slug: "shop-a-ar" },
    ],
  };

  const categoriesAnswer = {
    aggregations: {
      filtered_results: {
        by_boutique: {
          buckets: [
            {
              key: 1,
              top_orig_categories: {
                orig_categories_by_id: {
                  buckets: [
                    {
                      orig_category_details: {
                        hits: {
                          hits: [
                            { _source: { id: 100, num_available_product: 12, most_viewed_product_thumbnail: "cat.jpg" } },
                          ],
                        },
                      },
                    },
                    { orig_category_details: { hits: { hits: [{ _source: { id: 101 } }] } } },
                    { orig_category_details: { hits: { hits: [] } } },
                  ],
                },
              },
              custom_categories_nested: {
                by_language: {
                  by_category_id: {
                    buckets: [
                      {
                        key: 100,
                        top_category_hit: {
                          hits: {
                            hits: [
                              {
                                _source: {
                                  custom_categories: {
                                    category_id: 100,
                                    id: 1000,
                                    slug: "women",
                                    name: "Women",
                                    language_code: "en",
                                    flat_photo_path: "w.png",
                                    position: 0,
                                  },
                                },
                              },
                            ],
                          },
                        },
                      },
                      {
                        key: 101,
                        top_category_hit: {
                          hits: { hits: [{ _source: { id: 1010, slug: "dresses", name: "Dresses", position: 1 } }] },
                        },
                        to_product: {
                          product_thumbnail: { hits: { hits: [{ _source: { images: '["d.jpg"]', name: "Red dress" } }] } },
                        },
                      },
                      {
                        key: 102,
                        top_category_hit: { hits: { hits: [] } },
                        to_product: { product_thumbnail: { hits: { hits: [{ _source: { images: "broken" } }] } } },
                      },
                      {
                        key: 103,
                        top_category_hit: { hits: { hits: [{ _source: { position: 2, flat_photo_path: "x.png" } }] } },
                        to_product: { product_thumbnail: { hits: { hits: [{ _source: { images: "[]" } }] } } },
                      },
                    ],
                  },
                },
              },
            },
            { key: 99 },
          ],
        },
      },
    },
  };

  it("builds each shop with its own-language wording, live banners and categories", async () => {
    const reader = new ElasticsearchReader();
    routeReader({
      boutiques: {
        aggregations: {
          boutiques_composite: {
            after_key: { boutique_position: 0, boutique_id: 1 },
            buckets: [shopBucket(shopA), shopBucket(null), shopBucket({ boutique_id: 2, custom_boutiques: [] })],
          },
        },
      },
      categories: categoriesAnswer,
    });

    const result: any = await reader.getBoutiques({
      language: "en",
      country: "iq",
      limit: 5,
      category: ["dresses"],
      searchAfter: [3, 9],
      sellerId: "s-1",
    });

    const sent = search.mock.calls[0][0];
    expect(
      sent.body.aggs.boutiques_composite.composite.after,
      "the next page did not continue from the given cursor",
    ).toEqual({ boutique_position: 3, boutique_id: 9 });
    expect(JSON.stringify(sent.body.query.bool.must), "the seller filter is missing").toContain(
      '"boutique.seller_id":"s-1"',
    );
    expect(JSON.stringify(sent.body.query.bool.must), "the category filter is missing").toContain(
      "custom_categories.slug.keyword",
    );
    expect(result.searchAfter, "the next cursor was not read from the after_key").toEqual([0, 1]);
    expect(result.boutiques.map((b: any) => b.slug), "a shop with no slug was kept").toEqual(["shop-a"]);

    const shop = result.boutiques[0];
    expect(shop.banners, "a deleted banner was kept").toEqual([{ file_path: "a.jpg", deleted_at: null }]);
    expect(shop.position, "the shop's position was lost").toBe(0);
    expect(shop.mainCategoriesForProductIds, "the main category is wrong").toEqual([
      {
        id: 100,
        slug: "women",
        name: "Women",
        language_code: "en",
        most_viewed_product_name: null,
        most_viewed_product_thumbnail: "cat.jpg",
        num_available_product: 12,
        flat_photo_path: "w.png",
      },
      {
        id: 102,
        slug: null,
        name: null,
        language_code: "en",
        most_viewed_product_name: null,
        most_viewed_product_thumbnail: null,
        num_available_product: 0,
        flat_photo_path: null,
      },
    ]);
  });

  it("falls back to the product's first image when the category has no thumbnail", async () => {
    const reader = new ElasticsearchReader();
    routeReader({
      boutiques: {
        aggregations: { boutiques_composite: { buckets: [shopBucket(shopA)] } },
      },
      categories: {
        aggregations: {
          filtered_results: {
            by_boutique: {
              buckets: [
                {
                  key: 1,
                  custom_categories_nested: {
                    by_language: {
                      by_category_id: {
                        buckets: [
                          {
                            key: 7,
                            top_category_hit: { hits: { hits: [{ _source: { slug: "shoes", name: "Shoes" } }] } },
                            to_product: {
                              product_thumbnail: { hits: { hits: [{ _source: { images: '["s.jpg"]', name: "Boot" } }] } },
                            },
                          },
                          {
                            key: 8,
                            top_category_hit: { hits: { hits: [{ _source: { slug: "bags" } }] } },
                            to_product: { product_thumbnail: { hits: { hits: [{ _source: { images: "broken" } }] } } },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    });

    const result: any = await reader.getBoutiques({ language: "en", limit: 5 });
    const [shoes, bags] = result.boutiques[0].mainCategoriesForProductIds;

    expect(shoes, "the category did not use the product's first image").toMatchObject({
      id: 7,
      most_viewed_product_thumbnail: "/product/s.jpg",
      most_viewed_product_name: "Boot",
      num_available_product: 0,
    });
    expect(bags.most_viewed_product_thumbnail, "an unreadable image list did not give no thumbnail").toBeNull();
    expect(result.searchAfter, "a missing after_key still gave a cursor").toBeNull();
  });

  it("fills a shop with too few categories with its most viewed products", async () => {
    vi.stubEnv("MIN_CATEGORIES_UNDER_BOUTIQUE", "5");
    const reader = new ElasticsearchReader();
    const shop = (id: number) => ({
      boutique_id: id,
      custom_boutiques: [{ id: id * 10, language_code: "ar", slug: `shop-${id}` }],
    });
    routeReader({
      boutiques: {
        aggregations: {
          boutiques_composite: { buckets: [1, 2, 3, 4].map((id) => shopBucket(shop(id))) },
        },
      },
      categories: {},
      views: {
        // Shop 1: eight products viewed, so the six most viewed fill it.
        "1": { ids: [1, 2, 3, 4, 5, 6, 7, 8, null], total: 8 },
        // Shop 2: two products on the first page, nothing on the second.
        "2": (from: number) =>
          from === 0
            ? { hits: { hits: [{ _source: { product_id: 21 } }, { _source: { product_id: 22 } }], total: { value: 40 } } }
            : { hits: { hits: [], total: { value: 40 } } },
        // Shop 3: the views index is down.
        "3": new Error("views down"),
        // Shop 4: a viewed product that is no longer for sale, and no total.
        "4": { ids: [49] },
      },
      catalog: {
        ...Object.fromEntries(
          [1, 2, 3, 4, 5, 6, 7, 8].map((id) => [String(id), product(id, [{ language_code: "en", slug: `p-${id}`, name: `P${id}` }])]),
        ),
        "21": product(21, [{ language_code: "ar", slug: "p-21-ar" }, { language_code: "en", slug: "p-21", name: "Twenty-one" }]),
        "22": product(22, [{ language_code: "tr", slug: "p-22-tr", name: "Yirmi" }], null),
      },
      fallback: {
        "2": [23, 24, 25, 26, 27].map((id) => product(id, [{ language_code: "en", slug: `p-${id}` }])),
        "3": [
          product(31, [{ language_code: "ar", slug: "p-31-ar", name: "Ar" }], null),
          { id: 32, slug: "p-32", name: "Bare" },
          product(33, []),
        ],
      },
    });

    const result: any = await reader.getBoutiques({ language: "ar", limit: 10 });
    const filled = Object.fromEntries(
      result.boutiques.map((b: any) => [b.slug, b.mainCategoriesForProductIds.map((p: any) => p.slug)]),
    );

    expect(filled["shop-1"], "shop 1 was not filled with its six most viewed products").toEqual([
      "p-1", "p-2", "p-3", "p-4", "p-5", "p-6",
    ]);
    expect(filled["shop-2"], "shop 2 was not topped up from its catalogue after its views ran out").toEqual([
      "p-21-ar", "p-22-tr", "p-23", "p-24", "p-25", "p-26",
    ]);
    expect(filled["shop-3"], "shop 3 was not filled from its catalogue while the views index was down").toEqual([
      "p-31-ar", "p-32", null,
    ]);
    expect(filled["shop-4"], "shop 4 got products although it has none for sale").toEqual([]);
    expect(
      result.boutiques[0].mainCategoriesForProductIds[0],
      "a filled product card is wrong",
    ).toMatchObject({ id: 1, is_product: true, most_views: true, most_viewed_product_thumbnail: "/product/p.jpg" });

    const fallbackForShop2 = search.mock.calls
      .map((call) => call[0])
      .find((p: any) => p.body?.sort?.[0]?.id && p.body.query.bool.must.at(-1).term.boutique_id === 2);
    expect(
      JSON.stringify(fallbackForShop2.body.query.bool.must_not),
      "the catalogue top-up could repeat a product the views already gave",
    ).toContain('{"terms":{"id":[21,22]}}');
  });

  it(
    "BUG-data-2: without MIN_CATEGORIES_UNDER_BOUTIQUE set, a shop with no categories is still filled with products",
    async () => {
      const reader = new ElasticsearchReader();
      routeReader({
        boutiques: {
          aggregations: {
            boutiques_composite: {
              buckets: [shopBucket({ boutique_id: 1, custom_boutiques: [{ id: 10, language_code: "en", slug: "shop-1" }] })],
            },
          },
        },
        categories: {},
        views: { "1": { ids: [1], total: 1 } },
        catalog: { "1": product(1, [{ language_code: "en", slug: "p-1" }]) },
      });

      const result: any = await reader.getBoutiques({ language: "en", limit: 10 });

      expect(
        result.boutiques[0].mainCategoriesForProductIds.map((p: any) => p.slug),
        "with the setting unset, the default of 5 never applied (parseInt gives NaN, and `NaN ?? 5` is NaN), " +
          "so a shop with 0 categories was left empty instead of being filled with its products",
      ).toEqual(["p-1"]);
    },
  );

  it("reports and passes on a failed boutique search", async () => {
    const reader = new ElasticsearchReader();
    search.mockRejectedValue(new Error("down"));
    await expect(reader.getBoutiques({ language: "en", limit: 1 }), "a failed boutique search was hidden").rejects.toThrow(
      "down",
    );
    search.mockRejectedValue("plain");
    await expect(reader.getBoutiques({ language: "en", limit: 1 }), "a thrown string was hidden").rejects.toBe("plain");
    expect(
      LogServerError.mock.calls.map((call: any[]) => call[0]?.error),
      "the failed boutique searches were not reported",
    ).toEqual(["down", "plain"]);
  });
});

describe("one boutique's page data (getBoutiqueInfo)", () => {
  const info = (source: any) => ({ hits: { hits: source === undefined ? [] : [{ _source: source }] } });
  const ask = () =>
    new ElasticsearchReader().getBoutiqueInfo({ language: "en", slug: "shop-a", country: "sy" });

  it("answers the shop's name, icon and live banners in the asked language", async () => {
    search.mockResolvedValue(
      info({
        custom_boutiques: [
          { language_code: "ar", slug: "shop-a", name: "متجر" },
          {
            language_code: "en",
            slug: "shop-a",
            name: "Shop A",
            icon: "i.png",
            banners: [{ file_path: "a.jpg", deleted_at: null }, { file_path: "b.jpg", deleted_at: "2026-01-01" }],
          },
        ],
      }),
    );

    expect(await ask(), "the boutique page data is wrong").toEqual({
      name: "Shop A",
      icon: "i.png",
      banners: [{ file_path: "a.jpg", deleted_at: null }],
    });
  });

  it("answers empty fields when the shop has no name, icon or banners", async () => {
    search.mockResolvedValue(info({ custom_boutiques: [{ language_code: "en", slug: "shop-a" }] }));

    expect(await ask(), "missing boutique fields did not fall back").toEqual({ name: null, icon: null, banners: [] });
  });

  it("answers nothing when the shop is not found in that language", async () => {
    search.mockResolvedValue(info(undefined));
    expect(await ask(), "a missing shop gave page data").toBeNull();

    search.mockResolvedValue(info({ custom_boutiques: [{ language_code: "ar", slug: "shop-a" }] }));
    expect(await ask(), "a shop in another language gave page data").toBeNull();

    search.mockResolvedValue(info({}));
    expect(await ask(), "a shop with no wording gave page data").toBeNull();
  });

  it("answers nothing, and reports it, when the search fails", async () => {
    search.mockRejectedValue(new Error("down"));
    expect(await ask(), "a failed search gave page data").toBeNull();
    search.mockRejectedValue("plain");
    expect(await ask(), "a failed search gave page data").toBeNull();
    expect(
      LogServerError.mock.calls.map((call: any[]) => call[0]?.error),
      "the failed boutique page searches were not reported",
    ).toEqual(["down", "plain"]);
  });
});
