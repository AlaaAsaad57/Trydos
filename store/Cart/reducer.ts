import { getLocalizedCountryName } from "utils/countryData";
import { DisableScroll, EnableScroll } from "utils/tinyUtils";
import { CartApiInterface } from "utils/types/cart";

const getCountry = () => {
  const localeSegment =
    typeof window !== "undefined" &&
    window.location.pathname.split("/")[1].split("-");
  if (localeSegment) {
    const [countryParam, language] = localeSegment;
    let country = {
      name: getLocalizedCountryName(countryParam, language),
      code: countryParam,
    };
    return country;
  }
};

const showLocationText = (location) => {
  let str = "";
  if (location.province && location.province !== "null")
    str += ` | ${location.province}`;
  if (location.city && location.city !== "null") str += ` | ${location.city}`;
  if (location.town && location.town !== "null") str += ` | ${location.town}`;
  if (location.street && location.street !== "null")
    str += ` | ${location.street}`;
  if (location.building) str += ` | ${location.building}`;
  return str;
};

const openCart = (val) => {
  document.documentElement.scrollTop = 0;
  if (val) {
    document.querySelector(".site-container").classList.add("scale-95");
    DisableScroll();
    return val;
  } else {
    document.querySelector(".cart-provider")?.classList.add("slideDown-cart");
    document.querySelector(".site-container")?.classList.remove("scale-95");
    EnableScroll();
    return val;
  }
};

const useCartStore = (set, get) => ({
  // Initial state
  orderLoading: false,
  cart: [],
  coupon_discount: null,
  total_discount: null,
  showOrderOptions: false,
  total_shipping_cost: null,
  provinces: [],
  total_cash: null,
  sub_total: null,
  total: null,
  available_payment_method: [],
  selectedOrder: null,
  SelectedOrderItem: null,
  shouldUpdateOrders: 0,
  ActivePacks: null,
  cartShippingSuccess: null,
  addressLists: [],
  center: null,
  addressDetails: {
    id: null,
    location: { latitude: null, longitude: null },
    user_name: null,
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
  order_chat_id: null,
  openPayIframe: false,
  payIframeURL: "",
  orderPageLoading: false,
  orderReturnObject: null,
  lastPathname: null,
  settingLastPath: null,

  // Seller dashboard orders sync for notifications
  sellerOrders: [],
  setSellerOrders: (orders) => {
    if (typeof orders === "function") {
      set((state) => ({ sellerOrders: orders(state.sellerOrders) }));
    } else {
      set({ sellerOrders: Array.isArray(orders) ? orders : [] });
    }
  },

  LoggingOut: false,
  setLastPathname: (e) => {
    set((state) => ({ lastPathname: e }));
  },
  setLoggingOut: (e) =>
    set((state) => ({
      LoggingOut: e,
    })),
  setSettingLastPath: (path) =>
    set((state) => ({
      settingLastPath: path,
    })),
  // Actions
  setOrderDetails: (order) => {
    set((state) => ({
      selectedOrder: order,
    }));
  },
  setCartShippingSuccess: (flag: string) => set({ cartShippingSuccess: flag }),
  setOrderPageLoading: (loading) => set({ orderPageLoading: loading }),
  setActivePacks: (pack) => set({ ActivePacks: pack }),
  setSelectedOrderItem: (item) =>
    set({ SelectedOrderItem: item, showOrderOptions: Boolean(item) }),
  setOrderOptions: (bool) => set({ showOrderOptions: bool }),
  setProvinces: (provinces) => set({ provinces }),
  setCryptoCardPayment: (url) =>
    set({
      openPayIframe: true,
      payIframeURL: url?.url,
    }),
  setShouldUpdateOrders: (e) => set({ shouldUpdateOrders: e }),
  setShouldUpdateOrdersChat: (e) => set({ order_chat_id: e }),
  setWalletBalance: () =>
    set((state) => ({
      balance: state.wallet?.wallet_balance || 0,
    })),
  setCouponDiscount: (value) => set({ coupon_discount: value }),
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

  setWalletUser: (wallet) => {
    set({
      wallet: {
        ...wallet,
        wallet_balance: wallet?.wallet_balance || 0,
      },
    });
  },

  setMapCenter: (center) => set({ center }),

  setOrderSuccess: (data) =>
    set((state) => ({
      orderData: { ...state.orderData, ...data },
    })),

  setOrderData: (data) => {
    return set((state) => ({
      orderData: {
        ...state.orderData,
        ...data,
      },
    }));
  },

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

  startUpdateAddress: (address) =>
    set((state) => {
      const temp = {
        ...address,
        region: showLocationText(address.region_details),
        contact_info: {
          ...address.contact_info,
          contact_person_name: address?.contact_info?.name,
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
      return { addressLists: arr };
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

  addProductToCart: (cart_item) =>
    set((state) => {
      return {
        ...state,
        localCart: [...state.localCart, cart_item],
      };
    }),

  storeOldCart: (cart) =>
    set((state) => {
      if (!cart) return { oldCart: null };
      const products = cart.oldCart ?? [];
      const oldCart = products.map((product) => ({
        ...product,
        offer_price: product?.offer_price,
        price: product.unit_price,
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

  editQuantity: (variantId) =>
    set((state) => {
      if (variantId === "") {
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
          if ((s.product_variation_id ?? s.id) === variantId)
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

  initCart: (data: CartApiInterface) =>
    set((state) => ({
      ...data,
      cartShippingSuccess: null,
      localCart: [
        ...data.cart.map((s) => ({
          id: s.product_id,
          item_id: s.id,
          image: s.image,
          quantity: s.quantity,
          is_luck: s.is_luck,
          size: s.variations?.size_options ?? undefined,
          color: s?.variations?.color_options ?? undefined,
          sku: `${s.product_id}${
            s?.variations?.color && s?.variations?.color_options
              ? `-${s.variations?.color_options}`
              : ""
          }${
            s.variations?.size_options ? `-${s.variations?.size_options}` : ""
          }`,
          type: s?.product_variation_id,
          offer_price: s.offer_price,
          product_variation_id: s.product_variation_id,
        })),
      ],
    })),

  setCartPreview: (data) =>
    set((state) => ({
      ...data,
      cart: state.cart,
      localCart: state.localCart,
      cartShippingSuccess: null,
    })),

  removeFromCart: (id) =>
    set((state) => ({
      cart: state.cart.filter((s) => s.id !== id),
      localCart: state.localCart.filter((s) => s.item_id !== id),
    })),
  // Undo a removal the core backend refused. The only caller is
  // services/cart.ts, and it passes the cart item itself — not a pair of
  // fields, and not a `local_cart` list, which never existed in this store.
  //
  // Only one of the two screens needs undoing. The cart page deletes the row
  // before it calls the service, so a refusal has to put the row back. The
  // add-to-cart widget waits for the answer, so nothing was ever removed and
  // putting the row back would list it twice.
  //
  // `localCart` says which case this is. `removeFromCart` clears the row from
  // both lists together, so a row still in `localCart` was never removed.
  errRemoveFromCart: (cart_item) =>
    set((state) => {
      if (state.localCart.some((s) => s.item_id === cart_item?.item_id))
        return {};
      return {
        cart: [...state.cart, cart_item],
        localCart: [...state.localCart, cart_item],
      };
    }),
  setCartLoading: (loading) => set({ cart_loading: loading }),

  enableCart: (enable) => {
    openCart(enable);
    return set({ cart_enable: enable });
  },

  getProductDetailsForCart: (product) =>
    set((state) => {
      const a = product?.choice_options?.[0]?.options[0];
      if (
        state.AddToCartOption.enable &&
        state.SelectedProduct.id === product?.temp_id
      ) {
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
      if (variation.color || variation?.Size) {
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
            temp_product.choice_options[0]?.options.filter(
              (s) => s.name === temp_variant.size,
            )[0];
          let color =
            temp_product.sync_color_images &&
            temp_product.sync_color_images?.filter(
              (s) => s.color_name === temp_variant.color?.name,
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

  editInfo: (info) => {
    return set((state) => ({
      SelectedProduct: { ...state.SelectedProduct, ...info },
    }));
  },
  expireLuck: () =>
    set((state) => ({
      ...state,
      SelectedProduct: { ...state.SelectedProduct, is_luck: false },
    })),
  enableAddToCartOption: (product) =>
    set((state) => {
      DisableScroll();
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
              product?.choice_options?.[0]?.options[0] ||
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
              state.SelectedProduct?.choice_options?.[0]?.options[0] ||
              null,
          },
        };
      }
    }),

  notifyProduct: (variantId) =>
    set((state) => {
      let temp = { ...state.SelectedProduct };
      let newVal = {};
      if (temp.variation && temp.variation?.length > 0) {
        newVal = {
          ...temp,
          variation: temp.variation.map((s) => {
            if ((s.product_variation_id ?? s.id) === variantId)
              return { ...s, variant_notify_for_user: true };
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
    EnableScroll();
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
          (s) => s.UID === option.UID,
        ).length > 0
      ) {
        let variable = state.AddToCartOption.selectedOptions.filter(
          (s) => s.UID === option.UID,
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
        let variant = (
          state.variants?.variation ||
          state.variants ||
          []
        ).filter(
          (s) =>
            (s.color?.name || "") ===
              (state?.AddToCartOption?.selectedColor?.color_name || "") &&
            s.size === size?.name,
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
          (s.color?.name || "") === (color?.color_name || "") &&
          (s.size || "") === (state?.AddToCartOption?.selectedSize?.name || ""),
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
