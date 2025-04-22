interface SearchFilter {
  categories: Array<{ slug: string; [key: string]: any }>;
  brands: Array<{ slug: string; [key: string]: any }>;
  boutiques: Array<{ slug: string; [key: string]: any }>;
}

interface SearchResults {
  products: any[];
  brands: any[];
  categories: any[];
  boutiques: any[];
  colors: any[];
  sizes: any[];
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
}

const initialState: SearchState = {
  value: "",
  searchWords: [].sort(),
  trending: [],
  totalProducts: null,
  searchResults: {
    products: [],
    brands: [],
    categories: [],
    boutiques: [],
    colors: [],
    sizes: [],
  },
  enable_search: false,
  searchFilters: { categories: [], brands: [], boutiques: [] },
  loading_search: false,
  partialLoading: false,
};

export const useSearchStore = (set, get) => ({
  ...initialState,

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

  setSearchResults: (results: Partial<SearchResults>) =>
    set((state) => ({
      searchResults: {
        ...state.searchResults,
        ...results,
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
      },
      totalProducts: null,
    })),

  setTotalSizeOfProducts: (payload: {
    total_size: number;
    [key: string]: any;
  }) =>
    set((state) => ({
      totalProducts: payload.total_size,
    })),
});
