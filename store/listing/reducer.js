const initialState = {
  products: [],
  loading: true,
  isReachEnd: false,
  offset: null,
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
      let arr = [];
      payload?.products?.map((s) => {
        arr.push({ ...s, id: s.product_id });
      });
      return {
        ...state,
        products: arr ?? [],
        offset: payload?.offset,
        limit: 4,
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
      let arr = [];
      payload?.products?.map((s) => {
        arr.push({ ...s, id: s.product_id });
      });
      return {
        ...state,
        products: [
          ...state.products,
          ...arr.filter(
            (s) => state.products.filter((d) => d.id === s.id).length === 0
          ),
        ],
        offset: payload.offset,
        isReachEnd: payload.products.length === 0,
        loading: false,
      };
    }
    case "RESET-BOUTIQUE": {
      return {
        ...state,
        isReachEnd: false,
        offset: null,
      };
    }
    case "GET_NEXT_PRODUCT_ERROR": {
      return {
        ...state,

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
    case "RESET-END": {
      return {
        ...state,
        isReachEnd: false,
      };
    }
    default:
      return state;
  }
};
export default ListingReducer;
