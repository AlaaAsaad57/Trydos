"use server";

import { fetchServerData } from "./ServerFetch";
import { ReportError } from "utils/errorReported";
import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import { LogServerError } from "utils/serverErrorReporter";
interface CurrencyResponse {
  [key: string]: any;
}

export async function getCurrency(country, language) {
  try {
    let cachedCurrency = await getCurrencyFromCache(country);

    if (typeof cachedCurrency === "string") {
      return { ...JSON.parse(cachedCurrency), redis: true };
    }
    if (cachedCurrency?.exchange_rate) {
      return { ...cachedCurrency, redis: true };
    } else {
      let currencyData = await fetchCurrency(language, country);
      let currency = { ...currencyData.data.currency };

      StoreCurrency(country, currency);
      return { ...currency, redis: false };
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
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/mobile/home/currency?lang=${language}&country=${country}`,
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
