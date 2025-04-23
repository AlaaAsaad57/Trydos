import axios from "axios";

import pngErr from "public/images/error.png";
import Cookies from "js-cookie";
import { setupCache } from "axios-cache-interceptor";
import home from "services/home";

import { LogError, WaitForCondition } from "./functions";
import { toast } from "react-toastify";
import auth from "services/auth";
export const errorPNG = pngErr.src;
const getHeader = (token?) => {
  let [countryUrl, languageUrl] = window.location.pathname
    .split("/")[1]
    .split("-");
  return {
    headers: {
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
}: {
  url: string;
  title?: string;
}) => {
  await WaitForCondition();
  let attempt = 0;
  let retries = 2;
  let delay = 2000;
  while (attempt <= retries) {
    try {
      let res = await axios.get(url, getHeader());
      // If the response is successful, return the data
      // if (url.includes("customer/wallet")) {
      //   return res.data;
      // }
      // if (res.data.message !== "Data Got!") {
      //   toast.success(res.data.message);
      // }
      if (
        url.includes("user-notifications/get") ||
        url.includes("/customer/order/list") ||
        url.includes("/coupon/apply")
      ) {
        return res.data;
      }
      if (res.data.popular_search_terms) {
        return res.data.popular_search_terms;
      }
      if (res?.data.isSuccessful || res.data.data) {
        return res?.data?.data;
      } else {
        throw new Error(res.data.message);
      }
    } catch (error) {
      if (error.status === 422 || error.status === 500) {
        attempt = 2;
        toast.error(`${title} : ${error.message ?? "Failed"}`);
        throw new Error(
          `${title} : Max retries reached. Could not fetch the data. ${error.message}`
        );
        return;
      }
      if (error.status === 401) {
        if (auth.getUser()) {
          await auth.ExpiredUser();
        } else {
          await home.registerForExpire();
        }
      }
      attempt++;
      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      if (attempt > retries) {
        // toast.error(`${title} : ${error.message ?? "Failed"}`);
        LogError(error, url, window.location.href);

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
}: {
  url: string;
  title?: string;
  body: any;
  hasMessageOnly?: boolean;
  token?: string;
}) => {
  await WaitForCondition();
  let attempt = 0;
  let retries = 2;
  let delay = 2000;
  while (attempt <= retries) {
    try {
      let res = await axios.post(url, body, getHeader(token));
      if (url.includes("products/view")) {
        return res.data;
      }
      if (url.includes(`change_country_language`)) {
        if (res.data) {
          return res.data.data.firebase_settings;
        }
      }
      if (url.includes("/cart/update") || url.includes("/cart/add")) {
        if (res.data.data.status === 1) {
          toast.success(res.data.message);
          return res.data.data;
        } else {
          toast.error(res.data.message);
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
          toast.success(res.data.message);
          return res.data.data;
        }
        return res?.data.data;
      } else {
        throw new Error(res.data.message);
      }
    } catch (error) {
      if (error?.message === "Cart Error") {
        attempt = 2;
        throw new Error(
          `${title} : Max retries reached. Could not fetch the data. ${error.message}`
        );
      }
      if (
        error.status === 422 ||
        error.status === 500 ||
        error === "Failed" ||
        error.status === 400 ||
        error.status === 403 ||
        error?.message === "Failed"
      ) {
        if (error.response.data.message) {
          toast.error(`${title} : ${error.response.data?.message ?? "Failed"}`);
        } else {
          toast.error(`${title} : ${error.message ?? "Failed"}`);
        }
        attempt = 2;
        throw new Error(
          `${title} : Max retries reached. Could not fetch the data. ${error.message}`
        );
        return;
      }

      if (error.status === 401) {
        if (auth.getUser()) {
          await auth.ExpiredUser();
        } else {
          await home.registerForExpire();
        }
      }
      attempt++;
      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      if (attempt > retries) {
        LogError(error, url, window.location.href);

        // toast.error(`${title} : ${error.message ?? "Failed"}`);
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
