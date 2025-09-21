interface PriceFilter {
  min: number;
  max: number;
  pricesWord: string | null;
}

interface SelectedFilter {
  categories: any[];
  filtered: boolean;
  prices: PriceFilter;
  pricesSelected: any[];
  brands: any[];
  offers: any[];
  sizes: any[];
  searchText: string;
  colors: any[];
}

interface Filters {
  categories: any[];
  brands: any[];
  prices: {
    min_price: number;
    max_price: number;
    priceRanges?: any[];
  };
  sizes: any[];
  offers: any[];
  sizesAttr: {
    id: number;
    name: string;
  };
  colors: any[];
}

interface InfoMessage {
  showInfoMessage: boolean;
  title: string;
  icon: string;
  text: string;
  value: any[];
}

interface DetailsState {
  activeCameraGallery: boolean;
  shareLoading: boolean;
  totalProducts: number | null;
  InfoMessage: InfoMessage;
  PriceFiltered: boolean;
  isModalOpen: boolean | null | { id: string; slug: string; images: any[] };
  variants: any[];
  filters: Filters;
  selectedFilter: SelectedFilter;
  filterLoading: boolean;
  activeFilters: Omit<SelectedFilter, "pricesSelected">;
  activeFiltersShouldUpdate: boolean;
  search: boolean;
  isChangedFilter: boolean;
  product: any;
  details_loading: boolean;
  sharesCount: number | null;
  selected_product_for_add_to_cart: null | any;
  ColorBottomSheet: boolean | any;
}

const initialState: DetailsState = {
  activeCameraGallery: false,
  shareLoading: false,
  isModalOpen: null,
  selected_product_for_add_to_cart: null,
  totalProducts: null,
  InfoMessage: {
    showInfoMessage: false,
    title: "",
    icon: "",
    text: "",
    value: [],
  },
  PriceFiltered: false,
  variants: [],
  filters: {
    categories: [],
    brands: [],
    prices: {
      min_price: 0,
      max_price: 0,
    },
    sizes: [],
    offers: [],
    sizesAttr: {
      id: 1,
      name: "Size",
    },
    colors: [],
  },
  selectedFilter: {
    categories: [],
    filtered: false,
    prices: {
      min: 0,
      max: 500,
      pricesWord: null,
    },
    pricesSelected: [],
    brands: [],
    offers: [],
    sizes: [],
    searchText: "",
    colors: [],
  },
  filterLoading: false,
  activeFilters: {
    categories: [],
    filtered: false,
    prices: {
      min: 0,
      max: 500,
      pricesWord: null,
    },
    brands: [],
    offers: [],
    sizes: [],
    searchText: "",
    colors: [],
  },
  activeFiltersShouldUpdate: false,
  search: false,
  isChangedFilter: false,
  product: {},
  details_loading: false,
  sharesCount: null,
  ColorBottomSheet: false,
};

export const useDetailsStore = (set, get) => ({
  ...initialState,
  setIsModalOpen: (e) => set({ isModalOpen: e }),
  setShareLoading: (loading: boolean) => set({ shareLoading: loading }),
  setColorBottomSheet: (colorBottomSheet: boolean | any) =>
    set({ ColorBottomSheet: colorBottomSheet }),
  setSelectedProductForCart: (product: any) =>
    set({ selected_product_for_add_to_cart: product }),
  storeProduct: (product: any) =>
    set((state) => ({
      product: {
        ...product,
        activeColor:
          product.colorFrom && product.sync_color_images
            ? product.sync_color_images[
                product.sync_color_images.findIndex(
                  (s: any) => s.color_name === product.colorFrom
                )
              ]
            : product.sync_color_images
            ? product.sync_color_images[0]
            : null,
      },
      sharesCount: null,
    })),

  storeProductBoutique: (product: any) => set({ product }),

  setSharesCount: (count: number) => set({ sharesCount: count }),

  setActiveColorDetails: (color: any) =>
    set((state) => ({
      product: {
        ...state.product,
        activeColor: color,
      },
    })),

  resetSelected: () =>
    set((state) => ({
      selectedFilter: {
        filtered: false,
        categories: [],
        prices: {
          pricesWord: null,
        },
        brands: [],
        offers: [],
        sizes: [],
        searchText: "",
        colors: [],
        pricesSelected: [],
      },
      activeFilters: {
        filtered: false,
        categories: [],
        prices: {
          pricesWord: null,
        },
        brands: [],
        offers: [],
        sizes: [],
        searchText: "",
        colors: [],
      },
      isChangedFilter: false,
    })),

  resetSelectedBack: () =>
    set((state) => ({
      selectedFilter: {
        ...state.selectedFilter,
        categories: state.activeFilters.categories,
        brands: state.activeFilters.brands,
        sizes: state.activeFilters.sizes,
        colors: state.activeFilters.colors,
        prices: {
          ...state.selectedFilter.prices,
          pricesWord: state.activeFilters?.prices?.pricesWord ?? null,
        },
        searchText: state.activeFilters.searchText,
      },
    })),

  applySelected: () => set({ isChangedFilter: false }),

  initFilter: (payload: any) =>
    set((state) => ({
      filters: {
        brands: payload.brands,
        categories: payload.categories,
        prices: payload.prices,
        sizesAttr: payload?.attributes.filter((s: any) => s.name === "Size")[0]
          ?.id
          ? {
              id: payload?.attributes.filter((s: any) => s.name === "Size")[0]
                ?.id,
              name: payload?.attributes.filter((s: any) => s.name === "Size")[0]
                ?.name,
            }
          : { id: 1, name: "Size" },
        sizes:
          payload.attributes.filter((s: any) => s.name === "Size")[0]
            ?.options || [],
        offers: payload?.offers || [],
        colors: payload.colors,
      },
      selectedFilter: {
        ...state.selectedFilter,
        prices:
          payload.prices?.min_price >= 0 && payload?.prices?.max_price >= 0
            ? {
                pricesWord: state.selectedFilter.prices.pricesWord,
                min: payload?.prices?.min_price,
                max: payload?.prices?.max_price,
              }
            : null,
      },
    })),

  setFilterLoading: (loading: boolean) => set({ filterLoading: loading }),

  filterCategory: (category: any) =>
    set((state) => ({
      selectedFilter: {
        ...state.selectedFilter,
        filtered: true,
        categories:
          state.selectedFilter.categories.filter(
            (c) => c.slug === category.slug
          ).length > 0
            ? state.selectedFilter.categories.filter(
                (c) => c.slug !== category.slug
              )
            : [...state.selectedFilter.categories, category],
      },
      isChangedFilter: true,
    })),

  filterBrand: (brand: any) =>
    set((state) => ({
      selectedFilter: {
        ...state.selectedFilter,
        filtered: true,
        brands:
          state.selectedFilter.brands.filter((b) => b.slug === brand.slug)
            .length > 0
            ? state.selectedFilter.brands.filter((b) => b.slug !== brand.slug)
            : [...state.selectedFilter.brands, brand],
      },
      isChangedFilter: true,
    })),

  filterSize: (size: any) =>
    set((state) => ({
      selectedFilter: {
        ...state.selectedFilter,
        filtered: true,
        sizes:
          state.selectedFilter.sizes.filter((s) => s === size).length > 0
            ? state.selectedFilter.sizes.filter((s) => s !== size)
            : [...state.selectedFilter.sizes, size],
      },
      isChangedFilter: true,
    })),

  filterColor: (color: any) =>
    set((state) => ({
      selectedFilter: {
        ...state.selectedFilter,
        filtered: true,
        colors:
          state.selectedFilter.colors.filter((c) => c === color).length > 0
            ? state.selectedFilter.colors.filter((c) => c !== color)
            : [...state.selectedFilter.colors, color],
      },
      isChangedFilter: true,
    })),

  filterPrice: (price: { min: number; max: number }) =>
    set((state) => ({
      PriceFiltered: true,
      selectedFilter: {
        ...state.selectedFilter,
        filtered: true,
        prices: {
          min: price.min,
          max: price.max,
          pricesWord: `["${price.min}-${price.max}"]`,
        },
      },
      isChangedFilter: true,
    })),

  filterPriceText: (price: any) =>
    set((state) => ({
      selectedFilter: {
        ...state.selectedFilter,
        pricesSelected: state.selectedFilter.pricesSelected?.some(
          (s) => s === price
        )
          ? state.selectedFilter.pricesSelected.filter((s) => s !== price)
          : [...state.selectedFilter.pricesSelected, price],
      },
    })),

  resetFilter: () =>
    set((state) => ({
      PriceFiltered: false,
      selectedFilter: {
        filtered: false,
        categories: [],
        prices:
          state?.filters?.prices?.min_price >= 0 &&
          state?.filters?.prices?.max_price >= 0
            ? {
                ...state?.filters.prices,
                min: state?.filters.prices?.min_price,
                max: state?.filters?.prices?.max_price,
              }
            : null,
        brands: [],
        offers: [],
        sizes: [],
        searchText: "",
        colors: [],
        pricesSelected: [],
      },
    })),

  resetFilters: () => set(initialState),

  setActiveCameraGallery: (active: boolean) =>
    set({ activeCameraGallery: active }),

  showInfoMessage: (message: InfoMessage) => set({ InfoMessage: message }),

  closeInfoMessage: () =>
    set({
      InfoMessage: {
        showInfoMessage: false,
        title: "",
        icon: "",
        text: "",
        value: [],
      },
    }),

  resetPrice: () =>
    set((state) => ({
      selectedFilter: {
        ...state.selectedFilter,
        prices:
          state.filters.prices?.min_price && state.filters.prices?.min_price
            ? {
                ...state.filters.prices,
                min: state.filters.prices?.min_price,
                max: state.filters.prices?.max_price,
              }
            : null,
      },
    })),

  editFilter: (payload: any) =>
    set((state) => ({
      totalProducts: payload.reset ? null : payload.total_size,
      details_loading: false,
      PriceFiltered: payload.reset ? false : state.PriceFiltered,
      filters: {
        ...state.filters,
        categories: [...payload.categories],
        brands: [...payload.brands],
        sizes: [...payload.sizes],
        colors: [...payload.colors],
        prices: payload.prices,
      },
      selectedFilter: {
        ...state.selectedFilter,
        colors: [...state.selectedFilter.colors],
        categories: [...state.selectedFilter.categories],
        brands: [...state.selectedFilter.brands],
        sizes: [...state.selectedFilter.sizes],
        prices:
          payload.reset && payload?.prices?.min_price >= 0
            ? {
                pricesWord: null,
                min: payload.prices?.min_price,
                max: payload.prices?.max_price,
              }
            : state.selectedFilter.prices?.max > payload?.prices?.max_price
            ? {
                ...state.selectedFilter.prices,
                min: payload.prices?.min_price,
                max: payload.prices?.max_price,
              }
            : state.selectedFilter?.prices?.min >= 0
            ? { ...state.selectedFilter.prices }
            : {
                ...state.selectedFilter.prices,
                min: payload.prices?.min_price,
                max: payload.prices?.max_price,
              },
      },
      activeFilters: {
        ...state.activeFilters,
        searchText: payload.reset ? "" : state.activeFilters.searchText,
      },
      filterLoading: false,
    })),

  filterStart: () => set({ filterLoading: false }),

  setActiveFilter: (payload: any) =>
    set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        ...payload,
      },
      selectedFilter: {
        ...state.selectedFilter,
        ...payload,
      },
    })),

  enableHandlingFilter: () => set({ activeFiltersShouldUpdate: true }),

  setFilterSearch: (enabled: boolean) => set({ search: enabled }),

  searchFilter: (text: string) =>
    set((state) => ({
      isChangedFilter: true,
      selectedFilter: {
        ...state.selectedFilter,
        searchText: text || "",
      },
    })),
});
