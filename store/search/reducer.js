const initialState = {
  value: "",
  searchWords: [].sort(),
  searchResults: {
    products: [],
    brands: [],
    categories: [],
    boutiques: [],
  },
  enable: false,
  searchFilters: { categories: [], brands: [], boutiques: [] },
  loading: false,
};

const SearchReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "SEARCH-CATEGORY": {
      return {
        ...state,
        searchFilters: {
          ...state.searchFilters,
          categories: state.searchFilters.categories.some(
            (s) => s.slug === payload
          )
            ? [
                ...state.searchFilters.categories.filter(
                  (s) => payload !== s.slug
                ),
              ]
            : [...state.searchFilters.categories, { slug: payload }],
        },
      };
    }
    case "SEARCH-BRAND": {
      return {
        ...state,
        searchFilters: {
          ...state.searchFilters,
          brands: state.searchFilters.brands.some((s) => s.slug === payload)
            ? [...state.searchFilters.brands.filter((s) => payload !== s.slug)]
            : [...state.searchFilters.brands, { slug: payload }],
        },
      };
    }
    case "SEARCH-BOUTIQUE": {
      return {
        ...state,
        searchFilters: {
          ...state.searchFilters,
          boutiques: state.searchFilters.boutiques.some(
            (s) => s.slug === payload
          )
            ? [
                ...state.searchFilters.boutiques.filter(
                  (s) => payload !== s.slug
                ),
              ]
            : [...state.searchFilters.boutiques, { slug: payload }],
        },
      };
    }
    case "SEARCH-RESULTS": {
      return {
        ...state,
        searchResults: {
          ...state.searchResults,
          ...payload,
        },
      };
    }
    case "FIND-PRODUCTS": {
      return {
        ...state,
        searchResults: {
          ...state.searchResults,
          products: payload,
        },
        searchWords: payload.map((s) => s.name),
        loading: false,
      };
    }
    case "SEARCH-LOADING": {
      return { ...state, loading: true };
    }
    case "SEARCH-WORD": {
      return {
        ...state,
        value: payload,
      };
    }
    case "ENABLE-SEARCH": {
      if (payload)
        return {
          ...state,
          enable: payload,
        };
      else
        return {
          ...state,
          value: "",
          searchFilters: {
            categories: [],
            brands: [],
            boutiques: [],
          },
        };
    }
    case "RESET-SEARCH-FILTER": {
      return {
        ...state,
        searchFilters: {
          categories: [],
          brands: [],
          boutiques: [],
        },
      };
    }
    case "EDIT-FILTER-SEARCH": {
      return {
        ...state,
        loading: false,
        searchResults: {
          ...state.searchResults,
          ...payload,
        },
      };
    }
    default:
      return state;
  }
};
export default SearchReducer;
