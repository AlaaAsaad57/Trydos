const initialState = {
  Cart: [],
};

export const CartReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "ADD-TO-CART": {
      if (state.Cart.some((s) => s.id === payload.id)) {
        if (payload.quantity === 0) {
          return {
            ...state,
            Cart: state.Cart.filter((s) => s.id !== payload.id),
          };
        }
        let cartTemp = [];
        state.Cart.map((s) => {
          if (s.id === payload.id) {
            cartTemp.push({ ...payload });
          } else {
            cartTemp.push({ ...s });
          }
        });
      } else return { ...state, Cart: [...state.Cart, payload] };
    }
    default:
      return state;
  }
};
