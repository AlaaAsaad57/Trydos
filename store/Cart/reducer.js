const initialState = {
  cart: null,
  enable: false,
  AddToCartOption: {
    enable: false,
    selectedSize: null,
    selectedColor: {},
    quantity: 0,
    price: null,
    UID: "",
    selectedOptions: [],
  },
  SelectedProduct: null,
  variants: [],
  loading: true,
  localCart: [],
  loaded: false,
};

export const CartReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "LOADED-CART": {
      return {
        ...state,
        loaded: payload,
      };
    }
    case "ADD-PRODUCT-TO-CART": {
      if (state.localCart.some((s) => s.item_id === payload.item_id)) {
        let arr = [];
        let prod = null;
        state.localCart.map((s) => {
          if (s.item_id !== payload.item_id) {
            arr.push(s);
          } else {
            prod = s;
          }
        });
        arr.push({
          ...prod,
          quantity: parseInt(prod.quantity + payload.quantity),
        });
        let selectedOptions = [];
        state.AddToCartOption.selectedOptions.map((s) => {
          if (s.UID === payload.UID) {
            selectedOptions.push();
          } else {
            selectedOptions.push(s);
          }
        });
        return {
          ...state,
          localCart: arr,
          AddToCartOption: {
            ...state.AddToCartOption,
            quantity: 0,
            selectedOptions: selectedOptions,
          },
        };
      } else {
        let selectedOptions = [];
        state.AddToCartOption.selectedOptions.map((s) => {
          if (s.UID === payload.UID) {
            selectedOptions.push();
          } else {
            selectedOptions.push(s);
          }
        });
        return {
          ...state,
          localCart: [...state.localCart, payload],
          AddToCartOption: {
            ...state.AddToCartOption,
            quantity: 0,
            selectedOptions: selectedOptions,
          },
        };
      }
    }
    case "ANIMATION-END": {
      return {
        ...state,
        AddToCartOption: {
          ...state.AddToCartOption,
          selectedOptions: state.AddToCartOption.selectedOptions.filter(
            (s) => s.UID !== payload
          ),
        },
      };
    }
    case "CART-INIT": {
      let brands = [];
      let prods = payload.cart;
      prods.map((s) => {
        if (!s?.boutique?.id && !brands.some((b) => b?.boutique?.id === null)) {
          brands.push({ brand: null });
        }
        if (brands.some((b) => b?.id === s.boutique?.id)) {
        } else {
          if (s.boutique) brands.push(s.boutique);
        }
      });

      return {
        ...state,
        ...payload,
        loading: false,
        brands: brands,
        localCart: [
          ...payload.cart.map((s) => ({
            id: s.product_id,
            item_id: s.id,
            image: s.image,
            quantity: s.quantity,
            size: s.choices?.length > 0 ? s.choices[0]?.choice_1 : null,
            color: "",
            sku: `${s.product_id}${
              s.variations?.length > 0 ? `-${s.variations[0].color}` : ""
            }${s.choices?.length > 0 ? `-${s.choices[0].choice_1}` : ""}`,
          })),
        ],
      };
    }
    case "CART-LOADING": {
      return {
        ...state,
        loading: true,
      };
    }
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
          AddToCartOption: {
            ...state.AddToCartOption,
            selectedSize: payload?.choice_options?.filter(
              (s) => s.title == "Size"
            )[0]?.options[0],
          },
          loaded: true,
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
        loading: false,
        loaded: true,
      };
    }
    case "AddToCartOptionEnable": {
      return {
        ...state,
        SelectedProduct: { ...payload, choice_options: null },
        AddToCartOption: {
          ...state.AddToCartOption,
          enable: true,
          selectedColor: payload?.sync_color_images
            ? payload?.sync_color_images[0]
            : null,
        },
      };
    }
    case "AddToCartOptionDisable": {
      return {
        ...state,
        AddToCartOption: {
          enable: false,
          selectedSize: null,
          selectedColor: {},
          quantity: 0,
          price: null,
          UID: "",
          selectedOptions: [],
        },
        SelectedProduct: null,
      };
    }
    case "ADD-TO-CART-Quantity": {
      let arr_of_selected = [];
      if (
        state.AddToCartOption.selectedOptions.filter(
          (s) => s.UID === payload.UID
        ).length > 0
      ) {
        let variable = state.AddToCartOption.selectedOptions.filter(
          (s) => s.UID === payload.UID
        )[0];
        arr_of_selected = state.AddToCartOption.selectedOptions.map((s) => {
          if (s.UID === payload.UID)
            return { ...variable, quantity: variable.quantity + 1 };
          else return s;
        });
        return {
          ...state,
          AddToCartOption: {
            ...state.AddToCartOption,
            selectedOptions: arr_of_selected,
          },
        };
      } else {
        return {
          ...state,
          AddToCartOption: {
            ...state.AddToCartOption,
            selectedOptions: [
              ...state.AddToCartOption.selectedOptions,
              { ...payload, quantity: 1 },
            ],
          },
        };
      }
    }
    case "REMOVE-QUANTITY": {
      let arr_of_selected = [];
      let variable = state.AddToCartOption.selectedOptions.filter(
        (s) => s.UID === payload
      )[0];
      if (variable.quantity === 1) {
        arr_of_selected = state.AddToCartOption.selectedOptions.filter(
          (s) => s.UID !== payload
        );
      } else {
        arr_of_selected = state.AddToCartOption.selectedOptions.map((s) => {
          if (s.UID === payload) {
            return { ...s, quantity: s.quantity - 1 };
          } else return s;
        });
      }

      return {
        ...state,
        AddToCartOption: {
          ...state.AddToCartOption,
          selectedOptions: arr_of_selected,
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
