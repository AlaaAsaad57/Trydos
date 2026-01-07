// import translations from "public/translations/translations.js";
import { useAppStore } from "store";
import { CartResponse } from "models/API/market/CartShipping";
import { OldCartApi } from "models/API/market/OldCart";
import LocalizationServiceClass from "services/localization";
import { GetConfiguredImagePropsType } from "models/componentType/boutiqueTypes/metaDataPropsType";
import { fetchData } from "./fetchData";
import {
  COOKIE_NAMES,
  UserData,
  getCookie,
  setCookie,
  deleteCookie,
} from "./cookies/cookie-manager";
import { REQUESTS_DATA } from "./Requests";
import { readStoredLastPaths } from "./history";
import { getLastRequest } from "./requestLoggerClient";
export const SSRDetect = () => {
  return typeof window !== "undefined";
};

export function translateFunction(key: string, language?: string | string[]) {
  let url, languageUrl;
  // if (language === "en") return key;

  if (typeof window !== "undefined") {
    languageUrl = window.location.pathname.split("/")[1].split("-")[1];
  } else {
    languageUrl = language || LocalizationServiceClass.GetAppLanguage();
  }
  if (!languageUrl) return key;
  if (languageUrl === "en") return key;
  let translations =
    require(`public/translations/translations.${languageUrl}.js`).default;
  // Ensure translations object exists and has the requested language
  if (!translations) {
    return key;
  }

  if (languageUrl) {
    return translations?.[key] || key;
  }

  return translations?.[key] || key;
}

export const getUserChat = (): any => {
  const userChat = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
  if (userChat) return userChat;
  else return {};
};
export const getUserStories = (): any => {
  const userStories = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);
  return userStories;
};

export const _isStoreLastJson = () => {
  return !!process.env.NEXT_PUBLIC_IS_STORE_LAST_JSON;
};

export const getConfiguredImage = ({
  src,
  width,
  height,
  q,
  c_pad,
}: GetConfiguredImagePropsType) => {
  if (typeof src === "string") {
    return src.replace(
      "/upload",
      `/upload/h_${height}${width ? `,w_${width}` : ""},${
        c_pad ? "w_800,c_pad" : "c_pad,b_auto"
      }/f_auto/q_auto:good/fl_lossy/so_0`
    );
  }
  if (src?.file_path?.includes("cloudinary")) {
    return src.file_path.replace(
      "/upload/v1",
      `/upload/v1/h_${height}${width ? `,w_${width}` : ""},${
        c_pad ? "w_800,c_pad" : "c_pad,b_auto"
      }/f_auto/q_auto:good/fl_lossy/so_0`
    );
  } else return src?.file_path || src || "";
};
export const getLang = (lang, cookieLang) => {
  if (lang) {
    if (lang === "ar") {
      return "ar";
    } else {
      return lang;
    }
  } else {
    if (cookieLang) {
      if (cookieLang === "ar") {
        return "ar";
      } else {
        return cookieLang;
      }
    } else {
      return "en";
    }
  }
};

export const expandView = ({ filter }) => {
  const { filterEnabled } = useAppStore.getState();

  if (!filter && filterEnabled) {
    return;
  }
  if (document.querySelector<HTMLElement>(".home-navbar")) {
    document
      .querySelector<HTMLElement>(".home-navbar")
      .classList.add("animate-in");
  }

  if (document.querySelector<HTMLElement>(".filter-listing-bar")) {
    document.querySelector<HTMLElement>(".filter-listing-bar").style.position =
      "fixed";
    document
      .querySelector<HTMLElement>(".filter-listing-bar")
      .classList.remove("relative");
    document.querySelector<HTMLElement>(
      ".filter-listing-bar"
    ).style.paddingRight = "5px";
    document.querySelector<HTMLElement>(".filter-listing-bar").style.zIndex =
      "999999";
    document
      .querySelector<HTMLElement>(".filter-listing-bar")
      .classList.add("fixedAlign");
    document.querySelector<HTMLElement>(".filter-listing-bar").style.left =
      "0px";
  }
  if (document.querySelector<HTMLElement>(".boutique-header"))
    document.querySelector<HTMLElement>(".boutique-header").style.marginTop =
      !filter ? "214px" : "118px";
  if (
    document.querySelector<HTMLElement>(".boutique-top-info .boutique-text")
  ) {
    document.querySelector<HTMLElement>(
      ".boutique-top-info .boutique-text"
    ).style.display = "none";
    document
      .querySelectorAll(".boutique-top-info .boutique-logo-container svg")
      .forEach((s: HTMLElement) => {
        s.style.display = "none";
        document.querySelector<HTMLElement>(".boutique-top-info").style.zIndex =
          "999999";
        document.querySelector<HTMLElement>(".boutique-top-info").style.width =
          "auto";
        document.querySelector<HTMLElement>(
          ".boutique-top-info"
        ).style.marginLeft = "60px";
        document
          .querySelector<HTMLElement>(".boutique-top-info")
          .classList.add("move-anim");
        document
          .querySelector<HTMLElement>(".boutique-top-info")
          .classList.add("items-end");
        document
          .querySelector<HTMLElement>(".boutique-top-info")
          .classList.remove("items-center");
      });
  }
  if (
    document.querySelector<HTMLElement>(
      ".boutique-photo-holder .offer-slider-container"
    )
  )
    document.querySelector<HTMLElement>(
      ".boutique-photo-holder .offer-slider-container"
    ).style.maxHeight = "0px";
};
export const normalizeView = () => {
  const { filterEnabled } = useAppStore.getState();
  if (filterEnabled) {
    return;
  }
  let filterBar = document.querySelector<HTMLElement>(".filter-listing-bar");
  if (document.querySelector<HTMLElement>(".boutique-top-info")) {
    document
      .querySelector<HTMLElement>(".boutique-top-info")
      ?.classList.remove("move-anim");
  }

  document
    .querySelector<HTMLElement>(".home-navbar")
    ?.classList.remove("animate-in");
  if (filterBar) {
    document.querySelector<HTMLElement>(".filter-listing-bar").style.position =
      "static";
    document.querySelector<HTMLElement>(
      ".filter-listing-bar"
    ).style.paddingRight = "20px";
    document.querySelector<HTMLElement>(".filter-listing-bar").style.top =
      "initial";
    document
      .querySelector<HTMLElement>(".filter-listing-bar")
      .classList.remove("fixedAlign");

    document
      .querySelector<HTMLElement>(".filter-listing-bar")
      .classList.add("relative");
  }
  if (document.querySelector<HTMLElement>(".boutique-top-info")) {
    if (
      document.querySelector<HTMLElement>(".boutique-top-info .boutique-text")
    ) {
      document.querySelector<HTMLElement>(
        ".boutique-top-info .boutique-text"
      ).style.display = "flex";
    }
    document
      .querySelectorAll(".boutique-top-info .boutique-logo-container svg")
      .forEach((s: HTMLElement) => {
        s.style.display = "flex";
      });
    document.querySelector<HTMLElement>(".boutique-top-info").style.position =
      "static";
    document
      .querySelector<HTMLElement>(".boutique-top-info")
      .classList.add("items-center");
    document
      .querySelector<HTMLElement>(".boutique-top-info")
      .classList.remove("items-end");

    document.querySelector<HTMLElement>(".boutique-top-info").style.zIndex =
      "1";
    document.querySelector<HTMLElement>(".boutique-top-info").style.width =
      "100%";
    document.querySelector<HTMLElement>(".boutique-top-info").style.marginLeft =
      "0px";
    document.querySelector<HTMLElement>(".boutique-top-info").style.top =
      "initial";
    document.querySelector<HTMLElement>(".boutique-top-info").style.left =
      "initial";
    document
      .querySelector<HTMLElement>(".boutique-top-info")
      .classList.remove("move-anim");
  }
  if (document.querySelector<HTMLElement>(".boutique-header"))
    document.querySelector<HTMLElement>(".boutique-header").style.marginTop =
      "0px";
  if (
    document.querySelector<HTMLElement>(
      ".boutique-photo-holder .offer-slider-container"
    )
  ) {
    document.querySelector<HTMLElement>(
      ".boutique-photo-holder .offer-slider-container"
    ).style.maxHeight = "342px";

    document.querySelector<HTMLElement>(".boutique-photo-holder").style.height =
      "auto";
  }
};

function preciseMultiply(a, b) {
  const aStr = a.toString();
  const bStr = b.toString();

  // عدد الأرقام بعد الفاصلة في كل رقم
  const aDecimals = (aStr.split(".")[1] || "").length;
  const bDecimals = (bStr.split(".")[1] || "").length;

  // نحذف الفواصل ونحول الأرقام لأعداد صحيحة
  const intA = Number(aStr.replace(".", ""));
  const intB = Number(bStr.replace(".", ""));

  // نضرب الأعداد الصحيحة
  const resultInt = intA * intB;

  // نعيد الفاصلة لمكانها الصحيح
  const decimals = aDecimals + bDecimals;
  return resultInt / Math.pow(10, decimals);
}
function toFixedUp(decimalDigits, number) {
  const factor = 10 ** decimalDigits;

  // 1. الضرب بالمعامل (مثلاً 100)
  let multiplied = Number(number) * factor;

  // 2. إصلاح خطأ الفواصل العشرية في لغة البرمجة
  // نقوم بتقريب الرقم لأقرب 12 خانة عشرية للتخلص من أي كسور وهمية
  // مثل 830.0000000000001 ستعود لتصبح 830
  multiplied = Number(multiplied.toFixed(12));

  // 3. الآن نطبق التقريب للأعلى (Ceil)
  const ceiled = Math.ceil(multiplied);

  // 4. القسمة وإرجاع النص
  return (ceiled / factor).toFixed(decimalDigits);
}

export const RoundPrice = ({
  num,
  rate,
  returnNumber,
  language = "en",
  points,
}: {
  num?: number | string;
  rate?: number;
  returnNumber?: boolean;
  language?: string;
  points?: any;
}): number | string => {
  let price_num = Number(num);
  const {
    currency,
    settings,
    language: languageVariable,
  } = useAppStore.getState();

  // Currency conversion at the start
  let rateVariable = rate || currency?.exchange_rate || 1;
  let deciaml_points = points || currency?.decimal_digits || 0;
  price_num = Number(toFixedUp(deciaml_points, price_num));
  let number = preciseMultiply(price_num, rateVariable);

  if (returnNumber) {
    return number;
  }

  // Return raw converted number if requested
  let languageCode = language ?? languageVariable ?? "en";

  // Dart's formatNumber logic
  const thousand = languageCode !== "ar" ? "K" : "أ";
  const million = languageCode !== "ar" ? "M" : "م";

  if (number >= 1e5 && number < 1e6) {
    const result = Math.floor((number + 999) / 1000);
    return `${result}${thousand}`;
  } else if (number === 0) {
    return "0";
  } else if (number < 1e5) {
    return number;
  } else {
    let result = Math.floor((number + 999) / 1000) / 1000;

    return `${result}${million}`;
  }
};

export const onClickSearchHistory = (searchValue) => {
  if (localStorage.getItem("search-history")) {
    let arr = JSON.parse(localStorage.getItem("search-history"));
    if (arr.some((s) => s.toLowerCase() === searchValue.toLowerCase())) {
    } else {
      let arr = JSON.parse(localStorage.getItem("search-history"));
      localStorage.setItem(
        "search-history",
        JSON.stringify([searchValue, ...arr])
      );
    }
    return [searchValue, ...arr];
  } else {
    return [searchValue];
    localStorage.setItem("search-history", JSON.stringify([searchValue]));
  }

  return searchValue;
};

export const getOldCart = async () => {
  const deviceToken = getCookie<string>(COOKIE_NAMES.DEVICE_TOKEN);
  const marketToken = getCookie<string>(COOKIE_NAMES.MARKET_TOKEN);
  if (!deviceToken && !marketToken) return [];
  try {
    let response: OldCartApi = await fetchData({
      url: "/old-cart/get_old_cart",
      reqTitle: REQUESTS_DATA.OLD_CART_REQUEST,
      method: "GET",
      server: "market",
    });
    // @ts-ignore
    if (!response.success) {
      throw new Error(response.message);
    }
    const { storeOldCart } = useAppStore.getState();
    storeOldCart(response.data?.original?.data);
  } catch (error) {
    console.error(error);
  }
};
export const getCart = async ({ callback }) => {
  const { initCart, cart, setCartShippingSuccess } = useAppStore.getState();
  const deviceToken = getCookie<string>(COOKIE_NAMES.DEVICE_TOKEN);
  const marketToken = getCookie<string>(COOKIE_NAMES.MARKET_TOKEN);
  if (!deviceToken && !marketToken) return { cart: [] };
  try {
    let response: CartResponse = await fetchData({
      url: "/cart/cart_shipping",
      reqTitle: REQUESTS_DATA.CART_REQUEST,
      method: "GET",
      server: "market",
    });
    // @ts-ignore
    if (!response.success) {
      // @ts-ignore
      setCartShippingSuccess(response.message);
      throw new Error(response.message);
    }
    initCart(response.data);
    return response.data;
  } catch (err) {
    if (callback) callback([{ cart: [] }]);
    return { cart: [] };
  }
};
export const GetCartOreview = async () => {
  const { setCartPreview } = useAppStore.getState();
  try {
    let response = await fetchData({
      url: "/cart/cart_overview",
      reqTitle: REQUESTS_DATA.CART_OVERVIEW,
      method: "GET",
      server: "market",
    });
    // @ts-ignore
    if (!response.success) {
      throw new Error(response.message);
    }
    setCartPreview(response.data);
  } catch (error) {
    console.error(error);
  }
};
export const LogError = async (error) => {
  let last_request;
  const userData = getCookie(COOKIE_NAMES.USER_DATA);
  const userChat = getCookie(COOKIE_NAMES.USER_CHAT);
  const userStories = getCookie(COOKIE_NAMES.USER_STORIES);
  const marketToken = getCookie(COOKIE_NAMES.MARKET_TOKEN);
  const deviceToken = getCookie(COOKIE_NAMES.DEVICE_TOKEN);
  const last_paths = await readStoredLastPaths();
  if (typeof window !== "undefined") {
    last_request = await getLastRequest();
  } else {
    last_request = "server...cannot access localstorage";
  }
  const language = getCookie("language");
  const country = getCookie("country");
  const userIP = getCookie("userIP");
  const Error_Object = {
    ...(error ?? {}),
    userChat,
    userData,
    userStories,
    marketToken,
    deviceToken,
    last_paths,
    last_request,
    language,
    country,
    userIP,
  };
  await storeError(Error_Object);
};
export async function storeError(error) {
  await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/mobile_error_log/store", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      error_description: JSON.stringify({
        platform: "🛑WEB🛑",
        ...(error ?? {}),
      }),
      credentials: "omit",
    }),
  });
}
export const WaitForCondition = async () => {
  const { isRegisteringReady } = useAppStore.getState();
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const isReady = isRegisteringReady;
      if (isReady) {
        clearInterval(interval);
        resolve("Ready, now performing the request!");
      }
    }, 1000); // Check every second

    // Optional: timeout in case it's taking too long
    // Wait for 10 seconds
  });
};

export const addToCompare = (slug: string) => {
  const f_p = getCookie<string>("f_p");
  const s_p = getCookie<string>("s_p");

  if (!f_p) {
    setCookie("f_p", slug);
    return `?f_p=${slug}`;
  } else if (!s_p) {
    setCookie("s_p", slug);
    return `?f_p=${f_p}&s_p=${slug}`;
  } else {
    // If both exist, replace the first one
    setCookie("f_p", slug);
    return `?f_p=${slug}&s_p=${s_p}`;
  }
};

export const removeFromCompare = (slug: string) => {
  const f_p = getCookie<string>("f_p");
  const s_p = getCookie<string>("s_p");

  if (f_p === slug) {
    deleteCookie("f_p");
    if (s_p) {
      // Move s_p to f_p
      setCookie("f_p", s_p);
      deleteCookie("s_p");
      return `?f_p=${s_p}`;
    }
    return "";
  } else if (s_p === slug) {
    deleteCookie("s_p");
    if (f_p) {
      return `?f_p=${f_p}`;
    }
    return "";
  }
  return null;
};

/**
 * Compare two cart products by product_id and variations (Size, color, color_options)
 * Returns true if they are the same product with the same variation
 */
export const areProductsEqual = (prodA: any, prodB: any): boolean => {
  if (!prodA || !prodB) return false;
  const varA =
    prodA.variations && prodA.variations[0] ? prodA.variations[0] : {};
  const varB =
    prodB.variations && prodB.variations[0] ? prodB.variations[0] : {};
  return (
    prodA.product_id === prodB.product_id &&
    (varA.Size || "") === (varB.Size || "") &&
    (varA.color || "") === (varB.color || "") &&
    (varA.color_options || "") === (varB.color_options || "")
  );
};
