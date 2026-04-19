"use server";

import { elasticSearchClient } from "services/elastic/elasticsearch.config";
import { catalog_index, recommendation_index } from "./INDEXES";
import {
  buildBaseConditions,
  extractFilters,
  getSourceFields,
  normalizeCustomProducts,
} from "./helpers";
import { LogServerError } from "utils/serverErrorReporter";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RecommendedProduct {
  product_id: string;
  item_id?: string;
  boutique_id: string;
  score: number;
}

interface RecommendationCandidate {
  id: string;
  boutique_id: string;
  score: number;
}

interface EnrichFilters {
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

interface EnrichResult {
  products: Array<Record<string, unknown> & { is_recommended: true }>;
  recommended_offset: number;
}

// Keys that do not count as "extra" filters
const ALLOWED_FILTER_KEYS = new Set(["boutiques"]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasOnlyBoutiqueFilter(filters: EnrichFilters): boolean {
  const activeKeys = Object.keys(filters).filter((key) => {
    const value = filters[key];
    if (value === undefined || value === null) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (value === false) return false;
    return true;
  });

  return activeKeys.every((key) => ALLOWED_FILTER_KEYS.has(key));
}

function getSingleBoutique(filters: EnrichFilters): string | null {
  const boutiques = filters?.boutiques;
  if (!Array.isArray(boutiques) || boutiques.length !== 1) return null;
  return boutiques[0] || null;
}

// ─── Core ────────────────────────────────────────────────────────────────────

async function fetchUserRecommendations(
  userId: string,
): Promise<RecommendationCandidate[]> {
  const client = elasticSearchClient;

  const sourceFields = [
    "recommended_products.product_id",
    "recommended_products.item_id",
    "recommended_products.boutique_id",
    "recommended_products.score",
  ];

  const response = await client.search({
    index: recommendation_index,
    _source: sourceFields,
    size: 1,
    query: { term: { user_id: Number(userId) } },
  });

  const source = response.hits.hits?.[0]?._source as
    | { recommended_products?: RecommendedProduct[] }
    | undefined;

  if (!source?.recommended_products) return [];

  return source.recommended_products
    .map((item) => ({
      id: String(item.product_id || item.item_id),
      boutique_id: String(item.boutique_id ?? ""),
      score: item.score ?? 0,
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Validate a batch of product IDs against the catalog.
 * Returns only products that are active (status 1, boutique/brand active).
 * Mirrors the pattern used by GetRecomendationsForUser → fetchProductDetailsBatch.
 */
async function fetchValidProductsBatch(
  ids: string[],
  country: string,
  language_code: string,
) {
  if (ids.length === 0) return [];

  const { must, must_not } = buildBaseConditions({}, country);
  must.push({ terms: { id: ids } });

  const response = await elasticSearchClient.search({
    index: catalog_index,
    _source: getSourceFields(),
    size: ids.length,
    query: { bool: { must, must_not } },
  });

  const rawProducts = response.hits.hits.map((hit) => hit._source as any);
  const processed = extractFilters(rawProducts, language_code, true);
  const normalised = normalizeCustomProducts(processed);

  return normalised.custom_products.map((p) => ({
    ...p,
    is_luck: p.luck_price > 0,
    luck_price: p.luck_price,
    seller_status: p?.seller_status,
  }));
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Intercepts a product listing request to inject personalised recommendations.
 *
 * Returns `null` when the context is not eligible (missing user, extra filters,
 * or multi-boutique view), so the caller can fall back to the standard listing.
 */
export async function enrichWithRecommended({
  userId,
  filters,
  offset = 0,
  limit = 10,
  language_code = "en",
  country = "",
}: {
  userId?: string | null;
  filters: EnrichFilters;
  offset?: number;
  limit?: number;
  language_code?: string;
  country?: string;
}): Promise<EnrichResult | null> {
  // ── Step A: Guard Clauses ──────────────────────────────────────────────

  if (!userId) return null;
  if (!hasOnlyBoutiqueFilter(filters)) return null;

  const boutiqueSlug = getSingleBoutique(filters);
  if (!boutiqueSlug) return null;

  try {
    // ── Step B: Fetch & Filter Recommendations ─────────────────────────

    const allCandidates = await fetchUserRecommendations(userId);

    const filteredCandidates = allCandidates.filter(
      (c) => c.boutique_id === boutiqueSlug,
    );

    if (filteredCandidates.length === 0) {
      return { products: [], recommended_offset: 0 };
    }

    // ── Step C: Hydration Loop ─────────────────────────────────────────
    //
    // We need exactly `limit` valid products. Recommendations can be stale
    // (out of stock, disabled) so we fetch in batches of 2× what we need
    // and keep looping until we fill the page or exhaust candidates.

    const BATCH_MULTIPLIER = 2;
    const validProducts: Array<
      Record<string, unknown> & { is_recommended: true }
    > = [];
    let currentOffset = offset;

    while (
      validProducts.length < limit &&
      currentOffset < filteredCandidates.length
    ) {
      const needed = limit - validProducts.length;
      const batchSize = Math.min(
        needed * BATCH_MULTIPLIER,
        filteredCandidates.length - currentOffset,
      );

      const batch = filteredCandidates.slice(
        currentOffset,
        currentOffset + batchSize,
      );

      const batchIds = batch.map((c) => c.id).filter((id) => /^\d+$/.test(id));

      if (batchIds.length === 0) {
        currentOffset += batchSize;
        continue;
      }

      // Validate batch against the catalog (checks stock, visibility, etc.)
      const catalogProducts = await fetchValidProductsBatch(
        batchIds,
        country,
        language_code,
      );

      const validIdSet = new Set(
        catalogProducts.map((p) => String(p.id ?? p.product_id)),
      );

      // Re-order by recommendation score (batch is already score-sorted)
      for (const candidate of batch) {
        if (validProducts.length >= limit) break;
        if (!validIdSet.has(candidate.id)) continue;

        const product = catalogProducts.find(
          (p) => String(p.id ?? p.product_id) === candidate.id,
        );
        if (!product) continue;

        validProducts.push({
          ...product,
          is_recommended: true,
        });
      }

      currentOffset += batchSize;
    }

    return {
      products: validProducts,
      recommended_offset: currentOffset,
    };
  } catch (error) {
    LogServerError({
      scenario: "enrichWithRecommended",
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
