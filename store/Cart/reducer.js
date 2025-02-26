"use client";
import { allCountries } from "country-telephone-data";
const getCountry = () => {
  const countryParam =
    typeof window !== "undefined" &&
    window.location.pathname.split("/")[1].split("-")[0];
  if (countryParam) {
    let country = {
      name: allCountries.filter((s) => s.iso2 === countryParam)[0]?.name,
      code: countryParam,
    };
    return country;
  }
};
const initialState = {
  orderLoading: false,
  cart: [],
  addressLists: [],
  center: null,
  addressDetails: {
    location: { latitude: null, longitude: null },
    Country: getCountry(),

    address_detail: "",
    address: "",
    contact_info: {
      contact_person_name: "",
      phone: "",
      alternative_phone: "",
    },
    region: "",
    region_details: {
      city: "",
      province: "",
      town: "",
      street: "",
      building: "",
    },
  },
  orderData: {
    payment: [],
    coupon: false,
    agree: false,
    coupon_number: "",
    loading: false,
    success: false,
  },
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
  oldCart: null,
  wallet: null,
  balance: 0,
  crypto: 0,
  credit: 0,
  openPayIframe: false,
  payIframeURL: "",
};
const showLocationText = (location) => {
  let str = "";
  if (location.province) str += ` | ${location.province}`;
  if (location.city) str += ` | ${location.city}`;
  if (location.town) str += ` | ${location.town}`;
  if (location.street) str += ` | ${location.street}`;
  if (location.building) str += ` | ${location.building}`;
  return str;
};
const openCart = (val) => {
  document.documentElement.scrollTop = 0;
  if (val) {
    document.querySelector(".site-container").classList.add("scale-95");
    document.documentElement.style.overflow = "hidden";
    return val;
  } else {
    document.querySelector(".cart-provider")?.classList.add("slideDown-cart");
    document.querySelector(".site-container")?.classList.remove("scale-95");
    document.documentElement.style.overflow = "initial";

    // setTimeout(() => {
    //   document
    //     .querySelector(".cart-provider")
    //     .classList.remove("slideDown-cart");
    // }, 400);
    // await new Promise((resolve) => setTimeout(resolve, 400));
    return val;
  }
};

export const CartReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "CRYPTO_CARD_PAYMENT": {
      return {
        ...state,
        openPayIframe: true,
        payIframeURL: payload.url,
      };
    }
    case "WALLET_BALANCE-USER": {
      return {
        ...state,
        balance: state?.wallet?.total_wallet_balance || 0,
      };
    }
    case "COD-USER": {
      return {
        ...state,
        balance: state.total_cash || 0,
      };
    }
    case "CRYPTO-USER": {
      return {
        ...state,
        crypto: state.total_cash || 0,
      };
    }
    case "CREDIT-USER": {
      return {
        ...state,
        credit: state.total_cash || 0,
      };
    }
    case "WALLET-USER": {
      return {
        ...state,
        wallet: payload,
      };
    }
    case "MAP-CENTER": {
      return {
        ...state,
        center: payload,
      };
    }
    case "ORDER-SUCCESS": {
      return {
        ...state,
        orderData: { ...state.orderData, ...payload },
        cart: [],
        localCart: [],
      };
    }
    case "ORDER-DATA": {
      return {
        ...state,
        orderData: {
          ...state.orderData,
          ...payload,
        },
      };
    }
    case "ORDER-LOADING": {
      return {
        ...state,
        orderLoading: payload,
      };
    }
    case "GET-ADRRESS-LIST": {
      return {
        ...state,
        addressLists: payload,
        orderLoading: false,
      };
    }
    case "INIT-ADDRESS-FORM": {
      return {
        ...state,
        addressDetails: {
          location: { latitude: null, longitude: null },
          Country: getCountry(),
          address_detail: "",
          address: "",
          contact_info: {
            contact_person_name: "",
            phone: "",
            alternative_phone: "",
          },
          region: "",
          region_details: {
            city: "",
            province: "",
            town: "",
            street: "",
            building: "",
          },
        },
      };
    }
    case "ADD-ADDRESS": {
      let arr = state.addressLists;
      arr.push({
        ...state.addressDetails,
        id: parseInt(Math.random() * 1000),
      });
      return {
        ...state,
        addressLists: arr,
      };
    }
    case "START-UPDATE-ADDRESS": {
      let temp = {
        ...payload,
        region: showLocationText(payload.region_details),
        contact_info: {
          ...payload.contact_info,
          contact_person_name: payload.contact_info.name,
        },
      };

      return {
        ...state,
        addressDetails: { ...temp, Country: getCountry() },
      };
    }
    case "UPDATE-ADDRESS": {
      let arr = [];
      state.addressLists.map((s) => {
        if (s.id === payload.id) arr.push(payload);
        else arr.push(s);
      });
      return {
        ...state,
        addressLists: arr.reverse(),
      };
    }
    case "DELETE-ADDRESS": {
      return {
        ...state,
        addressLists: state.addressLists.filter((s) => s.id !== payload),
      };
    }
    case "set-address-details": {
      return {
        ...state,
        addressDetails: {
          ...state.addressDetails,
          ...payload,
        },
      };
    }
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
          {
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
    case "STORE-OLD-CART": {
      if (!payload)
        return {
          ...state,
          oldCart: null,
        };
      let brands = [];
      let products = payload.oldCart ?? [];

      let oldCart = products.map((product) => ({
        ...product,
        offer_price: product.discount
          ? product.price_of_variant - product.discount
          : 0,
        price: product.price_of_variant,
      }));
      return {
        ...state,
        oldCart: { ...payload, oldCart: oldCart },
      };
    }
    case "HIDE-OLD-CART": {
      let products =
        state.oldCart?.oldCart.filter(
          (oldCartItem) => oldCartItem.id !== payload
        ) || [];

      let oldCart = products.map((product) => ({
        ...product,
        offer_price: product.discount
          ? product.price_of_variant - product.discount
          : 0,
        price: product.price_of_variant,
      }));
      return {
        ...state,
        oldCart: { ...state.oldCart, oldCart: oldCart },
      };
    }
    case "EDIT-QTY": {
      if (payload === "") {
        return {
          ...state,
          SelectedProduct: {
            ...state.SelectedProduct,
            current_stock:
              state.SelectedProduct.current_stock === 0
                ? 0
                : state.SelectedProduct.current_stock - 1,
          },
        };
      } else {
        let arr = [];
        state.SelectedProduct.variation.map((s) => {
          if (s.type === payload)
            arr.push({ ...s, qty: s.qty === 0 ? 0 : s.qty - 1 });
          else arr.push(s);
        });
        return {
          ...state,
          SelectedProduct: {
            ...state.SelectedProduct,
            variation: arr,
          },
        };
      }
    }
    case "CART-INIT": {
      return {
        ...state,
        ...payload,
        loading: false,
        localCart: [
          ...payload.cart.map((s) => ({
            id: s.product_id,
            item_id: s.id,
            image: s.image,
            quantity: s.quantity,
            size: s.choices?.length > 0 ? s.choices[0]?.choice_1 : null,
            color: "",
            sku: `${s.product_id}${
              s.variations?.length > 0 && s?.variations[0]?.color
                ? `-${s.variations[0].color}`
                : ""
            }${s.choices?.length > 0 ? `-${s.choices[0].choice_1}` : ""}`,
          })),
        ],
      };
    }
    case "CART-OREVIEW": {
      return {
        ...state,
        ...payload,
        cart: state.cart,
        localCart: state.localCart,
      };
    }
    case "REMOVE-FROM-CART": {
      return {
        ...state,
        cart: state.cart.filter((s) => s.id !== payload),
        localCart: state.localCart.filter((s) => s.item_id !== payload),
      };
    }

    case "CART-LOADING": {
      return {
        ...state,
        loading: true,
      };
    }
    case "ENABLE-CART": {
      openCart(payload);
      return {
        ...state,
        enable: payload,
      };
    }
    case "GET-PRODUCT-DETAILS-FOR-CART": {
      let a = payload?.choice_options?.filter((s) => s.title == "Size")[0]
        ?.options[0];
      console.log(a);
      if (
        state.AddToCartOption.enable &&
        state.SelectedProduct.id === payload?.id
      )
        return {
          ...state,
          AddToCartOption: {
            ...state.AddToCartOption,
            selectedSize: a || null,
          },
          SelectedProduct: { ...state.SelectedProduct, ...payload },
          variants: payload.variation,

          loaded: true,
        };
    }
    case "GET-PRODUCT-VARIATION": {
      return {
        ...state,
        SelectedProduct: { ...state.SelectedProduct, ...payload },
        variants: payload.variation,
        loaded: true,
      };
    }
    case "VIEWS-PRODUCTS": {
      return {
        ...state,
        SelectedProduct: { ...state.SelectedProduct, ...payload },
      };
    }
    case "EDIT-INFO": {
      return {
        ...state,
        SelectedProduct: { ...state.SelectedProduct, ...payload },
      };
    }
    case "ADD-TO-CART": {
      if (state.cart?.some((s) => s.id === payload?.id)) {
        if (payload.quantity === 0) {
          return {
            ...state,
            cart: state.cart.filter((s) => s.id !== payload.id),
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
      } else return { ...state, cart: [...state.cart, payload] };
    }
    case "STORE-VARIANTS": {
      return {
        ...state,
        variants: payload,
        loading: false,
        loaded: true,
        SelectedProduct: {
          ...state.SelectedProduct,
          slug_en_topic: payload.slug_en_topic,
        },
      };
    }
    case "AddToCartOptionEnable": {
      document.documentElement.style.overflow = "hidden";
      document.documentElement.scrollTop = 100;
      if (payload)
        return {
          ...state,
          SelectedProduct: { ...payload, choice_options: null },
          loaded: false,
          AddToCartOption: {
            ...state.AddToCartOption,
            enable: true,
            selectedColor: payload?.sync_color_images
              ? payload?.sync_color_images[0]
              : null,
            selectedSize:
              payload?.choice_options?.filter((s) => s.title === "Size")[0]
                ?.options[0] || null,
          },
        };
      else
        return {
          ...state,
          SelectedProduct: { ...state.SelectedProduct },
          AddToCartOption: {
            ...state.AddToCartOption,
            enable: true,
            selectedColor: state.SelectedProduct?.sync_color_images
              ? state.SelectedProduct?.sync_color_images[0]
              : null,
            selectedSize:
              state.SelectedProduct?.choice_options?.filter(
                (s) => s.title === "Size"
              )[0]?.options[0] || null,
          },
        };
    }
    case "NOTIFY-PRODUCT": {
      let temp = { ...state.SelectedProduct };
      let newVal = {};
      if (temp.variation && temp.variation?.length > 0) {
        newVal = {
          ...temp,
          variation: temp.variation.map((s) => {
            if (s.type === payload)
              return { ...s, variant_notify_for_user: true };
            else return s;
          }),
        };
      } else {
        newVal = { ...temp, is_product_notify_for_user: true };
      }
      return {
        ...state,
        SelectedProduct: { ...newVal },
      };
    }
    case "AddToCartOptionDisable": {
      document.documentElement.style.overflow = "initial";
      document.documentElement.scrollTop = 0;
      return {
        ...state,
        AddToCartOption: {
          ...state.AddToCartOption,
          enable: false,
          selectedSize: null,
          selectedColor: {},
          quantity: 0,
          price: null,
          UID: "",
          selectedOptions: [],
        },
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
      if ((state.variants?.variation || state.variants || [])?.length > 0) {
        let variant = (
          state.variants?.variation ||
          state.variants ||
          []
        ).filter(
          (s) =>
            s.type.includes(
              state?.AddToCartOption?.selectedColor?.color_name || ""
            ) && s.type.includes(payload?.name || "")
        )[0];
        return {
          ...state,
          AddToCartOption: {
            ...state.AddToCartOption,
            selectedSize: payload,
            price: {
              offer_price_formated: variant?.offer_price_formated,
              price: variant?.price,
              offer_price: variant?.offer_price,
              price_formated: variant?.price_formated,
            },
          },
        };
      } else {
        return {
          ...state,
          AddToCartOption: {
            ...state.AddToCartOption,
            selectedSize: payload,
          },
        };
      }
    }
    case "AddToCartColor": {
      let variant = (state.variants?.variation || state.variants || []).filter(
        (s) =>
          s.type.includes(payload?.color_name || "") &&
          s.type.includes(state?.AddToCartOption?.selectedSize?.name || "")
      )[0];

      return {
        ...state,
        AddToCartOption: {
          ...state.AddToCartOption,
          selectedColor: { ...payload },
          price: {
            offer_price_formated: variant?.offer_price_formated,
            price: variant?.price,
            offer_price: variant?.offer_price,
            price_formated: variant?.price_formated,
          },
        },
      };
    }
    default:
      return state;
  }
};
