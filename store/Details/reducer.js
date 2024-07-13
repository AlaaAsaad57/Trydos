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
  },
  filterLoading: false,
  activeFilters: {
    categories: [],
    brands: [],
    prices: null,
    offers: [],
    sizes: [],
    searchText: "",
  },
  activeFiltersShouldUpdate: false,
  search: false,
};

const DetailsReducer = (state = initialState, { type, payload }) => {
  switch (type) {
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
                (category) => category.id === payload.id
              ).length > 0
                ? [
                    ...state.selectedFilter.categories.filter(
                      (category) => category.id !== payload.id
                    ),
                  ]
                : [...state.selectedFilter.categories, payload],
          },
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
              (brand) => brand.id === payload.id
            ).length > 0
              ? [
                  ...state.selectedFilter.brands.filter(
                    (brand) => brand.id !== payload.id
                  ),
                ]
              : [...state.selectedFilter.brands, payload],
        },
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
                  min: state?.filters.prices?.min_price,
                  max: state?.filters?.prices?.max_price,
                }
              : null,
          brands: [],
          offers: [],
          sizes: [],
          searchText: "",
        },
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
        filters: { ...state.fiters, ...payload },
        selectedFilter: {
          ...state.selectedFilter,
          categories: state.selectedFilter.categories.filter(
            (cat) =>
              payload.categories.filter((s) => s.id === cat.id).length > 0
          ),
          brands: state.selectedFilter.brands.filter(
            (cat) => payload.brands.filter((s) => s.id === cat.id).length > 0
          ),
          sizes: state.selectedFilter.sizes.filter(
            (cat) => payload.sizes.filter((s) => s.id === cat.id).length > 0
          ),
          prices: payload.reset
            ? { min: payload.prices.min_price, max: payload.prices.max_price }
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
