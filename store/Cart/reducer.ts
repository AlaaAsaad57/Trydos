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
  provinces: [],
  selectedOrder: null,
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
  cart_enable: false,
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
  cart_loading: true,
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
    return val;
  }
};

export const useCartStore = (set, get) => ({
  // Initial state
  orderLoading: false,
  cart: [],
  coupon_discount: null,
  total_discount: null,
  total_shipping_cost: null,
  provinces: [],
  total_cash: null,
  sub_total: null,
  total: null,
  available_payment_method: [],
  selectedOrder: null,
  addressLists: [],
  center: null,
  addressDetails: {
    id: null,
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
    data: null,
    payment: [],
    coupon: false,
    agree: false,
    coupon_number: "",
    loading: false,
    success: false,
  },
  cart_enable: false,
  AddToCartOption: {
    enable: false,
    selectedSize: {
      name: null,
    },
    selectedColor: {},
    quantity: 0,
    price: null,
    UID: "",
    selectedOptions: [],
  },
  SelectedProduct: null,
  variants: [],
  cart_loading: true,
  localCart: [],
  loaded: false,
  oldCart: null,
  wallet: null,
  balance: 0,
  crypto: 0,
  credit: 0,
  openPayIframe: false,
  payIframeURL: "",

  // Actions
  setOrderDetails: (order) => set({ selectedOrder: order }),
  setProvinces: (provinces) => set({ provinces }),
  setCryptoCardPayment: (url) =>
    set({
      openPayIframe: true,
      payIframeURL: url,
    }),

  setWalletBalance: () =>
    set((state) => ({
      balance: state.wallet?.wallet_balance || 0,
    })),

  setCodUser: () =>
    set((state) => ({
      balance: state.total_cash || 0,
    })),

  setCryptoUser: () =>
    set((state) => ({
      crypto: state.total_cash || 0,
    })),

  setCreditUser: () =>
    set((state) => ({
      credit: state.total_cash || 0,
    })),

  setWalletUser: (wallet) =>
    set({
      wallet: {
        ...wallet,
        wallet_balance: wallet?.wallet_balance || 0,
      },
    }),

  setMapCenter: (center) => set({ center }),

  setOrderSuccess: (data) =>
    set((state) => ({
      orderData: { ...state.orderData, ...data },
      cart: [],
      localCart: [],
    })),

  setOrderData: (data) =>
    set((state) => ({
      orderData: {
        ...state.orderData,
        ...data,
      },
    })),

  setOrderLoading: (loading) => set({ orderLoading: loading }),

  setAddressList: (list) =>
    set({
      addressLists: list,
      orderLoading: false,
    }),

  initAddressForm: () =>
    set({
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
    }),

  addAddress: () =>
    set((state) => {
      const arr = state.addressLists;
      arr.push({
        ...state.addressDetails,
        id: parseInt((Math.random() * 1000).toString()),
      });
      return { addressLists: arr };
    }),

  startUpdateAddress: (address) =>
    set((state) => {
      const temp = {
        ...address,
        region: showLocationText(address.region_details),
        contact_info: {
          ...address.contact_info,
          contact_person_name: address.contact_info.name,
        },
      };
      return {
        addressDetails: { ...temp, Country: getCountry() },
      };
    }),

  updateAddress: (address) =>
    set((state) => {
      const arr = [];
      state.addressLists.map((s) => {
        if (s.id === address.id) arr.push(address);
        else arr.push(s);
      });
      return { addressLists: arr.reverse() };
    }),

  setDefaultAddress: (id) =>
    set((state) => {
      const addressLists = state.addressLists;
      const arr = addressLists.map((s) => {
        if (s.id === id) {
          return { ...s, is_default: 1 };
        } else {
          return { ...s, is_default: 0 };
        }
      });
      return { addressLists: arr };
    }),

  deleteAddress: (id) =>
    set((state) => ({
      addressLists: state.addressLists.filter((s) => s.id !== id),
    })),

  setAddressDetails: (details) =>
    set((state) => ({
      addressDetails: {
        ...state.addressDetails,
        ...details,
      },
    })),

  setLoadedCart: (loaded) => set({ loaded }),

  updateProductQuantityInCart: ({ id, qty }) =>
    set((state) => {
      const arr = state.localCart.map((s) => {
        if (s.item_id === id) return { ...s, quantity: qty };
        else return s;
      });
      return { localCart: arr };
    }),

  addProductToCart: (product) =>
    set((state) => {
      if (state.localCart.some((s) => s.item_id === product.item_id)) {
        const arr = [];
        let prod = null;
        state.localCart.map((s) => {
          if (s.item_id !== product.item_id) {
            arr.push(s);
          } else {
            prod = s;
          }
        });
        arr.push({
          ...prod,
          quantity: parseInt(prod.quantity + product.quantity),
        });
        const selectedOptions = [];
        state.AddToCartOption.selectedOptions.map((s) => {
          selectedOptions.push(s);
        });
        return {
          localCart: arr,
          AddToCartOption: {
            ...state.AddToCartOption,
            quantity: 0,
            selectedOptions,
          },
        };
      } else {
        const selectedOptions = [];
        state.AddToCartOption.selectedOptions.map((s) => {
          if (s.UID === product.UID) {
          } else {
            selectedOptions.push(s);
          }
        });
        return {
          localCart: [...state.localCart, product],
          AddToCartOption: {
            ...state.AddToCartOption,
            quantity: 0,
            selectedOptions,
          },
        };
      }
    }),

  storeOldCart: (cart) =>
    set((state) => {
      if (!cart) return { oldCart: null };
      const products = cart.oldCart ?? [];
      const oldCart = products.map((product) => ({
        ...product,
        offer_price: product.discount
          ? product.price_of_variant - product.discount
          : 0,
        price: product.price_of_variant,
      }));
      return { oldCart: { ...cart, oldCart } };
    }),

  hideOldCart: (id) =>
    set((state) => {
      const products =
        state.oldCart?.oldCart.filter((oldCartItem) => oldCartItem.id !== id) ||
        [];
      const oldCart = products.map((product) => ({
        ...product,
        offer_price: product.discount
          ? product.price_of_variant - product.discount
          : 0,
        price: product.price_of_variant,
      }));
      return { oldCart: { ...state.oldCart, oldCart } };
    }),

  editQuantity: (type) =>
    set((state) => {
      if (type === "") {
        return {
          SelectedProduct: {
            ...state.SelectedProduct,
            available_quantity:
              state.SelectedProduct.available_quantity === 0
                ? 0
                : state.SelectedProduct.available_quantity - 1,
          },
        };
      } else {
        const arr = [];
        state.SelectedProduct.variation.map((s) => {
          if (s.type === type)
            arr.push({ ...s, qty: s.qty === 0 ? 0 : s.qty - 1 });
          else arr.push(s);
        });
        return {
          SelectedProduct: {
            ...state.SelectedProduct,
            variation: arr,
          },
        };
      }
    }),

  initCart: (data) =>
    set((state) => ({
      ...data,
      cart_loading: false,
      localCart: [
        ...data.cart.map((s) => ({
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
    })),

  setCartPreview: (data) =>
    set((state) => ({
      ...data,
      cart: state.cart,
      localCart: state.localCart,
    })),

  removeFromCart: (id) =>
    set((state) => ({
      cart: state.cart.filter((s) => s.id !== id),
      localCart: state.localCart.filter((s) => s.item_id !== id),
    })),
  errRemoveFromCart: ({ local_cart_item, cart_item }) =>
    set((state) => ({
      cart: [...state.cart, cart_item],
      local_cart: [...state.local_cart, local_cart_item],
    })),
  setCartLoading: (loading) => set({ cart_loading: loading }),

  enableCart: (enable) => {
    openCart(enable);
    return set({ cart_enable: enable });
  },

  getProductDetailsForCart: (product) =>
    set((state) => {
      const a = product?.choice_options?.filter((s) => s.title == "Size")[0]
        ?.options[0];
      if (
        state.AddToCartOption.enable &&
        state.SelectedProduct.id === product?.temp_id
      ) {
        console.log("product", product);
        return {
          AddToCartOption: {
            ...state.AddToCartOption,
            selectedSize: a || null,
          },
          SelectedProduct: { ...state.SelectedProduct, ...product },
          variants: product.variation,
          loaded: true,
        };
      }
      return state;
    }),

  getProductVariation: (variation) =>
    set((state) => {
      let temp = {};
      if (variation.color || variation.size) {
        return {
          SelectedProduct: { ...state.SelectedProduct, ...variation },
          ...temp,
          variants: variation.variation,
          loaded: true,
        };
      } else {
        let temp_product = { ...state.SelectedProduct, ...variation };
        let temp_variant = temp_product.variation.filter((s) => s.qty > 0)[0];
        if (temp_variant) {
          let size =
            temp_product.choice_options &&
            temp_product.choice_options[0]?.options.filter((s) =>
              temp_variant.type.endsWith(s.name)
            )[0];
          let color =
            temp_product.sync_color_images &&
            temp_product.sync_color_images?.filter((s) =>
              temp_variant.type.startsWith(s.color_name)
            )[0];
          temp = {
            AddToCartOption: {
              ...state.AddToCartOption,
              selectedColor: color,
              selectedSize: size,
            },
          };
        }
        return {
          SelectedProduct: { ...state.SelectedProduct, ...variation },
          ...temp,
          variants: variation.variation,
          loaded: true,
        };
      }
    }),

  setViewsProducts: (product) =>
    set((state) => ({
      SelectedProduct: { ...state.SelectedProduct, ...product },
    })),

  editInfo: (info) =>
    set((state) => ({
      SelectedProduct: { ...state.SelectedProduct, ...info },
    })),

  storeVariants: (variants) =>
    set((state) => ({
      variants,
      cart_loading: false,
      loaded: true,
      SelectedProduct: {
        ...state.SelectedProduct,
        slug_en_topic: variants.slug_en_topic,
      },
    })),

  enableAddToCartOption: (product) =>
    set((state) => {
      document.documentElement.style.overflow = "hidden";
      document.documentElement.scrollTop = 100;
      if (product) {
        return {
          SelectedProduct: { ...product, choice_options: null },
          loaded: false,
          AddToCartOption: {
            ...state.AddToCartOption,
            enable: true,
            selectedColor:
              state.AddToCartOption.selectedColor ||
              (product?.sync_color_images?.length > 0
                ? product?.sync_color_images[0]
                : null),
            selectedSize:
              state.AddToCartOption.selectedSize ||
              product?.choice_options?.filter((s) => s.title === "Size")[0]
                ?.options[0] ||
              null,
          },
        };
      } else {
        return {
          SelectedProduct: { ...state.SelectedProduct },
          AddToCartOption: {
            ...state.AddToCartOption,
            enable: true,
            selectedColor:
              state.AddToCartOption.selectedColor ||
              (state.SelectedProduct?.sync_color_images?.length > 0
                ? state.SelectedProduct?.sync_color_images[0]
                : null),
            selectedSize:
              state.AddToCartOption.selectedSize ||
              state.SelectedProduct?.choice_options?.filter(
                (s) => s.title === "Size"
              )[0]?.options[0] ||
              null,
          },
        };
      }
    }),

  notifyProduct: (type) =>
    set((state) => {
      let temp = { ...state.SelectedProduct };
      let newVal = {};
      if (temp.variation && temp.variation?.length > 0) {
        newVal = {
          ...temp,
          variation: temp.variation.map((s) => {
            if (s.type === type) return { ...s, variant_notify_for_user: true };
            else return s;
          }),
        };
      } else {
        newVal = { ...temp, is_product_notify_for_user: true };
      }
      return {
        SelectedProduct: { ...newVal },
      };
    }),

  disableAddToCartOption: () => {
    document.documentElement.style.overflow = "initial";
    document.documentElement.scrollTop = 0;
    return set((state) => ({
      AddToCartOption: {
        ...state.AddToCartOption,
        enable: false,

        quantity: 0,
        price: null,
        UID: "",
        selectedOptions: [],
      },
    }));
  },

  addToCartQuantity: (option) =>
    set((state) => {
      let arr_of_selected = [];
      if (
        state.AddToCartOption.selectedOptions.filter(
          (s) => s.UID === option.UID
        ).length > 0
      ) {
        let variable = state.AddToCartOption.selectedOptions.filter(
          (s) => s.UID === option.UID
        )[0];
        arr_of_selected = state.AddToCartOption.selectedOptions.map((s) => {
          if (s.UID === option.UID)
            return { ...variable, quantity: variable.quantity + 1 };
          else return s;
        });
        return {
          AddToCartOption: {
            ...state.AddToCartOption,
            selectedOptions: arr_of_selected,
          },
        };
      } else {
        return {
          AddToCartOption: {
            ...state.AddToCartOption,
            selectedOptions: [
              ...state.AddToCartOption.selectedOptions,
              { ...option, quantity: 1 },
            ],
          },
        };
      }
    }),

  addToCartSize: (size) =>
    set((state) => {
      if ((state.variants?.variation || state.variants || [])?.length > 0) {
        let variant = (state.variants?.variation || state.variants || [])
          .map((s) => {
            if (s.type.includes("-")) return s;
            else return { ...s, type: `-${s.type}` };
          })
          .filter(
            (s) =>
              s.type.includes(
                state?.AddToCartOption?.selectedColor?.color_name || ""
              ) && s.type.endsWith(`-${size?.name}` || "")
          )[0];
        return {
          AddToCartOption: {
            ...state.AddToCartOption,
            selectedSize: size,
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
          AddToCartOption: {
            ...state.AddToCartOption,
            selectedSize: size,
          },
        };
      }
    }),

  addToCartColor: (color) =>
    set((state) => {
      let variant = (state.variants?.variation || state.variants || []).filter(
        (s) =>
          s.type.includes(color?.color_name || "") &&
          s.type.includes(state?.AddToCartOption?.selectedSize?.name || "")
      )[0];

      return {
        AddToCartOption: {
          ...state.AddToCartOption,
          selectedColor: { ...color },
          price: {
            offer_price_formated: variant?.offer_price_formated,
            price: variant?.price,
            offer_price: variant?.offer_price,
            price_formated: variant?.price_formated,
          },
        },
      };
    }),
});

export default useCartStore;
