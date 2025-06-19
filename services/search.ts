import { AxiosGet } from "utils/AxiosApi";
import { useAppStore } from "store";
import { buildParamsFromFilters, filtersToSearchParams } from "utils/tinyUtils";

class SearchService {
  private searchAbortController: AbortController | null = null;

  async getTrendingSearch() {
    let data = await AxiosGet({
      url:
        process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
        "/api/products/popular-search",
      title: "Get Trending Search",
    });
    const { setTrendingSearch } = useAppStore.getState();
    setTrendingSearch(data);
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
        search:
          searchValue?.length > 0
            ? [searchValue]
            : value?.length > 0
            ? [value]
            : [],
      };

      const pathParams = buildParamsFromFilters(filterObj);
      const filterPath = pathParams.length > 0 ? pathParams.join("/") : "";
      const apiUrl = filterPath
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${lang}/filters/${filterPath}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${lang}/filters`;

      // Debug logging
      console.log("Search value used:", searchValue || value);
      console.log("Filter object:", filterObj);
      console.log("API URL:", apiUrl);

      const filtersResponseJson = await fetch(
        `${apiUrl}?${params.toString()}`,
        { signal } // Pass the abort signal to fetch
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

      // Build path-based filter URL from filter_obj
      const pathParams = buildParamsFromFilters(filter_obj);
      const filterPath = pathParams.length > 0 ? pathParams.join("/") : "";
      const apiUrl = filterPath
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${lang}/filters/${filterPath}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${lang}/filters`;

      const filtersResponseJson = await fetch(
        `${apiUrl}?noProducts=true`,
        { signal } // Pass the abort signal to fetch
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
  async getColorsAndSizes() {
    const CACHE_KEY = "colors_and_sizes_data";
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

    // Check if we have cached data
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const isCacheValid = Date.now() - timestamp < CACHE_DURATION;

      if (isCacheValid) {
        return data.data;
      }
    }

    try {
      // Fetch new data from API
      const response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL + "/web/get-colors-and-sizes"
      );
      const data = await response.json();

      // Store in localStorage with timestamp
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      return data.data;
    } catch (error) {
      console.error("Error fetching colors and sizes:", error);
      throw error;
    }
  }
}
export default new SearchService();
