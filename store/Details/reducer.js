const initialState = {
  activeCameraGallery: false,
  InfoMessage: {
    showInfoMessage: false,
    title: "",
    icon: "",
    text: "",
    value: [],
  },
  variants: [],
  AddToCartOption: {
    enable: false,
    selectedSize: { name: "M", last: "2" },
    selectedColor: { color_name: "Blue", images: [null] },
    quantity: 0,
    price: null,
    UID: "",
  },
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
  isChangedFilter: false,
};

const DetailsReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "RESET-SELECTED": {
      return {
        ...state,
        selectedFilter: {
          ...state.selectedFilter,
          ...state.activeFilters,
          prices:
            (state.activeFilters.prices && {
              ...state.activeFilters.prices,
              min: state.activeFilters.prices.min_price,
              max: state.activeFilters.prices.max_price,
            }) ??
            (state.filters.prices && {
              ...state.filters.prices,
              min: state.filters.prices.min_price,
              max: state.filters.prices.max_price,
            }) ??
            {},
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
      console.log(payload);
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
        selectedFilter: {
          ...state.selectedFilter,
          filtered: true,
          prices: {
            min: payload.min,
            max: payload.max,
          },
        },
        isChangedFilter: true,
      };
    }
    case "STORE-VARIANTS": {
      return {
        ...state,
        variants: payload,
      };
    }
    case "RESET-FILTER": {
      return {
        ...state,
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
        AddToCartOption: {
          enable: false,
          selectedSize: { name: "M", last: "2" },
          selectedColor: { color_name: "Blue", images: [null] },
          quantity: 0,
          price: null,
          UID: "",
        },
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
    case "AddToCartOptionEnable": {
      return {
        ...state,
        AddToCartOption: { ...payload, enable: true },
      };
    }
    case "AddToCartOptionDisable": {
      return {
        ...state,
        AddToCartOption: { ...state.AddToCartOption, enable: false },
      };
    }
    case "ADD-TO-CART-Quantity": {
      let variant = state.variants.filter(
        (s) =>
          s.type.includes(
            state?.AddToCartOption?.selectedColor?.color_name || ""
          ) && s.type.includes(state.AddToCartOption?.selectedSize?.name || "")
      )[0];
      return {
        ...state,
        AddToCartOption: {
          ...state.AddToCartOption,
          quantity: state.AddToCartOption.quantity + 1,
          price: {
            offer_price_formated: variant?.offer_price_formated,
            price: variant?.price,
            offer_price: variant.offer_price,
            price_formated: variant.price_formated,
          },
        },
      };
    }
    case "AddToCartSize": {
      let variant = state.variants.filter(
        (s) =>
          s.type.includes(
            state?.AddToCartOption?.selectedColor?.color_name || ""
          ) && s.type.includes(payload.name || "")
      )[0];
      return {
        ...state,
        AddToCartOption: {
          ...state.AddToCartOption,
          selectedSize: payload,
          price: {
            offer_price_formated: variant?.offer_price_formated,
            price: variant?.price,
            offer_price: variant.offer_price,
            price_formated: variant.price_formated,
          },
        },
      };
    }
    case "AddToCartColor": {
      let variant = state.variants.filter(
        (s) =>
          s.type.includes(payload?.color_name || "") &&
          s.type.includes(state?.AddToCartOption?.selectedSize?.name || "")
      )[0];
      return {
        ...state,
        AddToCartOption: {
          ...state.AddToCartOption,
          selectedColor: payload,
          price: {
            offer_price_formated: variant?.offer_price_formated,
            price: variant?.price,
            offer_price: variant.offer_price,
            price_formated: variant.price_formated,
          },
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
            state.filters.prices.min_price && state.filters.prices.min_price
              ? {
                  ...state.filters.prices,
                  min: state.filters.prices.min_price,
                  max: state.filters.prices.max_price,
                }
              : null,
        },
      };
    }
    case "EDIT-FILTER": {
      return {
        ...state,
        filters: { ...state.filters, ...payload },
        selectedFilter: {
          ...state.selectedFilter,
          colors: state.selectedFilter.colors.filter(
            (cat) => payload.colors.filter((s) => s === cat).length > 0
          ),
          categories: state.selectedFilter.categories.filter(
            (cat) =>
              payload.categories.filter((s) => s.slug === cat.slug).length > 0
          ),
          brands: state.selectedFilter.brands.filter(
            (cat) =>
              payload.brands.filter((s) => s.slug === cat.slug).length > 0
          ),
          sizes: state.selectedFilter.sizes.filter(
            (cat) => payload.sizes.filter((s) => s.slug === cat.slug).length > 0
          ),
          prices:
            payload.reset && payload.prices?.min_price >= 0
              ? {
                  min: payload.prices?.min_price,
                  max: payload.prices.max_price,
                }
              : { ...state.selectedFilter.prices },
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
        selectedFilter: {
          ...state.selectedFilter,
          searchText: payload,
        },
        activeFilters: {
          ...state.activeFilters,
          searchText: payload,
        },
      };
    }
    default:
      return state;
  }
};
export default DetailsReducer;
