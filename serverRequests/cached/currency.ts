import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getCurrency } from "serverRequests/currency";

/**
 * The exchange rate and symbol for one country and language (D-11).
 *
 * getCurrency() stays where it is and keeps its "use server" directive:
 * serverRequests/index.tsx re-exports it and client components import that
 * barrel, so a plain module there drags next/headers into the client graph. It
 * type-checks and then fails the build (finding 8).
 *
 * `redis` and `time` are dropped. They measure the call that happened to run,
 * not the money, and storing them would freeze one request's timing into every
 * response served from the entry.
 *
 * The tag is keyed on country only, but the cached function reads `language`
 * too, so both join the cache key — only the arguments a cached function
 * actually uses do. Dropping `language` here would serve one language's answer
 * to every other.
 */
export async function getCachedCurrency(
  country: string,
  language: string,
): Promise<Record<string, any>> {
  "use cache";
  cacheLife("homepage");
  cacheTag(`currency-${country}`);

  const { redis, time, ...currency } = (await getCurrency(
    country,
    language,
  )) as Record<string, any>;

  return currency;
}
