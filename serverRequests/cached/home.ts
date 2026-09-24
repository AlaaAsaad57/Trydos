import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
import {
  GetFeaturedProducts,
  GetFlashDealProducts,
  GetHomeBoutiques,
} from "serverRequests/home";
import { normalizeListingProduct } from "utils/listing/normalizeListingProduct";
import type { ListingProduct } from "types/listing";

// Cached readers for the home and category views.
//
// This module is deliberately NOT "use server". A "use server" module cannot
// carry "use cache", and every export in one is also a public Server Action
// endpoint. Do not add it to serverRequests/index.tsx either — that barrel is
// imported by client components, and a next/headers import reaching it breaks
// the build (it type-checks, then fails at build time).
//
// Every function here takes plain serialisable arguments. Nothing reads a
// cookie, a header or the clock: those are the three things a `use cache` scope
// forbids, and they are also the three things that would make one shopper's data
// end up in another shopper's cache entry.
//
// EVERY reader must take country AND language, and must use both. Only the
// values a cached function actually reads join its cache key. Measured on this
// repo: a cached function that ignored the locale served one entry to /lb-ar and
// /tr-tr alike. Nothing warns you — the page renders, with the wrong prices and
// the wrong words. See docs/homepage-cache-phase-2-measurements.md.

export interface HomeCategory {
  id: string | number;
  name: string;
  slug: string;
  flat_photo_path?: { file_path?: string } | null;
  outline_photo_path?: { file_path?: string } | null;
  fill_photo_path?: { file_path?: string } | null;
}

/**
 * The category tabs, one entry per category, in one language.
 *
 * The Elasticsearch call asks for up to 4000 product documents and each one
 * carries every language variant of its categories. Caching that raw answer
 * would store the whole hit set per (country, language). Only the six fields the
 * navbar renders are kept, so the cache entry stays small (finding 12).
 */
export async function getCachedCategories(
  country: string,
  language: string,
): Promise<HomeCategory[]> {
  "use cache";
  cacheLife("homepage");
  cacheTag(`categories-${country}-${language}`);

  const reader = new ElasticsearchReader();
  const result: any = await reader.getCategories({ country, size: 4000 });

  const wanted = language?.toLowerCase();
  const byId = new Map<string | number, HomeCategory>();

  for (const item of result?.hits?.hits ?? []) {
    const match = item?._source?.custom_categories?.find(
      (candidate: any) => candidate?.language_code?.toLowerCase() === wanted,
    );
    if (!match || byId.has(match.id)) continue;
    byId.set(match.id, {
      id: match.id,
      name: match.name,
      slug: match.slug,
      flat_photo_path: match.flat_photo_path ?? null,
      outline_photo_path: match.outline_photo_path ?? null,
      fill_photo_path: match.fill_photo_path ?? null,
    });
  }

  return [...byId.values()];
}

/** A category slug as an Elasticsearch filter, or undefined for "no filter". */
function categoryFilter(slug: string | null): string | undefined {
  return slug ? JSON.stringify([slug]) : undefined;
}

/**
 * The featured row, for one country, language and category.
 *
 * `normalizeListingProduct` no longer reads the redeemed cookie, which is what
 * makes this cacheable at all (Task 9). What comes back is a fact about the
 * products; the shopper's own redemption record is applied in their browser.
 */
export async function getCachedFeatured(
  country: string,
  language: string,
  categorySlug: string | null,
): Promise<ListingProduct[]> {
  "use cache";
  cacheLife("homepage");
  cacheTag(`featured-${country}-${language}-${categorySlug ?? "all"}`);

  const response: any = await GetFeaturedProducts({
    language,
    country,
    category: categoryFilter(categorySlug),
    limit: 10,
  });
  return (response?.data?.products ?? []).map((product: any) =>
    normalizeListingProduct(product),
  );
}

/**
 * The flash-deal row, for one country, language and category.
 *
 * The deal window is decided by Elasticsearch date math (`now/d`), not by a
 * clock read here — a `use cache` scope has no clock, and a baked timestamp
 * would freeze the deal window into the entry. See services/elastic/helpers.ts.
 */
export async function getCachedFlashDeals(
  country: string,
  language: string,
  categorySlug: string | null,
): Promise<ListingProduct[]> {
  "use cache";
  cacheLife("homepage");
  cacheTag(`flash-${country}-${language}-${categorySlug ?? "all"}`);

  const response: any = await GetFlashDealProducts({
    language,
    country,
    category: categoryFilter(categorySlug),
    limit: 10,
  });
  return (response?.data?.products ?? []).map((product: any) =>
    normalizeListingProduct(product),
  );
}

/**
 * The boutique offers section, for one country, language and category.
 *
 * The offset travels with the boutiques: the infinite scroll asks for the next
 * page with it, so a cached section without one can never grow.
 */
export async function getCachedBoutiques(
  country: string,
  language: string,
  categorySlug: string | null,
): Promise<{ boutiques: any[]; offset: any }> {
  "use cache";
  cacheLife("homepage");
  cacheTag(`boutiques-${country}-${language}-${categorySlug ?? "all"}`);

  const response: any = await GetHomeBoutiques({
    language,
    country,
    category: categoryFilter(categorySlug) ?? null,
  });
  return {
    boutiques: response?.data?.boutiques ?? [],
    offset: response?.data?.offset ?? null,
  };
}
