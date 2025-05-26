import { AxiosGet } from "utils/AxiosApi";
import { useAppStore } from "store";

class SearchService {
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
    const {
      setSearchResults,
      searchFilters,
      value,
      setTotalSizeOfProducts,
      setSearchPartialLoading,
      setSearchLoading,
    } = useAppStore.getState();
    let processed_search_value = await this.ProcessSearchInput(value);
    let params = this.getSearchParamsFromObj(
      searchFilters,
      noProducts,
      noFilters,
      filters_offset
    );
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

      if (
        (searchFilters?.colors && searchFilters.colors.length > 0) ||
        // @ts-ignore
        processed_search_value?.colors
      ) {
        // @ts-ignore
        if (processed_search_value.sizes) {
          searchFiltersEdit = {
            ...searchFiltersEdit,
            // @ts-ignore
            colors: JSON.stringify(processed_search_value.colors.map((s) => s)),
          };
        } else
          searchFiltersEdit = {
            ...searchFiltersEdit,
            colors: JSON.stringify(searchFilters.colors.map((s) => s)),
          };
      }

      if (
        (searchFilters?.sizes && searchFilters.sizes.length > 0) ||
        // @ts-ignore
        processed_search_value?.sizes
      ) {
        // @ts-ignore
        if (processed_search_value.sizes) {
          searchFiltersEdit = {
            ...searchFiltersEdit,
            // @ts-ignore
            sizes: JSON.stringify(processed_search_value.sizes.map((s) => s)),
          };
        } else
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
      if (value?.length > 0 && processed_search_value?.str) {
        searchFiltersEdit = {
          ...searchFiltersEdit,
          search_text: processed_search_value.str || value,
        };
      }

      ("use server");
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
        `/api/${lang}/search?${params.toString()}${requestSearchParamsString}`
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
      if (!noProducts)
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
      else
        setSearchResults(
          {
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
      setSearchPartialLoading(false);
    }
  }
  async resetSearchFilters({ filter_obj, lang }) {
    const { setSearchResults, setTotalSizeOfProducts } = useAppStore.getState();
    try {
      ("use server");
      let requestSearchParams = new URLSearchParams();
      let requestSearchParamsString = "";
      console.log(filter_obj, "filter_obj");
      if (Object.keys(filter_obj).length > 0) {
        requestSearchParams.set("searchParams", JSON.stringify(filter_obj));
        requestSearchParamsString = `&${requestSearchParams.toString()}`;
      }
      const filtersResponseJson = await fetch(
        `/api/${lang}/search?noProducts=true&${requestSearchParamsString}`
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
      console.log(error, "resetSearchFilters");
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
  async ProcessSearchInput(str: string) {
    let { colors: colorsData, sizes } = await this.getColorsAndSizes();
    let colors = colorsData.map((s) => ({
      translations: [{ name: s.name }],
      code: s.code,
    }));

    // Convert input to lowercase for case-insensitive matching
    const input = str.toLowerCase().split(" ");
    const result = {
      str: [],
      colors: [] as string[],
      sizes: [] as string[],
    };

    // Process each word
    input.forEach((word) => {
      let matched = false;

      // Check colors
      for (const color of colors) {
        const colorNames = color.translations.map((t) => t.name.toLowerCase());
        if (colorNames.includes(word)) {
          console.log(colorNames);

          result.colors.push(color.code);
          matched = true;
          break;
        }
      }

      // Check sizes
      const sizeMatch = sizes.find((size) => size.toLowerCase() === word);
      if (sizeMatch) {
        console.log(sizeMatch);
        result.sizes.push(sizeMatch);
        matched = true;
      }

      // If word didn't match color or size, add to remaining string
      if (!matched) {
        result.str.push(word);
      }
    });

    // If no matches found, return original string
    if (result.colors.length === 0 && result.sizes.length === 0) {
      return { str };
    }

    // Join remaining words back into string
    return {
      ...result,
      str: result.str.join(" "),
    };
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
