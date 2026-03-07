"use server";
import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import AnalyzeSearchText from "./analyzeSearchText";
import {
  buildAggregations,
  buildBaseConditions,
  calculatePriceRange,
  CustomProduct,
  getChildrenAndGrandchildren,
  getSourceFields,
  normalizeCustomProducts,
  paginateFilters,
  processBoutiquesAggregation,
  processBrandsAggregation,
  processCategoriesAggregation,
  processCustomProduct,
  processRelatedCategories,
  sortColorsByFilteredColor,
  sortSyncColorImagesByFilteredColor,
} from "./helpers";
import { LogServerError } from "utils/serverErrorReporter";
import {
  catalog_index,
  recommendation_cold_index,
  recommendation_index,
} from "./INDEXES";
import { enrichWithRecommended } from "./recommendationService";

// Types and Interfaces
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
  userId?: string | number | null;
  recommended_offset?: number;
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
  gender?: number | null;
  group_age?: number | null;
  childes: CategoryFilter[];
}

interface SearchResult {
  offset: any[];
  limit: number;
  total_size: number;
  products?: CustomProduct[];
  brands?: FilterResult[];
  boutiques?: FilterResult[];
  categories?: CategoryFilter[];
  related_categories?: CategoryFilter[];
  attributes?: Array<{
    id: number;
    name: string;
    options: string[];
  }>;
  colors?: string[];
  prices?: {
    min_price: number;
    max_price: number;
    priceRanges?: any[];
  };
  isAnalyzed?: any;
  applied?: any;
  recommended_offset?: number;
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

// Initialize Elasticsearch client

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
  prices: any;
}
let client = elasticSearchClient;
/**
 * Main function to search products and get filters from Elasticsearch
 */
export async function getProductsAndFiltersFromElastic(
  params: SearchParams,
): Promise<SearchResult> {
  let {
    limit = 10,
    search_after = [],
    filters = {},
    language_code = "en",
    country = "",
    is_from_browser = false,
    filters_offset = 1,
    noFilters = false,
    noProducts = false,
    userId = null,
    recommended_offset = 0,
  } = params;
  if (filters?.prices) {
    filters = { ...filters, priceRange: filters.prices };
  }
  let isAnalyzed: any = false;
  try {
    if (filters.search_text && filters.search_text?.split(" ")?.length > 1) {
      let CleanSearchText = await AnalyzeSearchText(filters.search_text);
      if (CleanSearchText?.error) {
        console.error(
          `##################${
            CleanSearchText?.error || CleanSearchText?.message
          }#######################`,
        );
        isAnalyzed = CleanSearchText?.error || CleanSearchText?.message;
        throw new Error(CleanSearchText?.error || CleanSearchText?.message);
      }
      if (CleanSearchText?.name) {
        filters = { ...filters, search_text: CleanSearchText?.name };
      }
      if (CleanSearchText?.color) {
        let new_colors;
        if (Array.isArray(CleanSearchText.color))
          new_colors = CleanSearchText.color;
        else {
          new_colors = [CleanSearchText.color];
        }
        filters = {
          ...filters,
          colors: [...new Set([...(filters.colors || []), ...new_colors])],
        };
      }
      if (CleanSearchText?.size) {
        let new_sizes;
        if (Array.isArray(CleanSearchText.size)) {
          new_sizes = CleanSearchText.size;
        } else {
          new_sizes = [CleanSearchText.size];
        }
        filters = {
          ...filters,
          sizes: [...new Set([...(filters.sizes || []), ...new_sizes])],
        };
      }
      isAnalyzed = CleanSearchText;
    }
  } catch (error) {
    LogServerError(`Gemini Search Analyze ${error}`, JSON.stringify(filters));
    isAnalyzed?.length > 4 ? isAnalyzed : "failed to Analyze";
    console.error(error);
  }

  try {
    const filtersSize = filters_offset * 10;
    let categoriesFilter = [],
      colorsFilter = [],
      sizesFilter = [],
      prices = null,
      brandsFilter = [],
      boutiquesFilter = [];
    const baseConditions = buildBaseConditions(filters, country);
    const { must: mustConditions, must_not: mustNotConditions } =
      baseConditions;

    const searchQuery = {
      index: catalog_index,
      _source: getSourceFields(),
      track_scores: true,
      track_total_hits: true,
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
        filtersSize,
      ),
    };

    if (noFilters) delete searchQuery.aggs;
    // Add search_after for pagination
    if (search_after?.length > 0) {
      // @ts-ignore
      searchQuery.search_after = search_after;
    }
    // Execute search with pagination
    const customProducts: any[] = [];
    let lastSortValue: any[] = search_after;
    let response;

    response = await client.search(searchQuery);
    const hits = response.hits.hits as ElasticsearchHit[];
    let total_size = response.hits?.total?.value;
    hits.forEach((hit: ElasticsearchHit) => {
      customProducts.push(hit._source);
    });
    lastSortValue = hits.length > 0 ? hits[hits.length - 1].sort : [];
    // Process aggregations

    const productsWithFilters: any = extractFilters(
      customProducts,
      language_code,
      is_from_browser,
      country,
    );
    prices = productsWithFilters.prices;
    if (filters.colors?.length) {
      productsWithFilters.custom_products = sortSyncColorImagesByFilteredColor(
        productsWithFilters.custom_products,
        filters,
      );
      sortColorsByFilteredColor(productsWithFilters.custom_products, filters);
    }
    // Normalize products
    const normalizedProducts = normalizeCustomProducts(productsWithFilters);
    // ── Recommended products (fire-and-forget merge) ──────────────
    let recommendedProducts: any[] = [];
    let newRecommendedOffset = recommended_offset;

    try {
      const enrichResult = await enrichWithRecommended({
        userId: userId ? String(userId) : null,
        filters,
        offset: recommended_offset,
        limit,
        language_code,
        country,
      });

      if (enrichResult?.products?.length) {
        recommendedProducts = enrichResult.products;
        newRecommendedOffset = enrichResult.recommended_offset;
      }
    } catch {
      // Silently continue — recommendations are non-critical
    }

    const catalogProducts =
      normalizedProducts.custom_products?.map((s) => ({
        ...s,
        is_luck: s.redeem_price > 0,
        luck_price: s.redeem_price,
        seller_status: s?.seller_status,
      })) ?? [];

    // Deduplicate: remove catalog products already present in recommendations
    const recommendedIdSet = new Set(
      recommendedProducts.map((p) => String(p.id ?? p.product_id)),
    );
    const deduplicatedCatalog = catalogProducts.filter(
      (p) => !recommendedIdSet.has(String(p.id ?? p.product_id)),
    );

    const mergedProducts = [...recommendedProducts, ...deduplicatedCatalog];

    if (noFilters) {
      return {
        colors: colorsFilter,
        offset: lastSortValue,
        prices: prices,
        isAnalyzed: isAnalyzed,
        applied: filters,
        total_size: total_size,
        products: mergedProducts,
        limit: limit,
        recommended_offset: newRecommendedOffset,
      };
    }

    const aggregations = response.aggregations?.filtered_results || {}; // Process filters
    let CategoriesIds = (
      aggregations as any
    ).top_categories?.filtered_categories?.categories_by_id?.buckets.map(
      (s) => s?.category_details.hits.hits[0]._source.category_id,
    );
    let categories_childs = await getChildrenAndGrandchildren(
      client,
      catalog_index,
      CategoriesIds,
      language_code,
      country,
      filters,
    );
    let categiresCombo = (
      aggregations as any
    ).top_categories?.filtered_categories?.categories_by_id?.buckets.concat(
      categories_childs.top_categories?.filtered_categories?.categories_by_id
        ?.buckets || [],
    );
    let by_id_categories_comb = (
      (aggregations as any).top_orig_categories?.orig_categories_by_id
        ?.buckets || []
    ).concat(
      categories_childs.top_orig_categories?.orig_categories_by_id?.buckets ||
        [],
    );
    const categoriesResult = processCategoriesAggregation(
      categiresCombo,
      by_id_categories_comb,
      filters_offset,
    );
    categoriesFilter = categoriesResult.categories;

    const relatedCategoriesFilter = processRelatedCategories(
      aggregations,
      categoriesResult.genderAgePairs,
      filters_offset,
    );

    colorsFilter = processColorsAggregation(
      (aggregations as any).top_colors?.colors_by_color?.buckets || [],
      filters_offset,
    );

    sizesFilter = processSizesAggregation(
      (aggregations as any).top_sizes?.available_size_as_json_by_size
        ?.buckets || [],
      filters_offset,
    );

    brandsFilter = processBrandsAggregation(
      (aggregations as any).top_brands?.filtered_brands?.brands_by_id
        ?.buckets || [],
      filters_offset,
    );
    boutiquesFilter = processBoutiquesAggregation(
      (aggregations as any).top_boutiques?.filtered_boutiques?.boutiques_by_id
        ?.buckets || [],
      filters_offset,
    );

    return {
      offset: lastSortValue,
      limit: limit,
      total_size: total_size,
      products: mergedProducts,
      brands: brandsFilter,
      boutiques: boutiquesFilter,
      categories: categoriesFilter,
      related_categories: relatedCategoriesFilter,
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
      prices: prices,
      isAnalyzed: isAnalyzed,
      applied: filters,
      recommended_offset: newRecommendedOffset,
    };
  } catch (error) {
    LogServerError({
      scenario: "getProductAndFilters in elasticSearch",
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      `Search failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

async function fetchRecommendationCandidates(userId: string | number) {
  const sourceFields = [
    "recommended_products.product_id",
    "recommended_products.item_id",
    "recommended_products.score",
  ];

  // 1. Build Query (User vs Cold Start)
  let queryConfig = {};
  if (!userId) {
    queryConfig = {
      index: recommendation_cold_index,
      // Sort by the nested field MAX score to find the best *Document*, not the best product
    };
  } else {
    queryConfig = {
      index: recommendation_index,
      query: { term: { user_id: Number(userId) } },
      sort: [
        {
          "recommended_products.score": {
            order: "desc",
            mode: "max",
            nested: { path: "recommended_products" },
          },
        },
      ],
    };
  }

  // 2. Execute Search
  let response = await client.search({
    ...queryConfig,
    _source: sourceFields,
    size: 1,
  });

  // 3. Fallback to Cold Start if User not found
  if (response.hits.hits.length === 0 && userId) {
    response = await client.search({
      index: recommendation_cold_index,
      _source: sourceFields,
      size: 1,
    });
  }

  // 4. Extract and Deterministically SORT the array
  const source = response.hits.hits?.[0]?._source as any;
  if (!source?.recommended_products) return [];

  return source.recommended_products
    .map((item) => ({
      id: String(item.product_id || item.item_id),
      score: item.score || 0,
    }))
    .sort((a, b) => b.score - a.score); // Highest score first
}
async function fetchProductDetailsBatch(ids: string[], country: string) {
  if (ids.length === 0) return [];

  const baseConditions = buildBaseConditions({}, country);
  const { must, must_not } = baseConditions;

  // We strictly look for these specific IDs
  must.push({ terms: { id: ids } });

  const response = await client.search({
    index: catalog_index,
    _source: getSourceFields(),
    size: ids.length, // Fetch exactly what we asked for
    query: {
      bool: { must, must_not },
    },
  });
  return response.hits.hits.map((hit) => ({
    ...(hit._source as any),
    is_luck: (hit._source as any)?.redeem_price > 0,
    luck_price: (hit._source as any)?.redeem_price,
  }));
}
export async function GetRecomendationsForUser({
  userId,
  language,
  country,
  search_after = [0], // Default to Index 0
  limit = 50,
}) {
  try {
    const start = process.hrtime.bigint();

    // STEP 1: Master list (source of truth)
    const allCandidates = await fetchRecommendationCandidates(userId);
    const totalCandidates = allCandidates.length;

    // STEP 2: Cursor
    let currentIndex =
      typeof search_after[0] === "number" ? search_after[0] : 0;

    const validProducts: any[] = [];

    // STEP 3: Fill the bucket
    while (validProducts.length < limit && currentIndex < totalCandidates) {
      // how many we still need
      const needed = limit - validProducts.length;

      // IMPORTANT: fetch only as many candidates as we actually need.
      // If you want an optimization, you can multiply 'needed' by some factor (e.g. *1.5)
      // BUT if you do that you must *buffer* any extra accepted products for next page.
      const batchSize = Math.min(needed, totalCandidates - currentIndex);

      const batchSlice = allCandidates.slice(
        currentIndex,
        currentIndex + batchSize,
      );
      if (batchSlice.length === 0) break;

      const batchIds = batchSlice
        .map((c) => c.id)
        .filter((id) => /^\d+$/.test(id));

      // Fetch details for the batch (we inspected every candidate in batchSlice)
      const fetchedProductsRaw = await fetchProductDetailsBatch(
        batchIds,
        country,
      );
      const productsWithFilters: any = extractFilters(
        fetchedProductsRaw,
        language,
        true,
        country,
      );
      const fetchedProducts =
        normalizeCustomProducts(productsWithFilters).custom_products;

      // Restore recommendation order
      fetchedProducts.sort(
        (a, b) =>
          batchIds.indexOf(String(a.id)) - batchIds.indexOf(String(b.id)),
      );

      // Add up to 'needed' products
      for (const product of fetchedProducts) {
        if (validProducts.length >= limit) break;
        validProducts.push(product);
      }

      // We inspected the entire slice we requested -> advance past it.
      currentIndex += batchSlice.length;
    }

    // STEP 4: Finalize & sort to match original ordering
    const allCandidatesNum = allCandidates
      .map((c) => String(c.id))
      .filter((id) => /^\d+$/.test(id));

    const sortedFetchedProducts = validProducts.slice().sort((a, b) => {
      const indexA = allCandidatesNum.indexOf(String(a.product_id));
      const indexB = allCandidatesNum.indexOf(String(b.product_id));
      const posA = indexA === -1 ? Infinity : indexA;
      const posB = indexB === -1 ? Infinity : indexB;
      return posA - posB;
    });

    const end = process.hrtime.bigint();
    return {
      products: sortedFetchedProducts.map((s) => ({
        ...s,
        is_luck: s.redeem_price > 0,
        luck_price: s.redeem_price,
      })),
      limit,
      total_size: totalCandidates,
      offset: [currentIndex],
      time: Number(end - start) / 1_000_000,
    };
  } catch (error) {
    LogServerError({
      scenario: "getRecomendationsForUser in elasticSearch",
      error: error instanceof Error ? error.message : String(error),
    });
    return { products: [], limit, offset: [] };
  }
}

function processColorsAggregation(
  buckets: any[],
  filtersOffset: number,
): string[] {
  const colorsFilter = buckets.map((bucket) => bucket.key);
  return paginateFilters(colorsFilter, filtersOffset);
}

/**
 * Process sizes aggregation
 */
function processSizesAggregation(
  buckets: any[],
  filtersOffset: number,
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
  isFromBrowser: boolean,
  country: string = "",
): ExtractFiltersResult {
  const customProducts: CustomProduct[] = [];

  products?.forEach((product) => {
    if (product.custom_products && Array.isArray(product.custom_products)) {
      product.custom_products.forEach((customProduct: any) => {
        if (customProduct.language_code === languageCode) {
          const processed = processCustomProduct(
            product,
            customProduct,
            languageCode,
            isFromBrowser,
            country,
          );
          customProducts.push(processed);
        }
      });
    }
  });

  let prices =
    products.length > 0 ? calculatePriceRange(products, country) : null;
  // Calculate price range

  return {
    custom_products: customProducts,
    prices: prices,
  };
}
