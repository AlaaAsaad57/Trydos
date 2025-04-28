import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { useAppStore } from "store";
import { FilterProductApi } from "models/Api";

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
    const { setSearchResults, searchFilters, value, setTotalSizeOfProducts } =
      useAppStore.getState();

    let params = this.getSearchParamsFromObj(
      searchFilters,
      noProducts,
      noFilters,
      filters_offset
    );
    let searchFiltersEdit = {};
    if (searchFilters?.categories && searchFilters.categories.length > 0) {
      searchFiltersEdit = {
        ...searchFiltersEdit,
        categories: JSON.stringify(searchFilters.categories.map((s) => s.slug)),
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
    if (value?.length > 0) {
      searchFiltersEdit = {
        ...searchFiltersEdit,
        search_text: value,
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

    setSearchResults(
      {
        products,
        categories,
        brands,
        boutiques,
        colors,
        sizes: attributes?.[0]?.options,
      },
      replace
    );
    return filtersResponse;
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
  ProcessSearchInput(str: string): {
    str: string;
    colors?: string[];
    sizes?: string[];
  } {
    const colors = [
      {
        translations: [
          { name: "White", language_code: "en" },
          { name: "ابيض", language_code: "ar" },
          { name: "Beyaz", language_code: "tr" },
        ],
        code: "#FFFFFF",
      },
      {
        translations: [
          { name: "Black", language_code: "en" },
          { name: "اسود", language_code: "ar" },
          { name: "Siyah", language_code: "tr" },
        ],
        code: "#000000",
      },
      {
        translations: [
          { name: "Red", language_code: "en" },
          { name: "احمر", language_code: "ar" },
          { name: "Kırmızı", language_code: "tr" },
        ],
        code: "#FF0000",
      },
      {
        translations: [
          { name: "Green", language_code: "en" },
          { name: "اخضر", language_code: "ar" },
          { name: "Yeşil", language_code: "tr" },
        ],
        code: "#00FF00",
      },
      {
        translations: [
          { name: "Blue", language_code: "en" },
          { name: "ازرق", language_code: "ar" },
          { name: "Mavi", language_code: "tr" },
        ],
        code: "#0000FF",
      },
      {
        translations: [
          { name: "Yellow", language_code: "en" },
          { name: "اصفر", language_code: "ar" },
          { name: "Sarı", language_code: "tr" },
        ],
        code: "#FFFF00",
      },
      {
        translations: [
          { name: "Purple", language_code: "en" },
          { name: "بنفسجي", language_code: "ar" },
          { name: "Mor", language_code: "tr" },
        ],
        code: "#800080",
      },
      {
        translations: [
          { name: "Orange", language_code: "en" },
          { name: "برتقالي", language_code: "ar" },
          { name: "Turuncu", language_code: "tr" },
        ],
        code: "#FFA500",
      },
      {
        translations: [
          { name: "Pink", language_code: "en" },
          { name: "وردي", language_code: "ar" },
          { name: "Pembe", language_code: "tr" },
        ],
        code: "#FFC0CB",
      },
      {
        translations: [
          { name: "Brown", language_code: "en" },
          { name: "بني", language_code: "ar" },
          { name: "Kahverengi", language_code: "tr" },
        ],
        code: "#A52A2A",
      },
      {
        translations: [
          { name: "Gray", language_code: "en" },
          { name: "رمادي", language_code: "ar" },
          { name: "Gri", language_code: "tr" },
        ],
        code: "#808080",
      },
      {
        translations: [
          { name: "Navy", language_code: "en" },
          { name: "كحلي", language_code: "ar" },
          { name: "Lacivert", language_code: "tr" },
        ],
        code: "#000080",
      },
      {
        translations: [
          { name: "Teal", language_code: "en" },
          { name: "ازرق مخضر", language_code: "ar" },
          { name: "Turkuaz", language_code: "tr" },
        ],
        code: "#008080",
      },
      {
        translations: [
          { name: "Maroon", language_code: "en" },
          { name: "خمري", language_code: "ar" },
          { name: "Bordo", language_code: "tr" },
        ],
        code: "#800000",
      },
      {
        translations: [
          { name: "Olive", language_code: "en" },
          { name: "زيتوني", language_code: "ar" },
          { name: "Zeytin", language_code: "tr" },
        ],
        code: "#808000",
      },
      {
        translations: [
          { name: "Lime", language_code: "en" },
          { name: "ليموني", language_code: "ar" },
          { name: "Limon", language_code: "tr" },
        ],
        code: "#00FF00",
      },
      {
        translations: [
          { name: "Cyan", language_code: "en" },
          { name: "سماوي", language_code: "ar" },
          { name: "Camgöbeği", language_code: "tr" },
        ],
        code: "#00FFFF",
      },
      {
        translations: [
          { name: "Magenta", language_code: "en" },
          { name: "ارجواني", language_code: "ar" },
          { name: "Eflatun", language_code: "tr" },
        ],
        code: "#FF00FF",
      },
      {
        translations: [
          { name: "Silver", language_code: "en" },
          { name: "فضي", language_code: "ar" },
          { name: "Gümüş", language_code: "tr" },
        ],
        code: "#C0C0C0",
      },
      {
        translations: [
          { name: "Gold", language_code: "en" },
          { name: "ذهبي", language_code: "ar" },
          { name: "Altın", language_code: "tr" },
        ],
        code: "#FFD700",
      },
      {
        translations: [
          { name: "Indigo", language_code: "en" },
          { name: "نيلي", language_code: "ar" },
          { name: "Çivit", language_code: "tr" },
        ],
        code: "#4B0082",
      },
      {
        translations: [
          { name: "Violet", language_code: "en" },
          { name: "بنفسجي فاتح", language_code: "ar" },
          { name: "Menekşe", language_code: "tr" },
        ],
        code: "#EE82EE",
      },
      {
        translations: [
          { name: "Coral", language_code: "en" },
          { name: "مرجاني", language_code: "ar" },
          { name: "Mercan", language_code: "tr" },
        ],
        code: "#FF7F50",
      },
      {
        translations: [
          { name: "Crimson", language_code: "en" },
          { name: "قرمزي", language_code: "ar" },
          { name: "Kızıl", language_code: "tr" },
        ],
        code: "#DC143C",
      },
      {
        translations: [
          { name: "Khaki", language_code: "en" },
          { name: "كاكي", language_code: "ar" },
          { name: "Haki", language_code: "tr" },
        ],
        code: "#F0E68C",
      },
      {
        translations: [
          { name: "Plum", language_code: "en" },
          { name: "برقوقي", language_code: "ar" },
          { name: "Erik", language_code: "tr" },
        ],
        code: "#DDA0DD",
      },
      {
        translations: [
          { name: "Salmon", language_code: "en" },
          { name: "سلموني", language_code: "ar" },
          { name: "Somon", language_code: "tr" },
        ],
        code: "#FA8072",
      },
      {
        translations: [
          { name: "Tan", language_code: "en" },
          { name: "اسمر فاتح", language_code: "ar" },
          { name: "Taba", language_code: "tr" },
        ],
        code: "#D2B48C",
      },
      {
        translations: [
          { name: "Tomato", language_code: "en" },
          { name: "طماطمي", language_code: "ar" },
          { name: "Domates", language_code: "tr" },
        ],
        code: "#FF6347",
      },
      {
        translations: [
          { name: "Turquoise", language_code: "en" },
          { name: "فيروزي", language_code: "ar" },
          { name: "Turkuaz", language_code: "tr" },
        ],
        code: "#40E0D0",
      },
    ];
    let sizes = [
      "XXS",
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL",
      "3XL",
      "4XL",
      "5XL", // American sizes
      "EU32",
      "EU34",
      "EU36",
      "EU38",
      "EU40",
      "EU42",
      "EU44",
      "EU46",
      "EU48",
      "EU50", // European sizes
      "0",
      "2",
      "4",
      "6",
      "8",
      "10",
      "12",
      "14",
      "16",
      "18", // American numeric sizes
    ];
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
          result.colors.push(color.code);
          matched = true;
          break;
        }
      }

      // Check sizes
      const sizeMatch = sizes.find((size) => size.toLowerCase() === word);
      if (sizeMatch) {
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
}
export default new SearchService();
