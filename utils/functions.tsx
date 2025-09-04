// import translations from "public/translations/translations.js";
import { useAppStore } from "store";
import { notFound } from "next/navigation";
import { LogData } from "store/homepage/actions";
import { CartResponse } from "models/API/market/CartShipping";
import { SimpleBoutiqeApi } from "models/API/market/BoutiqueSimpleDetails";
import { OldCartApi } from "models/API/market/OldCart";
import LocalizationServiceClass from "services/localization";

import { GetConfiguredImagePropsType } from "models/componentType/boutiqueTypes/metaDataPropsType";
import { fetchData } from "./fetchData";
import { COOKIE_NAMES, UserData, getCookie } from "./cookies/cookie-manager";
import { REQUESTS_DATA } from "./Requests";
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
  return userChat;
};
export const getUserStories = (): any => {
  const userStories = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);
  return userStories;
};

export const _isStoreLastJson = () => {
  return !!process.env.NEXT_PUBLIC_IS_STORE_LAST_JSON;
};

export function encode_utf8(params: {
  s: string;
  element: NodeListOf<Element>;
}) {
  params.element.forEach((ele) => {
    ele.innerHTML = params.s;
  });
  return "";
}

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
      `/upload/h_${height},${
        c_pad ? "w_800,c_pad" : "c_limit"
      }/f_auto/q_auto:good/fl_lossy/so_0`
    );
  }
  if (src?.file_path?.includes("cloudinary")) {
    return src.file_path.replace(
      "/upload/v1",
      `/upload/v1/h_${height},${
        c_pad ? "w_800,c_pad" : "c_limit"
      }/f_auto/q_auto:good/fl_lossy/so_0`
    );
  } else return src?.file_path || "";
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

export const getBoutiqueMeta = async ({ boutiqueId, lang }) => {
  if (boutiqueId === "listing")
    return { name: "Search", banners: null, icon: null };
  let [country, language] = lang.split("-");
  let start = new Date();
  let resp = await fetch(
    process.env.NEXT_PUBLIC_BACKEND_URL +
      `/web/boutique/simpleDetails/${boutiqueId}?lang=${language}`,
    {
      next: {
        revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
      },
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        lang: language,
        country: country,
      }),
    }
  );
  let data: SimpleBoutiqeApi = await resp.json();
  let end = new Date();

  LogData({
    request: "Get Product simple info",
    url:
      process.env.NEXT_PUBLIC_BACKEND_URL +
      `/web/boutique/simpleDetails/${boutiqueId}`,
    headers: {
      lang: language,
      country: country,
    },
    response: data,
    time: end.getTime() - start.getTime(),
  });

  if (data.message === "Boutique not found") {
    notFound();
  }

  return { ...data.data, image: data.data?.banners[0]?.file_path };
};

export const caseCheck = (word, value) => {
  let inp = value;
  if (word.substr(0, value.length).toUpperCase() === value.toUpperCase())
    return word;
  else return "";
  //loop through every character in ino
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

export const urlParams = ({ filters, noProducts, noFilter = false }) => {
  const { PriceFiltered } = useAppStore.getState();

  let urlParams = new URLSearchParams();
  if (filters.categories.length > 0) {
    urlParams.set("category_slugs", JSON.stringify(filters.categories));
  }
  if (filters.brands.length > 0) {
    urlParams.set("brand_slugs", JSON.stringify(filters.brands));
  }
  if (
    filters?.boutique_slug?.length > 0 &&
    filters.boutique_slug !== "listing"
  ) {
    urlParams.set("boutique_slugs", JSON.stringify([filters.boutique_slug]));
  }
  if (filters?.attributes?.options?.length > 0) {
    urlParams.set("attributes", JSON.stringify([filters.attributes]));
  }
  if (filters.prices !== null && PriceFiltered) {
    urlParams.set("price", JSON.stringify(filters.prices));
  }
  if (filters?.searchText?.length > 0) {
    urlParams.set("search_text", filters.searchText);
  }
  if (noProducts) {
    urlParams.set("with_products", "false");
  }
  if (noFilter) {
    urlParams.set("with_filters", "false");
  }
  if (filters.colors && filters?.colors.length > 0) {
    urlParams.set("colors", JSON.stringify(filters.colors));
  }

  return urlParams.toString();
};

export const toUSD = (price) => {
  const { currency } = useAppStore.getState();

  return price / currency?.exchange_rate;
};
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
  const { currency, settings } = useAppStore.getState();

  // Currency conversion at the start
  let rateVariable = rate || currency?.exchange_rate || 1;
  let number = price_num * rateVariable;
  let deciaml_points =
    (settings && settings["starting-setting"]?.decimal_point_settings) || 0;
  number = Math.ceil(number);

  // Return raw converted number if requested
  if (returnNumber) {
    return number;
  }
  number = Number(number.toFixed(deciaml_points));
  // Dart's formatNumber logic
  const thousand = language !== "ar" ? "K" : "الف";
  const million = language !== "ar" ? "M" : "مليون";

  if (number >= 1e5 && number < 1e6) {
    const result = Math.floor((number + 999) / 1000);
    return `${result}${thousand}`;
  } else if (number === 0) {
    return "0.0";
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
  } else {
    localStorage.setItem("search-history", JSON.stringify([searchValue]));
  }
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
export const AddToCartAnimation = () => {
  let productImage = document.getElementById("added-to-cart");
  let CartIcon = document.getElementById("cart-icon");
  const cartPosition = CartIcon?.getBoundingClientRect();
  const productPosition = productImage?.getBoundingClientRect();
  const clonedImage = productImage?.cloneNode();

  if (clonedImage) {
    // @ts-ignore
    clonedImage?.classList.add("moving");
    // @ts-ignore
    clonedImage?.classList.remove("h-full");
    // @ts-ignore
    document.body.appendChild(clonedImage);
    // @ts-ignore
    clonedImage.style.left = `${productPosition.left}px`;
    // @ts-ignore
    clonedImage.style.top = `${productPosition.top}px`;
    // @ts-ignore
    clonedImage.style.width = `${productPosition.width}px`;
    // @ts-ignore
    clonedImage.style.height = `${productPosition.height}px`;
  }
  // @ts-ignore
  document.body?.appendChild(clonedImage);
  // @ts-ignore
  CartIcon?.animate(
    [
      { scale: "1", transform: "rotate(0deg)" },
      { scale: "1.2", transform: "rotate(10deg)" },
      { scale: "1.4", transform: "rotate(-10deg)" },
      { scale: "1", transform: "rotate(0deg)" },
    ],
    {
      duration: 1500,
      fill: "forwards",
    }
  );
  // @ts-ignore
  clonedImage?.animate(
    [
      {
        scale: "1",
        top: `${productPosition.top}px`,
        left: `${productPosition.left}px`,
        opacity: 1,
      },
      {
        scale: "0.1",
        top: `${cartPosition.top + 50}px`,
        left: `${cartPosition.left + 100}px`,
        opacity: 0,
      },
    ],
    {
      duration: 1200,
      fill: "forwards",
    }
  );
};

export const LogError = async (error) => {
  await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/mobile_error_log/store", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      error_description: JSON.stringify({ ...(error ?? {}), platform: "web" }),
    }),
  });
};

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
  const f_p = localStorage.getItem("f_p");
  const s_p = localStorage.getItem("s_p");

  if (!f_p) {
    localStorage.setItem("f_p", slug);
    return `?f_p=${slug}`;
  } else if (!s_p) {
    localStorage.setItem("s_p", slug);
    return `?f_p=${f_p}&s_p=${slug}`;
  } else {
    // If both exist, replace the first one
    localStorage.setItem("f_p", slug);
    return `?f_p=${slug}&s_p=${s_p}`;
  }
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
