"use client";
import { store } from "store";
import { GetChats } from "store/chat/actions";
import Cookies from "js-cookie";
import userImage from "public/images/profileNo.png";
import {
  _isStoreLastJson,
  AddToCartAnimation,
  ExpiredUser,
  getCart,
  getOldCart,
  getLang,
  getUser,
  UserID,
  UserToken,
  WaitForCondition,
  GetAppLanguage,
  GetAppCountry,
} from "utils/functions";
import Smartlook from "smartlook-client";

import {
  CUSTOMER_INFO_URL,
  FIREBASE_SETTINGS_URL,
  LISTING_INFO_URL,
  REGISTER_DEVICE_URL,
  STARTER_SETTINGS,
} from "utils/endpointConfig";
import { SSRDetect } from "utils/functions";
import { toast } from "react-toastify";
import axios from "axios";
import {
  onMessageListener,
  requestFirebaseNotificationPermission,
} from "utils/firebaseInitv1";
import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { changeToken } from "store/homepage/cachedActions";
import {
  CustomerInfoApi,
  GetProductApi,
  RegisterGuestApi,
  StarttingSettingApi,
  UpdateCartApi,
} from "models/Api";
const getHeader = () => {
  let [countryUrl, languageUrl] = window.location.pathname
    .split("/")[1]
    .split("-");
  return {
    next: {
      revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
    },
    headers: {
      Authorization: `Bearer ${
        localStorage.getItem("MARKET-TOKEN") ||
        localStorage.getItem("DEVICE-TOKEN")
      }`,
      lang: getLang(languageUrl, Cookies.get("language")),
      country: countryUrl || Cookies.get("country"),
      accept: "application/json",
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
      let repo: { data: StarttingSettingApi } = await response.json();
      store.dispatch({ type: "GET_SETTINGS", payload: repo });
      sessionStorage.setItem("starttingSetting", JSON.stringify(repo.data));
      await this.getCustomerInfo();

      getCart({
        callback: ([data, res]) => {
          store.dispatch({
            type: "CART-INIT",
            payload: data ?? { cart: [] },
          });
        },
      });
      await getOldCart();
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
  async GetFireBaseSettings() {
    const response2 = await AxiosGet({
      url: process.env.NEXT_PUBLIC_BACKEND_URL + FIREBASE_SETTINGS_URL,
      title: "get firebase settings request",
    });
    store.dispatch({
      type: "GET_FIREBASE_SETTINGS",
      payload: response2?.firebase_settings,
    });
  }
  async getCustomerInfo() {
    await WaitForCondition();
    const response = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + CUSTOMER_INFO_URL,
      getHeader()
    );
    if (response.status === 200) {
      let repo: {
        data: CustomerInfoApi;
      } = await response.json();

      if (repo.data) {
        store.dispatch({
          type: "UPDATE_USER_INFO",
          payload: repo.data?.customer_info,
        });
        // localStorage.setItem(
        //   "customer-info",
        //   JSON.stringify(repo.data.customer_info)
        // );
        if (typeof window !== "undefined") {
          _isStoreLastJson() &&
            localStorage.setItem("LAST_JSON", JSON.stringify(repo));
        }
      }
    }
    if (response.status === 500 || response.status === 422) {
      toast.error("Customer Info Error");
    }
    if (response.status === 302 || response.status === 401) {
      if (getUser()) {
        await ExpiredUser();
      } else {
        await this.registerForExpire();
        await this.getCustomerInfo();
      }
    }
  }
  async checkExpiration(bool) {
    if (localStorage.getItem("USER")) {
      if (bool) {
        store.dispatch({ type: "CANCEL-AUTH" });
        Cookies.remove("MARKET-TOKEN");
        localStorage.clear();
        store.dispatch({ type: "LOGIN-OPEN", payload: true });
      }
    } else if (localStorage.getItem("guest-user") || bool) {
      Cookies.remove("MARKET-TOKEN");
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
  async registerForExpire(id?: number) {
    let isReady = store.getState().homepage.isRegisteringReady;
    if (isReady) {
      let body = id
        ? { old_guest_user_id: id }
        : localStorage.getItem("guest-user")
        ? {
            old_guest_user_id: JSON.parse(localStorage.getItem("guest-user"))
              .id,
          }
        : { old_guest_user_id: null };

      try {
        store.dispatch({ type: "IS-REGISTERING", payload: false });
        let response = await fetch(
          process.env.NEXT_PUBLIC_BACKEND_URL + REGISTER_DEVICE_URL,
          {
            method: "POST",
            body: body.old_guest_user_id
              ? new URLSearchParams({
                  old_guest_user_id: body.old_guest_user_id,
                })
              : "old_guset_user_id=null",
            ...getHeader(),
            cache: "no-cache",
          }
        );
        let repo: RegisterGuestApi = await response.json();
        changeToken({ key: "DEVICE-TOKEN", value: repo.data.token });
        localStorage.setItem("DEVICE-TOKEN", repo.data.token);
        Cookies.set("DEVICE-TOKEN", repo.data.token, {
          expires: 365,
        });
        localStorage.setItem(
          "guest-user",
          JSON.stringify({
            ...repo.data.user,
            expired_at: repo.data.expires_at,
          })
        );
        if (repo.data.user) {
          Smartlook.identify(repo.data.user.id, {
            name: repo.data.user.name,
            phone: "guest",
            // other custom properties
          });
        }
        store.dispatch({ type: "IS-REGISTERING", payload: true });
      } catch (error) {
        store.dispatch({ type: "IS-REGISTERING", payload: true });
      }
    }
  }
  async RequestFireBase() {
    await requestFirebaseNotificationPermission().then(async (token) => {
      let language_code = window.location.pathname.split("/")[1].split("-")[1];
      let country_code = window.location.pathname.split("/")[1].split("-")[0];
      // @ts-ignore
      if (token) {
        localStorage.setItem("FB-DEVICE-TOKEN", token);
        setTimeout(async () => {
          if (UserToken()) {
            await AxiosPost({
              url:
                process.env.NEXT_PUBLIC_BACKEND_URL + "/firebase_device_tokens",
              body: {
                device_token: token,
                user_id: UserID(),
                auth_token: UserToken(),
              },
              title: "register firebase token",
            });
          }
        }, 2000);
        // ininit
      }
    });
  }
  async CheckLogin() {
    if (!localStorage.getItem("FB-DEVICE-TOKEN")) await this.RegisterDevice();
    if (
      SSRDetect() &&
      localStorage.getItem("USER") &&
      JSON.parse(localStorage.getItem("USER"))?.is_verified &&
      localStorage.getItem("ID-TOKEN") &&
      localStorage.getItem("MARKET-TOKEN")
    ) {
      Cookies.set("MARKET-TOKEN", localStorage.getItem("MARKET-TOKEN"));
      changeToken({
        key: "MARKET-TOKEN",
        value: localStorage.getItem("MARKET-TOKEN"),
      });

      Smartlook.identify(JSON.parse(localStorage.getItem("USER")).id, {
        name: JSON.parse(localStorage.getItem("USER")).name,
        phone: JSON.parse(localStorage.getItem("USER")).mobilePhone,
        // other custom properties
      });
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
      if (localStorage.getItem("guest-user")) {
        Smartlook.identify(JSON.parse(localStorage.getItem("guest-user")).id, {
          name: JSON.parse(localStorage.getItem("guest-user")).name,
          phone: JSON.parse(localStorage.getItem("guest-user")).mobilePhone,
          // other custom properties
        });
      }
      this.RegisterDevice();
    }
    await this.RequestFireBase();
    typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      onMessageListener()
        .then((payload) => {})
        .catch((err) => {});
  }
  async RegisterDevice() {
    let isReady = store.getState().homepage.isRegisteringReady;
    if (isReady) {
      let body = localStorage.getItem("guest-user")
        ? {
            old_guest_user_id: JSON.parse(localStorage.getItem("guest-user"))
              .id,
          }
        : { old_guest_user_id: null };
      if (
        !Cookies.get("DEVICE-TOKEN") &&
        localStorage.getItem("DEVICE-TOKEN")
      ) {
        changeToken({
          key: "DEVICE-TOKEN",
          value: localStorage.getItem("DEVICE-TOKEN"),
        });
        Cookies.set("DEVICE-TOKEN", localStorage.getItem("DEVICE-TOKEN"), {
          expires: 365,
        });
      }
      if (
        SSRDetect() &&
        !localStorage.getItem("DEVICE-TOKEN") &&
        !localStorage.getItem("USER")
      ) {
        store.dispatch({ type: "IS-REGISTERING", payload: false });
        let response = await fetch(
          process.env.NEXT_PUBLIC_BACKEND_URL + REGISTER_DEVICE_URL,
          {
            method: "POST",
            body: body.old_guest_user_id
              ? new URLSearchParams({
                  old_guest_user_id: body.old_guest_user_id,
                })
              : "old_guset_user_id=null",
            ...getHeader(),
          }
        );
        let repo: RegisterGuestApi = await response.json();
        localStorage.setItem("DEVICE-TOKEN", repo.data.token);
        changeToken({ key: "DEVICE-TOKEN", value: repo.data.token });

        Cookies.set("DEVICE-TOKEN", repo.data.token, {
          expires: 365,
        });
        localStorage.setItem(
          "guest-user",
          JSON.stringify({
            ...repo.data.user,
            expired_at: repo.data.expires_at,
          })
        );
        localStorage.removeItem("customer-info");
        if (repo.data.user) {
          Smartlook.identify(repo.data.user.id, {
            name: repo.data.user.name,
            phone: "guest",
            // other custom properties
          });
          await this.RequestFireBase();
        }
        store.dispatch({ type: "IS-REGISTERING", payload: true });
        if (typeof window !== "undefined") {
          _isStoreLastJson() &&
            localStorage.setItem("LAST_JSON", JSON.stringify(repo));
        }
      }
    }
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

    let str = `${
      filters.categories?.length > 0
        ? `category_slugs=${JSON.stringify(filters.categories)}`
        : ""
    }${
      filters.brands?.length > 0
        ? `&brand_slugs=${JSON.stringify(filters.brands)}`
        : ""
    }${
      filters.attributes?.options?.length > 0
        ? `&attributes=${JSON.stringify(filters.attributes)}`
        : ""
    }${
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
      let repo: GetProductApi = await data.json();
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
      let repo: GetProductApi = await rep.json();
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
      let repo: GetProductApi = await rep.json();

      callback({
        brands: repo.data.brands,
        categories: repo.data.categories,
        boutiques: repo.data.boutiques,
        total_size: repo.data.total_size,
        products: repo.data.products,
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
    alreadyExist: boolean | number;
    errCallback?: Function;
    slug: string;
  }) {
    let language_code = window.location.pathname.split("/")[1].split("-")[1];
    let country_code = window.location.pathname.split("/")[1].split("-")[0];
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
        // clonedImage.remove();
        // Update cart item count
      }, 1000);

      // request
      // @ts-ignore
      dataBody = dataBody.join("&");

      let res: UpdateCartApi;

      res = await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/update",
        body: dataBody,
        title: "Update  Quantity For Product in Cart",
      });

      store.dispatch({ type: "LOADED-CART", payload: true });
      if (res?.qty >= 0 && res?.status !== 0) {
        callback({ id: alreadyExist });
      } else {
        errCallback();
        store.dispatch({ type: "AddToCartOptionDisable" });
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
      let res: UpdateCartApi;
      try {
        res = await AxiosPost({
          url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/add",
          body: formBody,
          title: "Add  Product to Cart",
        });
      } catch (error) {
        store.dispatch({ type: "LOADED-CART", payload: true });
        return;
      }
      store.dispatch({ type: "LOADED-CART", payload: true });
      if (res?.id_cart) {
        callback({ id: res?.id_cart });
        await this.subscribeToTopic({
          topic: `product_availability_${id}`,
        });
      } else {
        errCallback();
        // store.dispatch({ type: "AddToCartOptionDisable", payload: true });
        toast.info(res?.message || "Failed");
      }
    }
  }

  async subscribeToTopic({
    topic,
    variant,
  }: {
    topic: string;
    variant?: string;
  }) {
    let token = localStorage.getItem("FB-DEVICE-TOKEN");

    if (token) {
      let response = await AxiosPost({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          "/firebase_device_tokens/subscribe_topic",
        body: {
          topic,
          variant,
        },
        title: "store firebase tsubscribe opic",
      });
      store.dispatch({
        type: "GET_FIREBASE_SETTINGS",
        payload: response.firebase_settings,
      });
    }
  }
  async UnsubscripeFromTopic({ topic }) {
    let response = await AxiosPost({
      url:
        process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/unsubscribe_topic",
      body: {
        topic,
      },
      title: "store firebase unsubscribe topic",
    });
    store.dispatch({
      type: "GET_FIREBASE_SETTINGS",
      payload: response.firebase_settings,
    });
  }
  async handleTopicsOnPageRefresh(token: string) {
    // Extract country and language from the URL
    const [countryCode, languageCode] = window.location.pathname
      .split("/")[1]
      .split("-");
    const lastPair = localStorage.getItem("lastPair");
    if (!countryCode || !languageCode) {
      throw new Error("Invalid URL format for country-language pair");
    }

    if (!token) return;

    if (lastPair !== countryCode + languageCode) {
      AxiosPost({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          "/firebase_device_tokens/change_country_language",
        body: {
          country: countryCode,
          language_code: languageCode,
        },
        title: "change firebase country-language pair",
      }).then((firebase_settings) => {
        store.dispatch({
          type: "GET_FIREBASE_SETTINGS",
          payload: firebase_settings,
        });
      });
      localStorage.setItem("lastPair", countryCode + languageCode);
    }
  }

  async hideOldCart({ id }: { id?: number }) {
    try {
      await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/old-cart/hide",
        body: { id: id },
        title: "Hide Old Cart",
      });
    } catch (error) {}
  }
  async TestNotificationBoutique({ boutique_id }) {
    await this.subscribeToTopic({ topic: "boutique_created" });
    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_boutique_created",
      {
        boutique_id: 144,
        topic: "boutique_created",
        language_code: GetAppLanguage(),
        country_iso: GetAppCountry(),
      },
      { ...getHeader() }
    );
  }
  async TestNotificationProductToOldCart() {
    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_product_cart_expiration",

      {
        product_id: 7681,
        language_code: GetAppLanguage(),
        country_iso: GetAppCountry(),
      },
      { ...getHeader() }
    );
  }
  async TestNotificationProductAvailable() {
    await this.subscribeToTopic({
      topic: "product_availability_7681",
      variant: "Blue-XXL",
    });

    await axios
      .post(
        process.env.NEXT_PUBLIC_BACKEND_URL +
          "/firebase_device_tokens/send_product_availability",
        {
          product_id: 7681,
          variant: "Blue-XXL",
          topic: "product_availability_7681",
          language_code: GetAppLanguage(),
          country_iso: GetAppCountry(),
        },
        { ...getHeader() }
      )
      .catch((s) => {
        console.error(s);
      });
  }

  async TestNotificationProductComment() {
    await this.subscribeToTopic({ topic: "product_comment_7681" });
    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_product_comment",
      {
        product_id: 7681,
        topic: "product_comment_7681",
        language_code: GetAppLanguage(),
        country_iso: GetAppCountry(),
      },
      { ...getHeader() }
    );
  }
  async TestNotificationProductDiscount() {
    await this.subscribeToTopic({ topic: "product_discount_7681" });

    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_product_discount",
      {
        product_id: 7681,
        topic: "product_discount_7681",
        language_code: GetAppLanguage(),
        country_iso: GetAppCountry(),
      },
      { ...getHeader() }
    );
  }
  async TestNotificationCategoryCreated() {
    await this.subscribeToTopic({ topic: "category_created" });

    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_category_created",
      {
        category_id: 392,
        topic: "category_created",
        language_code: GetAppLanguage(),
        country_iso: GetAppCountry(),
      },
      { ...getHeader() }
    );
  }
  //before stock out and change in price
  async TestNotificationBeforeStockOut() {
    await this.subscribeToTopic({ topic: "product_before_stock_out_7681" });

    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_product_before_stock_out",
      {
        user_id: UserID(),
        product_id: 7681,
        topic: "product_before_stock_out_7681",
        language_code: GetAppLanguage(),
        country_iso: GetAppCountry(),
      },
      { ...getHeader() }
    );
  }
  async TestNotificationChangeInPrice() {
    await this.subscribeToTopic({ topic: "product_when_change_in_price_7681" });

    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_product_when_change_in_price",
      {
        user_id: UserID(),
        product_id: 7681,
        topic: "product_when_change_in_price_7681",
        language_code: GetAppLanguage(),
        country_iso: GetAppCountry(),
      },
      { ...getHeader() }
    );
  }
  async RemoveFromCart({ key }) {
    try {
      AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/remove",
        body: { key: key },
        title: "Remove From Cart",
      });
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
  async EditNotificationSettings({ url, body }) {
    try {
      await AxiosPost({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          `/firebase_device_tokens/${url}`,
        body: body,
        title: "Remove From Cart",
      });
    } catch (error) {}
  }
}

export default new HomeService();
