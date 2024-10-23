const initialState = {
  activeCameraGallery: false,
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
    prices: {},
    sizes: [],
    offers: [],
    sizesAttr: {},
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
    brands: [],
    prices: {
      pricesWord: null,
    },
    offers: [],
    sizes: [],
    searchText: "",
    colors: [],
  },
  activeFiltersShouldUpdate: false,
  search: false,
  isChangedFilter: false,
  product: {},
  loading: false,
  sharesCount: null,
};

const DetailsReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "STORE-PRODUCT": {
      return {
        ...state,
        product: {
          ...payload,
          activeColor: payload.colorFrom
            ? payload.sync_color_images[
                payload.sync_color_images.findIndex(
                  (s) => s.color_name === payload.colorFrom
                )
              ]
            : payload.sync_color_images
            ? payload.sync_color_images[
                Math.round(payload.sync_color_images.length / 2) - 1
              ]
            : null,
        },
        sharesCount: null,
      };
    }
    case "shares": {
      return {
        ...state,
        sharesCount: payload,
      };
    }
    case "SHARE-SOCIAL": {
      return {
        ...state,
        sharesCount: state.sharesCount + 1,
      };
    }
    case "SET-ACTIVE-COLOR-DETAILS": {
      return {
        ...state,
        product: {
          ...state.product,
          activeColor: payload,
        },
      };
    }
    case "RESET-SELECTED": {
      return {
        ...state,
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
      };
    }
    case "RESET-SELECTED-Back": {
      return {
        ...state,
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
      };
    }
    case "APPLY-SELECTED": {
      return {
        ...state,
        isChangedFilter: false,
      };
    }
    case "FILTER-INIT": {
      return {
        ...state,
        filters: {
          brands: payload.brands,
          categories: payload.categories,
          prices: payload.prices,
          sizesAttr: payload?.attributes.filter((s) => s.name === "Size")[0]?.id
            ? {
                id: payload?.attributes.filter((s) => s.name === "Size")[0]?.id,
                name: payload?.attributes.filter((s) => s.name === "Size")[0]
                  ?.name,
              }
            : {},
          sizes:
            payload.attributes.filter((s) => s.name === "Size")[0]?.options ||
            [],
          offers: payload?.offers || [],
          colors: payload.colors,
        },
        selectedFilter: {
          ...state.selectedFilter,
          prices:
            payload.prices?.min_price >= 0 && payload?.prices?.max_price >= 0
              ? {
                  pricesWord: state.selectedFilter.pricesWord,
                  min: payload?.prices?.min_price,
                  max: payload?.prices?.max_price,
                }
              : null,
        },
      };
    }
    case "FILTER-LOADING": {
      return {
        ...state,
        loading: payload,
      };
    }
    case "FILTER-CATEGORY": {
      return {
        ...state,
        selectedFilter: {
          ...state.selectedFilter,
          filtered: true,
          categories:
            state.selectedFilter.categories.filter(
              (category) => category.slug === payload.slug
            ).length > 0
              ? [
                  ...state.selectedFilter.categories.filter(
                    (category) => category.slug !== payload.slug
                  ),
                ]
              : [...state.selectedFilter.categories, payload],
        },
        isChangedFilter: true,
      };
    }
    case "FILTER-BRAND": {
      return {
        ...state,
        selectedFilter: {
          ...state.selectedFilter,
          filtered: true,
          brands:
            state.selectedFilter.brands.filter(
              (brand) => brand.slug === payload.slug
            ).length > 0
              ? [
                  ...state.selectedFilter.brands.filter(
                    (brand) => brand.slug !== payload.slug
                  ),
                ]
              : [...state.selectedFilter.brands, payload],
        },
        isChangedFilter: true,
      };
    }
    case "FILTER-SIZE": {
      return {
        ...state,
        selectedFilter: {
          ...state.selectedFilter,
          filtered: true,
          sizes:
            state.selectedFilter.sizes.filter((size) => size === payload)
              .length > 0
              ? [
                  ...state.selectedFilter.sizes.filter(
                    (size) => size !== payload
                  ),
                ]
              : [...state.selectedFilter.sizes, payload],
        },
        isChangedFilter: true,
      };
    }
    case "FILTER-COLOR": {
      return {
        ...state,
        selectedFilter: {
          ...state.selectedFilter,
          filtered: true,
          colors:
            state.selectedFilter.colors.filter((color) => color === payload)
              .length > 0
              ? [
                  ...state.selectedFilter.colors.filter(
                    (color) => color !== payload
                  ),
                ]
              : [...state.selectedFilter.colors, payload],
        },
        isChangedFilter: true,
      };
    }
    case "FILTER-PRICE": {
      return {
        ...state,
        PriceFiltered: true,
        selectedFilter: {
          ...state.selectedFilter,
          filtered: true,
          prices: {
            min: payload.min,
            max: payload.max,
            pricesWord: `["${payload.min}-${payload.max}"]`,
          },
        },
        isChangedFilter: true,
      };
    }
    case "FILTER-PRICE-TEXT": {
      return {
        ...state,
        selectedFilter: {
          ...state.selectedFilter,
          pricesSelected: state.selectedFilter.pricesSelected?.some(
            (s) => s === payload
          )
            ? state.selectedFilter.pricesSelected.filter((s) => s !== payload)
            : [...state.selectedFilter.pricesSelected, payload],
        },
      };
    }
    case "RESET-FILTER": {
      return {
        ...state,
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
      };
    }
    case "RESET-FILTERS": {
      return {
        ...state,
        activeCameraGallery: false,
        InfoMessage: {
          showInfoMessage: false,
          title: "",
          icon: "",
          text: "",
          value: [],
        },
        variants: [],

        filters: {
          categories: [],
          brands: [],
          prices: {},
          sizes: [],
          offers: [],
          sizesAttr: {},
          colors: [],
        },
        selectedFilter: {
          categories: [],
          filtered: false,
          prices: {
            min: 0,
            max: 500,
          },
          brands: [],
          offers: [],
          sizes: [],
          searchText: "",
          colors: [],
          pricesSelected: [],
        },
        filterLoading: false,
        activeFilters: {
          categories: [],
          brands: [],
          prices: null,
          offers: [],
          sizes: [],
          searchText: "",
          colors: [],
        },
        activeFiltersShouldUpdate: false,
        search: false,
      };
    }
    case "ACTIVE-CAMERA-GALLERY":
      return { ...state, activeCameraGallery: payload };
    case "SHOW-INFO-MESSAGE": {
      return {
        ...state,
        InfoMessage: {
          ...payload,
        },
      };
    }

    case "CLOSE-INFO-MESSAGE": {
      return {
        ...state,
        InfoMessage: {
          showInfoMessage: false,
          title: "",
          icon: "",
          text: "",
          value: [],
        },
      };
    }
    case "RESET-PRICE": {
      return {
        ...state,
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
      };
    }
    case "EDIT-FILTER": {
      return {
        ...state,
        totalProducts: payload.reset ? null : payload.total_size,
        loading: false,
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
      };
    }
    case "FILTER-START": {
      return {
        ...state,
        filterLoading: false,
      };
    }
    case "ACTIVE-FILTER": {
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          ...payload,
        },
        selectedFilter: {
          ...state.selectedFilter,
          ...payload,
        },
      };
    }
    case "enable-handling-filter": {
      return {
        ...state,
        activeFiltersShouldUpdate: true,
      };
    }
    case "FILTER-SEARCH-ENABLE": {
      return {
        ...state,
        search: payload,
      };
    }
    case "SEARCH-FILTER": {
      return {
        ...state,
        isChangedFilter: true,
        selectedFilter: {
          ...state.selectedFilter,
          searchText: payload || "",
        },
      };
    }
    default:
      return state;
  }
};
export default DetailsReducer;
