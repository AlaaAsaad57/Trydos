"use server";

import { fetchServerData } from "./ServerFetch";
import { now } from "utils/runtime/timing";
import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import { LogServerError } from "utils/serverErrorReporter";
// Safe here: "use server" module — client imports get action proxies, so
// tokenManager's next/headers never enters the client bundle graph.
import { getMarketFetchBase } from "utils/server/tokenManager";
interface CurrencyResponse {
  [key: string]: any;
}

export async function getCurrency(country, language) {
  let start = now();

  try {
    let cachedCurrency = await getCurrencyFromCache(country);

    if (typeof cachedCurrency === "string") {
      let end = now();

      return {
        ...JSON.parse(cachedCurrency),
        redis: true,
        time: end - start,
      };
    }
    if (cachedCurrency?.exchange_rate) {
      let end = now();
      return {
        ...cachedCurrency,
        redis: true,
        time: end - start,
      };
    } else {
      let currencyData = await fetchCurrency(language, country);
      let currency = { ...currencyData.data };
      let end = now();
      StoreCurrency(country, currency);
      return {
        ...currency,
        redis: false,
        time: end - start,
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
  let response;
  try {
    // Verified users → Laravel, guests → Go (user-based routing)
    response = await fetchServerData({
      url: `${await getMarketFetchBase()}/mobile/home/currency?lang=${language}&country=${country}`,
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
