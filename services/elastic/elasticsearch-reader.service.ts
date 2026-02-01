import { LogServerError } from "utils/serverErrorReporter";
import { elasticSearchClient } from "./elasticsearch.config";

import { estypes } from "@elastic/elasticsearch";

export class ElasticsearchReader {
  private client = elasticSearchClient;

  async getCategories<T>(ReqQuery: any) {
    let country = ReqQuery.country || "sy";
    try {
      const { mustConditions, mustNotConditions } = this.getRules(country);
      const query: estypes.SearchRequest = {
        index: DEFAULT_INDEX,
        _source: [
          "id",
          "custom_categories.id",
          "custom_categories.category_id",
          "custom_categories.name",
          "custom_categories.slug",
          "custom_categories.position",
          "custom_categories.language_code",
          "custom_categories.flat_photo_path",
          "custom_categories.outline_photo_path",
          "custom_categories.fill_photo_path",
        ],
        query: {
          bool: {
            must: mustConditions,
            must_not: mustNotConditions,
          },
        },
      };
      const searchParams = {
        index: DEFAULT_INDEX,
        size: ReqQuery.size ?? 20,
        ...query,
      };
      const result = await this.client.search<T>(searchParams);

      return result;
    } catch (error) {
      LogServerError({
        scenario: "getCategories in elasticsearch-reader",
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Search failed: ${error}`);
    }
  }

  getRules(country) {
    const mustConditions: estypes.QueryDslQueryContainer[] = [
      { term: { status: 1 } },
      {
        nested: {
          path: "boutique",
          query: { term: { "boutique.status": 1 } },
        },
      },
      {
        nested: {
          path: "brand",
          query: { term: { "brand.status": 1 } },
        },
      },
      {
        bool: {
          should: [
            { term: { added_by: "admin" } },
            {
              bool: {
                must: [
                  { term: { added_by: "seller" } },
                  { term: { seller_status: "approved" } },
                ],
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
      {
        nested: {
          path: "custom_boutiques.banners",
          ignore_unmapped: true,
          query: {
            exists: { field: "custom_boutiques.banners.file_path" },
          },
        },
      },
    ];
    const upperCountry = country.toUpperCase();
    const mustNotConditions: estypes.QueryDslQueryContainer[] = [
      { exists: { field: "deleted_at" } },
      {
        nested: {
          path: "categories",
          query: {
            bool: {
              must: [
                {
                  term: {
                    "categories.status": 0,
                  },
                },
              ],
            },
          },
        },
      },
      {
        nested: {
          path: "countries_iso",
          ignore_unmapped: true,
          query: {
            bool: {
              must: [
                {
                  term: {
                    "categories.status": 0, // 👈 use plain 0, not `{ value: 0 }`
                  },
                },
              ],
            },
          },
        },
      },
      {
        nested: {
          path: "categories",
          ignore_unmapped: true,
          query: {
            nested: {
              path: "categories.countries_iso",
              query: {
                term: { "categories.countries_iso.iso": upperCountry },
              },
            },
          },
        },
      },
      {
        nested: {
          path: "brand",
          ignore_unmapped: true,
          query: {
            nested: {
              path: "brand.countries_iso",
              query: { term: { "brand.countries_iso.iso": upperCountry } },
            },
          },
        },
      },
      {
        nested: {
          path: "boutique",
          ignore_unmapped: true,
          query: {
            nested: {
              path: "boutique.countries_iso",
              query: {
                term: { "boutique.countries_iso.iso": upperCountry },
              },
            },
          },
        },
      },
    ];
    return { mustConditions, mustNotConditions };
  }
  async getBoutiques({
    country = "sy",
    language = "en",
    offset,
    limit,
    category,
    searchAfter,
    sellerId,
  }: {
    country?: string;
    language: string;
    offset?: number;
    limit: number;
    category?: string[];
    searchAfter?: any[];
    sellerId?: string;
  }) {
    try {
      const input: InputInitialized = {
        categorySlugs: category,
        limit,
      };

      let { must, must_not } = this.buildBaseConditions(input, country);
      const customProducts: any[] = [];

      const customQuery = {
        index: DEFAULT_INDEX,
        body: {
          size: 0,
          query: {
            bool: {
              must,
              must_not,
            },
          },
          aggs: {
            boutiques_composite: {
              composite: {
                size: limit,
                sources: [
                  {
                    boutique_position: {
                      terms: {
                        field: "boutique_position",
                        order: "desc",
                      },
                    },
                  },
                  {
                    boutique_id: {
                      terms: {
                        field: "boutique_id",
                        order: "asc",
                      },
                    },
                  },
                ],
              },
              aggs: {
                boutique_data: {
                  top_hits: {
                    size: 1,
                    _source: {
                      includes: [
                        "id",
                        "boutique_id",
                        "boutique_position",
                        "custom_boutiques.id",
                        "custom_boutiques.name",
                        "custom_boutiques.slug",
                        "custom_boutiques.icon",
                        "custom_boutiques.description",
                        "custom_boutiques.banners",
                        "custom_boutiques.language_code",
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      };

      if (Array.isArray(searchAfter) && searchAfter.length === 2) {
        // @ts-ignore
        customQuery.body.aggs.boutiques_composite.composite.after = {
          boutique_position: searchAfter[0],
          boutique_id: searchAfter[1],
        };
      }
      if (sellerId) {
        customQuery.body.query.bool.must = [
          ...customQuery.body.query.bool.must,
          {
            nested: {
              path: "boutique",
              query: { term: { "boutique.seller_id": sellerId } },
            },
          },
        ];
      }

      const response = await this.client.search(customQuery);

      const bucketsBoutiques =
        // @ts-ignore
        response.aggregations?.boutiques_composite?.buckets ?? [];

      for (const bucket of bucketsBoutiques) {
        const source = bucket.boutique_data?.hits?.hits?.[0]?._source ?? null;
        if (source) customProducts.push(source);
      }
      const afterKey =
        // @ts-ignore
        response.aggregations?.boutiques_composite?.after_key ?? null;
      let newSearchAfter = null;
      if (afterKey?.boutique_position >= 0 && afterKey?.boutique_id) {
        newSearchAfter = [afterKey.boutique_position, afterKey.boutique_id];
      }

      // Filter boutiques by language
      for (const boutique of customProducts) {
        if (Array.isArray(boutique.custom_boutiques)) {
          boutique.custom_boutiques = boutique.custom_boutiques.filter(
            (cb) => cb.language_code === language,
          );
        }
      }

      // Build categories query
      const boutiqueIds = [
        ...new Set(customProducts.map((b) => b.boutique_id)),
      ];

      const categoriesQuery: any = {
        index: DEFAULT_INDEX,
        body: {
          size: 0,
          query: {
            bool: {
              must: [...must, { terms: { boutique_id: boutiqueIds } }],
              must_not,
            },
          },
          aggs: {
            filtered_results: {
              filter: {
                bool: {
                  must,
                  must_not,
                },
              },
              aggs: {
                by_boutique: {
                  terms: {
                    field: "boutique_id",
                    size: boutiqueIds.length || 10000,
                    include: boutiqueIds,
                  },
                  aggs: {
                    custom_categories_nested: {
                      nested: { path: "custom_categories" },
                      aggs: {
                        by_language: {
                          filter: {
                            term: {
                              "custom_categories.language_code": language,
                            },
                          },
                          aggs: {
                            by_category_id: {
                              terms: {
                                field: "custom_categories.category_id",
                                size: 10000,
                              },
                              aggs: {
                                top_category_hit: {
                                  top_hits: {
                                    size: 1,
                                    _source: {
                                      includes: [
                                        "custom_categories.category_id",
                                        "custom_categories.id",
                                        "custom_categories.slug",
                                        "custom_categories.name",
                                        "custom_categories.position",
                                        "custom_categories.language_code",
                                        "custom_categories.flat_photo_path",
                                      ],
                                    },
                                  },
                                },
                                to_product: {
                                  reverse_nested: {},
                                  aggs: {
                                    product_thumbnail: {
                                      top_hits: {
                                        size: 1,
                                        _source: [
                                          "boutique_id",
                                          "thumbnail",
                                          "name",
                                        ],
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    top_orig_categories: {
                      nested: { path: "categories" },
                      aggs: {
                        orig_categories_by_id: {
                          terms: {
                            field: "categories.id",
                            size: 10000,
                          },
                          aggs: {
                            orig_category_details: {
                              top_hits: {
                                size: 1,
                                _source: [
                                  "categories.id",
                                  "categories.num_available_product",
                                  "categories.most_viewed_product_thumbnail",
                                ],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const catResponse = await this.client.search(categoriesQuery);
      const filteredAgg = catResponse.aggregations?.filtered_results ?? {};
      // @ts-ignore
      const boutiqueBuckets = filteredAgg.by_boutique?.buckets ?? [];

      const categories: any[] = [];

      for (const boutiqueBucket of boutiqueBuckets) {
        const bid = boutiqueBucket.key;

        // === PHP origMap equivalent ===
        const origBuckets =
          boutiqueBucket.top_orig_categories?.orig_categories_by_id?.buckets ??
          [];

        const origMap: Record<string, any> = {};

        for (const b of origBuckets) {
          const src = b.orig_category_details?.hits?.hits?.[0]?._source ?? {};

          const cat = src;
          if (!cat?.id) continue;

          origMap[cat.id] = {
            num_available_product: cat.num_available_product ?? 0,
            most_viewed_product_thumbnail:
              cat.most_viewed_product_thumbnail ?? null,
          };
        }

        const catBuckets =
          boutiqueBucket.custom_categories_nested?.by_language?.by_category_id
            ?.buckets ?? [];

        for (const bucket of catBuckets) {
          const hitData =
            bucket.top_category_hit?.hits?.hits?.[0]?._source ?? {};
          const thumbHit =
            bucket.to_product?.product_thumbnail?.hits?.hits?.[0]?._source ??
            {};
          const catId = bucket.key;

          const orig = origMap[catId] ?? {
            num_available_product: 0,
            most_viewed_product_thumbnail: null,
          };

          categories.push({
            category_id:
              hitData.custom_categories?.category_id ||
              hitData.category_id ||
              catId,
            id: hitData.custom_categories?.id || hitData.id || null,
            slug: hitData.custom_categories?.slug || hitData.slug || null,
            name: hitData.custom_categories?.name || hitData.name || null,
            language_code:
              hitData.custom_categories?.language_code ||
              hitData.language_code ||
              language,
            flat_photo_path:
              hitData.custom_categories?.flat_photo_path ||
              hitData.flat_photo_path ||
              null,
            num_available_product: orig.num_available_product,
            position:
              hitData.custom_categories?.position || hitData.position || 0,
            boutique_id: bid,
            most_viewed_product_thumbnail:
              origMap[catId] &&
              origMap[catId].most_viewed_product_thumbnail !== null
                ? origMap[catId].most_viewed_product_thumbnail
                : (thumbHit.thumbnail ?? null),

            most_viewed_product_name: thumbHit.name ?? null,
          });
        }
      }

      // === Grouping (same as PHP) ===
      const grouped: Record<string, { main: any[]; child: any[] }> = {};

      for (const cat of categories) {
        const bid = cat.boutique_id;
        if (!grouped[bid]) grouped[bid] = { main: [], child: [] };

        const item: any = {
          id: cat.category_id,
          slug: cat.slug,
          name: cat.name,
          language_code: cat.language_code,
          most_viewed_product_name: cat.most_viewed_product_name,
          most_viewed_product_thumbnail: cat.most_viewed_product_thumbnail,
          num_available_product: cat.num_available_product,
        };

        if (cat.position === 0) {
          item.flat_photo_path = cat.flat_photo_path;
          grouped[bid].main.push(item);
        } else if (cat.position === 1) {
          grouped[bid].child.push(item);
        }
      }

      // === Merge into boutiques (same as PHP) ===
      for (const boutique of customProducts) {
        const bid = boutique.boutique_id;
        boutique.mainCategoriesForProductIds = grouped[bid]?.main || [];
        boutique.childCategoriesForProductIds = grouped[bid]?.child || [];
      }

      // === Filter banners (same as PHP) ===
      for (const boutique of customProducts) {
        for (const cb of boutique.custom_boutiques) {
          if (cb.banners) {
            cb.banners = cb.banners.filter(
              (banner: any) => banner.deleted_at === null,
            );
          }
        }
      }

      // === Final mapping (same as PHP) ===
      let final = customProducts.map((boutique) => {
        const cb = boutique.custom_boutiques[0] || {};
        return {
          boutique_id: boutique.boutique_id,
          id: cb.id,
          name: cb.name ?? null,
          slug: cb.slug ?? null,
          description: cb.description ?? null,
          icon: cb.icon ?? null,
          banners: cb.banners ?? null,
          mainCategoriesForProductIds:
            boutique.mainCategoriesForProductIds ?? [],
          childCategoriesForProductIds: [],
        };
      });

      final = final.filter((b) => b?.slug !== undefined && b?.slug !== null);

      return { boutiques: final, searchAfter: newSearchAfter };
    } catch (error) {
      LogServerError({
        scenario: "getBoutiques in elasticsearch-reader",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // -----------------------------------------------------------------------------
  // buildBaseConditions (matches PHP version)
  // -----------------------------------------------------------------------------

  buildBaseConditions(input: InputInitialized, country?: string) {
    const categorySlugs = input.categorySlugs || [];

    const must: any[] = [
      { term: { status: 1 } },
      {
        nested: {
          path: "boutique",
          query: { term: { "boutique.status": 1 } },
        },
      },
      {
        nested: {
          path: "brand",
          query: { term: { "brand.status": 1 } },
        },
      },
    ];
    must.push({
      nested: {
        path: "custom_products",
        ignore_unmapped: true,
        query: {
          exists: { field: "custom_products.id" },
        },
      },
    });
    if (categorySlugs.length > 0) {
      must.push({
        bool: {
          must: [
            {
              nested: {
                path: "categories",
                query: { term: { "categories.status": 1 } },
              },
            },
            {
              nested: {
                path: "custom_categories",
                query: {
                  term: { "custom_categories.slug.keyword": categorySlugs },
                },
              },
            },
          ],
        },
      });
    }

    must.push({
      bool: {
        should: [
          { term: { added_by: "admin" } },
          {
            bool: {
              must: [
                { term: { added_by: "seller" } },
                { term: { seller_status: "approved" } },
              ],
            },
          },
        ],
        minimum_should_match: 1,
      },
    });

    must.push({
      nested: {
        path: "custom_boutiques.banners",
        ignore_unmapped: true,
        query: {
          exists: { field: "custom_boutiques.banners.file_path" },
        },
      },
    });

    const must_not: any[] = [{ exists: { field: "deleted_at" } }];

    if (country) {
      const iso = country.toUpperCase();
      must_not.push(
        {
          nested: {
            path: "countries_iso",
            ignore_unmapped: true,
            query: { term: { "countries_iso.iso": iso } },
          },
        },
        {
          nested: {
            path: "categories",
            ignore_unmapped: true,
            query: {
              nested: {
                path: "categories.countries_iso",
                query: { term: { "categories.countries_iso.iso": iso } },
              },
            },
          },
        },
        {
          nested: {
            path: "brand",
            ignore_unmapped: true,
            query: {
              nested: {
                path: "brand.countries_iso",
                query: { term: { "brand.countries_iso.iso": iso } },
              },
            },
          },
        },
        {
          nested: {
            path: "boutique",
            ignore_unmapped: true,
            query: {
              nested: {
                path: "boutique.countries_iso",
                query: { term: { "boutique.countries_iso.iso": iso } },
              },
            },
          },
        },
      );
    }

    must_not.push({
      nested: {
        path: "categories",
        query: {
          bool: { must: [{ term: { "categories.status": 0 } }] },
        },
      },
    });

    return { must, must_not };
  }

  async getBoutiqueInfo({
    slug,
    country,
    language,
  }: {
    slug: string;
    country?: string;
    language: string;
  }) {
    try {
      const input: InputInitialized = {
        categorySlugs: undefined,
        limit: 1,
      };

      const { must, must_not } = this.buildBaseConditions(input, country);

      // Add filter for specific boutique slug and language
      must.push({
        nested: {
          path: "custom_boutiques",
          query: {
            bool: {
              must: [
                { term: { "custom_boutiques.slug.keyword": slug } },
                { term: { "custom_boutiques.language_code": language } },
              ],
            },
          },
        },
      });

      const query = {
        index: DEFAULT_INDEX,
        body: {
          size: 1,
          _source: [
            "custom_boutiques.name",
            "custom_boutiques.slug",
            "custom_boutiques.icon",
            "custom_boutiques.banners",
            "custom_boutiques.language_code",
          ],
          query: {
            bool: {
              must,
              must_not,
            },
          },
          sort: [{ boutique_id: { order: "asc" } }],
        },
      };

      const response = await this.client.search(query);
      const hits = response?.hits?.hits;

      if (!hits?.length) return null;

      const boutique = hits[0]._source as { custom_boutiques: any[] };

      // Get the correct language version
      const matched = (boutique.custom_boutiques || []).find(
        (cb: any) => cb.language_code === language && cb.slug === slug,
      );

      if (!matched) return null;

      // Filter out deleted banners
      const filteredBanners =
        matched.banners?.filter((b: any) => b.deleted_at === null) || [];

      return {
        name: matched.name || null,
        icon: matched.icon || null,
        banners: filteredBanners,
      };
    } catch (error) {
      LogServerError({
        scenario: "getBoutiqueInfo in elasticsearch-reader",
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}
export const DEFAULT_INDEX = "products_catalog_develop";
type InputInitialized = {
  categorySlugs?: string | string[];
  limit: number;
};
