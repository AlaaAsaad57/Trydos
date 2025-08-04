import { cache } from "react";
import {
  fetchBoutiques,
  fetchCurrency,
  fetchFilteredProducts,
  fetchMainCategories,
} from "Server Requests";

export const GetHomeData = cache(
  async (params: { lang: string; mainCategory?: string }) => {
    let [country, language] = params.lang.split("-");

    let [flashDealsData, featuredData, boutiqueData, currencyData] =
      await Promise.all([
        fetchFilteredProducts(
          language,
          country,
          [],
          "false",
          "true",
          null,
          null,
          false,
          true
        ),
        fetchFilteredProducts(
          language,
          country,
          [],
          "false",
          "true",
          null,
          null,
          true,
          false
        ),
        fetchBoutiques(language, country, params.mainCategory || "", null, 10),
        fetchCurrency(language, country),
      ]);

    return {
      flashDealsData,
      featuredData,
      boutiqueData,
      currencyData: currencyData.data.currency,
    };
  }
);
