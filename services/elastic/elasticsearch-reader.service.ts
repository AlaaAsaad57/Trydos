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
}
