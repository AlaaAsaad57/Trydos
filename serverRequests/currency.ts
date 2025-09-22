"use server";

import { reportError } from "utils/error-reporter";
import { fetchServerData } from "./ServerFetch";

interface CurrencyResponse {
  [key: string]: any;
}

export async function fetchCurrency(
  language: string,
  country: string
): Promise<CurrencyResponse> {
  try {
    const response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/mobile/home/currency?lang=${language}&country=${country}`,
      method: "GET",
      revalidate: 0,
      local: `${country}-${language}`,
    });

    if (response.isError) {
      console.error(`Currency Error: ${response.status}`);
      reportError(new Error(`Currency Error: ${response.status}`), {
        source: "currency",
        page: "currency",
        language: language,
        country: country,
        response: JSON.stringify(response),
      });
      return {
        currency: { data: null, message: "Currency not found" },
      };
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching currency:", error);
    throw error;
  }
}
