import {
  fetchBoutiqueDetails,
  fetchCurrency,
  fetchFilteredProducts,
} from "Server Requests";

export const GetFiltersData = async (
  params: { lang: string; filters?: any },
  boutique: string,
  isFeatured: boolean,
  isFlashDeals: boolean,
  withFilters: boolean
) => {
  let returnedBoutique;
  if (!boutique) {
    returnedBoutique = {
      name: "Search",
      banners: null,
      icon: null,
    };
  }
  const key = JSON.stringify(params);

  let [country, language] = params.lang.split("-");
  let filters = params.filters;

  let [productsData, currencyData, boutiqueData] = await Promise.all([
    fetchFilteredProducts(
      language,
      country,
      filters,
      "false",
      withFilters ? "false" : "true",
      null,
      null,
      isFeatured,
      isFlashDeals
    ),
    fetchCurrency(language, country),
    boutique
      ? fetchBoutiqueDetails(boutique, language, country)
      : returnedBoutique,
  ]);

  return {
    products: productsData.data,
    currency: currencyData.data.currency,
    boutique: boutiqueData,
  };
};
