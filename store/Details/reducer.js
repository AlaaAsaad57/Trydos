const initialState = {
  activeCameraGallery: false,
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
};

const DetailsReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "STORE-PRODUCT": {
      return {
        ...state,
        product: {
          ...payload,
          activeColor: payload.sync_color_images
            ? payload.sync_color_images[
                Math.round(payload.sync_color_images.length / 2) - 1
              ]
            : null,
        },
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
          ...state.selectedFilter,
          ...state.activeFilters,
          prices: (state.activeFilters.prices && {
            ...state.activeFilters.prices,
            pricesWord: null,
            min:
              state.activeFilters?.prices?.min_price ||
              state.filters.prices?.min_price,
            max:
              state.activeFilters.prices?.max_price ||
              state.filters.prices?.max_price,
          }) ??
            (state.filters.prices && {
              ...state.filters.prices,
              pricesWord: null,
              min: state.filters.prices?.min_price,
              max: state.filters.prices?.max_price,
            }) ?? {
              pricesWord: null,
              min: state.filters?.prices?.min_price,
              max: state.filters?.prices?.max_price,
            },
        },
        isChangedFilter: false,
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
      if (payload.parent_id) {
      } else
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
