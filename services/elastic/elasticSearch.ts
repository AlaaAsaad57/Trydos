"use server";
import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import AnalyzeSearchText from "./analyzeSearchTextCerebras";
import {
  buildAggregations,
  buildBaseConditions,
  buildSortClause,
  buildPriceHistogramAggregation,
  buildPriceStatsAggregation,
  calculatePriceRange,
  CustomProduct,
  deriveEqualCountCards,
  GenderEnum,
  getChildrenAndGrandchildren,
  getSourceFields,
  GroupAgeEnum,
  logSearchTerm,
  mergePriceHistogram,
  mergePriceStats,
  priceHistogramInterval,
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

// Types and Interfaces
interface SearchParams {
  limit?: number;
  search_after?: any[];
  filters?: SearchFilters;
  language_code?: string;
  country?: string;
  is_from_browser?: boolean;
  filters_offset?: number;
  // User-facing listing sort key (`?sort=`). Maps to an ES sort array via
  // buildSortClause; undefined / unknown ⇒ relevance (unchanged default).
  sort?: string;
  noProducts?: boolean;
  noFilters?: boolean;
  userId?: string | number | null;
  recommended_offset?: number;
  // ── WEB vs MOBILE `_source` split (ticket 7c) ───────────────────────
  // Defaults to the trimmed WEB `_source`. Mobile API routes (source not in
  // this repo) pass `fullSource: true` to get the full field set back.
  fullSource?: boolean;
  // ── Point-in-Time pagination (ADR-009) ──────────────────────────────
  // When `usePit` is set AND the runtime flag is enabled, the product search
  // runs inside a PIT snapshot so every page of one browsing session reads an
  // immutable view (no drift → no duplicate, no skip). `pit_id` carries the
  // snapshot id across pages; null/absent on the first page (a PIT is opened).
  pit_id?: string | null;
  usePit?: boolean;
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
  pit_id?: string | null;
  time: number;
}

interface ElasticsearchHit {
  _source: any;
  sort: any[];
}
interface SearchFilters {
  categories?: string[];
  related_categories?: string[];
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

// ── Point-in-Time pagination (ADR-009) ────────────────────────────────────
// Disabled by default. Flip `ELASTIC_LISTING_PIT=true` to enable the snapshot
// pagination; with the flag off the code path below is inert and the listing
// behaves exactly as before (index-based stateless `search_after`). This is the
// plan's primary rollback (flag off) and lets us stage the rollout.
const LISTING_PIT_ENABLED = process.env.ELASTIC_LISTING_PIT === "true";
const LISTING_PIT_KEEPALIVE = process.env.ELASTIC_LISTING_PIT_KEEPALIVE || "2m";

// ── Global price-filter aggregations (ticket: price-filter-elastic-aggregations)
// Flag OFF ⇒ exact current page-scan price behavior (the primary rollback). When
// ON, the slider bounds / equal-count cards / distribution curve come from global
// Elasticsearch aggregations over ALL matching docs (ADR-010). The debug flag is
// dev-only and is hard-suppressed in production so it can never log there.
const LISTING_PRICE_AGG_ENABLED =
  process.env.LISTING_PRICE_AGG_ENABLED === "true";
const LISTING_PRICE_AGG_DEBUG =
  process.env.LISTING_PRICE_AGG_DEBUG === "true" &&
  process.env.NODE_ENV !== "production";

/**
 * Open a fresh PIT snapshot over the catalog index. Returns the pit id, or null
 * if PIT could not be opened (caller then falls back to index-based search).
 */
async function openListingPit(): Promise<string | null> {
  try {
    const pit = await client.openPointInTime({
      index: catalog_index,
      keep_alive: LISTING_PIT_KEEPALIVE,
    });
    return pit?.id ?? null;
  } catch (error) {
    LogServerError(
      { error, type: "openListingPit failed" },
      "/listing/pit",
    );
    return null;
  }
}

/**
 * Run a product search that may be PIT-scoped. On a PIT-expired/invalid error
 * we transparently re-open a fresh PIT and retry once from the same cursor
 * (OQ-1: resume-and-continue, never end early). Returns the search response and
 * the pit id that was actually in effect (rotated id if the server returned one,
 * or the freshly re-opened id after a retry).
 */
async function runListingSearch(
  searchQuery: any,
  activePitId: string | null,
): Promise<{ response: any; pitId: string | null }> {
  try {
    const response = await client.search(searchQuery);
    return { response, pitId: (response as any)?.pit_id ?? activePitId };
  } catch (error) {
    // Only attempt a resume when we were actually using a PIT.
    if (!activePitId) throw error;
    const fresh = await openListingPit();
    if (!fresh) throw error;
    searchQuery.pit = { id: fresh, keep_alive: LISTING_PIT_KEEPALIVE };
    const response = await client.search(searchQuery);
    return { response, pitId: (response as any)?.pit_id ?? fresh };
  }
}

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
    pit_id = null,
    usePit = false,
    fullSource = false,
    sort,
  } = params;
  if (filters?.prices) {
    filters = { ...filters, priceRange: filters.prices };
  }

  let start = process.hrtime.bigint();
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

    const relatedBaseConditions = buildBaseConditions(
      { ...filters, categories: [], related_categories: [] },
      country,
    );

    const searchQuery = {
      index: catalog_index,
      _source: getSourceFields(fullSource),
      track_scores: true,
      // Facet/initial loads still get a bounded count for display; pure
      // product-pagination requests (`noFilters`) skip the full count.
      track_total_hits: noFilters ? false : 10000,
      size: limit,
      query: {
        bool: {
          must: mustConditions,
          must_not: mustNotConditions,
        },
      },
      sort: buildSortClause(sort, language_code),
      aggs: buildAggregations(
        mustConditions,
        mustNotConditions,
        language_code,
        filtersSize,
        relatedBaseConditions.must,
        relatedBaseConditions.must_not,
      ),
    };

    if (noFilters) delete searchQuery.aggs;

    // Facet-only requests (`noProducts`) never need product hits — the facets
    // are served entirely from `aggs`, independent of any price-agg flag.
    if (noProducts) (searchQuery as any).size = 0;

    // ── Global price-facet (ticket: price-filter-elastic-aggregations) ───────
    // The price facet re-scopes to ALL active filters INCLUDING the selected
    // price range, so the slider bounds, the curve, and the cards reflect the
    // current selection (product-owner testing decision; supersedes the earlier
    // self-excluding approach). It uses the same must/must_not as the main query.
    // For the filters-only panel request (`noProducts`) product fetching is
    // already forced to `size: 0` above, independent of this flag.
    let priceFacetActive = false;
    if (LISTING_PRICE_AGG_ENABLED && !noFilters && (searchQuery as any).aggs) {
      priceFacetActive = true;
      (searchQuery as any).aggs.price_facet = buildPriceStatsAggregation(
        mustConditions,
        mustNotConditions,
        country,
      );
    }

    // Add search_after for pagination
    if (search_after?.length > 0) {
      // @ts-ignore
      searchQuery.search_after = search_after;
    }

    // ── PIT scoping (ADR-009) ────────────────────────────────────────────
    // When enabled: reuse the incoming pit_id, or open a fresh PIT for the
    // first page of the session. A PIT search must NOT carry an `index`.
    const pitEnabled = usePit && LISTING_PIT_ENABLED;
    let activePitId: string | null = pitEnabled
      ? pit_id || (await openListingPit())
      : null;
    if (activePitId) {
      // @ts-ignore — `pit` replaces `index` on a snapshot search
      delete searchQuery.index;
      // @ts-ignore
      searchQuery.pit = { id: activePitId, keep_alive: LISTING_PIT_KEEPALIVE };
    }

    // Execute search with pagination
    const customProducts: any[] = [];
    let lastSortValue: any[] = search_after;

    const { response, pitId: effectivePitId } = await runListingSearch(
      searchQuery,
      activePitId,
    );
    activePitId = effectivePitId;
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

    // ── Global price-facet result (ticket: price-filter-elastic-aggregations) ─
    // Replace the page-scan prices with aggregation-derived bounds + cards over
    // ALL matching docs. Phase 1 (stats) rides the main request above; Phase 2
    // (the fine histogram → curve + equal-count cards) is a cheap `size:0`
    // aggregation-only request. It runs for any filter-bearing request
    // (`!noFilters`) — including the `/filters` page render, which fetches the
    // grid (`noProducts:false`) yet still needs the cards. Grid-only pagination
    // (`GetProducts`) passes `noFilters:true`, so it is excluded entirely.
    if (LISTING_PRICE_AGG_ENABLED && !noFilters && priceFacetActive) {
      const computeStart = process.hrtime.bigint();
      const priceFacet = (response as any).aggregations?.price_facet;
      // Stats are re-scoped to all active filters (incl. the selected price
      // range), so the slider bounds track the current selection.
      const stats = mergePriceStats(priceFacet);
      let histogram: { min_price: number; max_price: number; count: number }[] =
        [];
      let priceRanges: any[] = [];

      if (stats.max_price > stats.min_price) {
        // One histogram over the re-scoped result set feeds BOTH the curve and
        // the equal-count cards, so all of slider/curve/cards agree.
        const interval = priceHistogramInterval(stats.min_price, stats.max_price);
        const { response: histResponse } = await runListingSearch(
          {
            index: catalog_index,
            size: 0,
            track_total_hits: false,
            query: { match_all: {} },
            aggs: {
              price_facet_hist: buildPriceHistogramAggregation(
                mustConditions,
                mustNotConditions,
                country,
                interval,
                stats.min_price,
              ),
            },
          } as any,
          null,
        );
        histogram = mergePriceHistogram(
          (histResponse as any).aggregations?.price_facet_hist,
          interval,
        );
        priceRanges = deriveEqualCountCards(histogram);
      } else if (stats.total > 0) {
        // All matching products share one price → a single card / flat curve.
        histogram = [
          {
            min_price: stats.min_price,
            max_price: stats.max_price,
            count: stats.total,
          },
        ];
        priceRanges = [
          {
            min_price: stats.min_price,
            max_price: stats.max_price,
            products_count: stats.total,
          },
        ];
      }

      prices = {
        min_price: stats.min_price,
        max_price: stats.max_price,
        priceRanges,
        histogram,
        total: stats.total,
      };

      // if (LISTING_PRICE_AGG_DEBUG) {
      //   const computeEnd = process.hrtime.bigint();
      //   console.debug(
      //     "[price-agg]",
      //     JSON.stringify({
      //       country,
      //       filters: {
      //         must: mustConditions.length,
      //         must_not: mustNotConditions.length,
      //       },
      //       base_stats: priceFacet?.base_stats?.stats,
      //       country_stats: priceFacet?.country_stats?.matched?.stats,
      //       merged: stats,
      //       histogramBuckets: histogram.length,
      //       cards: priceRanges,
      //       es_took_ms: (response as any).took,
      //       compute_ms: Number(computeEnd - computeStart) / 1_000_000,
      //     }),
      //   );
      // }
    }

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

    // try {
    //   const enrichResult = await enrichWithRecommended({
    //     userId: userId ? String(userId) : null,
    //     filters,
    //     offset: recommended_offset,
    //     limit,
    //     language_code,
    //     country,
    //   });

    //   if (enrichResult?.products?.length) {
    //     recommendedProducts = enrichResult.products;
    //     newRecommendedOffset = enrichResult.recommended_offset;
    //   }
    // } catch {
    //   // Silently continue — recommendations are non-critical
    // }

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
      let end = process.hrtime.bigint();
      return {
        colors: colorsFilter,
        offset: lastSortValue,
        prices: prices,
        isAnalyzed: isAnalyzed,
        applied: filters,
        total_size: total_size,
        products: mergedProducts,
        limit: limit,
        time: Number(end - start) / 1_000_000,
        recommended_offset: newRecommendedOffset,
        pit_id: activePitId,
      };
    }

    const aggregations = response.aggregations?.filtered_results || {};
    const relatedAggregations =
      response.aggregations?.global_related_scope?.related_filtered_results ||
      {}; // Process filters
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
      relatedAggregations,
      categoriesResult.genderAgePairs,
      filters_offset,
    );

    const existingCategoryKeys = new Set<string>();
    const collectCategoryKeys = (categories: any[] = []) => {
      for (const category of categories) {
        const categoryId = category?.category_id ?? category?.id;
        if (categoryId != null) {
          existingCategoryKeys.add(`id:${String(categoryId)}`);
        }
        if (category?.slug) {
          existingCategoryKeys.add(`slug:${String(category.slug)}`);
        }
        if (Array.isArray(category?.childes) && category.childes.length > 0) {
          collectCategoryKeys(category.childes);
        }
      }
    };

    const dedupeRelatedTree = (categories: any[] = []): any[] => {
      const deduped: any[] = [];

      for (const category of categories) {
        const categoryId = category?.category_id ?? category?.id;
        const idKey = categoryId != null ? `id:${String(categoryId)}` : null;
        const slugKey = category?.slug ? `slug:${String(category.slug)}` : null;
        const isSelectedSlug =
          !!category?.slug &&
          (filters?.categories || []).includes(String(category.slug));

        const shouldSkip =
          isSelectedSlug ||
          (idKey && existingCategoryKeys.has(idKey)) ||
          (slugKey && existingCategoryKeys.has(slugKey));

        const dedupedChildren = dedupeRelatedTree(category?.childes || []);

        if (shouldSkip) {
          continue;
        }

        deduped.push({
          ...category,
          childes: dedupedChildren,
        });
      }

      return deduped;
    };

    collectCategoryKeys(categoriesFilter);
    const uniqueRelatedCategories = dedupeRelatedTree(relatedCategoriesFilter);

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
    let end = process.hrtime.bigint();
    // console.log(
    //   filters.search_text,
    //   "search term",
    //   total_size,
    //   "products count",
    //   "Time taken:",
    //   Number(end - start) / 1_000_000,
    //   "ms",
    // );
    if (
      filters?.search_text &&
      filters.search_text.trim().length > 0 &&
      total_size !== undefined &&
      total_size > 0
    ) {
      logSearchTerm({
        searchText: filters.search_text,
        userData: {
          id: userId,
        },
        productsCount: total_size,
        client,
      });
    }
    return {
      offset: lastSortValue,
      limit: limit,
      total_size: total_size,
      products: mergedProducts,
      brands: brandsFilter,
      boutiques: boutiquesFilter,
      categories: categoriesFilter,
      related_categories: uniqueRelatedCategories.map((s) => ({
        ...s,
        group_age: GroupAgeEnum[s.group_age].label,
        gender: GenderEnum[s.gender].label,
        realted: categoriesFilter
          .filter(
            (category) =>
              category.group_age === s.group_age &&
              category.gender === s.gender,
          )
          .map((s) => s.slug),
      })),
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
      pit_id: activePitId,
      time: Number(end - start) / 1_000_000,
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
async function fetchProductDetailsBatch(
  ids: string[],
  country: string,
  fullSource: boolean = false,
) {
  if (ids.length === 0) return [];

  const baseConditions = buildBaseConditions({}, country);
  const { must, must_not } = baseConditions;

  // We strictly look for these specific IDs
  must.push({ terms: { id: ids } });

  const response = await client.search({
    index: catalog_index,
    _source: getSourceFields(fullSource),
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
  fullSource = false,
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
        fullSource,
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

  // One product document must yield exactly one card. A document's
  // `custom_products` is its per-language localization set; pick the single row
  // matching the requested language. Using `.find` (not `.forEach`) guards
  // against duplicate localized rows for the same language in the index, which
  // would otherwise render the same product multiple times.
  products?.forEach((product) => {
    if (product.custom_products && Array.isArray(product.custom_products)) {
      const matchingCustomProduct = product.custom_products.find(
        (cp: any) => cp.language_code === languageCode,
      );
      if (matchingCustomProduct) {
        const processed = processCustomProduct(
          product,
          matchingCustomProduct,
          languageCode,
          isFromBrowser,
          country,
        );
        customProducts.push(processed);
      }
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

export interface RelatedProductsParams {
  productId: number;
  limit?: number;
  search_after?: any[];
  language_code?: string;
  country?: string;
  pit_id?: string | null;
  usePit?: boolean;
  fullSource?: boolean;
}

export async function getRelatedProducts(
  params: RelatedProductsParams
): Promise<SearchResult> {
  const {
    productId,
    limit = 10,
    search_after = [],
    language_code = "en",
    country = "",
    pit_id = null,
    usePit = false,
    fullSource = false,
  } = params;

  let start = process.hrtime.bigint();
  try {
    // 1. Fetch the current product from ES by id to get its categories.gender and categories.group_age
    const productResponse = await client.search({
      index: catalog_index,
      size: 1,
      query: {
        term: { id: productId }
      }
    });

    const hit = productResponse.hits.hits[0];
    if (!hit) {
      return {
        offset: [],
        limit,
        total_size: 0,
        products: [],
        time: 0,
      };
    }

    const currentProduct = hit._source as any;
    const categories = currentProduct.categories || [];
    
    // Extract distinct gender + group_age pairs
    const pairs: { gender: number; group_age: number }[] = [];
    const seenPairs = new Set<string>();
    for (const cat of categories) {
      if (
        cat.gender !== undefined &&
        cat.gender !== null &&
        cat.group_age !== undefined &&
        cat.group_age !== null
      ) {
        const key = `${cat.gender}_${cat.group_age}`;
        if (!seenPairs.has(key)) {
          seenPairs.add(key);
          pairs.push({ gender: cat.gender, group_age: cat.group_age });
        }
      }
    }

    // If the product doesn't have any categories with gender + group_age, return empty list
    if (pairs.length === 0) {
      return {
        offset: [],
        limit,
        total_size: 0,
        products: [],
        time: 0,
      };
    }

    // 2. Build the query to find related products
    const baseConditions = buildBaseConditions({}, country);
    const { must: mustConditions, must_not: mustNotConditions } = baseConditions;

    // Filter by same gender + group_age pairs
    const shouldQueries = pairs.map((pair) => ({
      bool: {
        must: [
          { term: { "categories.gender": pair.gender } },
          { term: { "categories.group_age": pair.group_age } }
        ]
      }
    }));

    mustConditions.push({
      nested: {
        path: "categories",
        query: {
          bool: {
            should: shouldQueries,
            minimum_should_match: 1
          }
        }
      }
    });

    // Exclude the current product
    mustNotConditions.push({ term: { id: productId } });

    const searchQuery: any = {
      index: catalog_index,
      _source: getSourceFields(fullSource),
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
    };

    if (search_after?.length > 0) {
      searchQuery.search_after = search_after;
    }

    // ── PIT scoping (ADR-009) — same snapshot pagination as the main listing.
    const pitEnabled = usePit && LISTING_PIT_ENABLED;
    let activePitId: string | null = pitEnabled
      ? pit_id || (await openListingPit())
      : null;
    if (activePitId) {
      delete searchQuery.index;
      searchQuery.pit = { id: activePitId, keep_alive: LISTING_PIT_KEEPALIVE };
    }

    // Execute the search (with transparent PIT resume on expiry)
    const { response, pitId: effectivePitId } = await runListingSearch(
      searchQuery,
      activePitId,
    );
    activePitId = effectivePitId;
    const hits = response.hits.hits as ElasticsearchHit[];
    const total_size = typeof response.hits?.total === "number" ? response.hits.total : (response.hits?.total as any)?.value;

    const customProducts: any[] = [];
    hits.forEach((hit: ElasticsearchHit) => {
      customProducts.push(hit._source);
    });
    const lastSortValue = hits.length > 0 ? hits[hits.length - 1].sort : [];

    // Extract & normalize results
    const productsWithFilters = extractFilters(
      customProducts,
      language_code,
      true, // is_from_browser
      country,
    );

    const normalizedProducts = normalizeCustomProducts(productsWithFilters);

    const catalogProducts =
      normalizedProducts.custom_products?.map((s) => ({
        ...s,
        is_luck: s.redeem_price > 0,
        luck_price: s.redeem_price,
        seller_status: s?.seller_status,
      })) ?? [];

    let end = process.hrtime.bigint();

    return {
      offset: lastSortValue,
      limit: limit,
      total_size: total_size,
      products: catalogProducts,
      pit_id: activePitId,
      time: Number(end - start) / 1_000_000,
    };
  } catch (error) {
    LogServerError({
      scenario: "getRelatedProducts in elasticSearch",
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      `Related products search failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
