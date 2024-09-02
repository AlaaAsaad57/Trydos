"use client";
import { store } from "store";
import { GetChats } from "store/chat/actions";
import Cookies from "js-cookie";
import userImage from "public/images/profileNo.png";
import { _isStoreLastJson, getCart, getLang } from "utils/functions";
import {
  CUSTOMER_INFO_URL,
  HOME_DATA_URL,
  LISTING_INFO_URL,
  REGISTER_DEVICE_URL,
  STARTER_SETTINGS,
} from "utils/endpointConfig";
import { SSRDetect } from "utils/functions";
import { GetMainData, LogData } from "store/homepage/actions";
import { FetchApi } from "store/homepage/cachedActions";
import { toast } from "react-toastify";
const getHeader = () => {
  return {
    next: {
      revalidate: 36000,
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
      if (
        !localStorage.getItem("customer-info") &&
        localStorage.getItem("USER")
      )
        this.getCustomerInfo();
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
  async CheckLogin() {
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
      setTimeout(() => {
        this.getClientData();
      }, 10);
    } else {
      this.RegisterDevice();
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
      localStorage.setItem("guest-user", JSON.stringify(repo.data.user));

      if (typeof window !== "undefined") {
        _isStoreLastJson() &&
          localStorage.setItem("LAST_JSON", JSON.stringify(repo));
      }
    }
    setTimeout(() => {
      this.getClientData();
    }, 10);
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

    if (categories !== "listing")
      filters = { ...filters, boutique_slug: [categories] };
    let str = `category_slugs=${JSON.stringify(
      filters.categories
    )}&brand_slugs=${JSON.stringify(
      filters.brands
    )}&attributes=${JSON.stringify(filters.attributes)}${
      filters.prices !== null ? `&prices=${JSON.stringify(filters.prices)}` : ""
    }&boutique_slugs=${JSON.stringify(filters.boutique_slug)}${
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
      process.env.NEXT_PUBLIC_BACKEND_URL +
      (categories
        ? "/web/products" +
          `?${boutiqueCategory ? `category=${boutiqueCategory}&` : ""}${str}`
        : LISTING_INFO_URL + `?${str}`);
    await fetch(
      url + `&offset=${offset}&limit=${4}`,

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
      store.dispatch({ type: "GET_NEXT_PRODUCT", payload: repo.data });
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
        process.env.NEXT_PUBLIC_BACKEND_URL +
          "/web/search" +
          `?search_text=${search_text}&${urlParams.toString()}&offset=1&limit=4`,
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
        process.env.NEXT_PUBLIC_BACKEND_URL +
          `/web/search/filters?${
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
  }) {
    if (alreadyExist) {
      let dataBody = [];
      let dataObj = { key: alreadyExist, quantity: quantity + 1 };
      for (var property in dataObj) {
        if (dataObj[property]) {
          var encodedKey = encodeURIComponent(property);
          var encodedValue = encodeURIComponent(dataObj[property]);
          dataBody.push(encodedKey + "=" + encodedValue);
        }
      }
      // @ts-ignore
      dataBody = dataBody.join("&");
      let [updateQuantity, data] = await FetchApi({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/update",
        method: "POST",
        body: dataBody,
        country: null,
        lang: null,
      });
      LogData(data);

      store.dispatch({ type: "LOADED-CART", payload: true });
      if (updateQuantity?.data?.qty >= 0) {
        callback({ id: alreadyExist });
      } else {
        toast.info(updateQuantity?.message || "Failed");
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

      let [data, response] = await FetchApi({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/add",
        method: "POST",
        body: formBody,
        country: null,
        lang: null,
      });
      LogData(response);
      store.dispatch({ type: "LOADED-CART", payload: true });
      if (data?.data?.id_cart) {
        callback({ id: data?.data?.id_cart });
      } else {
        toast.info(data?.message || "Failed");
      }
    }
  }
}

export default new HomeService();
