import { AxiosGet } from "utils/AxiosApi";
import { useAppStore } from "store";

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
      let searchFiltersEdit = {};
      if (searchFilters?.categories && searchFilters.categories.length > 0) {
        searchFiltersEdit = {
          ...searchFiltersEdit,
          categories: JSON.stringify(
            searchFilters.categories.map((s) => s.slug)
          ),
        };
      }
      if (searchFilters?.brands && searchFilters.brands.length > 0) {
        searchFiltersEdit = {
          ...searchFiltersEdit,
          brands: JSON.stringify(searchFilters.brands.map((s) => s.slug)),
        };
      }
      if (searchFilters?.boutiques && searchFilters.boutiques.length > 0) {
        searchFiltersEdit = {
          ...searchFiltersEdit,
          boutiques: JSON.stringify(searchFilters.boutiques.map((s) => s.slug)),
        };
      }

      if (searchFilters?.colors && searchFilters.colors.length > 0) {
        // @ts-ignore

        searchFiltersEdit = {
          ...searchFiltersEdit,
          colors: JSON.stringify(searchFilters.colors.map((s) => s)),
        };
      }

      if (searchFilters?.sizes && searchFilters.sizes.length > 0) {
        // @ts-ignore

        searchFiltersEdit = {
          ...searchFiltersEdit,
          sizes: JSON.stringify(searchFilters.sizes.map((s) => s)),
        };
      }
      if (
        searchFilters?.prices?.max_price > 0 &&
        searchFilters?.prices?.min_price >= 0
      ) {
        searchFiltersEdit = {
          ...searchFiltersEdit,
          prices: JSON.stringify([
            `${searchFilters.prices.min_price}-${searchFilters.prices.max_price}`,
          ]),
        };
      }
      if (value?.length > 0) {
        searchFiltersEdit = {
          ...searchFiltersEdit,
          search_text: value,
        };
      }

      let requestSearchParams = new URLSearchParams();
      let requestSearchParamsString = "";
      if (Object.keys(searchFiltersEdit).length > 0) {
        requestSearchParams.set(
          "searchParams",
          JSON.stringify(searchFiltersEdit)
        );
        requestSearchParamsString = `&${requestSearchParams.toString()}`;
      }

      const filtersResponseJson = await fetch(
        `/api/${lang}/search?${params.toString()}${requestSearchParamsString}`,
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
      let requestSearchParams = new URLSearchParams();
      let requestSearchParamsString = "";
      console.log(filter_obj, "filter_obj");
      if (Object.keys(filter_obj).length > 0) {
        requestSearchParams.set("searchParams", JSON.stringify(filter_obj));
        requestSearchParamsString = `&${requestSearchParams.toString()}`;
      }
      const filtersResponseJson = await fetch(
        `/api/${lang}/search?noProducts=true&${requestSearchParamsString}`,
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

  getSearchPageUrl() {
    let { searchFilters, value } = useAppStore.getState();
    if (searchFilters.categories.length > 0) {
    }
    let url = "/boutique/listing";
    let params = new URLSearchParams();
    if (searchFilters.categories.length > 0) {
      params.set(
        "categories",
        encodeURIComponent(
          JSON.stringify(searchFilters.categories.map((s) => s.slug))
        )
      );
    }
    if (searchFilters.brands.length > 0) {
      params.set(
        "brands",
        encodeURIComponent(
          JSON.stringify(searchFilters.brands.map((s) => s.slug))
        )
      );
    }
    if (searchFilters.boutiques.length > 0) {
      params.set(
        "boutiques",
        encodeURIComponent(
          JSON.stringify(searchFilters.boutiques.map((s) => s.slug))
        )
      );
    }
    if (value?.length > 0) {
      params.set("search_text", value);
    }
    if (
      searchFilters.prices.min_price !== null &&
      searchFilters?.prices?.max_price !== null &&
      searchFilters?.prices?.max_price > 0 &&
      searchFilters?.prices?.min_price >= 0
    ) {
      params.set(
        "prices",
        encodeURIComponent(
          JSON.stringify([
            `${searchFilters.prices.min_price}-${searchFilters.prices.max_price}`,
          ])
        )
      );
    }
    if (searchFilters.colors.length > 0) {
      params.set(
        "colors",
        encodeURIComponent(JSON.stringify(searchFilters.colors.map((s) => s)))
      );
    }
    if (searchFilters.sizes.length > 0) {
      params.set(
        "sizes",
        encodeURIComponent(JSON.stringify(searchFilters.sizes.map((s) => s)))
      );
    }
    return url + "?" + params.toString();
  }
  getPageUrl({ term, value }) {
    let params = new URLSearchParams();
    if (term && value) {
      params.set(
        term,
        encodeURIComponent(JSON.stringify(value.map((s) => s.slug)))
      );
    }
    return "?" + params.toString();
    return;
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
