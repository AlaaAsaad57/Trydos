import { useAppStore } from "store";
import { buildParamsFromFilters } from "utils/tinyUtils";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import { LogError } from "utils/functions";
import { logSearchTerm } from "./elastic/helpers";

class SearchService {
  private searchAbortController: AbortController | null = null;

  async getTrendingSearch() {
    try {
      let response = await fetchData({
        url: "/api/products/popular-search",
        reqTitle: REQUESTS_DATA.GET_TRENDING_SEARCH,
        method: "GET",
        server: "elastic",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      return response;
    } catch (error) {
      LogError({
        error,
        scenario: "Error in GetTrendingSearch in services/search",
      });
      return null;
    }
  }

  async getSearchOptions({
    noProducts = false,
    lang,
    noFilters = false,
    filters_offset = null,
    replace = true,
    searchValue = null,
  }) {
    // Cancel any in-flight request
    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }
    const [country, language] = lang.split("-");
    // Create new AbortController for this request
    this.searchAbortController = new AbortController();
    const signal = this.searchAbortController.signal;

    const {
      setSearchResults,
      searchFilters,
      value,
      setTotalSizeOfProducts,
      setSearchPartialLoading,
      setSearchLoading,
    } = useAppStore.getState();
    setSearchPartialLoading(true);
    setSearchLoading(true);
    try {
      // Build path-based filter URL
      const filterObj = {
        boutiques: searchFilters?.boutiques?.map((b) => b.slug) || [],
        categories: searchFilters?.categories?.map((c) => c.slug) || [],
        brands: searchFilters?.brands?.map((b) => b.slug) || [],
        colors:
          searchFilters?.colors?.map((c) =>
            typeof c === "string" ? c : c.toString(),
          ) || [],
        sizes:
          searchFilters?.sizes?.map((s) =>
            typeof s === "string" ? s : s.toString(),
          ) || [],
        prices:
          searchFilters?.prices &&
          searchFilters.prices.min_price !== null &&
          searchFilters.prices.min_price !== undefined &&
          searchFilters.prices.max_price !== null &&
          searchFilters.prices.max_price !== undefined &&
          !isNaN(Number(searchFilters.prices.min_price)) &&
          !isNaN(Number(searchFilters.prices.max_price)) &&
          Number(searchFilters.prices.min_price) >= 0 &&
          Number(searchFilters.prices.max_price) > 0
            ? [searchFilters.prices.min_price, searchFilters.prices.max_price]
            : [],
        search_text:
          searchValue?.length > 0
            ? searchValue
            : value?.length > 0
              ? value
              : null,
      };

      const filtersResponse = await getProductsAndFiltersFromElastic({
        country: country,
        language_code: language,
        filters: filterObj,
        filters_offset: filters_offset ?? 1,
        limit: 10,
        noProducts: noProducts,
      });
      const {
        products,
        categories,
        brands,
        boutiques,
        colors,
        attributes: attributes,
        total_size,
      } = filtersResponse;
      setTotalSizeOfProducts({ total_size });
      setSearchResults(
        {
          products,
          categories,
          brands,
          boutiques,
          colors,
          sizes: attributes?.[0]?.options || [],
          prices: {
            min_price: filtersResponse?.prices?.min_price || null,
            max_price: filtersResponse?.prices?.max_price || null,
          },
          prices_ranges: /*filtersResponse?.prices?.priceRanges*/ [],
        },
        replace,
      );
      setSearchPartialLoading(false);
      setSearchLoading(false);

      return { data: filtersResponse };
    } catch (error) {
      // Check if error is due to abort
      if (error.name === "AbortError") {
        return null;
      }
      LogError({
        error,
        scenario: "Error in getSearchOptions in services/search",
      });
      setSearchPartialLoading(false);
      setSearchLoading(false);
      throw error;
    } finally {
      // Clear the controller reference if this request completed
      if (this.searchAbortController?.signal === signal) {
        this.searchAbortController = null;
      }
    }
  }

  async resetSearchFilters({ filter_obj, lang }) {
    // Cancel any in-flight search request when resetting filters
    if (this.searchAbortController) {
      this.searchAbortController.abort();
    }

    // Create new AbortController for this request
    this.searchAbortController = new AbortController();
    const signal = this.searchAbortController.signal;
    const [country, language] = lang.split("-");
    const { setSearchResults, setTotalSizeOfProducts } = useAppStore.getState();
    try {
      const filtersResponse = await getProductsAndFiltersFromElastic({
        country: country,
        language_code: language,
        limit: 10,
        filters: {},
        filters_offset: 1,
      });

      // if (!filtersResponse.success) {
      //   throw new Error(filtersResponse.message);
      // }
      const {
        products,
        categories,
        brands,
        boutiques,
        colors,
        attributes: attributes,
        total_size,
      } = filtersResponse;
      setTotalSizeOfProducts({ total_size });

      setSearchResults(
        {
          products,
          categories,
          brands,
          boutiques,
          colors,
          sizes: attributes?.[0]?.options,
          prices: {
            min_price: filtersResponse?.prices?.min_price || null,
            max_price: filtersResponse?.prices?.max_price || null,
          },
          prices_ranges: /*filtersResponse?.prices?.priceRanges*/ [],
        },
        true,
      );
      return filtersResponse;
    } catch (error) {
      // Check if error is due to abort
      if (error.name === "AbortError") {
        return null;
      }
      LogError({
        error,
        scenario: "Error in resetSearchFilters in services/search",
      });
      throw error;
    } finally {
      // Clear the controller reference if this request completed
      if (this.searchAbortController?.signal === signal) {
        this.searchAbortController = null;
      }
    }
  }
  getSearchParamsFromObj(obj, noProducts, noFilters, filters_offset?) {
    let params = new URLSearchParams();
    if (filters_offset) {
      params.set("filters_offset", `${filters_offset}`);
    }
    if (noProducts) {
      params.set("noProducts", "true");
    }
    if (noFilters) {
      params.set("noFilters", "true");
    }
    return params;
  }

  getSearchPageUrl({ lang }) {
    let { searchFilters, value } = useAppStore.getState();

    // Build filter object for path-based URL
    const filterObj = {
      boutiques: searchFilters?.boutiques?.map((b) => b.slug) || [],
      categories: searchFilters?.categories?.map((c) => c.slug) || [],
      brands: searchFilters?.brands?.map((b) => b.slug) || [],
      colors:
        searchFilters?.colors?.map((c) =>
          typeof c === "string" ? c : c.toString(),
        ) || [],
      sizes:
        searchFilters?.sizes?.map((s) =>
          typeof s === "string" ? s : s.toString(),
        ) || [],
      prices:
        searchFilters?.prices &&
        searchFilters.prices.min_price !== null &&
        searchFilters.prices.min_price !== undefined &&
        searchFilters.prices.max_price !== null &&
        searchFilters.prices.max_price !== undefined &&
        !isNaN(Number(searchFilters.prices.min_price)) &&
        !isNaN(Number(searchFilters.prices.max_price)) &&
        Number(searchFilters.prices.min_price) >= 0 &&
        Number(searchFilters.prices.max_price) > 0
          ? [
              `${searchFilters.prices.min_price}-${searchFilters.prices.max_price}`,
            ]
          : [],
      search: value?.length > 0 ? [value] : [],
    };

    // Build path-based URL
    const pathParams = buildParamsFromFilters(filterObj);

    // Get language from current URL or default to 'en-tr'

    if (pathParams.length > 0) {
      return `/${lang}/filters/${pathParams.join("/")}`;
    } else {
      return `/${lang}/filters`;
    }
  }
  getPageUrl({ term, value }) {
    if (term && value) {
      // Build filter object for single filter type
      const filterObj = {
        [term]: value.map((s) => s.slug),
      };

      const pathParams = buildParamsFromFilters(filterObj);

      // Get language from current URL or default to 'en-tr'
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "";
      const langMatch = currentPath.match(/^\/([^\/]+)\//);
      const lang = langMatch ? langMatch[1] : "en-tr";

      if (pathParams.length > 0) {
        return `/${lang}/filters/${pathParams.join("/")}`;
      }
    }

    // Get language for base filters URL
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";
    const langMatch = currentPath.match(/^\/([^\/]+)\//);
    const lang = langMatch ? langMatch[1] : "en-tr";

    return `/${lang}/filters`;
  }
}
export default new SearchService();
