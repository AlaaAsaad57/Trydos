const initialState = {
  Cart: [],
  enable: false,
  AddToCartOption: {
    enable: false,
    selectedSize: { name: "M", last: "2" },
    selectedColor: {},
    quantity: 0,
    price: null,
    UID: "",
  },
  SelectedProduct: null,
  variants: [],
};

export const CartReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "ENABLE-CART": {
      return {
        ...state,
        enable: payload,
      };
    }
    case "GET-PRODUCT-DETAILS-FOR-CART": {
      if (
        state.AddToCartOption.enable &&
        state.SelectedProduct.id === payload?.id
      )
        return {
          ...state,
          SelectedProduct: { ...state.SelectedProduct, ...payload },
          variants: payload.variation,
        };
    }
    case "ADD-TO-CART": {
      if (state.cart.some((s) => s.id === payload?.id)) {
        if (payload.quantity === 0) {
          return {
            ...state,
            Cart: state.cart.filter((s) => s.id !== payload.id),
          };
        }
        let cartTemp = [];
        state.cart.map((s) => {
          if (s.id === payload.id) {
            cartTemp.push({ ...payload });
          } else {
            cartTemp.push({ ...s });
          }
        });
      } else return { ...state, Cart: [...state.Cart, payload] };
    }
    case "STORE-VARIANTS": {
      return {
        ...state,
        variants: payload,
      };
    }
    case "AddToCartOptionEnable": {
      return {
        ...state,
        SelectedProduct: { ...payload },
        AddToCartOption: {
          ...state.AddToCartOption,
          enable: true,
          selectedColor: payload.sync_color_images[0],
        },
      };
    }
    case "AddToCartOptionDisable": {
      return {
        ...state,
        AddToCartOption: { ...state.AddToCartOption, enable: false },
        SelectedProduct: null,
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
          selectedColor: { ...payload },
          // price: {
          //   offer_price_formated: variant?.offer_price_formated,
          //   price: variant?.price,
          //   offer_price: variant.offer_price,
          //   price_formated: variant.price_formated,
          // },
        },
      };
    }
    default:
      return state;
  }
};
