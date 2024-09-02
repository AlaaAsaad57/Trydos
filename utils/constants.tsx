import axios from "axios";
import pngErr from "public/images/error.png";
import Cookies from "js-cookie";
export const errorPNG = pngErr.src;
export const AxiosGet = async ({ url }) => {
  let res = await axios.get(url, {
    headers: {
      lang: Cookies.get("language"),
      country: Cookies.get("country"),
      Authorization: `Bearer ${
        Cookies.get("market-token") ?? Cookies.get("DEVICE-TOKEN")
      }`,
    },
  });
  return res.data.data;
};
