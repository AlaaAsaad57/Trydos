import axios from "axios";

import pngErr from "public/images/error.png";
import Cookies from "js-cookie";
import { setupCache } from "axios-cache-interceptor";
import home from "services/home";

import { LogError, translateFunction, WaitForCondition } from "./functions";

import auth from "services/auth";
import { UnAuthintacetedAction } from "./tinyUtils";
import {
  showSuccessNotification,
  showErrorNotification,
} from "@/store/notifications/reducer";
import {
  showSuccessMessage,
  showErrorMessage,
} from "@/components/global/AddToCartMessage";

export const errorPNG = pngErr;
const getHeader = (token?, headers?) => {
  let [countryUrl, languageUrl] = window.location.pathname
    .split("/")[1]
    .split("-");
  return {
    headers: {
      ...headers,
      lang: languageUrl || Cookies.get("language") || Cookies.get("lang"),
      country: countryUrl || Cookies.get("country"),
      Authorization: `Bearer ${
        token ??
        localStorage.getItem("MARKET-TOKEN") ??
        localStorage.getItem("DEVICE-TOKEN") ??
        Cookies.get("MARKET-TOKEN") ??
        Cookies.get("DEVICE-TOKEN")
      }`,
      accept: "application/json",
    },
  };
};
export const AxiosGet = async ({
  url,
  title,
  token,
  headers = {},
}: {
  url: string;
  title?: string;
  token?: string;
  headers?: any;
}) => {
  await WaitForCondition();
  let attempt = 0;
  let retries = 2;
  let delay = 2000;
  while (attempt <= retries) {
    try {
      let res = await axios.get(url, getHeader(token, headers));

      if (
        url.includes("user-notifications/get") ||
        url.includes("/customer/order/list") ||
        url.includes("/coupon/apply") ||
        url.includes("/api/addresses/CountryBoundaryByIso")
      ) {
        return res.data;
      }
      if (res?.data?.popular_search_terms) {
        return res.data.popular_search_terms;
      }
      if (res?.data.isSuccessful || res.data.data) {
        return res?.data?.data;
      } else {
        throw new Error(res.data.message);
      }
    } catch (error) {
      if (error.status !== 401) {
        attempt = 2;
        if (!url.includes("/api/addresses/CountryBoundaryByIso"))
          showErrorNotification(`${title} : ${error.message ?? "Failed"}`);
        throw new Error(
          `${title} : Max retries reached. Could not fetch the data. ${error.message}`
        );
        return;
      }
      if (error.status === 401) {
        if (
          url.includes(process.env.NEXT_PUBLIC_CHAT_BACKEND_URL) ||
          url.includes(process.env.NEXT_PUBLIC_STORIES_BACKEND_URL)
        ) {
          UnAuthintacetedAction();
          return;
        }
        if (auth.getUser()) {
          await auth.ExpiredUser();
        } else {
          await home.registerForExpire();
        }
      }
      attempt++;
      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      if (attempt > retries) {
        let errorObj = {
          type: "api-call-back-end-exception",
          message: error?.message,
          url: url,
          user_id: auth.UserID(),
          token: auth.UserToken(),
          user_agent: navigator.userAgent,
          backend_url: url,
          req_method: "get",
          req_body: null,
          req_headers: getHeader(token, headers),
          req_params: null,
          req_query: null,
          req_status: error?.status,
          req_status_text: error?.statusText,
        };
        LogError(errorObj);

        throw new Error(
          `${title} : Max retries reached. Could not fetch the data. ${error.message}`
        );
      }
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};
export const AxiosPost = async ({
  url,
  title,
  body,
  hasMessageOnly,
  token,
  headers = {},
}: {
  url: string;
  title?: string;
  body: any;
  hasMessageOnly?: boolean;
  token?: string;
  headers?: any;
}) => {
  await WaitForCondition();
  let attempt = 0;
  let retries = 2;
  let delay = 2000;
  while (attempt <= retries) {
    try {
      let res = await axios.post(url, body, getHeader(token, headers));
      if (url.includes("products/view")) {
        return res.data;
      }
      if (url.includes(`change_country_language`)) {
        if (res.data) {
          return res.data.data.firebase_settings;
        }
      }
      if (url.includes("/cart/update") || url.includes("/cart/add")) {
        // TODO: custome notification
        if (res.data.data.status === 1) {
          if (url.includes("/cart/add"))
            showSuccessMessage(translateFunction("Add 1 Item To Your Bag"));
          else
            showSuccessMessage(translateFunction("Updated 1 Item In Your Bag"));

          return res.data.data;
        } else {
          if (url.includes("/cart/add"))
            showErrorMessage(translateFunction("Failed To Add"));
          else showErrorMessage(translateFunction("Failed to Update"));

          throw Error("Cart Error");
        }
      }
      if (res?.data.isSuccessful) {
        if (
          url.includes("product_likes") ||
          url.includes("old-cart/hide") ||
          url.includes("/cart/remove") ||
          url.includes("customer/update-name") ||
          hasMessageOnly
        ) {
          showSuccessNotification(res.data.message);
          return res.data.data;
        }
        return res?.data.data;
      } else {
        throw new Error(res.data.message);
      }
    } catch (error) {
      if (
        error?.message === "Cart Error" ||
        url.includes("cart/add") ||
        url.includes("cart/update") ||
        url.includes("cart/remove")
      ) {
        if (url.includes("cart/add"))
          showErrorMessage(translateFunction("Failed To Add"));
        else showErrorMessage(translateFunction("Failed to Update"));
        attempt = 2;
        throw new Error(
          `${title} : Max retries reached. Could not fetch the data. ${error.message}`
        );
      }
      if (error.status !== 401) {
        if (error?.response?.data?.message) {
          showErrorNotification(
            `${title ?? ""} : ${error?.response?.data?.message ?? "Failed"}`
          );
        } else {
          showErrorNotification(
            `${title ?? ""} : ${error.message ?? "Failed"}`
          );
        }
        attempt = 2;
        throw new Error(
          `${title} : Max retries reached. Could not fetch the data. ${error.message}`
        );
        return;
      }

      if (error.status === 401) {
        if (
          url.includes(process.env.NEXT_PUBLIC_CHAT_BACKEND_URL) ||
          url.includes(process.env.NEXT_PUBLIC_STORIES_BACKEND_URL)
        ) {
          UnAuthintacetedAction();
          return;
        }
        if (auth.getUser()) {
          await auth.ExpiredUser();
        } else {
          await home.registerForExpire();
        }
      }
      attempt++;
      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      if (attempt > retries) {
        let errorObj = {
          type: "api-call-back-end-exception",
          message: error?.message,
          url: url,
          user_id: auth.UserID(),
          token: auth.UserToken(),
          user_agent: navigator.userAgent,
          backend_url: url,
          req_method: "post",
          req_body: body,
          req_headers: getHeader(token, headers),
          req_params: null,
          req_query: null,
          req_status: error?.status,
          req_status_text: error?.statusText,
        };
        LogError(errorObj);

        throw new Error(
          `${title} : Max retries reached. Could not fetch the data. ${error.message}`
        );
      }
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};
let axiosInstance = axios.create();
const axiosApi = setupCache(axiosInstance);
export const AxiosCacheApi = async ({
  url,
  params,
}: {
  url: string;
  params?: any;
}) => {
  let res = await axiosApi.get(url, {
    params: params,
    headers: {
      lang: Cookies.get("language"),
      country: Cookies.get("country"),
      Authorization: `Bearer ${
        Cookies.get("MARKET-TOKEN") ?? Cookies.get("DEVICE-TOKEN")
      }`,
      accept: "application/json",
    },
    cache: {
      ttl: parseInt(process.env.NEXT_PUBLIC_REVALIDATE) * 10000,
      interpretHeader: false,
      methods: ["post", "get"],
    },
    id: url,
  });
  return res.data;
};
