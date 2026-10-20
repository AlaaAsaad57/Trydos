"use server";

import { GetRecomendationsForUser } from "services/elastic/elasticSearch";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { getCookieServer } from "utils/cookies/server-cookie-manager";
import { normalizeListingProduct } from "utils/listing/normalizeListingProduct";
import { parseNumberArray } from "utils/server/helpers";

// The next page of the home recommendations row ("Show More").
//
// A1-8: the shopper is whoever holds the session cookie, never a value the
// browser sends. A public Server Action that trusted `userId` from the page
// let anyone read another shopper's recommendations by changing a number.
//
// Why this is its own file and not in `serverRequests/home.tsx`: that module
// is reached from `serverRequests/cached/home.ts`, a `use cache` graph, and the
// cached-tree guard (tests/cache/noRuntimeReadsInCachedTree.test.ts) fails on
// any cookie read it can reach. This action is called from the browser only,
// so nothing cached can reach it from here.

const DEFAULT_LIMIT = 7;
// The row loads seven at a time; a page size from the browser is capped so a
// script cannot ask the search cluster for thousands in one call.
const MAX_LIMIT = 20;

export async function GetNextRecommendations({
  language,
  country,
  offset,
  limit,
}: {
  language: string;
  country: string;
  offset?: string | null;
  limit?: number;
}) {
  const user = await getCookieServer<{ id?: number | string }>(
    COOKIE_NAMES.USER_DATA,
  );
  const size = Math.min(
    Math.max(Number(limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const response: any = await GetRecomendationsForUser({
    country,
    language,
    limit: size,
    // A visitor with no profile cookie is asked for as a guest, with no id.
    userId: user?.id,
    search_after: parseNumberArray(offset),
  });
  return {
    items: response.products.map(normalizeListingProduct),
    offset: response?.offset,
  };
}
