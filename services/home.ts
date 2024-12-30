"use client";
import { store } from "store";
import { GetChats } from "store/chat/actions";
import Cookies from "js-cookie";
import userImage from "public/images/profileNo.png";
import {
  _isStoreLastJson,
  AddToCartAnimation,
  getCart,
  getLang,
  UserID,
  UserToken,
} from "utils/functions";
import {
  CUSTOMER_INFO_URL,
  HOME_DATA_URL,
  LISTING_INFO_URL,
  REGISTER_DEVICE_URL,
  STARTER_SETTINGS,
} from "utils/endpointConfig";
import { SSRDetect } from "utils/functions";
import { GetMainData } from "store/homepage/actions";
import { toast } from "react-toastify";
import axios from "node_modules/axios";
import { requestFirebaseNotificationPermission } from "utils/firebaseInitv1";
const getHeader = () => {
  return {
    next: {
      revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
    },
    headers: {
      Authorization: `Bearer ${
        localStorage.getItem("MARKET-TOKEN") ||
        localStorage.getItem("DEVICE-TOKEN")
      }`,
      lang: getLang(null, Cookies.get("language")),
      country: Cookies.get("country"),
    },
  };
};
class HomeService {
  async getClientData() {
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL + STARTER_SETTINGS,
        getHeader()
      );
      let repo = await response.json();
      store.dispatch({ type: "GET_SETTINGS", payload: repo });
      sessionStorage.setItem("starttingSetting", JSON.stringify(repo.data));
      if (!localStorage.getItem("customer-info")) this.getCustomerInfo();
      getCart({
        callback: ([data, res]) => {
          store.dispatch({
            type: "CART-INIT",
            payload: data ?? { cart: [] },
          });
        },
      });
      if (typeof window !== "undefined") {
        _isStoreLastJson() &&
          localStorage.setItem("LAST_JSON", JSON.stringify(repo));
      }
      setTimeout(() => {
        if (localStorage.getItem("USER")) GetChats(false);
      }, 5000);
    } catch (e) {
      console.error(e);
    }
  }
  async getCustomerInfo() {
    const response = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + CUSTOMER_INFO_URL,
      getHeader()
    );
    let repo = await response.json();

    store.dispatch({
      type: "UPDATE_USER_INFO",
      payload: repo.data.customer_info,
    });
    localStorage.setItem(
      "customer-info",
      JSON.stringify(repo.data.customer_info)
    );

    if (typeof window !== "undefined") {
      _isStoreLastJson() &&
        localStorage.setItem("LAST_JSON", JSON.stringify(repo));
    }
  }
  async checkExpiration(bool) {
    let expired_at;

    if (localStorage.getItem("USER")) {
      if (bool) {
        store.dispatch({ type: "CANCEL-AUTH" });
        Cookies.remove("market-token");
        localStorage.clear();
        store.dispatch({ type: "LOGIN-OPEN", payload: true });
      }
    } else if (localStorage.getItem("guest-user") || bool) {
      Cookies.remove("market-token");
      // Split the date into day, month, year

      if (bool) {
        Cookies.remove("DEVICE-TOKEN");

        // localStorage.clear();
        setTimeout(async () => {
          await this.registerForExpire();
        }, 2000);
      }
    }
  }
  async registerForExpire() {
    try {
      let response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL + REGISTER_DEVICE_URL,
        {
          method: "POST",
          ...getHeader(),
        }
      );
      let repo = await response.json();
      localStorage.setItem("DEVICE-TOKEN", repo.data.token);
      Cookies.set("DEVICE-TOKEN", repo.data.token, {
        expires: 365,
      });
      localStorage.setItem(
        "guest-user",
        JSON.stringify({ ...repo.data.user, expired_at: repo.data.expires_at })
      );
    } catch (error) {}
  }
  async CheckLogin() {
    if (!localStorage.getItem("FB-DEVICE-TOKEN")) await this.RegisterDevice();
    if (
      SSRDetect() &&
      localStorage.getItem("USER") &&
      JSON.parse(localStorage.getItem("USER")).is_verified &&
      localStorage.getItem("ID-TOKEN") &&
      localStorage.getItem("MARKET-TOKEN")
    ) {
      Cookies.set("market-token", localStorage.getItem("MARKET-TOKEN"));
      store.dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          id: JSON.parse(localStorage.getItem("USER")).id,
          idToken: localStorage.getItem("ID-TOKEN"),
          name: JSON.parse(localStorage.getItem("USER")).name,
          avatar: JSON.parse(localStorage.getItem("USER")).avatar || userImage,
        },
      });
    } else {
      this.RegisterDevice();
    }
    if (true) {
      await requestFirebaseNotificationPermission().then(async (token) => {
        // @ts-ignore
        if (token) {
          localStorage.setItem("FB-DEVICE-TOKEN", token);

          setTimeout(async () => {
            if (UserToken())
              await axios.post(
                process.env.NEXT_PUBLIC_BACKEND_URL + "/firebase_device_tokens",
                {
                  device_token: token,
                  user_id: UserID(),
                  auth_token: UserToken(),
                }
              );
          }, 3000);
        }
      });
    }
  }
  async RegisterDevice() {
    if (!Cookies.get("DEVICE-TOKEN") && localStorage.getItem("DEVICE-TOKEN")) {
      Cookies.set("DEVICE-TOKEN", localStorage.getItem("DEVICE-TOKEN"), {
        expires: 365,
      });
    }
    if (
      SSRDetect() &&
      !localStorage.getItem("DEVICE-TOKEN") &&
      !localStorage.getItem("USER")
    ) {
      let response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL + REGISTER_DEVICE_URL,
        {
          method: "POST",
          ...getHeader(),
        }
      );
      let repo = await response.json();
      localStorage.setItem("DEVICE-TOKEN", repo.data.token);
      Cookies.set("DEVICE-TOKEN", repo.data.token, {
        expires: 365,
      });
      localStorage.setItem(
        "guest-user",
        JSON.stringify({ ...repo.data.user, expired_at: repo.data.expires_at })
      );
      await requestFirebaseNotificationPermission().then(async (token) => {
        // @ts-ignore
        if (token) {
          localStorage.setItem("FB-DEVICE-TOKEN", token);
          if (localStorage.getItem("MARKET-TOKEN"))
            await axios.post(
              process.env.NEXT_PUBLIC_BACKEND_URL + "/firebase_device_tokens",
              {
                device_token: token,
                user_id: UserID(),
                auth_token: UserToken(),
              }
            );
        }
      });
      if (typeof window !== "undefined") {
        _isStoreLastJson() &&
          localStorage.setItem("LAST_JSON", JSON.stringify(repo));
      }
    }
  }
  async GetBoutiques(slug) {
    const response = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + HOME_DATA_URL + `ByCategory`,

      {
        method: "POST",
        body: JSON.stringify({ slug: slug }),
        headers: {
          ...getHeader().headers,
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
        },
      }
    );
    let repo = await response.json();
    store.dispatch(GetMainData(repo.data.boutiques));
  }
  async getNextProduct({ offset, categories, boutiqueCategory }) {
    const filterObj = store.getState().details.activeFilters;
    const sizesAttr = store.getState().details.filters.sizesAttr;
    let filters: any = {
      categories: filterObj.categories.map((s) => s.slug),
      prices: filterObj.prices?.pricesWord
        ? [
            `${filterObj.prices.min.toString()}-${filterObj.prices.max.toString()}`,
          ]
        : null,
      brands: filterObj.brands.map((brand) => brand.slug),
      attributes: { ...sizesAttr, options: filterObj.sizes },

      searchText: filterObj.searchText,
    };

    if (categories && categories !== "listing")
      filters = { ...filters, boutique_slug: [categories] };

    let str = `category_slugs=${JSON.stringify(
      filters.categories
    )}&brand_slugs=${JSON.stringify(
      filters.brands
    )}&attributes=${JSON.stringify(filters.attributes)}${
      filters.prices !== null ? `&price=${JSON.stringify(filters.prices)}` : ""
    }${
      filters.boutique_slug
        ? `&boutique_slugs=${JSON.stringify(filters.boutique_slug)}`
        : ""
    }${
      filters?.searchText?.length > 0
        ? `&search_text=${filters.searchText}`
        : ""
    }`;
    var details =
      boutiqueCategory !== "undefined"
        ? {
            boutique_slug: [categories],
            category: boutiqueCategory,
          }
        : {
            boutique_slug: [categories],
          };
    var formBody: any = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    let url =
      process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
      (categories
        ? "/api/products/search" +
          `?${boutiqueCategory ? `category=${boutiqueCategory}&` : ""}${str}`
        : LISTING_INFO_URL + `?${str}`);
    await fetch(
      url + `${offset ? `&offset=${offset}` : ""}&limit=${4}`,

      {
        method: "GET",

        headers: {
          ...getHeader().headers,
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
        },
      }
    ).then(async (data) => {
      let repo = await data.json();
      if (repo.data?.products)
        store.dispatch({ type: "GET_NEXT_PRODUCT", payload: repo.data });
      else {
        store.dispatch({ type: "GET_NEXT_PRODUCT_ERROR" });
      }
    });
  }
  async SearchProducts({ search_text, searchFilters, callback }) {
    let params = "";
    let urlParams = new URLSearchParams(params);
    if (searchFilters.categories.length > 0) {
      urlParams.set(
        "category_slugs",
        JSON.stringify(searchFilters.categories.map((s) => `${s.slug}`))
      );
    }
    if (searchFilters.brands.length > 0) {
      urlParams.set(
        "brand_slugs",
        JSON.stringify(searchFilters.brands.map((s) => `${s.slug}`))
      );
    }
    if (searchFilters.boutiques.length > 0) {
      urlParams.set(
        "boutique_slugs",
        JSON.stringify(searchFilters.boutiques.map((s) => `${s.slug}`))
      );
    }

    try {
      let rep = await fetch(
        process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
          "/api/products/search" +
          `?search_text=${search_text}${
            urlParams.size > 0 ? `&` + urlParams.toString() : ""
          }&limit=4&with_filter=false`,
        {
          headers: {
            ...getHeader().headers,
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            Accept: "application/json",
          },
        }
      );
      let repo = await rep.json();
      callback(repo.data.products);
    } catch (error) {
      console.log(error);
    }
  }
  async UpdateFilters({ search_text, callback }) {
    let searchFilters = store.getState().Search.searchFilters;
    let params = "";
    let urlParams = new URLSearchParams(params);
    if (searchFilters.categories.length > 0) {
      urlParams.set(
        "category_slugs",
        JSON.stringify(searchFilters.categories.map((s) => `${s.slug}`))
      );
    }
    if (searchFilters.brands.length > 0) {
      urlParams.set(
        "brand_slugs",
        JSON.stringify(searchFilters.brands.map((s) => `${s.slug}`))
      );
    }
    if (searchFilters.boutiques.length > 0) {
      urlParams.set(
        "boutique_slugs",
        JSON.stringify(searchFilters.boutiques.map((s) => `${s.slug}`))
      );
    }
    try {
      let rep = await fetch(
        process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
          `/api/products/search?${
            search_text?.length > 0 ? `search_text=${search_text}` : ""
          }${
            urlParams.toString()?.length > 0 ? `&${urlParams.toString()}` : ""
          }`,
        {
          headers: {
            ...getHeader().headers,
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            Accept: "application/json",
          },
        }
      );
      let repo = await rep.json();

      callback({
        brands: repo.data.brands,
        categories: repo.data.categories,
        boutiques: repo.data.boutiques,
        total_size: repo.data.total_size,
      });
    } catch (error) {
      console.log(error);
    }
  }
  async AddToCart({
    id,
    size,
    color,
    image,
    quantity,
    callback,
    alreadyExist,
    errCallback,
    slug,
  }: {
    id: number;
    size: string;
    color: string;
    image: string;
    quantity: number;
    callback: Function;
    alreadyExist: boolean;
    errCallback?: Function;
    slug: string;
  }) {
    AddToCartAnimation();
    if (alreadyExist) {
      let dataBody = [];
      let dataObj = { key: alreadyExist, quantity: quantity + 1 || 0 };
      for (var property in dataObj) {
        if (dataObj[property] || dataObj[property] === 0) {
          var encodedKey = encodeURIComponent(property);
          var encodedValue = encodeURIComponent(dataObj[property]);
          dataBody.push(encodedKey + "=" + encodedValue);
        }
      }

      // After the animation, remove the cloned image and update the cart
      setTimeout(() => {
        // @ts-ignore
        clonedImage.remove();
        // Update cart item count
      }, 1000);

      // request
      // @ts-ignore
      dataBody = dataBody.join("&");

      let res;
      try {
        res = await axios.post(
          process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/update",
          dataBody,
          {
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem("MARKET-TOKEN") ||
                localStorage.getItem("DEVICE-TOKEN")
              }`,
              lang: getLang(null, Cookies.get("language")),
              country: Cookies.get("country"),
            },
          }
        );
      } catch (error) {
        if (error.status === 401) {
          await this.registerForExpire();

          setTimeout(() => {
            this.AddToCart({
              id,
              size,
              color,
              image,
              quantity,
              callback,
              alreadyExist,
              errCallback,
              slug,
            });
          }, 2000);
        }
        store.dispatch({ type: "LOADED-CART", payload: true });
      }

      store.dispatch({ type: "LOADED-CART", payload: true });
      if (res.data?.data?.qty >= 0 && res.data?.data.status !== 0) {
        callback({ id: alreadyExist });
      } else {
        errCallback();
        // store.dispatch({ type: "AddToCartOptionDisable" });
        toast.info(res.data?.message || "Failed");
      }
    } else {
      const imageVar = image.split("/")[image.split("/").length - 1];
      let details = { id, color, image: imageVar, quantity, choice_1: size };
      let formBody = [];
      for (var property in details) {
        if (details[property]) {
          var encodedKey = encodeURIComponent(property);
          var encodedValue = encodeURIComponent(details[property]);
          formBody.push(encodedKey + "=" + encodedValue);
        }
      }
      // @ts-ignore
      formBody = formBody.join("&");
      let res;
      try {
        res = await axios.post(
          process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/add",
          formBody,
          {
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem("MARKET-TOKEN") ||
                localStorage.getItem("DEVICE-TOKEN")
              }`,
              lang: getLang(null, Cookies.get("language")),
              country: Cookies.get("country"),
            },
          }
        );
      } catch (error) {
        if (error.status === 401) {
          await this.registerForExpire();

          setTimeout(() => {
            this.AddToCart({
              id,
              size,
              color,
              image,
              quantity,
              callback,
              alreadyExist,
              errCallback,
              slug,
            });
          }, 2000);
        }
        store.dispatch({ type: "LOADED-CART", payload: true });
      }

      let fbtoken = localStorage.getItem("FB-DEVICE-TOKEN");

      store.dispatch({ type: "LOADED-CART", payload: true });
      if (res.data?.data?.id_cart) {
        callback({ id: res.data?.data?.id_cart });
        await fetch("/api/subscribeToTopic", {
          cache: "no-cache",
          method: "POST",
          // @ts-ignore
          body: JSON.stringify({
            token: fbtoken,
            topic: `product_hurry_up_${res.data?.data?.id_cart}`,
          }),
        });
        await this.subscribeToTopics({
          slug: slug,
          discount: true,
          comments: true,
        });
      } else {
        errCallback();
        // store.dispatch({ type: "AddToCartOptionDisable", payload: true });
        toast.info(res.data?.message || "Failed");
      }
    }
  }
  async subscribeToTopics({
    slug,
    discount,
    comments,
  }: {
    slug: string;
    discount?: boolean;
    comments?: boolean;
  }) {
    let fbtoken = localStorage.getItem("FB-DEVICE-TOKEN");
    if (discount)
      await fetch("/api/subscribeToTopic", {
        method: "POST",
        // @ts-ignore
        body: JSON.stringify({
          token: fbtoken,
          topic: `product_discount_${slug}`,
        }),
      });
    if (comments)
      await fetch("/api/subscribeToTopic", {
        cache: "no-cache",
        method: "POST",
        // @ts-ignore
        body: JSON.stringify({
          token: fbtoken,
          topic: `product_comment_${slug}`,
        }),
      });
  }
  async hideOldCart({ id }: { id?: number }) {
    try {
      let response = await axios.post(
        process.env.NEXT_PUBLIC_BACKEND_URL + "/old-cart/hide",
        { id: id },
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("MARKET-TOKEN") ||
              localStorage.getItem("DEVICE-TOKEN")
            }`,
            lang: getLang(null, Cookies.get("language")),
            country: Cookies.get("country"),
          },
        }
      );
    } catch (error) {
      toast.info("Error hiding old Cart");
    }
  }
  async TestNotificationBoutique({ boutique_id }) {
    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_boutique_created",
      { boutique_id: 66, topic: "boutique_created" },
      { ...getHeader() }
    );
  }
  async TestNotificationProductToOldCart() {
    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_product_cart_expiration",
      { product_id: 5566 },
      { ...getHeader() }
    );
  }
  async TestNotificationProductAvailable() {
    await axios
      .post(
        process.env.NEXT_PUBLIC_BACKEND_URL +
          "/firebase_device_tokens/send_product_availability",
        { product_id: 5550, variant: "Gold-XXL" },
        { ...getHeader() }
      )
      .catch((s) => {
        console.error(s);
      });
  }
  async TestNotificationProductComment() {
    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_product_comment",
      {
        product_id: 5550,
        topic: "product_comment_mixit-solid-bangle-bracelet-RhqqPZ",
      },
      { ...getHeader() }
    );
  }
  async TestNotificationProductDiscount() {
    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_product_discount",
      {
        product_id: 5550,
        topic: "product_discount_mixit-solid-bangle-bracelet-RhqqPZ",
      },
      { ...getHeader() }
    );
  }
  async TestNotificationCategoryCreated() {
    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_category_created",
      { category_id: 368, topic: "category_created" },
      { ...getHeader() }
    );
  }
  async RemoveFromCart({ key }) {
    try {
      await axios.post(
        process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/remove",
        { key: key },
        { ...getHeader() }
      );
    } catch (error) {}
  }
  async StoreNotificationProduct({ type_id, variant, product_id }) {
    let detail = {
      user_id: UserID(),
      product_id: product_id,
      notification_type_id: type_id,
      variant: variant,
    };
    var formBody: any = [];
    for (var property in detail) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(detail[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    await axios
      .post(
        process.env.NEXT_PUBLIC_BACKEND_URL + "/product_notification/store",
        formBody,
        { ...getHeader() }
      )
      .catch((e) => {});
  }
}

export default new HomeService();
