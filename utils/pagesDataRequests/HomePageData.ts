import { cache } from "react";
import {
  fetchBoutiques,
  fetchCurrency,
  fetchFilteredProducts,
  fetchMainCategories,
} from "Server Requests";

export const GetHomeData = cache(
  async (params: { lang: string; mainCategory?: string }) => {
    const key = JSON.stringify(params);

    let [country, language] = params.lang.split("-");
    let category = params.mainCategory;

    let [
      categoriesData,
      flashDealsData,
      featuredData,
      boutiqueData,
      currencyData,
    ] = await Promise.all([
      fetchMainCategories(language, country),
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
      categoriesData,
      flashDealsData,
      featuredData,
      boutiqueData,
      currencyData: currencyData.data.currency,
    };
  }
);
