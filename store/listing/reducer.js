const initialState = {
  products: [],
  loading: true,
  isReachEnd: false,
  offset: 2,
  filterEnabled: false,
  skeleton: false,
  showedFilter: "Categories",
};

const ListingReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "SHOWED-FILTER": {
      return { ...state, showedFilter: payload };
    }
    case "filterEnabled": {
      if (document.querySelector(".filter-container"))
        document.querySelector(".filter-container").scrollLeft = 0;
      return {
        ...state,
        filterEnabled: payload,
      };
    }
    case "GET_PRODUCT": {
      return {
        ...state,
        products: payload?.products ?? [],
        offset: 2,
        limit: 10,
        loading: false,
        skeleton: false,
      };
    }
    case "Skeleton-Listing": {
      return {
        ...state,
        skeleton: true,
      };
    }
    case "PRODUCT_LOADING": {
      return {
        ...state,
        loading: true,
      };
    }
    case "GET_NEXT_PRODUCT": {
      return {
        ...state,
        products: [
          ...state.products,
          ...payload.products.filter(
            (s) => state.products.filter((d) => d.id === s.id).length === 0
          ),
        ],
        offset: state.offset + 1,
        isReachEnd: payload.products.length === 0,
        loading: false,
      };
    }
    case "RESET_LISTING_FILTER": {
      return {
        ...state,
        offset: 1,
        isReachEnd: false,
        loading: false,
      };
    }
    case "RESET-OFFSET": {
      return {
        ...state,
        offset: 1,
      };
    }
    default:
      return state;
  }
};
export default ListingReducer;
