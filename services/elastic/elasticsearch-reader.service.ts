import { elasticSearchClient } from "./elasticsearch.config";
import { SearchResponse } from "@elastic/elasticsearch/lib/api/types";
import { estypes } from "@elastic/elasticsearch";
export class ElasticsearchReader {
  private client = elasticSearchClient;
  private readonly index = "products_catalog";

  async getCategories<T>(ReqQuery: any): Promise<SearchResponse<T>> {
    let country = ReqQuery.country;
    try {
      const { mustConditions, mustNotConditions } = this.getRules(country);
      const query: estypes.SearchRequest = {
        index: "products_catalog",
        _source: [
          "id",
          "custom_categories.id",
          "custom_categories.category_id",
          "custom_categories.name",
          "custom_categories.slug",
          "custom_categories.position",
          "custom_categories.language_code",
          "custom_categories.flat_photo_path",
        ],
        query: {
          bool: {
            must: mustConditions,
            must_not: mustNotConditions,
          },
        },
      };
      const searchParams = {
        index: this.index,
        size: ReqQuery.size ?? 20,
        ...query,
      };
      const result = await this.client.search<T>(searchParams);
      return result;
    } catch (error) {
      console.error("Elastic::::::", error);
      throw new Error(`Search failed: ${error}`);
    }
  }
  // async getBoutiques<T>(ReqQuery: any): Promise<SearchResponse<T>> {
  //   let country = ReqQuery.country;
  //   try {
  //     const { mustConditions, mustNotConditions } = this.getRules(country);
  //     const query: estypes.SearchRequest = {
  //       index: "products_catalog",
  //       _source: ["id", "custom_boutiques"],
  //       query: {
  //         bool: {
  //           must: { ...mustConditions },
  //           must_not: mustNotConditions,
  //         },
  //       },
  //     };
  //     const searchParams = {
  //       index: this.index,
  //       size: ReqQuery.size ?? 20,
  //       ...query,
  //     };
  //     const result = await this.client.search<T>(searchParams);
  //     return result;
  //   } catch (error) {
  //     console.error("Elastic::::::", error);
  //     throw new Error(`Search failed: ${error}`);
  //   }
  // }
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
    country,
    language,
    offset,
    limit,
    category,
    searchAfter,
  }: {
    country?: string;
    language: string;
    offset?: number;
    limit: number;
    category?: string;
    searchAfter?: any[];
  }) {
    try {
      const input: InputInitialized = {
        categorySlugs: category,
        limit,
      };

      const { must, must_not } = this.buildBaseConditions(input, country);
      const customProducts: any[] = [];

      const customQuery: any = {
        index: "products_catalog",
        body: {
          track_scores: true,
          size: limit,
          collapse: {
            field: "boutique_id",
            inner_hits: {
              name: "by_position",
              size: 1,
              sort: [
                {
                  "boutique.position": {
                    order: "desc",
                    nested: { path: "boutique" },
                  },
                },
              ],
            },
          },
          _source: [
            "id",
            "boutique_id",
            "boutique.position",
            "custom_boutiques.id",
            "custom_boutiques.name",
            "custom_boutiques.slug",
            "custom_boutiques.icon",
            "custom_boutiques.description",
            "custom_boutiques.banners",
            "custom_boutiques.language_code",
          ],
          query: { bool: { must, must_not } },
          sort: [
            {
              "boutique.position": {
                order: "desc",
                nested: { path: "boutique" },
              },
            },
            { boutique_id: { order: "asc" } },
          ],
        },
      };

      while (true) {
        if (searchAfter?.length) {
          customQuery.body.search_after = searchAfter;
        }

        const response = await this.client.search(customQuery);
        const hits = (response.hits.hits as any[]) || [];
        if (!hits.length) break;

        for (const hit of hits) {
          const source = hit._source;
          if (
            hit.inner_hits?.by_position?.hits?.hits?.[0]?._source?.boutique
              ?.position
          ) {
            source.boutique_position =
              hit.inner_hits.by_position.hits.hits[0]._source.boutique.position;
          }
          customProducts.push(source);
        }

        searchAfter = hits[hits.length - 1].sort;
        if (customProducts.length >= limit) break;
      }

      // Sort by position desc, then boutique_id asc
      customProducts.sort((a, b) => {
        const posA = a.boutique_position ?? Number.MIN_SAFE_INTEGER;
        const posB = b.boutique_position ?? Number.MIN_SAFE_INTEGER;
        if (posA !== posB) return posB - posA;
        return a.boutique_id - b.boutique_id;
      });

      // Filter custom_boutiques by language
      for (const boutique of customProducts) {
        boutique.custom_boutiques = (boutique.custom_boutiques || []).filter(
          (cb: any) => cb.language_code === language
        );
      }

      // build categories query
      const boutiqueIds = [
        ...new Set(customProducts.map((b) => b.boutique_id)),
      ];
      const categoriesQuery: any = {
        index: "products_catalog",
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
                  must: [...must, { terms: { boutique_id: boutiqueIds } }],
                  must_not,
                },
              },
              aggs: {
                custom_categories_nested: {
                  nested: { path: "custom_categories" },
                  aggs: {
                    by_language: {
                      filter: {
                        term: { "custom_categories.language_code": language },
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
                                _source: [
                                  "custom_categories.category_id",
                                  "custom_categories.id",
                                  "custom_categories.slug",
                                  "custom_categories.name",
                                  "custom_categories.position",
                                  "custom_categories.language_code",
                                  "custom_categories.flat_photo_path",
                                ],
                                size: 1,
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
                      terms: { field: "categories.id", size: 10000 },
                      aggs: {
                        orig_category_details: {
                          top_hits: {
                            size: 1,
                            _source: [
                              "categories.id",
                              "categories.num_available_product",
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
      };

      const catResponse = await this.client.search(categoriesQuery);

      const agg = catResponse.aggregations as any;
      const origBuckets =
        agg?.filtered_results?.top_orig_categories?.orig_categories_by_id
          ?.buckets || [];

      const origMap: Record<string, any> = {};
      for (const b of origBuckets) {
        const hit =
          b.orig_category_details.hits.hits[0]?._source?.categories || {};
        if (hit.id) {
          origMap[hit.id] = {
            num_available_product: hit.num_available_product || 0,
          };
        }
      }

      const buckets =
        agg?.filtered_results?.custom_categories_nested?.by_language
          ?.by_category_id?.buckets || [];

      const categories: any[] = [];
      for (const bucket of buckets) {
        const hitData = bucket.top_category_hit.hits.hits[0]?._source;
        const catId = bucket.key;
        const orig = origMap[catId] || { num_available_product: 0 };

        const thumbHit =
          bucket.to_product.product_thumbnail.hits.hits[0]?._source || {};
        categories.push({
          category_id: hitData.category_id,
          id: hitData.id,
          slug: hitData.slug,
          name: hitData.name,
          language_code: hitData.language_code,
          flat_photo_path: hitData.flat_photo_path,
          num_available_product: orig.num_available_product,
          position: hitData.position,
          boutique_id: thumbHit.boutique_id || null,
          most_viewed_product_thumbnail: thumbHit.thumbnail || null,
          most_viewed_product_name: thumbHit.name || null,
        });
      }

      // group categories by boutique
      const grouped: Record<string, { main: any[]; child: any[] }> = {};
      for (const cat of categories) {
        const bid = cat.boutique_id;
        if (!grouped[bid]) grouped[bid] = { main: [], child: [] };

        const item = {
          id: cat.category_id,
          slug: cat.slug,
          name: cat.name,
          language_code: cat.language_code,
          most_viewed_product_name: cat.most_viewed_product_name,
          most_viewed_product_thumbnail: cat.most_viewed_product_thumbnail,
          num_available_product: cat.num_available_product,
        };

        if (cat.position === 0) {
          item["flat_photo_path"] = cat.flat_photo_path;
          grouped[bid].main.push(item);
        } else if (cat.position === 1) {
          grouped[bid].child.push(item);
        }
      }

      // merge categories into boutiques
      for (const boutique of customProducts) {
        const bid = boutique.boutique_id;
        boutique.mainCategoriesForProductIds = grouped[bid]?.main || [];
        boutique.childCategoriesForProductIds = grouped[bid]?.child || [];
      }

      // filter banners
      for (const boutique of customProducts) {
        for (const cb of boutique.custom_boutiques) {
          if (cb.banners) {
            cb.banners = cb.banners.filter(
              (banner: any) => banner.deleted_at === null
            );
          }
        }
      }

      // final result
      let final = customProducts.map((boutique) => {
        const cb = boutique.custom_boutiques[0] || {};
        return {
          boutique_id: boutique.boutique_id,
          id: cb.id,
          name: cb.name || null,
          slug: cb.slug || null,
          description: cb.description || null,
          icon: cb.icon || null,
          banners: cb.banners || null,
          mainCategoriesForProductIds: boutique.mainCategoriesForProductIds,
          childCategoriesForProductIds: boutique.childCategoriesForProductIds,
        };
      });
      final = final.filter((b) => b?.slug !== undefined || b?.slug !== null);
      return { boutiques: final, searchAfter };
    } catch (error) {
      console.error("GET BOUTIQUE ERROR FROM ELASTIC:", error);
    }
  }
  buildBaseConditions(input: InputInitialized, country?: string) {
    const categorySlugs = input.categorySlugs;

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
    if (categorySlugs?.length > 0) {
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
                  terms: { "custom_categories.slug.keyword": [categorySlugs] },
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
        }
      );
    }

    must_not.push({
      nested: {
        path: "categories",
        query: { bool: { must: [{ term: { "categories.status": 0 } }] } },
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
        index: "products_catalog",
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
        (cb: any) => cb.language_code === language && cb.slug === slug
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
      console.log("Elastic Get Boutique Data:", error);
      return null;
    }
  }
}

type InputInitialized = {
  categorySlugs?: string;
  limit: number;
};
