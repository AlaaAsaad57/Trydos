import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";

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
