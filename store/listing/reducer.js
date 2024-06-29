const initialState = {
  products: [],
  loading: true,
  isReachEnd: false,
  offset: 2,
};

const ListingReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "GET_PRODUCTS": {
      return {
        ...state,
        products: payload?.products ?? [],
        offset: 2,
        limit: 20,
        loading: false,
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
    default:
      return state;
  }
};
export default ListingReducer;
