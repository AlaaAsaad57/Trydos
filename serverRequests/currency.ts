"use server";

import { fetchServerData } from "./ServerFetch";
import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import { LogServerError } from "utils/serverErrorReporter";
// Safe here: "use server" module — client imports get action proxies, so
// tokenManager's next/headers never enters the client bundle graph.
import { getMarketFetchBase } from "utils/server/tokenManager";
interface CurrencyResponse {
  [key: string]: any;
}

/**
 * The exchange rate and symbol, from whichever backend the shopper's own
 * User-Data cookie routes them to (verified -> core, guest -> gateway).
 *
 * Do NOT call this from inside a `use cache` scope. getMarketFetchBase() reads
 * the cookie, a cached scope has no cookies, and the read throws — it fails the
 * whole prerender of the route. Use getGatewayCurrency() there.
 */
export async function getCurrency(country, language) {
  return currencyFromBase(country, language, await getMarketFetchBase());
}

/**
 * The same answer, always from the gateway, chosen with no cookie read (D-11).
 *
 * This is the reader a cached render uses. An exchange rate is the same money
 * for everybody in a country, so there is nothing per-shopper to lose by not
 * asking which backend they belong to.
 */
export async function getGatewayCurrency(country, language) {
  return currencyFromBase(country, language, process.env.GO_BACKEND_URL || "");
}

async function currencyFromBase(country, language, base: string) {
  let start = process.hrtime.bigint();

  try {
    let cachedCurrency = await getCurrencyFromCache(country);

    if (typeof cachedCurrency === "string") {
      let end = process.hrtime.bigint();

      return {
        ...JSON.parse(cachedCurrency),
        redis: true,
        time: Number(end - start) / 1_000_000,
      };
    }
    if (cachedCurrency?.exchange_rate) {
      let end = process.hrtime.bigint();
      return {
        ...cachedCurrency,
        redis: true,
        time: Number(end - start) / 1_000_000,
      };
    } else {
      let currencyData = await fetchCurrencyFrom(base, language, country);
      let currency = { ...currencyData.data };
      let end = process.hrtime.bigint();
      StoreCurrency(country, currency);
      return {
        ...currency,
        redis: false,
        time: Number(end - start) / 1_000_000,
      };
    }
  } catch (error) {
    LogServerError(
      { error, type: "get currency error", country, language },
      `/${country}-${language}`,
    );
    return {};
  }
}
export async function fetchCurrency(
  language: string,
  country: string,
): Promise<CurrencyResponse> {
  return fetchCurrencyFrom(await getMarketFetchBase(), language, country);
}

// Not exported: this module is "use server", so every export is also a public
// Server Action endpoint. An exported function that takes a URL base would let
// a browser choose where the server sends the request.
async function fetchCurrencyFrom(
  base: string,
  language: string,
  country: string,
): Promise<CurrencyResponse> {
  let response;
  try {
    response = await fetchServerData({
      url: `${base}/mobile/home/currency?lang=${language}&country=${country}`,
      method: "GET",
      revalidate: 0,
      local: `${country}-${language}`,
    });

    if (response.isError) {
      throw response?.error ?? `Currency Error: ${response.status}`;
    }

    // /mobile/home/currency nests the fields under data.currency; the legacy
    // /home/currency returned them flat in data. Flatten so callers can keep
    // spreading `currencyData.data` (exchange_rate, symbol, ...) unchanged.
    const body = response.data;
    return { ...body, data: body?.data?.currency ?? body?.data };
  } catch (error) {
    LogServerError({
      error: `Currency Error: ${response.status}`,
      source: "currency",
      page: "currency",
      language,
      country,
      response: JSON.stringify(response),
    });

    throw error;
  }
}
