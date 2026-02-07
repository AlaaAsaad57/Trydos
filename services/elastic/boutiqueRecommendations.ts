"use server";

import { elasticSearchClient } from "./elasticsearch.config";
import {
  buildBaseConditions,
  buildAggregations,
  extractFilters,
  getSourceFields,
  normalizeCustomProducts,
  sortColorsByFilteredColor,
  sortSyncColorImagesByFilteredColor,
  processCategoriesAggregation,
  processBrandsAggregation,
  processBoutiquesAggregation,
  getChildrenAndGrandchildren,
  paginateFilters,
} from "./helpers";
import {
  catalog_index,
  recommendation_index,
  recommendation_cold_index,
} from "./INDEXES";
import { LogServerError } from "utils/serverErrorReporter";

const client = elasticSearchClient;

// --- Types ---

interface SearchFilters {
  boutiques?: string[];
  categories?: string[];
  brands?: string[];
  colors?: string[];
  sizes?: string[];
  search_text?: string;
  priceRange?: number[];
  prices?: number[];
  tags_names?: string[];
  featured?: boolean;
  flashdeal?: boolean;
}

interface EnrichedParams {
  filters: SearchFilters;
  country: string;
  language_code: string;
  is_from_browser: boolean;
  limit: number;
  search_after: any[];
  noFilters: boolean;
  userId: string | number;
  isAnalyzed: any;
  filters_offset: number;
}

// --- Condition Check ---

/**
 * Returns true when boutique recommendation enrichment should activate:
 * exactly one active filter key "boutiques" with exactly one slug,
 * and a valid userId provided.
 */
export async function shouldEnrichWithBoutiqueRecs(
  filters: SearchFilters,
  userId?: string | number | null,
): Promise<boolean> {
  if (!userId) return false;

  const activeKeys = Object.keys(filters).filter((key) => {
    const val = (filters as any)[key];
    if (val === undefined || val === null) return false;
    if (Array.isArray(val) && val.length === 0) return false;
    if (typeof val === "string" && val.trim() === "") return false;
    if (typeof val === "boolean" && val === false) return false;
    return true;
  });

  return (
    activeKeys.length === 1 &&
    activeKeys[0] === "boutiques" &&
    filters.boutiques?.length === 1
  );
}

// --- Cursor Parsing ---

/**
 * Enriched cursor format:
 * Phase R (showing recommendations): ["r", recOffset, totalSize]
 * Phase C (catalog only, recs exhausted): ["c", totalSize, ...esSearchAfter]
 * Empty []: first page
 */
function parseEnrichedCursor(searchAfter: any[]): {
  phase: "r" | "c";
  recOffset: number;
  totalSize: number | null;
  esSearchAfter: any[];
} {
  if (!searchAfter || searchAfter.length === 0) {
    return { phase: "r", recOffset: 0, totalSize: null, esSearchAfter: [] };
  }

  if (searchAfter[0] === "r") {
    return {
      phase: "r",
      recOffset: searchAfter[1] || 0,
      totalSize: searchAfter[2] ?? null,
      esSearchAfter: [],
    };
  }

  if (searchAfter[0] === "c") {
    return {
      phase: "c",
      recOffset: -1,
      totalSize: searchAfter[1] ?? null,
      esSearchAfter: searchAfter.slice(2),
    };
  }

  return {
    phase: "c",
    recOffset: -1,
    totalSize: null,
    esSearchAfter: searchAfter,
  };
}

// --- Data Fetching ---

/**
 * Resolve boutique slug to numeric boutique_id via the catalog index.
 * Uses base conditions to ensure the boutique is active and visible.
 */
async function resolveBoutiqueIdFromSlug(
  boutiqueSlug: string,
  country: string,
): Promise<number | null> {
  const baseConditions = buildBaseConditions(
    { boutiques: [boutiqueSlug] },
    country,
  );

  const response = await client.search({
    index: catalog_index,
    query: {
      bool: {
        must: baseConditions.must,
        must_not: baseConditions.must_not,
      },
    },
    _source: ["custom_boutiques.id", "custom_boutiques.slug"],
    size: 1,
  });

  const source = response.hits.hits[0]?._source as any;
  if (!source?.custom_boutiques) return null;

  const boutique = source.custom_boutiques.find(
    (b: any) => b.slug === boutiqueSlug,
  );
  return boutique?.id ?? null;
}

/**
 * Fetch recommended product candidates for a user + boutique from the recommendation index.
 * Filters nested recommended_products by boutique_id using inner_hits.
 * Falls back to cold start if user data not found.
 */
async function fetchBoutiqueRecCandidates(
  userId: string | number,
  boutiqueId: number,
): Promise<{ id: string; score: number }[]> {
  let response = await client.search({
    index: recommendation_index,
    query: {
      bool: {
        must: [
          { term: { user_id: Number(userId) } },
          {
            nested: {
              path: "recommended_products",
              query: {
                term: { "recommended_products.boutique_id": boutiqueId },
              },
              inner_hits: {
                size: 100,
                sort: [{ "recommended_products.score": { order: "desc" } }],
              },
            },
          },
        ],
      },
    },
    _source: false,
    size: 1,
  });

  let innerHits =
    response.hits.hits[0]?.inner_hits?.recommended_products?.hits?.hits;

  // Fallback to cold start if user has no recommendations
  if (!innerHits?.length) {
    response = await client.search({
      index: recommendation_cold_index,
      query: {
        nested: {
          path: "recommended_products",
          query: {
            term: { "recommended_products.boutique_id": boutiqueId },
          },
          inner_hits: {
            size: 100,
            sort: [{ "recommended_products.score": { order: "desc" } }],
          },
        },
      },
      _source: false,
      size: 1,
    });
    innerHits =
      response.hits.hits[0]?.inner_hits?.recommended_products?.hits?.hits;
  }

  if (!innerHits?.length) return [];

  return innerHits
    .map((hit: any) => ({
      id: String(hit._source.product_id || hit._source.item_id),
      score: hit._source.score || 0,
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Validate a batch of product IDs against catalog conditions.
 * Returns raw product data for products that pass all base conditions
 * (active status, country, visibility, seller, boutique, etc.).
 */
async function validateRecProductsBatch(
  productIds: string[],
  country: string,
  filters: SearchFilters,
): Promise<any[]> {
  if (productIds.length === 0) return [];

  const validIds = productIds.filter((id) => /^\d+$/.test(id));
  if (validIds.length === 0) return [];

  const baseConditions = buildBaseConditions(filters, country);
  baseConditions.must.push({ terms: { id: validIds } });

  const response = await client.search({
    index: catalog_index,
    _source: getSourceFields(),
    size: validIds.length,
    query: {
      bool: {
        must: baseConditions.must,
        must_not: baseConditions.must_not,
      },
    },
  });

  return response.hits.hits.map((hit: any) => hit._source);
}

// --- Aggregation Processing ---

/**
 * Mirrors the aggregation processing in getProductsAndFiltersFromElastic.
 */
async function processAggregationResponse(
  aggregations: any,
  languageCode: string,
  country: string,
  filters: SearchFilters,
  filtersOffset: number,
) {
  const CategoriesIds =
    aggregations.top_categories?.filtered_categories?.categories_by_id?.buckets?.map(
      (s: any) => s?.category_details?.hits?.hits?.[0]?._source?.category_id,
    ) || [];

  const categoriesChilds = await getChildrenAndGrandchildren(
    client,
    catalog_index,
    CategoriesIds,
    languageCode,
    country,
    filters,
  );

  const categiresCombo = (
    aggregations.top_categories?.filtered_categories?.categories_by_id
      ?.buckets || []
  ).concat(
    categoriesChilds.top_categories?.filtered_categories?.categories_by_id
      ?.buckets || [],
  );

  const byIdCategoriesComb = (
    aggregations.top_orig_categories?.orig_categories_by_id?.buckets || []
  ).concat(
    categoriesChilds.top_orig_categories?.orig_categories_by_id?.buckets || [],
  );

  return {
    categories: processCategoriesAggregation(
      categiresCombo,
      byIdCategoriesComb,
      filtersOffset,
    ),
    colors: paginateFilters(
      (aggregations.top_colors?.colors_by_color?.buckets || []).map(
        (b: any) => b.key,
      ),
      filtersOffset,
    ),
    sizes: paginateFilters(
      (
        aggregations.top_sizes?.available_size_as_json_by_size?.buckets || []
      ).map((b: any) => b.key),
      filtersOffset,
    ),
    brands: processBrandsAggregation(
      aggregations.top_brands?.filtered_brands?.brands_by_id?.buckets || [],
      filtersOffset,
    ),
    boutiques: processBoutiquesAggregation(
      aggregations.top_boutiques?.filtered_boutiques?.boutiques_by_id
        ?.buckets || [],
      filtersOffset,
    ),
  };
}

// --- Main Enrichment Function ---

/**
 * Enriches boutique listing results with recommended products.
 *
 * Recommended products (validated against catalog conditions) appear first,
 * marked with is_recommended: true, followed by normal catalog products.
 * Strict deduplication by product id. Pagination uses a two-phase cursor:
 * phase "r" for recommendation pages, phase "c" for catalog pages.
 *
 * Returns null if enrichment cannot proceed (fallback to normal flow).
 */
export async function getEnrichedBoutiqueResults(
  params: EnrichedParams,
): Promise<any | null> {
  const {
    filters,
    country,
    language_code,
    is_from_browser,
    limit,
    search_after,
    noFilters,
    userId,
    isAnalyzed,
    filters_offset,
  } = params;

  const boutiqueSlug = filters.boutiques![0];

  // Step 1: Resolve boutique slug → numeric ID
  const boutiqueId = await resolveBoutiqueIdFromSlug(boutiqueSlug, country);
  if (!boutiqueId) return null;

  // Step 2: Get recommendation candidates for user + boutique
  const recCandidates = await fetchBoutiqueRecCandidates(userId, boutiqueId);
  const allRecCandidateIds = recCandidates
    .map((c) => c.id)
    .filter((id) => /^\d+$/.test(id));

  if (allRecCandidateIds.length === 0) return null;

  // Step 3: Parse cursor
  const {
    phase,
    recOffset,
    totalSize: cursorTotalSize,
    esSearchAfter,
  } = parseEnrichedCursor(search_after);

  // Step 4: Collect raw products for this page
  const recRawProducts: any[] = [];
  const catalogRawProducts: any[] = [];
  let newRecOffset = recOffset;
  let catalogSearchAfter: any[] = [];

  if (phase === "r") {
    // Validate rec candidates in batches, preserving recommendation score order
    let currentIndex = recOffset;

    while (
      recRawProducts.length < limit &&
      currentIndex < allRecCandidateIds.length
    ) {
      const needed = limit - recRawProducts.length;
      const batchSize = Math.min(
        needed,
        allRecCandidateIds.length - currentIndex,
      );
      const batchIds = allRecCandidateIds.slice(
        currentIndex,
        currentIndex + batchSize,
      );

      const validRaw = await validateRecProductsBatch(
        batchIds,
        country,
        filters,
      );

      // Restore recommendation score order
      const orderedValid = batchIds
        .map((id) => validRaw.find((p: any) => String(p.id) === id))
        .filter(Boolean);

      for (const product of orderedValid) {
        if (recRawProducts.length >= limit) break;
        recRawProducts.push(product);
      }

      currentIndex += batchSize;
    }

    newRecOffset = currentIndex;

    // Fill remaining slots with catalog products (excluding all rec candidate IDs)
    if (recRawProducts.length < limit) {
      const catalogNeeded = limit - recRawProducts.length;
      const catalogBase = buildBaseConditions(filters, country);

      const catalogQuery: any = {
        index: catalog_index,
        _source: getSourceFields(),
        track_scores: true,
        track_total_hits: true,
        size: catalogNeeded,
        query: {
          bool: {
            must: catalogBase.must,
            must_not: [
              ...catalogBase.must_not,
              { terms: { id: allRecCandidateIds } },
            ],
          },
        },
        sort: [{ _score: { order: "desc" } }, { id: { order: "asc" } }],
      };

      const catalogResponse = await client.search(catalogQuery);
      const catalogHits = catalogResponse.hits.hits as any[];

      catalogHits.forEach((hit: any) => catalogRawProducts.push(hit._source));
      catalogSearchAfter =
        catalogHits.length > 0 ? catalogHits[catalogHits.length - 1].sort : [];
    }
  } else {
    // Phase "c": Only catalog products, recs exhausted
    const catalogBase = buildBaseConditions(filters, country);

    const catalogQuery: any = {
      index: catalog_index,
      _source: getSourceFields(),
      track_scores: true,
      track_total_hits: true,
      size: limit,
      query: {
        bool: {
          must: catalogBase.must,
          must_not: [
            ...catalogBase.must_not,
            { terms: { id: allRecCandidateIds } },
          ],
        },
      },
      sort: [{ _score: { order: "desc" } }, { id: { order: "asc" } }],
    };

    if (esSearchAfter.length > 0) {
      catalogQuery.search_after = esSearchAfter;
    }

    const catalogResponse = await client.search(catalogQuery);
    const catalogHits = catalogResponse.hits.hits as any[];

    catalogHits.forEach((hit: any) => catalogRawProducts.push(hit._source));
    catalogSearchAfter =
      catalogHits.length > 0 ? catalogHits[catalogHits.length - 1].sort : [];
  }

  // Step 5: Process all products through the same pipeline
  const allRawProducts = [...recRawProducts, ...catalogRawProducts];

  const processed = extractFilters(
    allRawProducts,
    language_code,
    is_from_browser,
  );
  const prices = processed.prices;

  if (filters.colors?.length) {
    processed.custom_products = sortSyncColorImagesByFilteredColor(
      processed.custom_products,
      filters,
    );
    sortColorsByFilteredColor(processed.custom_products, filters);
  }

  const normalized = normalizeCustomProducts(processed);

  // Separate rec and catalog products, mark is_recommended, restore order
  const recIdSet = new Set(recRawProducts.map((p) => String(p.id)));

  const recProcessed = normalized.custom_products.filter((p) =>
    recIdSet.has(String(p.product_id)),
  );
  const catalogProcessed = normalized.custom_products.filter(
    (p) => !recIdSet.has(String(p.product_id)),
  );

  // Restore recommendation score order for rec products
  const orderedRecProcessed = recRawProducts
    .map((raw) =>
      recProcessed.find((p) => String(p.product_id) === String(raw.id)),
    )
    .filter(Boolean);

  const finalProducts = [...orderedRecProcessed, ...catalogProcessed].map(
    (p) => ({
      ...p,
      is_redeem: p.has_redeem_discount,
      seller_status: p?.seller_status,
      ...(recIdSet.has(String(p.product_id)) ? { is_recommended: true } : {}),
    }),
  );

  // Step 6: Aggregations + total_size
  let totalSize = cursorTotalSize;
  let aggResults = null;

  if (!noFilters) {
    // Run aggregation query without rec exclusion (preserves correct agg counts)
    const aggBase = buildBaseConditions(filters, country);
    const filtersSize = filters_offset * 10;

    const aggQuery: any = {
      index: catalog_index,
      _source: false,
      track_total_hits: true,
      size: 0,
      query: {
        bool: {
          must: aggBase.must,
          must_not: aggBase.must_not,
        },
      },
      aggs: buildAggregations(
        aggBase.must,
        aggBase.must_not,
        language_code,
        filtersSize,
      ),
    };

    const aggResponse = await client.search(aggQuery);
    totalSize = (aggResponse.hits?.total as any)?.value ?? totalSize;

    const aggregations = aggResponse.aggregations?.filtered_results || {};
    aggResults = await processAggregationResponse(
      aggregations,
      language_code,
      country,
      filters,
      filters_offset,
    );
  } else if (totalSize === null) {
    // noFilters=true and first page: need total_size from a count query
    const countBase = buildBaseConditions(filters, country);
    const countResponse = await client.search({
      index: catalog_index,
      track_total_hits: true,
      size: 0,
      query: {
        bool: {
          must: countBase.must,
          must_not: countBase.must_not,
        },
      },
    });
    totalSize = (countResponse.hits?.total as any)?.value ?? 0;
  }

  // Step 7: Build offset
  let newOffset: any[];

  if (phase === "r" && newRecOffset < allRecCandidateIds.length) {
    // More rec candidates to process on next pages
    newOffset = ["r", newRecOffset, totalSize];
  } else if (catalogSearchAfter.length > 0) {
    // Transitioned to or continuing in catalog phase
    newOffset = ["c", totalSize, ...catalogSearchAfter];
  } else if (
    phase === "r" &&
    newRecOffset >= allRecCandidateIds.length &&
    catalogRawProducts.length === 0
  ) {
    // Recs exhausted this page, catalog not yet started — next page starts catalog
    newOffset = ["c", totalSize];
  } else {
    // No more results
    newOffset = [];
  }

  // Step 8: Return
  if (noFilters) {
    return {
      colors: [],
      offset: newOffset,
      prices: prices,
      isAnalyzed: isAnalyzed,
      applied: filters,
      total_size: totalSize,
      products: finalProducts,
      limit: limit,
    };
  }

  return {
    offset: newOffset,
    limit: limit,
    total_size: totalSize,
    products: finalProducts,
    brands: aggResults?.brands ?? [],
    boutiques: aggResults?.boutiques ?? [],
    categories: aggResults?.categories ?? [],
    attributes:
      (aggResults?.sizes?.length ?? 0) > 0
        ? [{ id: 1, name: "Size", options: aggResults.sizes }]
        : [],
    colors: aggResults?.colors ?? [],
    prices: prices,
    isAnalyzed: isAnalyzed,
    applied: filters,
  };
}
