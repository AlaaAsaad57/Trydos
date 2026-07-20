"use server";

import { fetchServerData } from "./ServerFetch";
import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import { LogServerError } from "utils/serverErrorReporter";
interface CurrencyResponse {
  [key: string]: any;
}

export async function getCurrency(country, language) {
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
      let currencyData = await fetchCurrency(language, country);
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
  let response;
  try {
    response = await fetchServerData({
      url: `${process.env.GO_BACKEND_URL}/home/currency?lang=${language}&country=${country}`,
      method: "GET",
      revalidate: 0,
      local: `${country}-${language}`,
    });

    if (response.isError) {
      throw response?.error ?? `Currency Error: ${response.status}`;
    }

    return response.data;
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
