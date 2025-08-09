"use server";

import {
  SearchRequest,
  SearchResponse,
  QueryDslQueryContainer,
  AggregationsAggregationContainer,
} from "@elastic/elasticsearch/lib/api/types";
import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import AnalyzeSearchText from "./analyzeSearchText";

// Types and Interfaces
interface SearchFilters {
  categories?: string[];
  brands?: string[];
  boutiques?: string[];
  colors?: string[];
  sizes?: string[];
  search_text?: string;
  priceRange?: number[];
  tags_names?: string[];
  featured?: boolean;
  flashdeal?: boolean;
}

interface SearchParams {
  limit?: number;
  search_after?: any[];
  filters?: SearchFilters;
  language_code?: string;
  country?: string;
  is_from_browser?: boolean;
  filters_offset?: number;
  noProducts?: boolean;
  noFilters?: boolean;
}

interface FilterResult {
  id: string | number;
  name?: string;
  slug?: string;
  icon?: string;
  banner?: any;
  doc_count?: number;
}

interface CategoryFilter extends FilterResult {
  category_id?: string | number;
  bio?: string;
  description?: string;
  flat_photo_path?: string;
  png_photo_path?: string;
  fill_photo_path?: string;
  banner_photo_path?: string;
  num_available_product?: number;
  parent_id?: string | number | null;
  most_viewed_product_thumbnail?: string;
  childes: CategoryFilter[];
}

interface SearchResult {
  offset: any[];
  time: number;
  limit: number;
  total_size: number;
  products: CustomProduct[];
  brands: FilterResult[];
  boutiques: FilterResult[];
  categories: CategoryFilter[];
  attributes: Array<{
    id: number;
    name: string;
    options: string[];
  }>;
  colors: string[];
  prices: {
    min_price: number;
    max_price: number;
    priceRanges?: any[];
  };
}

interface ElasticsearchHit {
  _source: any;
  sort: any[];
}
interface SearchFilters {
  categories?: string[];
  brands?: string[];
  boutiques?: string[];
  colors?: string[];
  sizes?: string[];
  search_text?: string;
  priceRange?: number[];
  prices?: number[];
  tags_names?: string[];
  featured?: boolean;
  flashdeal?: boolean;
}

interface FilterResult {
  id: string | number;
  name?: string;
  slug?: string;
  icon?: string;
  banner?: any;
  doc_count?: number;
}

interface CategoryFilter extends FilterResult {
  category_id?: string | number;
  bio?: string;
  description?: string;
  flat_photo_path?: string;
  png_photo_path?: string;
  fill_photo_path?: string;
  banner_photo_path?: string;
  num_available_product?: number;
  parent_id?: string | number | null;
  most_viewed_product_thumbnail?: string;
  childes: CategoryFilter[];
}

interface CustomProduct {
  id: string;
  product_id?: string;
  name?: string;
  slug?: string;
  status?: number;
  details?: string;
  language_code?: string;
  label_names?: string[];
  videos?: any[];
  thumbnail?: string;
  images?: any[];
  colors?: any[];
  sync_color_images?: any[];
  price?: number;
  offer_price?: number;
  boutique_id?: string;
  in_stock?: boolean;
  [key: string]: any;
}

interface ExtractFiltersResult {
  custom_products: CustomProduct[];
  prices: {
    min_price: number;
    max_price: number;
  };
}
// Initialize Elasticsearch client
interface ColorItem {
  name: string;
  color?: string;
  [key: string]: any;
}

interface SyncColorImage {
  color_name: string;
  [key: string]: any;
}

interface ProductImage {
  id?: string | number;
  path?: string;
  url?: string;
  alt?: string;
  title?: string;
  [key: string]: any;
}

interface ExtractFiltersResult {
  custom_products: CustomProduct[];
  prices: {
    min_price: number;
    max_price: number;
  };
}
let client = elasticSearchClient;
/**
 * Main function to search products and get filters from Elasticsearch
 */
export async function getProductsAndFiltersFromElastic(
  params: SearchParams
): Promise<SearchResult> {
  let start = process.hrtime.bigint();
  let {
    limit = 10,
    search_after = [],
    filters = {},
    language_code = "en",
    country = "",
    is_from_browser = false,
    filters_offset = 1,
  } = params;
  if (filters?.prices) {
    filters = { ...filters, priceRange: filters.prices };
  }

  if (filters.search_text && filters.search_text?.split(" ")?.length > 2) {
    let CleanSearchText = await AnalyzeSearchText(filters.search_text);
    if (CleanSearchText?.name) {
      filters = { ...filters, search_text: CleanSearchText?.name };
    }
    if (CleanSearchText?.color) {
      filters = {
        ...filters,
        colors: [
          ...new Set([...(filters.colors || []), ...CleanSearchText.color]),
        ],
      };
    }
    if (CleanSearchText?.size) {
      filters = {
        ...filters,
        sizes: [...new Set([...(filters.sizes || []), CleanSearchText.size])],
      };
    }
  }

  try {
    const filtersSize = filters_offset * 10;
    const baseConditions = buildBaseConditions(filters, country);
    const { must: mustConditions, must_not: mustNotConditions } =
      baseConditions;

    // Build the main search query
    const searchQuery: SearchRequest = {
      index: "products_catalog",
      _source: getSourceFields(),
      track_scores: true,
      size: limit,
      query: {
        bool: {
          must: mustConditions,
          must_not: mustNotConditions,
        },
      },
      sort: [{ _score: { order: "desc" } }, { id: { order: "asc" } }],
      aggs: buildAggregations(
        mustConditions,
        mustNotConditions,
        language_code,
        filtersSize
      ),
    };
    // Add search_after for pagination
    if (search_after.length > 0) {
      searchQuery.search_after = search_after;
    }

    // Execute search with pagination
    const customProducts: any[] = [];
    let lastSortValue: any[] = search_after;
    let response: SearchResponse;

    response = await client.search(searchQuery);
    const hits = response.hits.hits as ElasticsearchHit[];
    hits.forEach((hit: ElasticsearchHit) => {
      customProducts.push(hit._source);
    });
    lastSortValue = hits.length > 0 ? hits[hits.length - 1].sort : [];
    // Process aggregations
    const aggregations = response.aggregations?.filtered_results || {};

    // Process filters
    const brandsFilter = processBrandsAggregation(
      (aggregations as any).top_brands?.filtered_brands?.brands_by_id
        ?.buckets || [],
      filters_offset
    );
    const boutiquesFilter = processBoutiquesAggregation(
      (aggregations as any).top_boutiques?.filtered_boutiques?.boutiques_by_id
        ?.buckets || [],
      filters_offset
    );

    const categoriesFilter = processCategoriesAggregation(
      (aggregations as any).top_categories?.filtered_categories
        ?.categories_by_id?.buckets || [],
      (aggregations as any).top_orig_categories?.orig_categories_by_id
        ?.buckets || [],
      filters_offset
    );

    const colorsFilter = processColorsAggregation(
      (aggregations as any).top_colors?.colors_by_color?.buckets || [],
      filters_offset
    );

    const sizesFilter = processSizesAggregation(
      (aggregations as any).top_sizes?.available_size_as_json_by_size
        ?.buckets || [],
      filters_offset
    );

    // Process products
    const productsWithFilters = extractFilters(
      customProducts,
      language_code,
      is_from_browser
    );

    // Sort products by filtered colors if color filter is applied
    if (filters.colors?.length) {
      productsWithFilters.custom_products = sortSyncColorImagesByFilteredColor(
        productsWithFilters.custom_products,
        filters
      );

      sortColorsByFilteredColor(productsWithFilters.custom_products, filters);
    }

    // Normalize products
    const normalizedProducts = normalizeCustomProducts(productsWithFilters);
    let end = process.hrtime.bigint();

    return {
      offset: lastSortValue,
      time: Number(end - start) / 1_000_000,
      limit: limit,
      total_size: customProducts.length,
      products: params.noProducts
        ? []
        : normalizedProducts.custom_products?.map((s) => ({
            ...s,
            is_redeem: s.has_redeem_discount,
          })),
      brands: brandsFilter,
      boutiques: boutiquesFilter,
      categories: categoriesFilter,
      attributes:
        sizesFilter.length > 0
          ? [
              {
                id: 1,
                name: "Size",
                options: sizesFilter,
              },
            ]
          : [],
      colors: colorsFilter,
      prices: productsWithFilters.prices,
    };
  } catch (error) {
    console.error("Elasticsearch search error:", error);
    throw new Error(
      `Search failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Build base conditions for the search query
 */
function buildBaseConditions(filters: SearchFilters, country: string) {
  const fuzziness = calculateFuzziness(filters.search_text);
  const searchWords = filters.search_text
    ? filters.search_text
        .trim()
        .split(/\s+/)
        .filter((w) => w !== "")
    : [];
  const wordCount = searchWords.length;

  const mustConditions: QueryDslQueryContainer[] = [
    { term: { status: 1 } },
    { nested: { path: "boutique", query: { term: { "boutique.status": 1 } } } },
    { nested: { path: "brand", query: { term: { "brand.status": 1 } } } },
  ];

  // Add category filter
  if (filters.categories?.length) {
    mustConditions.push({
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
                terms: { "custom_categories.slug.keyword": filters.categories },
              },
            },
          },
        ],
      },
    });
  }

  // Add brand filter
  if (filters.brands?.length) {
    mustConditions.push({
      bool: {
        must: [
          { nested: { path: "brand", query: { term: { "brand.status": 1 } } } },
          {
            nested: {
              path: "custom_brands",
              query: {
                terms: { "custom_brands.slug.keyword": filters.brands },
              },
            },
          },
        ],
      },
    });
  }

  // Add boutique filter
  if (filters.boutiques?.length) {
    mustConditions.push({
      nested: {
        path: "custom_boutiques",
        query: {
          terms: { "custom_boutiques.slug.keyword": filters.boutiques },
        },
      },
    });
  }

  // Add color filter
  if (filters.colors?.length) {
    mustConditions.push({
      bool: {
        should: filters.colors.map((color) => ({
          match_phrase: { text_colors: color },
        })),
      },
    });
  }

  // Add size filter
  if (filters.sizes?.length) {
    mustConditions.push({
      bool: {
        should: filters.sizes.map((size) => ({
          match_phrase: { available_size: size },
        })),
      },
    });
  }

  // Add price range filter
  if (filters.priceRange) {
    mustConditions.push({
      range: {
        offered_price: {
          gte: filters.priceRange[0],
          lte: filters.priceRange[1],
        },
      },
    });
  }

  // Add search text conditions
  if (filters.search_text) {
    mustConditions.push(
      buildSearchTextConditions(
        filters.search_text,
        searchWords,
        wordCount,
        fuzziness
      )
    );
  }

  // Add seller conditions
  mustConditions.push({
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

  // Add tags filter
  if (filters.tags_names?.length) {
    mustConditions.push({
      terms: { tags_names: filters.tags_names },
    });
  }

  // Add flash deal filter
  if (filters.flashdeal === true) {
    const currentDate = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    mustConditions.push({
      bool: {
        must: [
          { term: { flash_deal_status: 1 } },
          { exists: { field: "start_date" } },
          { exists: { field: "end_date" } },
          { range: { start_date: { lte: currentDate } } },
          { range: { end_date: { gte: currentDate } } },
        ],
      },
    });
  }

  const mustNotConditions: QueryDslQueryContainer[] = [
    { exists: { field: "deleted_at" } },
  ];

  // Add country restrictions
  if (country) {
    const upperCountry = country.toUpperCase();

    mustNotConditions.push(
      {
        nested: {
          path: "countries_iso",
          ignore_unmapped: true,
          query: { term: { "countries_iso.iso": upperCountry } },
        },
      },
      {
        nested: {
          path: "categories",
          ignore_unmapped: true,
          query: {
            nested: {
              path: "categories.countries_iso",
              query: { term: { "categories.countries_iso.iso": upperCountry } },
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
              query: { term: { "boutique.countries_iso.iso": upperCountry } },
            },
          },
        },
      }
    );
  }

  // Add category status restriction
  mustNotConditions.push({
    nested: {
      path: "categories",
      query: {
        bool: {
          must: [{ term: { "categories.status": 0 } }],
        },
      },
    },
  });

  return {
    must: mustConditions,
    must_not: mustNotConditions,
  };
}

/**
 * Build search text conditions
 */
function buildSearchTextConditions(
  searchText: string,
  searchWords: string[],
  wordCount: number,
  fuzziness: string | number | null
): QueryDslQueryContainer {
  const shouldClauses: QueryDslQueryContainer[] = [];

  // Nested product search
  shouldClauses.push({
    nested: {
      path: "custom_products",
      query: {
        bool: {
          should: [
            // Exact phrase matches
            {
              multi_match: {
                query: searchText,
                fields: [
                  "custom_products.name.exact^4",
                  "custom_products.slug.english^3",
                  "custom_products.descriptors_names.english^2",
                  "custom_products.label_names.english^2.5",
                  "custom_products.label_names.exact^2",
                  "custom_products.similar_words.english^2",
                  "custom_products.similar_words.exact^2",
                ],
                type: "phrase",
                analyzer: "english_edge_ngram_analyzer",
                slop: 0,
                boost: 10,
              },
            },
            {
              multi_match: {
                query: searchText,
                fields: [
                  "custom_products.name.exact^4",
                  "custom_products.slug.english^3",
                  "custom_products.descriptors_names.english^2",
                  "custom_products.label_names.english^2.5",
                  "custom_products.similar_words.english^2",
                  "custom_products.label_names.exact^2",
                  "custom_products.similar_words.exact^2",
                ],
                type: "phrase",
                analyzer: "standard",
                slop: 0,
                boost: 10,
              },
            },
            {
              multi_match: {
                query: searchText,
                fields: [
                  "custom_products.name.arabic^4",
                  "custom_products.slug.arabic^3",
                  "custom_products.descriptors_names.arabic^2",
                  "custom_products.label_names.arabic^2.5",
                  "custom_products.label_names.exact^2",
                  "custom_products.similar_words.english^2",
                  "custom_products.similar_words.exact^2",
                ],
                type: "phrase",
                analyzer: "arabic",
                slop: 0,
                boost: 10,
              },
            },
            // Fuzzy matches
            {
              multi_match: {
                query: searchText,
                fields: [
                  "custom_products.details^1",
                  "custom_products.name.english^2",
                  "custom_products.slug.english^1",
                  "custom_products.descriptors_names.english",
                  "custom_products.label_names.english^1.5",
                  "custom_products.similar_words.english^2",
                ],
                analyzer: "standard",
                ...(fuzziness && { fuzziness }),
                type: "best_fields",
                boost: 5,
              },
            },
            {
              multi_match: {
                query: searchText,
                fields: [
                  "custom_products.details.arabic^1",
                  "custom_products.name.arabic^2",
                  "custom_products.slug.arabic^1",
                  "custom_products.descriptors_names.arabic",
                  "custom_products.label_names.arabic^1.5",
                  "custom_products.similar_words.arabic^2",
                ],
                analyzer: "arabic",
                ...(fuzziness && { fuzziness }),
                type: "best_fields",
                boost: 5,
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    },
  });

  // Nested categories search
  shouldClauses.push({
    nested: {
      path: "custom_categories",
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query: searchText,
                fields: ["custom_categories.name.english^1"],
                analyzer: "standard",
                ...(fuzziness && { fuzziness }),
                type: "best_fields",
                boost: 5,
              },
            },
            {
              multi_match: {
                query: searchText,
                fields: ["custom_categories.name.arabic^1"],
                analyzer: "arabic",
                ...(fuzziness && { fuzziness }),
                type: "best_fields",
                boost: 5,
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    },
  });

  // Nested brands search
  shouldClauses.push({
    nested: {
      path: "custom_brands",
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query: searchText,
                fields: ["custom_brands.name.english^1"],
                analyzer: "standard",
                ...(fuzziness && { fuzziness }),
                type: "best_fields",
                boost: 2,
              },
            },
            {
              multi_match: {
                query: searchText,
                fields: ["custom_brands.name.arabic^1"],
                analyzer: "arabic",
                ...(fuzziness && { fuzziness }),
                type: "best_fields",
                boost: 2,
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    },
  });

  // Colors search
  shouldClauses.push({
    multi_match: {
      query: searchText,
      fields: [
        "similar_words_colors^3",
        "similar_words_colors.arabic^2",
        "similar_words_colors.english^2",
      ],
      type: "best_fields",
      boost: 2,
    },
  });

  // Multi-word search logic
  if (wordCount > 1 && wordCount < 3) {
    shouldClauses.push(buildMultiWordSearch(searchWords, fuzziness));
  }

  if (wordCount > 2) {
    const atLeastTwoClause = buildAtLeastTwoClause(searchWords, fuzziness);
    if (atLeastTwoClause) {
      shouldClauses.push(atLeastTwoClause);
    }
  }

  return {
    bool: {
      should: shouldClauses,
      minimum_should_match: 1,
    },
  };
}

// Helper Functions (These need to be implemented separately)

function calculateFuzziness(searchText?: string): string | number | null {
  if (!searchText) return null;
  const length = searchText.length;
  return length >= 7 && length <= 12 ? 1 : null;
}

function getSourceFields(): string[] {
  return [
    "id",
    "status",
    "seller_status",
    "added_by",
    "countries_iso",
    "images",
    "videos",
    "thumbnail",
    "flash_deal_status",
    "flash_deal_discount",
    "offered_price",
    "unit_price",
    "colors",
    "text_colors",
    "sync_color_images",
    "discount",
    "discount_type",
    "redeem_discount_rate",
    "current_stock",
    "boutique_id",
    "available_size",
    "category_ids",
    "end_date",
    "start_date",
    "boutique.status",
    "brand.status",
    "brand.is_verified",
    "categories.num_available_product",
    "categories.status",
    "categories.position",
    "categories.id",
    "categories.parent_id",
    "custom_brands.id",
    "custom_brands.name",
    "custom_brands.slug",
    "custom_brands.icon",
    "custom_brands.language_code",
    "custom_boutiques.id",
    "custom_boutiques.name",
    "custom_boutiques.slug",
    "custom_boutiques.banners",
    "custom_boutiques.language_code",
    "custom_categories.id",
    "custom_categories.category_id",
    "custom_categories.name",
    "custom_categories.slug",
    "custom_categories.description",
    "custom_categories.bio",
    "custom_categories.language_code",
    "custom_categories.flat_photo_path",
    "custom_categories.outline_photo_path",
    "custom_categories.png_photo_path",
    "custom_categories.fill_photo_path",
    "custom_categories.banner_photo_path",
    "custom_products.id",
    "custom_products.product_id",
    "custom_products.name",
    "custom_products.slug",
    "custom_products.status",
    "custom_products.details",
    "custom_products.language_code",
    "custom_products.label_names",
  ];
}

function buildAggregations(
  mustConditions: QueryDslQueryContainer[],
  mustNotConditions: QueryDslQueryContainer[],
  languageCode: string,
  filtersSize: number
): Record<string, AggregationsAggregationContainer> {
  const filterCondition = {
    bool: {
      must: mustConditions,
      must_not: mustNotConditions,
    },
  };

  return {
    filtered_results: {
      filter: filterCondition,
      aggs: {
        top_brands: {
          nested: { path: "custom_brands" },
          aggs: {
            filtered_brands: {
              filter: { term: { "custom_brands.language_code": languageCode } },
              aggs: {
                brands_by_id: {
                  terms: { field: "custom_brands.id", size: filtersSize },
                  aggs: {
                    brand_details: {
                      top_hits: {
                        _source: {
                          includes: [
                            "custom_brands.name",
                            "custom_brands.slug",
                            "custom_brands.icon",
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
        top_boutiques: {
          nested: { path: "custom_boutiques" },
          aggs: {
            filtered_boutiques: {
              filter: {
                term: { "custom_boutiques.language_code": languageCode },
              },
              aggs: {
                boutiques_by_id: {
                  terms: { field: "custom_boutiques.id", size: filtersSize },
                  aggs: {
                    boutique_details: {
                      top_hits: {
                        _source: {
                          includes: [
                            "custom_boutiques.name",
                            "custom_boutiques.slug",
                            "custom_boutiques.banners",
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
        top_categories: {
          nested: { path: "custom_categories" },
          aggs: {
            filtered_categories: {
              filter: {
                term: { "custom_categories.language_code": languageCode },
              },
              aggs: {
                categories_by_id: {
                  terms: {
                    field: "custom_categories.category_id",
                    size: filtersSize,
                  },
                  aggs: {
                    category_details: {
                      top_hits: {
                        size: 1,
                        _source: {
                          includes: [
                            "custom_categories.id",
                            "custom_categories.category_id",
                            "custom_categories.name",
                            "custom_categories.slug",
                            "custom_categories.bio",
                            "custom_categories.description",
                            "custom_categories.flat_photo_path",
                            "custom_categories.png_photo_path",
                            "custom_categories.fill_photo_path",
                            "custom_categories.banner_photo_path",
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
                            _source: { includes: ["thumbnail"] },
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
              terms: { field: "categories.id", size: filtersSize },
              aggs: {
                orig_category_details: {
                  top_hits: {
                    size: 1,
                    _source: {
                      includes: [
                        "categories.id",
                        "categories.num_available_product",
                        "categories.parent_id",
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        top_colors: {
          nested: { path: "colors" },
          aggs: {
            colors_by_color: {
              terms: { field: "colors.color.keyword", size: filtersSize },
            },
          },
        },
        top_sizes: {
          nested: { path: "available_size_as_json" },
          aggs: {
            available_size_as_json_by_size: {
              terms: {
                field: "available_size_as_json.size.keyword",
                size: filtersSize,
              },
            },
          },
        },
      },
    },
  };
}

// (These would be separate functions due to length constraints)

// export {
//   buildMultiWordSearch,
//   buildAtLeastTwoClause,
//   processBrandsAggregation,
//   processBoutiquesAggregation,
//   processCategoriesAggregation,
//   processColorsAggregation,
//   processSizesAggregation,
//   extractFilters,
//   sortSyncColorImagesByFilteredColor,
//   sortColorsByFilteredColor,
//   normalizeCustomProducts,
//   paginateFilters,
//   calculateDiscountedPrice,
//   getProductImagesWithDetails,
//   getSyncColorImagesProductWithDetails,
//   processCustomProduct,
//   extractCategoryHierarchy,
//   getCustomCategoryFromHighestPositionCategory,
//   getAllCustomCategories,
//   filterColorSyncObj,
//   removeCategoryExtraFields,
//   parseJsonField
// };

// Interfaces for the helper functions

/**
 * Build multi-word search conditions
 */
function buildMultiWordSearch(
  searchWords: string[],
  fuzziness: string | number | null
): QueryDslQueryContainer {
  const mustClauses: QueryDslQueryContainer[] = [];

  searchWords.forEach((word) => {
    if (!word || word.trim() === "") return;

    const trimmedWord = word.trim();
    const wordShould: QueryDslQueryContainer[] = [];

    // Search in nested custom_products
    wordShould.push({
      nested: {
        path: "custom_products",
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: trimmedWord,
                  fields: [
                    "custom_products.details^1",
                    "custom_products.name.english^2",
                    "custom_products.label_names.english^2",
                    "custom_products.label_names.exact^1.5",
                    "custom_products.similar_words.english^2",
                  ],
                  analyzer: "standard",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 5,
                },
              },
              {
                multi_match: {
                  query: trimmedWord,
                  fields: [
                    "custom_products.details.arabic^1",
                    "custom_products.name.arabic^2",
                    "custom_products.label_names.arabic^2",
                    "custom_products.label_names.exact^1.5",
                    "custom_products.similar_words.english^2",
                  ],
                  analyzer: "arabic",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 5,
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
    });

    // Search in nested custom_categories
    wordShould.push({
      nested: {
        path: "custom_categories",
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_categories.name.english^1"],
                  analyzer: "standard",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 2,
                },
              },
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_categories.name.arabic^1"],
                  analyzer: "arabic",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 2,
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
    });

    // Search in nested custom_brands
    wordShould.push({
      nested: {
        path: "custom_brands",
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_brands.name.english^1"],
                  analyzer: "standard",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 4,
                },
              },
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_brands.name.arabic^1"],
                  analyzer: "arabic",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 4,
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
    });

    mustClauses.push({
      bool: {
        should: wordShould,
        minimum_should_match: 1,
      },
    });
  });

  return {
    bool: {
      must: mustClauses,
    },
  };
}

/**
 * Build at least two words clause
 */
function buildAtLeastTwoClause(
  searchWords: string[],
  fuzziness: string | number | null,
  boost: number = 1
): QueryDslQueryContainer | null {
  if (searchWords.length < 2) {
    return null;
  }

  const shouldClausesForEachWord: QueryDslQueryContainer[] = [];

  searchWords.forEach((word) => {
    if (!word || word.trim() === "") return;

    const trimmedWord = word.trim();
    const subShould: QueryDslQueryContainer[] = [];

    // Search in nested custom_products
    subShould.push({
      nested: {
        path: "custom_products",
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: trimmedWord,
                  fields: [
                    "custom_products.details^1",
                    "custom_products.name.english^2",
                    "custom_products.similar_words.english^2",
                  ],
                  analyzer: "standard",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 5,
                },
              },
              {
                multi_match: {
                  query: trimmedWord,
                  fields: [
                    "custom_products.details.arabic^1",
                    "custom_products.name.arabic^2",
                    "custom_products.similar_words.arabic^2",
                  ],
                  analyzer: "arabic",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 5,
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
    });

    // Search in nested custom_categories
    subShould.push({
      nested: {
        path: "custom_categories",
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_categories.name.english^1"],
                  analyzer: "standard",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 2,
                },
              },
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_categories.name.arabic^1"],
                  analyzer: "arabic",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 2,
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
    });

    // Search in nested custom_brands
    subShould.push({
      nested: {
        path: "custom_brands",
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_brands.name.english^1"],
                  analyzer: "standard",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 2,
                },
              },
              {
                multi_match: {
                  query: trimmedWord,
                  fields: ["custom_brands.name.arabic^1"],
                  analyzer: "arabic",
                  ...(fuzziness && { fuzziness }),
                  type: "best_fields",
                  boost: 2,
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
    });

    shouldClausesForEachWord.push({
      bool: {
        should: subShould,
        minimum_should_match: 1,
      },
    });
  });

  if (shouldClausesForEachWord.length === 0) {
    return null;
  }

  const minimumMatch = searchWords.length < 4 ? 2 : 3;
  const finalBoost = searchWords.length >= 4 ? boost * 2 : boost;

  return {
    bool: {
      should: shouldClausesForEachWord,
      minimum_should_match: minimumMatch,
      boost: finalBoost,
    },
  };
}

/**
 * Process brands aggregation
 */
function processBrandsAggregation(
  buckets: any[],
  filtersOffset: number
): FilterResult[] {
  const brandsFilter: FilterResult[] = [];

  buckets.forEach((bucket) => {
    const brandHit = bucket.brand_details?.hits?.hits?.[0]?._source;

    if (brandHit) {
      brandsFilter.push({
        id: bucket.key,
        name: brandHit.name || "",
        slug: brandHit.slug || "",
        icon: brandHit.icon || "",
      });
    } else {
      brandsFilter.push({
        id: bucket.key,
        doc_count: bucket.doc_count,
      });
    }
  });

  return paginateFilters(brandsFilter, filtersOffset);
}

/**
 * Process boutiques aggregation
 */
function processBoutiquesAggregation(
  buckets: any[],
  filtersOffset: number
): FilterResult[] {
  const boutiquesFilter: FilterResult[] = [];

  buckets.forEach((bucket) => {
    const hit = bucket.boutique_details?.hits?.hits?.[0]?._source;

    if (hit) {
      // Filter first non-deleted banner
      let banner = null;
      if (hit.banners && Array.isArray(hit.banners)) {
        for (const b of hit.banners) {
          if (!b.deleted_at) {
            banner = { ...b };
            delete banner.deleted_at;
            break;
          }
        }
      }

      boutiquesFilter.push({
        id: bucket.key,
        name: hit.name || "",
        slug: hit.slug || "",
        banner: banner,
      });
    } else {
      boutiquesFilter.push({
        id: bucket.key,
        doc_count: bucket.doc_count,
      });
    }
  });

  return paginateFilters(boutiquesFilter, filtersOffset);
}

/**
 * Process categories aggregation
 */
function processCategoriesAggregation(
  transBuckets: any[],
  origBuckets: any[],
  filtersOffset: number
): CategoryFilter[] {
  // Create original categories map
  const origMap: Record<string | number, any> = {};
  origBuckets.forEach((bucket) => {
    const hit = bucket.orig_category_details?.hits?.hits?.[0]?._source || {};
    if (hit.id) {
      origMap[hit.id] = {
        num_available_product: hit.num_available_product || 0,
        parent_id: hit.parent_id || null,
      };
    }
  });

  const categoriesFilter: CategoryFilter[] = [];

  transBuckets.forEach((bucket) => {
    const src = bucket.category_details?.hits?.hits?.[0]?._source || {};
    const thumbHit =
      bucket.to_product?.product_thumbnail?.hits?.hits?.[0]?._source || {};
    const thumbnail = thumbHit.thumbnail || null;

    const catId = bucket.key;
    const orig = origMap[catId] || {
      num_available_product: 0,
      parent_id: null,
    };

    categoriesFilter.push({
      id: src.id || catId,
      category_id: src.category_id || catId,
      name: src.name || "",
      slug: src.slug || "",
      bio: src.bio || "",
      description: src.description || "",
      flat_photo_path: src.flat_photo_path || "",
      png_photo_path: src.png_photo_path || "",
      fill_photo_path: src.fill_photo_path || "",
      banner_photo_path: src.banner_photo_path || "",
      num_available_product: orig.num_available_product,
      parent_id: orig.parent_id,
      most_viewed_product_thumbnail: thumbnail,
      childes: [],
    });
  });

  // Index categories by category_id
  const indexed: Record<string | number, CategoryFilter> = {};
  categoriesFilter.forEach((cat) => {
    indexed[cat.category_id!] = cat;
  });

  // Link children to parents
  Object.values(indexed).forEach((cat) => {
    if (cat.parent_id && indexed[cat.parent_id]) {
      indexed[cat.parent_id].childes.push(cat);
    }
  });

  // Collect tree: only roots (parent_id = 0 or null)
  const categoriesTree = Object.values(indexed).filter(
    (cat) => !cat.parent_id || cat.parent_id === 0
  );

  return paginateFilters(categoriesTree, filtersOffset);
}

/**
 * Process colors aggregation
 */
function processColorsAggregation(
  buckets: any[],
  filtersOffset: number
): string[] {
  const colorsFilter = buckets.map((bucket) => bucket.key);
  return paginateFilters(colorsFilter, filtersOffset);
}

/**
 * Process sizes aggregation
 */
function processSizesAggregation(
  buckets: any[],
  filtersOffset: number
): string[] {
  const sizesFilter = buckets.map((bucket) => bucket.key);
  return paginateFilters(sizesFilter, filtersOffset);
}

/**
 * Extract filters from products
 */
function extractFilters(
  products: any[],
  languageCode: string,
  isFromBrowser: boolean
): ExtractFiltersResult {
  const customProducts: Record<string, CustomProduct> = {};

  products.forEach((product) => {
    // Process custom products
    if (product.custom_products && Array.isArray(product.custom_products)) {
      product.custom_products.forEach((customProduct: any) => {
        if (customProduct.language_code === languageCode) {
          customProducts[customProduct.id] = processCustomProduct(
            product,
            customProduct,
            languageCode,
            isFromBrowser
          );
        }
      });
    }
  });

  // Calculate price range
  const prices = calculatePriceRange(products);

  return {
    custom_products: Object.values(customProducts),
    prices,
  };
}

/**
 * Sort sync color images by filtered color
 */
function sortSyncColorImagesByFilteredColor(
  products: CustomProduct[],
  filters: SearchFilters
): any {
  if (!filters.colors || filters.colors.length === 0) {
    return;
  }

  const filteredColorCode = filters.colors[0];
  let productsArr = [];
  products.forEach((product) => {
    if (!product.colors || !product.sync_color_images) {
      productsArr.push(product);
      return;
    }

    // Find color name matching the code
    let colorName: string | null = null;
    for (const color of product.colors) {
      if (
        color.color &&
        color.color.toLowerCase() === filteredColorCode.toLowerCase()
      ) {
        colorName = color.name;
        break;
      }
    }

    if (!colorName) {
      productsArr.push(product);
      return;
    }
    let arr = Array.isArray(product.sync_color_images)
      ? product.sync_color_images
      : JSON.parse(product.sync_color_images || "[]");
    // Sort sync_color_images to show matching color first
    arr.sort((a: any, b: any) => {
      if (a.color_name === colorName) return -1;
      if (b.color_name !== colorName) return 1;
      return 0;
    });
    product = { ...product, sync_color_images: arr };
    // @ts-ignore
    productsArr.push(product);
  });
  return productsArr;
}

/**
 * Sort colors by filtered color
 */
function sortColorsByFilteredColor(
  products: CustomProduct[],
  filters: SearchFilters
): void {
  if (!filters.colors || filters.colors.length === 0) {
    return;
  }

  const filteredColorCode = filters.colors[0];

  products.forEach((product) => {
    if (!product.colors || !Array.isArray(product.colors)) {
      return;
    }

    product.colors.sort((a: any, b: any) => {
      const codeA = (a.color || "").toLowerCase();
      const codeB = (b.color || "").toLowerCase();
      const target = filteredColorCode.toLowerCase();

      if (codeA === target && codeB !== target) return -1;
      if (codeB === target && codeA !== target) return 1;
      return 0;
    });
  });
}

// Helper utility functions

/**
 * Paginate filters array
 */
function paginateFilters<T>(
  filters: T[],
  filtersSize: number,
  perPage: number = 10
): T[] {
  const offset = Math.max(0, (filtersSize - 1) * perPage);
  return filters.slice(offset, offset + perPage);
}

/**
 * Process individual custom product
 */
function processCustomProduct(
  product: any,
  customProduct: any,
  languageCode: string,
  isFromBrowser: boolean
): CustomProduct {
  const result: CustomProduct = { ...customProduct };

  result.videos = product.videos || [];
  result.thumbnail = product.thumbnail;

  const flashDealEndDate = product.end_date || null;
  const flashDealStartDate = product.start_date || null;
  const flashDealStatus = product.flash_deal_status || null;
  const flashDealDiscount = product.flash_deal_discount || null;

  // Handle flash deal
  if (flashDealStartDate && flashDealEndDate && flashDealStatus === 1) {
    result.flash_deal_start_date = flashDealStartDate;
    result.flash_deal_end_date = flashDealEndDate;
    result.flash_deal_status = flashDealStatus;
    result.flash_deal_discount = flashDealDiscount;
    result.flash_deal_price = calculateDiscountedPrice(
      product.unit_price,
      flashDealDiscount,
      "percent"
    );
    result.is_flash_deal_active = false;

    try {
      const startDate = new Date(flashDealStartDate);
      const endDate = new Date(flashDealEndDate);
      const currentDate = new Date();

      if (currentDate >= startDate && currentDate <= endDate) {
        result.is_flash_deal_active = true;
      }
    } catch (error) {
      // Date parsing failed, keep is_flash_deal_active as false
    }
  }

  result.images = parseJsonField(product.images);
  result.colors = product.colors;
  result.sync_color_images = product.sync_color_images || [];
  result.price = product.unit_price;
  result.offer_price = product.offered_price;
  result.boutique_id = product.boutique_id;
  result.in_stock = parseFloat(product.current_stock || "0") > 0;

  // Handle redeem discount
  const redeemDiscountRate = parseFloat(product.redeem_discount_rate || "0");
  result.has_redeem_discount =
    redeemDiscountRate > 0 && redeemDiscountRate < 100;

  if (result.has_redeem_discount) {
    result.redeem_discount_rate = redeemDiscountRate;
    result.redeem_price = calculateDiscountedPrice(
      product.unit_price,
      redeemDiscountRate,
      "percent"
    );
  }

  // Process categories and brands
  result.category = getCustomCategoryFromHighestPositionCategory(
    product,
    languageCode
  );
  result.categories = getAllCustomCategories(product, languageCode);
  result.category_hierarchy = extractCategoryHierarchy(product, languageCode);

  // Find appropriate brand
  if (product.custom_brands && Array.isArray(product.custom_brands)) {
    for (const brand of product.custom_brands) {
      if (brand.language_code === languageCode) {
        result.brand = brand;
        if (product.brand?.is_verified) {
          result.brand.is_verified = product.brand.is_verified;
        }
        break;
      }
    }
  }

  if (isFromBrowser) {
    delete result.categories;
    if (result.category) {
      removeCategoryExtraFields(result.category);
    }
  }

  return result;
}

/**
 * Calculate price range from products
 */
function calculatePriceRange(products: any[]): {
  min_price: number;
  max_price: number;
  priceRanges: any[];
} {
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  products.forEach((product) => {
    const price = parseFloat(
      product.offered_price || product.unit_price || "0"
    );
    if (price > 0) {
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
    }
  });
  let priceRanges = calculatePriceFilter(products);
  return {
    min_price: minPrice === Infinity ? 0 : minPrice,
    max_price: maxPrice === -Infinity ? 0 : maxPrice,
    priceRanges: priceRanges?.priceRanges ?? [],
  };
}

/**
 * Calculate discounted price
 */

/**
 * Parse JSON field with error handling
 */
function parseJsonField(jsonData: any): any[] {
  if (!jsonData) return [];

  try {
    if (typeof jsonData === "string") {
      const data = JSON.parse(jsonData);
      return Array.isArray(data) ? data : [];
    }
    return Array.isArray(jsonData) ? jsonData : [];
  } catch {
    return [];
  }
}

/**
 * Get custom category from highest position category
 */
function getCustomCategoryFromHighestPositionCategory(
  productData: any,
  lang: string
): any {
  if (!productData.category_ids || !Array.isArray(productData.category_ids)) {
    return null;
  }

  // Find category with highest position
  let highestCategory: any = null;
  productData.category_ids.forEach((catIdData: any) => {
    if (typeof catIdData.position === "number") {
      if (!highestCategory || catIdData.position > highestCategory.position) {
        highestCategory = catIdData;
      }
    }
  });

  if (!highestCategory) return null;

  const highestCategoryId = highestCategory.id;

  // Find matching category to check status
  let matchingCategory: any = null;
  if (productData.categories && Array.isArray(productData.categories)) {
    matchingCategory = productData.categories.find(
      (cat: any) => cat.id == highestCategoryId
    );
  }

  if (!matchingCategory || matchingCategory.status !== 1) {
    return null;
  }

  // Find corresponding custom category
  let customCategory: any = null;
  if (
    productData.custom_categories &&
    Array.isArray(productData.custom_categories)
  ) {
    customCategory = productData.custom_categories.find(
      (cat: any) =>
        cat.category_id == highestCategoryId && cat.language_code === lang
    );
  }

  if (!customCategory) return null;

  return {
    ...customCategory,
    num_available_product: matchingCategory.num_available_product || null,
    most_viewed_product_thumbnail: productData.thumbnail || null,
  };
}

/**
 * Get all custom categories
 */
function getAllCustomCategories(productData: any, lang: string): any[] {
  const result: any[] = [];

  if (!productData.category_ids || !Array.isArray(productData.category_ids)) {
    return result;
  }

  productData.category_ids.forEach((catIdData: any) => {
    if (!catIdData.id) return;

    const currentCategoryId = catIdData.id;

    // Find matching category for status check
    let matchingCategory: any = null;
    if (productData.categories && Array.isArray(productData.categories)) {
      matchingCategory = productData.categories.find(
        (cat: any) => cat.id == currentCategoryId
      );
    }

    if (!matchingCategory || matchingCategory.status !== 1) {
      return;
    }

    // Find custom category
    let customCategory: any = null;
    if (
      productData.custom_categories &&
      Array.isArray(productData.custom_categories)
    ) {
      customCategory = productData.custom_categories.find(
        (cat: any) =>
          cat.category_id == currentCategoryId && cat.language_code === lang
      );
    }

    if (customCategory) {
      result.push({
        ...customCategory,
        num_available_product: matchingCategory.num_available_product || null,
        most_viewed_product_thumbnail: productData.thumbnail || null,
      });
    }
  });

  return result;
}

/**
 * Extract category hierarchy
 */
function extractCategoryHierarchy(productData: any, lang: string): any {
  if (!productData.category_ids || !Array.isArray(productData.category_ids)) {
    return {};
  }

  const categoriesByPosition: Record<number, any> = {};

  productData.category_ids.forEach((catIdData: any) => {
    if (!catIdData.id || typeof catIdData.position !== "number") {
      return;
    }

    const categoryId = catIdData.id;
    const position = catIdData.position;

    // Find custom category
    let customCategory: any = null;
    if (
      productData.custom_categories &&
      Array.isArray(productData.custom_categories)
    ) {
      customCategory = productData.custom_categories.find(
        (cat: any) =>
          cat.category_id == categoryId && cat.language_code === lang
      );
    }

    if (customCategory) {
      categoriesByPosition[position] = {
        id: customCategory.id,
        name: customCategory.name,
      };
    }
  });

  const sortedCategories = Object.keys(categoriesByPosition)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((key) => categoriesByPosition[parseInt(key)]);

  return {
    main_category: sortedCategories[0] || null,
    sub_category: sortedCategories[1] || null,
    sub_sub_category: sortedCategories[2] || null,
  };
}

/**
 * Remove extra fields from category for browser response
 */
function removeCategoryExtraFields(category: any): void {
  const fieldsToRemove = [
    "description",
    "bio",
    "outline_photo_path",
    "png_photo_path",
    "fill_photo_path",
    "banner_photo_path",
  ];

  fieldsToRemove.forEach((field) => {
    if (category[field] !== undefined) {
      delete category[field];
    }
  });
}
// Remaining helper functions to complete the Elasticsearch implementation

/**
 * Normalize custom products - filters colors and sync color images for consistency
 */
function normalizeCustomProducts(
  productsWithFilters: ExtractFiltersResult
): ExtractFiltersResult {
  if (
    !productsWithFilters.custom_products ||
    productsWithFilters.custom_products.length === 0
  ) {
    return productsWithFilters;
  }

  productsWithFilters.custom_products.forEach((product) => {
    // Read the lists, whether they are arrays or objects
    const colorsList = Array.isArray(product.colors)
      ? product.colors
      : product.colors || [];
    const syncList = Array.isArray(product.sync_color_images)
      ? product.sync_color_images
      : JSON.parse(product.sync_color_images || "[]") || [];

    // Apply filtering
    const cleaned = filterColorSyncObj(colorsList, syncList);

    // Reassign the cleaned values
    product.colors = cleaned.colors;
    product.sync_color_images = cleaned.sync_color_images;
    product.sync_color_images = cleaned.sync_color_images?.map((s) => ({
      ...s,
      images: s.images.map((d) => ({ file_path: `/product/${d}` })),
    }));
    product.images = product.images.map((s) => ({
      file_path: `/product/${s}`,
    }));
  });

  return productsWithFilters;
}

/**
 * Filter sync color images to only include colors that exist in the colors array
 */
function filterColorSyncObj(
  colors: ColorItem[],
  syncColorImages: SyncColorImage[]
): {
  colors: ColorItem[];
  sync_color_images: SyncColorImage[];
} {
  // Extract valid color names from colors array
  const validNames = colors.map((color) => color.name).filter((name) => name);

  // Filter sync_color_images to only include valid color names
  const filteredSync = syncColorImages.filter((item) => {
    return validNames.includes(item.color_name);
  });

  return {
    colors: colors,
    sync_color_images: filteredSync,
  };
}

/**
 * Get product images with additional details and processing
 */
function getProductImagesWithDetails(images: any): ProductImage[] {
  if (!images) {
    return [];
  }

  // If images is already an array, return it
  if (Array.isArray(images)) {
    return images.map(processImageItem);
  }

  // If images is a string (JSON), try to parse it
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        return parsed.map(processImageItem);
      }
    } catch (error) {
      console.warn("Failed to parse images JSON:", error);
      return [];
    }
  }

  // If images is an object, try to convert it to array format
  if (typeof images === "object" && images !== null) {
    // Handle case where images might be an object with numeric keys
    const keys = Object.keys(images);
    if (keys.every((key) => !isNaN(Number(key)))) {
      return keys.map((key) => processImageItem(images[key]));
    }

    // Handle single image object
    return [processImageItem(images)];
  }

  return [];
}

/**
 * Process individual image item to ensure consistent structure
 */
function processImageItem(image: any): ProductImage {
  if (!image || typeof image !== "object") {
    return {
      id: null,
      path: "",
      url: "",
      alt: "",
      title: "",
    };
  }

  return {
    id: image.id || null,
    path: image.path || image.url || "",
    url: image.url || image.path || "",
    alt: image.alt || image.title || "",
    title: image.title || image.alt || "",
    ...image, // Preserve any additional properties
  };
}

/**
 * Get sync color images with additional details and processing
 */
function getSyncColorImagesProductWithDetails(
  syncColorImages: any
): SyncColorImage[] {
  if (!syncColorImages) {
    return [];
  }

  // If already an array, process each item
  if (Array.isArray(syncColorImages)) {
    return syncColorImages.map(processSyncColorImageItem);
  }

  // If it's a string (JSON), try to parse it
  if (typeof syncColorImages === "string") {
    try {
      const parsed = JSON.parse(syncColorImages);
      if (Array.isArray(parsed)) {
        return parsed.map(processSyncColorImageItem);
      }
    } catch (error) {
      console.warn("Failed to parse sync color images JSON:", error);
      return [];
    }
  }

  // If it's an object, try to convert to array
  if (typeof syncColorImages === "object" && syncColorImages !== null) {
    const keys = Object.keys(syncColorImages);
    if (keys.every((key) => !isNaN(Number(key)))) {
      return keys.map((key) => processSyncColorImageItem(syncColorImages[key]));
    }

    // Handle single sync color image object
    return [processSyncColorImageItem(syncColorImages)];
  }

  return [];
}

/**
 * Process individual sync color image item
 */
function processSyncColorImageItem(item: any): SyncColorImage {
  if (!item || typeof item !== "object") {
    return {
      color_name: "",
      images: [],
    };
  }

  // Process images within the sync color item
  let processedImages: ProductImage[] = [];
  if (item.images) {
    processedImages = getProductImagesWithDetails(item.images);
  }

  return {
    color_name: item.color_name || "",
    images: processedImages,
    ...item, // Preserve any additional properties
  };
}

/**
 * Advanced price catalog filter - replicates PHP PriceCatalogFilter::execute functionality
 */
function executePriceCatalogFilter(products: any[]): {
  min_price: number;
  max_price: number;
} {
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  if (!products || products.length === 0) {
    return {
      min_price: 0,
      max_price: 0,
    };
  }

  products.forEach((product) => {
    // Check multiple price fields to find the effective price
    const prices: number[] = [];

    // Add offered price (primary price)
    if (product.offered_price) {
      const offeredPrice = parseFloat(product.offered_price);
      if (!isNaN(offeredPrice) && offeredPrice > 0) {
        prices.push(offeredPrice);
      }
    }

    // Add unit price as fallback
    if (product.unit_price) {
      const unitPrice = parseFloat(product.unit_price);
      if (!isNaN(unitPrice) && unitPrice > 0) {
        prices.push(unitPrice);
      }
    }

    // Check flash deal price if active
    if (product.flash_deal_status === 1 && product.flash_deal_discount) {
      const basePrice = parseFloat(
        product.unit_price || product.offered_price || "0"
      );
      if (basePrice > 0) {
        const flashDealPrice = calculateDiscountedPrice(
          basePrice,
          parseFloat(product.flash_deal_discount),
          "percent"
        );
        if (flashDealPrice > 0) {
          prices.push(flashDealPrice);
        }
      }
    }

    // Check redeem discount price
    if (product.redeem_discount_rate) {
      const redeemRate = parseFloat(product.redeem_discount_rate);
      if (!isNaN(redeemRate) && redeemRate > 0 && redeemRate < 100) {
        const basePrice = parseFloat(
          product.unit_price || product.offered_price || "0"
        );
        if (basePrice > 0) {
          const redeemPrice = calculateDiscountedPrice(
            basePrice,
            redeemRate,
            "percent"
          );
          if (redeemPrice > 0) {
            prices.push(redeemPrice);
          }
        }
      }
    }

    // Find min and max from all available prices for this product
    if (prices.length > 0) {
      const productMin = Math.min(...prices);
      const productMax = Math.max(...prices);

      minPrice = Math.min(minPrice, productMin);
      maxPrice = Math.max(maxPrice, productMax);
    }
  });

  // Handle case where no valid prices were found
  if (minPrice === Infinity || maxPrice === -Infinity) {
    return {
      min_price: 0,
      max_price: 0,
    };
  }

  return {
    min_price: Math.floor(minPrice), // Round down for min
    max_price: Math.ceil(maxPrice), // Round up for max
  };
}

/**
 * Calculate discounted price (reused from previous helpers but included here for completeness)
 */
function calculateDiscountedPrice(
  originalPrice: number,
  discount: number,
  discountType: string
): number {
  if (discountType === "percent") {
    return originalPrice - (originalPrice * discount) / 100;
  }
  // For flat discount
  return Math.max(0, originalPrice - discount);
}

/**
 * Enhanced JSON field parser with better error handling
 */
function parseJsonFieldAdvanced(jsonData: any, defaultValue: any = []): any {
  if (jsonData === null || jsonData === undefined) {
    return defaultValue;
  }

  // If already parsed/proper type, return as is
  if (typeof jsonData === "object" && !Array.isArray(jsonData)) {
    return jsonData;
  }

  if (Array.isArray(jsonData)) {
    return jsonData;
  }

  // If it's a string, try to parse it
  if (typeof jsonData === "string") {
    // Handle empty strings
    if (jsonData.trim() === "") {
      return defaultValue;
    }

    try {
      const parsed = JSON.parse(jsonData);
      return parsed !== null ? parsed : defaultValue;
    } catch (error) {
      console.warn("JSON parsing failed:", error, "Data:", jsonData);
      return defaultValue;
    }
  }

  return defaultValue;
}

/**
 * Utility function to safely get nested object properties
 */
function getNestedProperty(
  obj: any,
  path: string,
  defaultValue: any = null
): any {
  if (!obj || typeof obj !== "object") {
    return defaultValue;
  }

  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Utility function to ensure array format
 */
function ensureArray(value: any): any[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return [];
  }

  // If it's a string that might be JSON
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [value];
    }
  }

  // For objects, convert to array
  if (typeof value === "object") {
    return Object.values(value);
  }

  return [value];
}

/**
 * Clean and validate product data
 */
function validateAndCleanProduct(product: any): any {
  if (!product || typeof product !== "object") {
    return null;
  }

  // Ensure required fields exist
  const requiredFields = ["id", "name", "slug"];
  for (const field of requiredFields) {
    if (!product[field]) {
      console.warn(`Product missing required field: ${field}`, product);
      return null;
    }
  }

  // Clean and validate numeric fields
  const numericFields = ["price", "offer_price", "unit_price", "offered_price"];
  numericFields.forEach((field) => {
    if (product[field] !== undefined) {
      const numValue = parseFloat(product[field]);
      product[field] = isNaN(numValue) ? 0 : numValue;
    }
  });

  // Ensure arrays are properly formatted
  product.colors = ensureArray(product.colors);
  product.sync_color_images = ensureArray(product.sync_color_images);
  product.images = ensureArray(product.images);
  product.videos = ensureArray(product.videos);

  return product;
}

interface PriceRange {
  min_price: number;
  max_price: number;
  products_count: number;
}

interface FinalPrices {
  min_price: number;
  max_price: number;
  priceRanges: PriceRange[];
}
function calculatePriceFilter(products: CustomProduct[]): FinalPrices | null {
  if (products.length === 0) return null;

  const getDiscountedPrice = (product: CustomProduct): number => {
    const { unit_price, discount, discount_type } = product;
    if (discount_type === "percent") {
      return unit_price - (discount / 100) * unit_price;
    } else if (discount_type === "flat") {
      return unit_price - discount;
    } else {
      return unit_price;
    }
  };

  const discountedPrices = products.map(getDiscountedPrice);

  const minOfferPrice = Math.min(...discountedPrices);
  const maxOfferPrice = Math.max(...discountedPrices);

  if (minOfferPrice >= maxOfferPrice) return null;

  const diff = (maxOfferPrice - minOfferPrice) / 4;
  const boundaries = [
    minOfferPrice,
    minOfferPrice + diff,
    minOfferPrice + diff * 2,
    minOfferPrice + diff * 3,
    maxOfferPrice,
  ];

  const priceRanges: PriceRange[] = [];

  for (let i = 0; i < 4; i++) {
    const rangeMin = boundaries[i];
    const rangeMax = boundaries[i + 1];

    const productsCount = discountedPrices.filter(
      (price) => price >= rangeMin && price <= rangeMax
    ).length;

    priceRanges.push({
      min_price: rangeMin,
      max_price: rangeMax,
      products_count: productsCount,
    });
  }

  return {
    min_price: minOfferPrice,
    max_price: maxOfferPrice,
    priceRanges,
  };
}
