const initialState = {
  cart: [],
  addressLists: [
    {
      id: parseInt(Math.random() * 1000),
      geolocation: {
        lat: 33.50444295570695,
        lng: 36.29793030614546,
      },
      Country: {
        name: "Turkey",
        code: "TR",
      },
      location: "",
      detailes_Address:
        "LA, 1608. Cd., Üniversiteler Mahallesi, Çankaya, Ankara, Central Anatolia Region, 06800, Turkey",
      title: "My Home",
      ContactInfo: {
        name: "Alaa Asaad",
        phone: "+963937288307",
        alternatePhone: "+963937288307",
      },
      region:
        "LA, 1608. Cd., Üniversiteler Mahallesi, Çankaya, Ankara, Central Anatolia Region, 06800, Turkey",
      regionDetails: {
        province: null,
        town: null,
        suburb: null,
      },
    },
  ],
  addressDetails: {
    geolocation: { lat: null, lng: null },
    Country: { name: "Turkey", code: "TR" },
    location: "",
    detailes_Address: "",
    title: "",
    ContactInfo: {
      name: "",
      phone: "",
      alternatePhone: "",
    },
    region: "",
    regionDetails: {
      province: null,
      town: null,
      suburb: null,
    },
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
};

export const CartReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case "INIT-ADDRESS-FORM": {
      return {
        ...state,
        addressDetails: {
          geolocation: { lat: null, lng: null },
          Country: { name: "Turkey", code: "TR" },
          location: "",
          detailes_Address: "",
          title: "",
          ContactInfo: {
            name: "",
            phone: "",
            alternatePhone: "",
          },
          region: "",
          regionDetails: {
            province: null,
            town: null,
            suburb: null,
          },
        },
      };
    }
    case "ADD-ADDRESS": {
      return {
        ...state,
        addressLists: state.addressLists.push({
          ...state.addressDetails,
          id: parseInt(Math.random() * 1000),
        }),
      };
    }
    case "START-UPDATE-ADDRESS": {
      return {
        ...state,
        addressDetails: payload,
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
        addressLists: arr,
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
            enable: true,
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
    case "CART-INIT": {
      let payloadVa = {
        sub_total: 1000,
        total_tax: 0,
        total_discount_on_product: 200,
        total_shipping_cost: 0,
        coupon_discount: 0,
        cod_cost: 0,
        limitFree: 4.9504950495049,
        estimated_tax: 40,
        total: 800,
        rest_for_free_shipping: -795.0495049504951,
        total_cash: 800,
        has_cod: true,
        show_message_reset_for_shipping_free: false,
        available_payment_method: ["COD", "Wallet", "Telr", "Postpay"],
        cart: [
          {
            id: 2173,
            customer_id: 370,
            cart_group_id: "370-UJqtP-1736851458",
            product_id: 7650,
            choices: [],
            variations: [
              {
                color: "Aqua",
              },
            ],
            variant: "Aqua",
            available_quantity: 1000,
            max_allowed_qty: "0",
            vendor_name: "",
            quantity: 1,
            discount: 200,
            price: 1000,
            offer_price: 800,
            tax: 0,
            slug: "control-future-crawling-crab-baby-55",
            name: "Control Future Crawling Crab Baby",
            count_of_pieces: 1,
            shop: {
              image:
                "https://market-under-dev-backend.trydos.dev/assets/front-end/img/image-place-holder.png",
              name: "Clearance",
            },
            brand: {
              id: 762,
              name: "kerastase",
              slug: "kerastase-762",
              image:
                "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/brand/2024-05-19-664a09be4e74f.svg",
            },
            boutique: {
              id: 133,
              icon: {
                file_path:
                  "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/boutiques/boutiques/icon/2025-01-13-6784ea96bb93d.svg",
                original_width: "800px",
                original_height: "800px",
              },
            },
            thumbnail:
              "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/thumbnail/2024-12-23-67687c9e3d4a1.png",
            image:
              "https://res.cloudinary.com/dtcmozf4d/image/upload/v1/product/2024-12-23-67687c91382b4.png",
            created_at: "2025-01-14 16:44:18",
            flash_deal_details: null,
            flash_deal_max_allowed_quantity: null,
            shipping_days: 1,
            have_hurry_up_notify_time_left: false,
            have_hurry_up_notify_qty: false,
            qty_left: 1000,
            time_left_in_minutes: 10,
          },
        ],
      };
      return {
        ...state,
        ...payloadVa,
        loading: false,
        localCart: [
          ...payloadVa.cart.map((s) => ({
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
      let variant = (state.variants?.variation || state.variants || []).filter(
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
            offer_price: variant.offer_price,
            price_formated: variant.price_formated,
          },
        },
      };
    }
    case "AddToCartColor": {
      // let variant = ( state.variants.variation||state.variants).filter(
      //   (s) =>
      //     s.type.includes(payload?.color_name || "") &&
      //     s.type.includes(state?.AddToCartOption?.selectedSize?.name || "")
      // )[0];
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
