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
};

const SearchReducer = (state = initialState, { type, payload }) => {
  switch (type) {
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
      };
    }
    case "SEARCH-WORD": {
      return {
        ...state,
        value: payload,
      };
    }
    case "ENABLE-SEARCH": {
      return {
        ...state,
        enable: payload,
      };
    }
    default:
      return state;
  }
};
export default SearchReducer;
