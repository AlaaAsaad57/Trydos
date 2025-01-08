import axios from "axios";

import pngErr from "public/images/error.png";
import Cookies from "js-cookie";
import { setupCache } from "axios-cache-interceptor";
import home from "services/home";
import { ExpiredUser, getUser, LogError } from "./functions";
import { toast } from "react-toastify";
export const errorPNG = pngErr.src;
const getHeader = () => {
  let languageUrl = window.location.pathname.split("/")[1].split("-")[1];

  return {
    headers: {
      lang: languageUrl || Cookies.get("language") || Cookies.get("lang"),
      country: Cookies.get("country"),
      Authorization: `Bearer ${
        localStorage.getItem("MARKET-TOKEN") ??
        Cookies.get("market-token") ??
        Cookies.get("DEVICE-TOKEN") ??
        localStorage.getItem("DEVICE-TOKEN")
      }`,
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
  let attempt = 0;
  let retries = 2;
  let delay = 2000;
  while (attempt <= retries) {
    try {
      let res = await axios.get(url, getHeader());
      // If the response is successful, return the data
      if (res?.data.data) {
        return res?.data.data;
      } else {
        throw new Error(res.data.message);
      }
    } catch (error) {
      if (error.status === 401) {
        if (getUser()) {
          ExpiredUser();
          return;
        }
        await home.registerForExpire();
      }
      attempt++;
      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      if (attempt > retries) {
        toast.error(`${title} : ${error.message ?? "Failed"}`);
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
}: {
  url: string;
  title?: string;
  body: any;
}) => {
  let attempt = 0;
  let retries = 2;
  let delay = 2000;
  while (attempt <= retries) {
    try {
      let res = await axios.post(url, body, getHeader());
      // If the response is successful, return the data
      if (url.includes(`/api/products/view`)) {
        if (res.data.view_count) {
          return res.data;
        }
      }
      if (url.includes("cart/")) {
        if (res.data.data.status === 1) {
          toast.success(res.data.message);
          return res.data.data;
        } else {
          toast.error(res.data.message);
          return;
        }
      }
      if (res?.data.data) {
        if (res.data.message) {
          toast.success(res.data.message);
        }
        return res?.data.data;
      } else {
        throw new Error(res.data.message);
      }
    } catch (error) {
      attempt++;
      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      if (attempt > retries) {
        toast.error(`${title} : ${error.message ?? "Failed"}`);
        LogError(error, url, window.location.href);
        if (error.status === 401) {
          if (getUser()) {
            ExpiredUser();
            return;
          }
          await home.registerForExpire();
        }
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
        Cookies.get("market-token") ?? Cookies.get("DEVICE-TOKEN")
      }`,
    },
    cache: {
      ttl: parseInt(process.env.NEXT_PUBLIC_REVALIDATE) * 1000,
      interpretHeader: false,
      methods: ["post", "get"],
    },
    id: url,
  });
  return res.data;
};
