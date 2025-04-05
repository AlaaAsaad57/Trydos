import translations from "public/translations/translations.js";
import profilePicture from "public/images/profileNo.png";
import { store } from "store";
import Cookies from "js-cookie";

import { notFound } from "next/navigation";
import { LogData } from "store/homepage/actions";
import { AxiosCacheApi, AxiosGet } from "./AxiosApi";
import home from "services/home";
import { analytics } from "./firebaseInitv1";
import { logEvent } from "@firebase/analytics";
import axios from "axios";
import {
  CartApi,
  FilterProductApi,
  OldCartApi,
  SimpleBoutiqeApi,
  SimpleDetailsProductApi,
} from "models/Api";
import auth from "services/auth";
export const SSRDetect = () => {
  return typeof window !== "undefined";
};

export function translateFunction(key: string, language?: string | string[]) {
  let url, languageUrl;

  if (typeof window !== "undefined") {
    languageUrl = window.location.pathname.split("/")[1].split("-")[1];
  } else {
    languageUrl = GetAppLanguage();
  }

  // Ensure translations object exists and has the requested language
  if (!translations || !translations[languageUrl]) {
    return key;
  }

  if (language) {
    return translations[language]?.[key] || key;
  }

  return translations[languageUrl]?.[key] || key;
}

export const getStoriesHeaders = () => {
  const token = SSRDetect() && localStorage.getItem("STORIES-TOKEN");

  return {
    headers: {
      Authentication: `Bearer ${token}`,
      Authorization: `Bearer ${token}`,
    },

    next: {
      tags: ["stories"],
      revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
    },
  };
};
export const GeneralCahcedHeader = (apiName) => {
  return {
    next: {
      tags: [apiName],
      revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
    },
  };
};
export const configureStory = (story) => {
  let returnedData = [];
  story?.stories?.map((storyItem) => {
    if (storyItem.full_video_path) {
      let vid = storyItem.full_video_path.replace(
        "/upload",
        "/upload/w_700/f_webm/q_auto"
      );
      returnedData.push({
        url: vid,
        FixedUrl: vid,
        is_seen: storyItem.is_seen,
        id: storyItem.id,
        header: {
          heading: story.name ?? story.mobile_phone ?? "Unknown",
          subheading: "Posted 30m ago",
          profileImage: story.photo_path ?? profilePicture.src,
        },
        duration: 5000,
        preloadResource: true,
        type: "video",
      });
    } else if (storyItem.photo_path) {
      let img = storyItem.photo_path.replace(
        "/upload",
        "/upload/w_800/f_avif/q_auto"
      );
      returnedData.push({
        url: img,
        FixedUrl: img,
        is_seen: storyItem.is_seen,
        duration: 5000,
        id: storyItem.id,
        header: {
          heading: story.name ?? story.mobile_phone ?? "Unknown",
          subheading: "Posted 30m ago",
          profileImage: story.photo_path ?? profilePicture.src,
        },
        preloadResource: true,
        type: "image",
      });
    }
  });
  return { ...story, stories: returnedData };
};
export const getThumb = (url, isVideo) => {
  if (url) {
    if (isVideo) {
      return url.replace("/upload", "/upload/h_194/f_avif/q_100");
    } else return url.replace("/upload", "/upload/h_194/f_avif/q_100");
  }
};
export const getUser = () => {
  return (
    localStorage.getItem("USER") && JSON.parse(localStorage.getItem("USER"))
  );
};
export const getUserChat = () => {
  if (typeof window !== "undefined")
    return (
      localStorage.getItem("USER-CHAT") &&
      JSON.parse(localStorage.getItem("USER-CHAT"))
    );
};
export const UserToken = () => {
  return (
    localStorage.getItem("MARKET-TOKEN") ||
    localStorage.getItem("DEVICE-TOKEN") ||
    false
  );
};
export const UserID = () => {
  return (
    (localStorage.getItem("USER") &&
      JSON.parse(localStorage.getItem("USER"))?.id) ||
    (localStorage.getItem("guest-user") &&
      JSON.parse(localStorage.getItem("guest-user"))?.id) ||
    false
  );
};
export const User = () => {
  return (
    (localStorage.getItem("USER") &&
      JSON.parse(localStorage.getItem("USER"))) ||
    (localStorage.getItem("guest-user") &&
      JSON.parse(localStorage.getItem("guest-user"))) ||
    false
  );
};
export const getUserStories = () => {
  return (
    localStorage.getItem("USER-STORIES") &&
    JSON.parse(localStorage.getItem("USER-STORIES"))
  );
};

export const _isStoreLastJson = () => {
  return !!process.env.NEXT_PUBLIC_IS_STORE_LAST_JSON;
};
export const Sendevent = async (params: {
  event:
    | "programming_event"
    | "button_clicked"
    | "viewed_product"
    | "viewed_boutique";
  value?: string;
  extra?: any;
  category?: any;
}) => {
  try {
    let userId = localStorage.getItem("USER")
      ? JSON.parse(localStorage.getItem("USER"))?.id
      : "empty";
    // @ts-ignore
    if (typeof window !== "undefined") {
      // @ts-ignore
      let a = analytics;
      // @ts-ignore
      logEvent(analytics, params.event, {
        executed_event_name: params.value,
        country_name: Cookies.get("country"),
        userID: userId,
        device_language: Cookies.get("language"),
        time_stamp: new Date().toISOString(),

        our_session_id: store.getState().homepage.session_id,
        previous_event_button_name:
          store.getState().homepage.previous_event_button_name,
      });
    }

    store.dispatch({ type: "GA-EVENT", payload: params.value });
  } catch (e) {
    console.error(e);
  }
};
export const GetAppLanguage = () => {
  return store.getState().homepage.language;
};
export const GetAppCountry = () => {
  return store.getState().homepage.country;
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

export const getConfiguredImage = ({ src, width, height }) => {
  if (typeof src === "string") {
    return src.replace("/upload", `/upload/h_${height}/f_avif/q_auto`);
  }
  if (src?.file_path?.includes("cloudinary")) {
    return src.file_path.replace(
      "/upload",
      `/upload/h_${height}/f_avif/q_auto`
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

export const getProductMeta = async ({ productId, lang, color }) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  let start = new Date();
  let [country, language] = lang.split("-");

  let data: SimpleDetailsProductApi = await fetchWithRetry(
    process.env.NEXT_PUBLIC_BACKEND_URL +
      `/web/product/simpleDetails/${productId}${
        color ? `?color=${color}` : ""
      }`,
    {
      next: {
        revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
      },
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        lang: await getLang(language, cookieStore.get("language")?.value),
        country: country || cookieStore.get("country")?.value,
      }),
    },
    "Product SimpleDetails"
  );

  let end = new Date();
  LogData({
    request: "Get Product meta info",
    url:
      process.env.NEXT_PUBLIC_BACKEND_URL +
      `/web/product/simpleDetails/${productId}`,
    headers: {
      Authorization: `Bearer ${
        typeof localStorage !== "undefined" &&
        localStorage.getItem("MARKET-TOKEN")
      }`,
      lang: getLang(null, cookieStore.get("language")?.value),
      country: cookieStore.get("country")?.value,
    },
    response: data,
    time: end.getTime() - start.getTime(),
  });
  if (data.message === "Product Not Found") {
    notFound();
  }

  return data.data;
};
export const getBoutiqueMeta = async ({ boutiqueId, lang }) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
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
        lang: await getLang(language, cookieStore.get("language")?.value),
        country:
          cookieStore.get("country") && cookieStore.get("country")?.value,
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
      Authorization: `Bearer ${
        typeof localStorage !== "undefined"
          ? localStorage.getItem("MARKET-TOKEN")
          : cookieStore.get("token")?.value
      }`,
      lang: getLang(null, cookieStore.get("language")?.value),
      country: cookieStore.get("country")?.value,
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
  for (let i in inp) {
    //if input character matches with character in word no need to change
    if (inp[i] == word[i]) {
      continue;
    } else if (inp[i].toUpperCase() == word[i]) {
      //if inp[i] when converted to uppercase matches word[i] it means word[i] needs to be lowercase
      word.splice(i, 1, word[i].toLowerCase());
    } else {
      //word[i] needs to be uppercase
      word.splice(i, 1, word[i].toUpperCase());
    }
  }
  //array to string
  return word.join("");
};
export const expandView = ({ filter }) => {
  let filterEnabled = store.getState().listing.filterEnabled;
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
  let filterEnabled = store.getState().listing.filterEnabled;
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
    document.querySelector<HTMLElement>(
      ".boutique-top-info .boutique-text"
    ).style.display = "flex";
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
export const filterProducts = async ({
  boutiqueId,
  lang,
  offset,
  callback,
  newFiltersCallback,
  sizesAttr,
  reset,
  storeCallback,
  searchText,
  serachTrigger,
}: {
  reset?: boolean;
  lang: any;
  offset: number;
  callback: Function;
  newFiltersCallback: Function;
  sizesAttr: any;
  boutiqueId: any;
  storeCallback?: any;
  searchText?: string;
  serachTrigger?: boolean;
}) => {
  const filterObj = store.getState().details.selectedFilter;

  storeCallback(filterObj);

  let filters = {
    categories: filterObj.categories.map((s) => s.slug),
    prices: filterObj.prices?.pricesWord
      ? [
          `${filterObj.prices.min.toString()}-${filterObj.prices.max.toString()}`,
        ]
      : null,
    brands: filterObj.brands.map((brand) => brand.slug),
    attributes: { ...sizesAttr, options: filterObj.sizes },
    boutique_slug: boutiqueId,
    lang: lang.split("-")[1],
    country: lang.split("-")[0],
    searchText: searchText || filterObj.searchText,
    colors: filterObj.colors.map((s) => s),
  };
  let str = "";
  if (reset) {
    str = `/api/products/search?limit=4&${
      boutiqueId !== "listing" &&
      boutiqueId &&
      `boutique_slugs=${JSON.stringify([boutiqueId])}`
    }`;
  } else {
    let urlParam = urlParams({ filters: filters, noProducts: false });
    str = `/api/products/search?${urlParam}`;
  }
  let product: FilterProductApi = await AxiosCacheApi({
    url: process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL + str,
    params:
      filters.colors.length === 0
        ? null
        : { colors: `${JSON.stringify(filters.colors)}` },
  });

  // if (!serachTrigger)
  // newFiltersCallback({
  //   filtersVar: {
  //     categories: product.data.categories,
  //     brands: product.data.brands,
  //     sizes:
  //       product.data.attributes.filter((s) => s.name === "Size")[0]
  //         ?.options || [],
  //     prices: product.data.prices || null,
  //     offers:
  //       product.data.attributes.filter((s) => s.name === "Offer")[0]
  //         ?.options || [],
  //     reset: reset,
  //     colors: product.data.colors || [],
  //   },
  // });
  callback(product.data.products);
  return product.data.products;
};
export const searchProducts = async ({ searchText }) => {
  let product: FilterProductApi["data"] = await AxiosGet({
    url:
      process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
      `/api/products/search?limit=4&search_text=${searchText}`,
    title: "Search Products",
  });
  console.log(product);
  return product.products;
};
const urlParams = ({ filters, noProducts }) => {
  const PriceFiltered = store.getState().details.PriceFiltered;
  let urlParams = new URLSearchParams();
  if (filters.categories.length > 0) {
    urlParams.set("category_slugs", JSON.stringify(filters.categories));
  }
  if (filters.brands.length > 0) {
    urlParams.set("brand_slugs", JSON.stringify(filters.brands));
  }
  if (filters.boutique_slug.length > 0 && filters.boutique_slug !== "listing") {
    urlParams.set("boutique_slugs", JSON.stringify([filters.boutique_slug]));
  }
  if (filters?.attributes?.options?.length > 0) {
    urlParams.set("attributes", JSON.stringify(filters.attributes));
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
  if (filters.colors && filters?.colors.length > 0) {
    urlParams.set("colors", JSON.stringify(filters.colors));
  }

  return urlParams.toString();
};
export const UpdateFilter = async ({
  sizesAttr,
  boutiqueId,
  searchText,
  lang,
  newFiltersCallback,
  done,
  filtersVar,
}: {
  sizesAttr: any;
  boutiqueId: any;
  searchText: any;
  lang: any;
  newFiltersCallback: any;
  done: any;
  filtersVar?: any;
}) => {
  try {
    const filterObj = filtersVar || store.getState().details.selectedFilter;

    let filters = {
      categories: filterObj.categories.map((s) => s.slug),
      prices:
        filterObj.prices?.min >= 0
          ? [
              `${filterObj.prices.min.toString()}-${filterObj.prices.max.toString()}`,
            ]
          : null,
      brands: filterObj.brands.map((brand) => brand.slug),
      attributes: { ...sizesAttr, options: filterObj.sizes },
      boutique_slug: boutiqueId,
      lang: lang.split("-")[1],
      country: lang.split("-")[0],
      searchText: searchText || filterObj.searchText,
      colors: filterObj.colors.map((s) => s),
    };
    let urlParam = urlParams({ filters: filters, noProducts: true });
    let str = `/api/products/search?${urlParam}`;

    let product: FilterProductApi = await AxiosCacheApi({
      url: process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL + str,
      params:
        filters.colors.length === 0
          ? null
          : { colors: `${JSON.stringify(filters.colors)}` },
    });

    newFiltersCallback({
      filtersVar: {
        categories: product.data?.categories || [],
        brands: product.data.brands || [],
        sizes:
          product.data.attributes?.filter((s) => s.name === "Size")[0]
            ?.options || [],
        prices: product.data.prices || null,
        offers:
          product.data.attributes.filter((s) => s.name === "Offer")[0]
            ?.options || [],
        reset: false,
        colors: product.data.colors || [],
        total_size: product.data.total_size,
        searchText: searchText,
      },
    });
    done();
  } catch (error) {
    done();
    console.log(error);
  }
};
function formatPrice(price) {
  let currency = store.getState().homepage.currency;
  let ceil = currency?.ciel;
  if (price >= 1000000) {
    return (
      (ceil
        ? Math.ceil(parseFloat((price / 1000000).toFixed(3)) * ceil) / ceil
        : parseFloat((price / 1000000).toFixed(3))) + translateFunction("M")
    ); // For millions
  } else if (price >= 1000) {
    return (
      (ceil
        ? Math.ceil(parseFloat((price / 1000).toFixed(3)) * ceil) / ceil
        : parseFloat((price / 1000).toFixed(3))) + translateFunction("K")
    ); // For thousands
  } else {
    return price; // For prices under 1000
  }
}
export const RoundPrice = ({
  num,
  rate,
  points,
  returnNumber,
}: {
  num?: any;
  rate?: any;
  points?: any;
  returnNumber?: boolean;
}): number => {
  let currency = store.getState().homepage.currency;
  let rateVariable =
    rate || store.getState().homepage.currency?.exchange_rate || 1;
  let pointsVariable =
    points ||
    (store.getState().homepage?.settings &&
      store.getState().homepage?.settings["starting-setting"]
        ?.decimal_point_settings) ||
    0;
  let a = parseFloat(num);

  if (returnNumber) {
    a = parseFloat((a * rateVariable).toFixed(pointsVariable));
    return a;
  }
  a = parseFloat((a * rateVariable).toFixed(pointsVariable));
  if (currency?.ciel) {
    a = Math.ceil(a / currency.ceil) * currency.ceil;
  }
  return formatPrice(a);
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
export async function fetchWithRetry(url, options, title) {
  let attempt = 0;
  let retries = 2;
  let delay = 200;
  while (attempt <= retries) {
    try {
      const response = await fetch(url, options);

      // If the response is successful, return the data
      if (response.ok) {
        return await response.json();
      } else {
        // Handle HTTP error responses (e.g., 4xx or 5xx)
        throw new Error(`HTTP Error: ${response.status}`);
      }
    } catch (error) {
      attempt++;
      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      if (attempt > retries) {
        throw new Error(
          `${title} : Max retries reached. Could not fetch the data.`
        );
      }
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
export const getSearchOptions = async () => {
  let categories: FilterProductApi["data"] = await AxiosGet({
    url:
      process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
      "/api/products/search?with_products=false",
    title: "get Search Filter Options Request",
  });

  return [
    {
      categories: categories?.categories ?? [],
      brands: categories?.brands ?? [],
      boutiques: categories?.boutiques ?? [],
    },
    {},
  ];
};
export const getOldCart = async () => {
  if (
    !localStorage.getItem("DEVICE-TOKEN") &&
    !localStorage.getItem("MARKET-TOKEN")
  )
    await home.RegisterDevice();
  let oldCartData: OldCartApi["data"] = await AxiosGet({
    url: process.env.NEXT_PUBLIC_BACKEND_URL + "/old-cart/get_old_cart",
    title: "Old Cart Request",
  });
  store.dispatch({
    type: "STORE-OLD-CART",
    payload: oldCartData?.original?.data,
  });
};
export const getCart = async ({ callback }) => {
  if (
    !localStorage.getItem("DEVICE-TOKEN") &&
    !localStorage.getItem("MARKET-TOKEN")
  )
    await home.RegisterDevice();
  let data: CartApi["data"] = await AxiosGet({
    url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/cart_shipping",
    title: "Cart Request",
  });
  callback([data, {}]);
  return data;
};
export const GetCartOreview = async () => {
  let data = await AxiosGet({
    url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/cart_overview",
    title: "Cart Oreview",
  });
  store.dispatch({ type: "CART-OREVIEW", payload: data });
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
  // setTimeout(() => {
  //   store.dispatch({ type: "LOADED-CART", payload: true });
  // }, 1500);
};

export const LogError = (error, url, href) => {
  axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/mobile_error_log/store`, {
    error_description: JSON.stringify(error),
    token: UserToken(),
    url: href,
    backend_url: url,
  });
};
export const ExpiredUser = async () => {
  if (getUser()?.phone) localStorage.setItem("has-phone", getUser()?.phone);
  await home.registerForExpire(getUser().id);

  auth.cancelAuth();
  localStorage.removeItem("MARKET-TOKEN");
  localStorage.removeItem("USER");
  Cookies.remove("MARKET-TOKEN");
};
export const WaitForCondition = async () => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const isReady = store.getState().homepage.isRegisteringReady;
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
export const ProcessSearchInput = (
  str: string
): { str: string; colors?: string[]; sizes?: string[] } => {
  const colors = [
    {
      translations: [
        { name: "White", language_code: "en" },
        { name: "ابيض", language_code: "ar" },
        { name: "Beyaz", language_code: "tr" },
      ],
      code: "#FFFFFF",
    },
    {
      translations: [
        { name: "Black", language_code: "en" },
        { name: "اسود", language_code: "ar" },
        { name: "Siyah", language_code: "tr" },
      ],
      code: "#000000",
    },
    {
      translations: [
        { name: "Red", language_code: "en" },
        { name: "احمر", language_code: "ar" },
        { name: "Kırmızı", language_code: "tr" },
      ],
      code: "#FF0000",
    },
    {
      translations: [
        { name: "Green", language_code: "en" },
        { name: "اخضر", language_code: "ar" },
        { name: "Yeşil", language_code: "tr" },
      ],
      code: "#00FF00",
    },
    {
      translations: [
        { name: "Blue", language_code: "en" },
        { name: "ازرق", language_code: "ar" },
        { name: "Mavi", language_code: "tr" },
      ],
      code: "#0000FF",
    },
    {
      translations: [
        { name: "Yellow", language_code: "en" },
        { name: "اصفر", language_code: "ar" },
        { name: "Sarı", language_code: "tr" },
      ],
      code: "#FFFF00",
    },
    {
      translations: [
        { name: "Purple", language_code: "en" },
        { name: "بنفسجي", language_code: "ar" },
        { name: "Mor", language_code: "tr" },
      ],
      code: "#800080",
    },
    {
      translations: [
        { name: "Orange", language_code: "en" },
        { name: "برتقالي", language_code: "ar" },
        { name: "Turuncu", language_code: "tr" },
      ],
      code: "#FFA500",
    },
    {
      translations: [
        { name: "Pink", language_code: "en" },
        { name: "وردي", language_code: "ar" },
        { name: "Pembe", language_code: "tr" },
      ],
      code: "#FFC0CB",
    },
    {
      translations: [
        { name: "Brown", language_code: "en" },
        { name: "بني", language_code: "ar" },
        { name: "Kahverengi", language_code: "tr" },
      ],
      code: "#A52A2A",
    },
    {
      translations: [
        { name: "Gray", language_code: "en" },
        { name: "رمادي", language_code: "ar" },
        { name: "Gri", language_code: "tr" },
      ],
      code: "#808080",
    },
    {
      translations: [
        { name: "Navy", language_code: "en" },
        { name: "كحلي", language_code: "ar" },
        { name: "Lacivert", language_code: "tr" },
      ],
      code: "#000080",
    },
    {
      translations: [
        { name: "Teal", language_code: "en" },
        { name: "ازرق مخضر", language_code: "ar" },
        { name: "Turkuaz", language_code: "tr" },
      ],
      code: "#008080",
    },
    {
      translations: [
        { name: "Maroon", language_code: "en" },
        { name: "خمري", language_code: "ar" },
        { name: "Bordo", language_code: "tr" },
      ],
      code: "#800000",
    },
    {
      translations: [
        { name: "Olive", language_code: "en" },
        { name: "زيتوني", language_code: "ar" },
        { name: "Zeytin", language_code: "tr" },
      ],
      code: "#808000",
    },
    {
      translations: [
        { name: "Lime", language_code: "en" },
        { name: "ليموني", language_code: "ar" },
        { name: "Limon", language_code: "tr" },
      ],
      code: "#00FF00",
    },
    {
      translations: [
        { name: "Cyan", language_code: "en" },
        { name: "سماوي", language_code: "ar" },
        { name: "Camgöbeği", language_code: "tr" },
      ],
      code: "#00FFFF",
    },
    {
      translations: [
        { name: "Magenta", language_code: "en" },
        { name: "ارجواني", language_code: "ar" },
        { name: "Eflatun", language_code: "tr" },
      ],
      code: "#FF00FF",
    },
    {
      translations: [
        { name: "Silver", language_code: "en" },
        { name: "فضي", language_code: "ar" },
        { name: "Gümüş", language_code: "tr" },
      ],
      code: "#C0C0C0",
    },
    {
      translations: [
        { name: "Gold", language_code: "en" },
        { name: "ذهبي", language_code: "ar" },
        { name: "Altın", language_code: "tr" },
      ],
      code: "#FFD700",
    },
    {
      translations: [
        { name: "Indigo", language_code: "en" },
        { name: "نيلي", language_code: "ar" },
        { name: "Çivit", language_code: "tr" },
      ],
      code: "#4B0082",
    },
    {
      translations: [
        { name: "Violet", language_code: "en" },
        { name: "بنفسجي فاتح", language_code: "ar" },
        { name: "Menekşe", language_code: "tr" },
      ],
      code: "#EE82EE",
    },
    {
      translations: [
        { name: "Coral", language_code: "en" },
        { name: "مرجاني", language_code: "ar" },
        { name: "Mercan", language_code: "tr" },
      ],
      code: "#FF7F50",
    },
    {
      translations: [
        { name: "Crimson", language_code: "en" },
        { name: "قرمزي", language_code: "ar" },
        { name: "Kızıl", language_code: "tr" },
      ],
      code: "#DC143C",
    },
    {
      translations: [
        { name: "Khaki", language_code: "en" },
        { name: "كاكي", language_code: "ar" },
        { name: "Haki", language_code: "tr" },
      ],
      code: "#F0E68C",
    },
    {
      translations: [
        { name: "Plum", language_code: "en" },
        { name: "برقوقي", language_code: "ar" },
        { name: "Erik", language_code: "tr" },
      ],
      code: "#DDA0DD",
    },
    {
      translations: [
        { name: "Salmon", language_code: "en" },
        { name: "سلموني", language_code: "ar" },
        { name: "Somon", language_code: "tr" },
      ],
      code: "#FA8072",
    },
    {
      translations: [
        { name: "Tan", language_code: "en" },
        { name: "اسمر فاتح", language_code: "ar" },
        { name: "Taba", language_code: "tr" },
      ],
      code: "#D2B48C",
    },
    {
      translations: [
        { name: "Tomato", language_code: "en" },
        { name: "طماطمي", language_code: "ar" },
        { name: "Domates", language_code: "tr" },
      ],
      code: "#FF6347",
    },
    {
      translations: [
        { name: "Turquoise", language_code: "en" },
        { name: "فيروزي", language_code: "ar" },
        { name: "Turkuaz", language_code: "tr" },
      ],
      code: "#40E0D0",
    },
  ];
  let sizes = [
    "XXS",
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "3XL",
    "4XL",
    "5XL", // American sizes
    "EU32",
    "EU34",
    "EU36",
    "EU38",
    "EU40",
    "EU42",
    "EU44",
    "EU46",
    "EU48",
    "EU50", // European sizes
    "0",
    "2",
    "4",
    "6",
    "8",
    "10",
    "12",
    "14",
    "16",
    "18", // American numeric sizes
  ];
  // Convert input to lowercase for case-insensitive matching
  const input = str.toLowerCase().split(" ");
  const result = {
    str: [],
    colors: [] as string[],
    sizes: [] as string[],
  };

  // Process each word
  input.forEach((word) => {
    let matched = false;

    // Check colors
    for (const color of colors) {
      const colorNames = color.translations.map((t) => t.name.toLowerCase());
      if (colorNames.includes(word)) {
        result.colors.push(color.code);
        matched = true;
        break;
      }
    }

    // Check sizes
    const sizeMatch = sizes.find((size) => size.toLowerCase() === word);
    if (sizeMatch) {
      result.sizes.push(sizeMatch);
      matched = true;
    }

    // If word didn't match color or size, add to remaining string
    if (!matched) {
      result.str.push(word);
    }
  });

  // If no matches found, return original string
  if (result.colors.length === 0 && result.sizes.length === 0) {
    return { str };
  }

  // Join remaining words back into string
  return {
    ...result,
    str: result.str.join(" "),
  };
};
