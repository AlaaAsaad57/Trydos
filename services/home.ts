"use client";
import { store } from "store";
import { GetChats } from "store/chat/actions";
import Cookies from "js-cookie";
import userImage from "public/images/profileNo.png";
import { _isStoreLastJson, getLang } from "utils/functions";
import {
  CUSTOMER_INFO_URL,
  HOME_DATA_URL,
  LISTING_INFO_URL,
  OTP_URL,
  REGISTER_DEVICE_URL,
  STARTER_SETTINGS,
} from "utils/endpointConfig";
import { SSRDetect } from "utils/functions";
import { GetMainData } from "store/homepage/actions";
const getHeader = () => {
  return {
    headers: {
      Authorization: `Bearer ${
        typeof localStorage !== "undefined" &&
        localStorage.getItem("MARKET-TOKEN")
      }`,
      lang: getLang(null, Cookies.get("language")),
      country: Cookies.get("country"),
    },
  };
};
class HomeService {
  async getClientData() {
    if (!localStorage.getItem("customer-info")) this.getCustomerInfo();
    const response = await fetch(OTP_URL + STARTER_SETTINGS, getHeader());
    let repo = await response.json();
    store.dispatch({ type: "GET_SETTINGS", payload: repo });
    sessionStorage.setItem("starttingSetting", JSON.stringify(repo.data));

    if (typeof window !== "undefined") {
      _isStoreLastJson() &&
        localStorage.setItem("LAST_JSON", JSON.stringify(repo));
    }
    setTimeout(() => {
      GetChats(false);
    }, 2000);
  }
  async getCustomerInfo() {
    const response = await fetch(OTP_URL + CUSTOMER_INFO_URL, getHeader());
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
      }, 6000);
    }
  }
  async RegisterDevice() {
    if (
      SSRDetect() &&
      !localStorage.getItem("DEVICE-TOKEN") &&
      !localStorage.getItem("USER")
    ) {
      let response = await fetch(OTP_URL + REGISTER_DEVICE_URL, {
        method: "POST",
        ...getHeader(),
      });
      let repo = await response.json();
      localStorage.setItem("DEVICE-TOKEN", repo.data.token);
      localStorage.setItem("guest-user", JSON.stringify(repo.data.user));
      if (typeof window !== "undefined") {
        _isStoreLastJson() &&
          localStorage.setItem("LAST_JSON", JSON.stringify(repo));
      }
    }
  }
  async GetBoutiques(slug) {
    const response = await fetch(
      OTP_URL + HOME_DATA_URL + `ByCategory`,

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
    const sizesAttr = store.getState().details.sizesAttr;
    let filters = {
      categories: filterObj.categories.map((s) => parseInt(s.id)),
      prices: filterObj.prices
        ? [
            `${filterObj.prices.min.toString()}-${filterObj.prices.max.toString()}`,
          ]
        : null,
      brands: filterObj.brands.map((brand) => parseInt(brand.id)),
      attributes: { ...sizesAttr, ...filterObj.sizes },
      boutique_slug: categories,
      searchText: filterObj.searchText,
    };
    let str = `categories=${JSON.stringify(
      filters.categories
    )}&brands=${JSON.stringify(filters.brands)}&attributes=${JSON.stringify(
      filters.attributes
    )}${
      filters.prices !== null ? `&prices=${JSON.stringify(filters.prices)}` : ""
    }&boutique_slug=${filters.boutique_slug}${
      filters?.searchText?.length > 0
        ? `&search_text=${filters.searchText}`
        : ""
    }`;
    var details =
      boutiqueCategory !== "undefined"
        ? {
            boutique_slug: categories,
            category: boutiqueCategory,
          }
        : {
            boutique_slug: categories,
          };
    var formBody: any = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    let url =
      OTP_URL +
      (categories
        ? "/web/products/with_filter" +
          `?${boutiqueCategory ? `category=${boutiqueCategory}&` : ""}${str}`
        : LISTING_INFO_URL + `?${str}`);
    await fetch(
      url + `&offset=${offset}&limit=${20}`,

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
}

export default new HomeService();
