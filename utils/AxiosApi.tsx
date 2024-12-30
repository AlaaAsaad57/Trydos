import axios from "axios";
("axios");
import pngErr from "public/images/error.png";
import Cookies from "js-cookie";
import { setupCache } from "axios-cache-interceptor";
import home from "services/home";
export const errorPNG = pngErr.src;

export const AxiosGet = async ({ url }) => {
  try {
    let res = await axios.get(url, {
      headers: {
        lang: Cookies.get("language"),
        country: Cookies.get("country"),
        Authorization: `Bearer ${
          localStorage.getItem("MARKET-TOKEN") ??
          Cookies.get("market-token") ??
          Cookies.get("DEVICE-TOKEN") ??
          localStorage.getItem("DEVICE-TOKEN")
        }`,
      },
    });
    return res?.data.data;
  } catch (error) {
    if (error.status === 401) {
      home.checkExpiration(true);
      setTimeout(() => {
        AxiosGet({ url });
      }, 2000);
    }
    console.error(error, url);
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
