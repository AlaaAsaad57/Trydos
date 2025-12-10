interface SearchFilter {
  categories: Array<{ slug: string; [key: string]: any }>;
  brands: Array<{ slug: string; [key: string]: any }>;
  boutiques: Array<{ slug: string; [key: string]: any }>;
  prices: { min_price: number; max_price: number };
  sizes: Array<{ slug: string; [key: string]: any }>;
  colors: Array<{ slug: string; [key: string]: any }>;
  search_text: string;
}

export interface SearchResults {
  products: any[];
  brands: any[];
  categories: any[];
  boutiques: any[];
  colors: any[];
  sizes: any[];
  prices: { min_price: null | number; max_price: null | number };
  search_text: string;
  prices_ranges: any[];
}

interface SearchState {
  value: string;
  searchWords: string[];
  trending: any[];
  totalProducts: number | null;
  searchResults: SearchResults;
  enable_search: boolean;
  searchFilters: SearchFilter;
  loading_search: boolean;
  partialLoading: boolean;
  resetLoadingMore: boolean;
}

const initialState: SearchState = {
  value: "",
  searchWords: [].sort(),
  trending: [],
  totalProducts: null,
  searchResults: {
    products: [],
    prices: { min_price: null, max_price: null },
    brands: [],
    categories: [],
    boutiques: [],
    colors: [],
    sizes: [],
    search_text: "",
    prices_ranges: [],
  },
  enable_search: false,
  searchFilters: {
    categories: [],
    brands: [],
    boutiques: [],
    prices: { min_price: null, max_price: null },
    sizes: [],
    colors: [],
    search_text: "",
  },
  loading_search: false,
  partialLoading: false,
  resetLoadingMore: false,
};

export const useSearchStore = (set, get) => ({
  ...initialState,
  setResettingLoadMore: (resetLoadingMore: boolean) =>
    set({ resetLoadingMore }),
  setTrendingSearch: (trending: any[]) => set({ trending }),

  setSearchPartialLoading: (loading: boolean) =>
    set({ partialLoading: loading }),

  setSearchCategory: (category: { slug: string; [key: string]: any }) =>
    set((state) => ({
      searchFilters: {
        ...state.searchFilters,
        categories: state.searchFilters.categories.some(
          (s) => s.slug === category.slug
        )
          ? state.searchFilters.categories.filter(
              (s) => category.slug !== s.slug
            )
          : [...state.searchFilters.categories, category],
      },
    })),

  setSearchBrand: (brand: { slug: string; [key: string]: any }) =>
    set((state) => ({
      searchFilters: {
        ...state.searchFilters,
        brands: state.searchFilters.brands.some((s) => s.slug === brand.slug)
          ? state.searchFilters.brands.filter((s) => brand.slug !== s.slug)
          : [...state.searchFilters.brands, brand],
      },
    })),

  setSearchBoutique: (boutique: { slug: string; [key: string]: any }) =>
    set((state) => ({
      searchFilters: {
        ...state.searchFilters,
        boutiques: state.searchFilters.boutiques.some(
          (s) => s.slug === boutique.slug
        )
          ? state.searchFilters.boutiques.filter(
              (s) => boutique.slug !== s.slug
            )
          : [...state.searchFilters.boutiques, boutique],
      },
    })),
  setSearchColor: (color: { slug: string; [key: string]: any }) =>
    set((state) => ({
      searchFilters: {
        ...state.searchFilters,
        colors: state.searchFilters.colors.some((s) => s === color)
          ? state.searchFilters.colors.filter((s) => color !== s)
          : [...state.searchFilters.colors, color],
      },
    })),
  setSearchSize: (size: { slug: string; [key: string]: any }) =>
    set((state) => ({
      searchFilters: {
        ...state.searchFilters,
        sizes: state.searchFilters.sizes.some((s) => s === size)
          ? state.searchFilters.sizes.filter((s) => size !== s)
          : [...state.searchFilters.sizes, size],
      },
    })),
  setSearchPrice: (price: { min_price: number; max_price: number }) =>
    set((state) => ({
      searchFilters: {
        ...state.searchFilters,
        prices: price,
      },
    })),
  setSearchResults: (results: Partial<SearchResults>, replace = true) =>
    set((state) => ({
      searchResults: {
        ...state.searchResults,
        products: results?.products,
        categories: replace
          ? results.categories
          : Array.from(
              new Map(
                [...state.searchResults.categories, ...results?.categories].map(
                  (item) => [item.slug, item]
                )
              ).values()
            ),
        brands: replace
          ? results?.brands
          : Array.from(
              new Map(
                [...state.searchResults.brands, ...results?.brands].map(
                  (item) => [item.slug, item]
                )
              ).values()
            ),
        boutiques: replace
          ? results?.boutiques
          : Array.from(
              new Map(
                [...state.searchResults.boutiques, ...results?.boutiques].map(
                  (item) => [item.slug, item]
                )
              ).values()
            ),
        colors: replace
          ? results?.colors
          : Array.from(
              new Map(
                [...state.searchResults.colors, ...results?.colors].map(
                  (item) => [item, item]
                )
              ).values()
            ),
        sizes: replace
          ? results?.sizes
          : Array.from(
              new Map(
                [...state.searchResults.sizes, ...results?.sizes].map(
                  (item) => [item.name, item]
                )
              ).values()
            ),
        prices: results?.prices || { min_price: null, max_price: null },
        prices_ranges: results?.prices_ranges || [],
      },
    })),

  findProducts: (products: any[]) =>
    set((state) => ({
      searchResults: {
        ...state.searchResults,
        products,
      },
      searchWords: products.map((s) => s.name),
      loading_search: false,
    })),

  setSearchLoading: (loading: boolean) => set({ loading_search: loading }),
  setSearchWord: (value: string) => set({ value }),
  setFilteredColorsAndSizes: ({ colors, sizes }) =>
    set((state) => ({
      ...state,
      searchFilters: {
        ...state.searchFilters,
        colors: colors,
        sizes: sizes,
      },
    })),
  setEnableSearch: (enable: boolean) =>
    set((state) =>
      enable
        ? { ...state, enable_search: enable }
        : {
            ...state,
            value: "",
            searchFilters: {
              categories: [],
              brands: [],
              boutiques: [],
              prices: { min_price: null, max_price: null },
              sizes: [],
              colors: [],
              search_text: "",
            },
            enable_search: false,
            totalProducts: null,
          }
    ),

  resetSearchFilter: () =>
    set((state) => ({
      ...state,
      searchFilters: {
        categories: [],
        brands: [],
        boutiques: [],
        prices: { min_price: null, max_price: null },
        sizes: [],
        colors: [],
        search_text: "",
      },
      totalProducts: null,
    })),
  setSearchFilters: (payload) =>
    set((state) => ({
      ...state,
      searchFilters: { ...state.searchFilters, ...payload },
    })),
  setTotalSizeOfProducts: (payload: {
    total_size: number;
    [key: string]: any;
  }) =>
    set((state) => ({
      totalProducts: payload.total_size,
    })),
});
