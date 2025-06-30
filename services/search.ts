import { AxiosGet } from "utils/AxiosApi";
import { useAppStore } from "store";
import {
  buildParamsFromFilters,
  filtersToSearchParams,
  configureSearchParams,
} from "utils/tinyUtils";
import auth from "./auth";
import { fetchData } from "utils/fetchData";

class SearchService {
  private searchAbortController: AbortController | null = null;

  async getTrendingSearch() {
    let response = await fetchData({
      url: "/api/products/popular-search",
      reqTitle: "Get Trending Search",
      method: "GET",
      server: "elastic",
    });

    const { setTrendingSearch } = useAppStore.getState();
    setTrendingSearch(response.popular_search_terms);
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

    let params = this.getSearchParamsFromObj(
      searchFilters,
      value.length === 0,
      noFilters,
      filters_offset
    );
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
            typeof c === "string" ? c : c.toString()
          ) || [],
        sizes:
          searchFilters?.sizes?.map((s) =>
            typeof s === "string" ? s : s.toString()
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
        search_text:
          searchValue?.length > 0
            ? [searchValue]
            : value?.length > 0
            ? [value]
            : [],
      };

      // Convert filter object to search params for elastic backend
      const searchParams = filtersToSearchParams(filterObj);

      const configuredParams = configureSearchParams({
        searchParams,
        noProducts: noProducts ? "true" : "false",
        noFilters: noFilters ? "true" : "false",
        lang: lang.split("-")[1] || "en",
        offset: null,
        boutiqueId: "listing",
        filters_offset: filters_offset?.toString(),
      });

      const apiUrl = `${process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL}/api/products/searchInCatalog`;

      // Debug logging

      const filtersResponseJson = await fetch(
        `${apiUrl}?${configuredParams.toString()}`,
        {
          signal, // Pass the abort signal to fetch
          headers: {
            lang: lang.split("-")[1] || "en",
            country: lang.split("-")[0] || "tr",
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            ...(auth.UserID() && (searchValue?.length > 0 || value.length > 0)
              ? { "original-user-id": auth.UserID() }
              : {}),
          },
        }
      );

      const filtersResponse = await filtersResponseJson.json();
      const {
        products,
        categories,
        brands,
        boutiques,
        colors,
        attributes: attributes,
        total_size,
      } = filtersResponse.data;
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
            min_price: filtersResponse?.data?.prices?.min_price || null,
            max_price: filtersResponse?.data?.prices?.max_price || null,
          },
          prices_ranges: filtersResponse?.data?.prices?.priceRanges || [],
        },
        replace
      );
      setSearchPartialLoading(false);
      setSearchLoading(false);
      return filtersResponse;
    } catch (error) {
      // Check if error is due to abort
      if (error.name === "AbortError") {
        console.log("Search request was cancelled");
        return null;
      }
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

    const { setSearchResults, setTotalSizeOfProducts } = useAppStore.getState();
    try {
      console.log(filter_obj, "filter_obj");

      // Convert filter object to search params for elastic backend
      const searchParams = filtersToSearchParams(filter_obj);

      const configuredParams = configureSearchParams({
        searchParams,
        noProducts: "true",
        noFilters: "false",
        lang: lang.split("-")[1] || "en",
        offset: "0",
        boutiqueId: "listing",
      });

      const apiUrl = `${process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL}/api/products/searchInCatalog`;

      const filtersResponseJson = await fetch(
        `${apiUrl}?${configuredParams.toString()}`,
        {
          signal, // Pass the abort signal to fetch
          headers: {
            lang: lang.split("-")[1] || "en",
            country: lang.split("-")[0] || "tr",
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
        }
      );

      const filtersResponse = await filtersResponseJson.json();
      const {
        products,
        categories,
        brands,
        boutiques,
        colors,
        attributes: attributes,
        total_size,
      } = filtersResponse.data;
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
            min_price: filtersResponse?.data?.prices?.min_price || null,
            max_price: filtersResponse?.data?.prices?.max_price || null,
          },
          prices_ranges: filtersResponse?.data?.prices?.priceRanges || [],
        },
        true
      );
      return filtersResponse.data;
    } catch (error) {
      // Check if error is due to abort
      if (error.name === "AbortError") {
        console.log("Reset filters request was cancelled");
        return null;
      }
      console.log(error, "resetSearchFilters");
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
          typeof c === "string" ? c : c.toString()
        ) || [],
      sizes:
        searchFilters?.sizes?.map((s) =>
          typeof s === "string" ? s : s.toString()
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
