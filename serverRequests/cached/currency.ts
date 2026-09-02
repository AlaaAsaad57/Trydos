import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getGatewayCurrency } from "serverRequests/currency";

/**
 * The exchange rate and symbol for one country and language (D-11).
 *
 * getGatewayCurrency(), not getCurrency(). getCurrency() picks its backend by
 * reading the User-Data cookie, and a `use cache` scope has no cookies: the read
 * throws and the prerender of the whole route fails. The gateway reader takes
 * that decision out of the request (D-11), which is safe because an exchange
 * rate is the same money for every shopper in a country.
 *
 * Both readers stay in serverRequests/currency.ts and keep its "use server"
 * directive: serverRequests/index.tsx re-exports that module and client
 * components import the barrel, so a plain module there drags next/headers into
 * the client graph. It type-checks and then fails the build (finding 8).
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

  const { redis, time, ...currency } = (await getGatewayCurrency(
    country,
    language,
  )) as Record<string, any>;

  return currency;
}
