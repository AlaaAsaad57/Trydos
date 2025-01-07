import { translations } from "public/translations/translations.js";
import profilePicture from "public/images/profileNo.png";
import StoryServiceClass from "services/story";
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
export const SSRDetect = () => {
  return typeof window !== "undefined";
};

export function translate(key: string, language?: string | string[]) {
  let url, lang;
  if (typeof window !== "undefined") {
    url = window.location.pathname.split("/")[1];
    lang = url.split("-")[1] ?? "en";
  } else {
    lang = Cookies.get("language") ?? "en";
  }

  if (translations[lang] && translations[lang][key]) {
    return translations[lang][key] || key;
  } else return key;
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
  let [langauge, country] = lang.split("-");
  let data: SimpleDetailsProductApi = await fetchWithRetry(
    process.env.NEXT_PUBLIC_BACKEND_URL +
      `/web/product/simpleDetails/${productId}${
        color ? `?color=${color}` : ""
      }`,
    {
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        lang: await getLang(langauge, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
    }
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
      lang: getLang(null, Cookies.get("language")),
      country: Cookies.get("country"),
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
  let [langauge, country] = lang.split("-");
  let start = new Date();
  let resp = await fetch(
    process.env.NEXT_PUBLIC_BACKEND_URL +
      `/web/boutique/simpleDetails/${boutiqueId}`,
    {
      next: {
        revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
      },
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        lang: await getLang(langauge, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
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
        typeof localStorage !== "undefined" &&
        localStorage.getItem("MARKET-TOKEN")
      }`,
      lang: getLang(null, Cookies.get("language")),
      country: Cookies.get("country"),
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
  const PriceFiltered = store.getState().details.PriceFiltered;
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
    str = `/api/products/search?${
      filters.categories.length > 0
        ? `category_slugs=${JSON.stringify(filters.categories)}`
        : ""
    }${
      filters.brands.length > 0
        ? `&brand_slugs=${JSON.stringify(filters.brands)}`
        : ""
    }${
      filters?.attributes?.options?.length > 0
        ? `&attributes=${JSON.stringify(filters.attributes)}`
        : ""
    }${
      filters.prices !== null && PriceFiltered
        ? `&price=${JSON.stringify(filters.prices)}`
        : ""
    }${
      filters.boutique_slug !== "listing" && filters.boutique_slug
        ? `&boutique_slugs=${JSON.stringify([filters.boutique_slug])}`
        : ""
    }${
      filters?.searchText?.length > 0
        ? `&search_text=${filters.searchText}`
        : ""
    }${filters.colors.length > 0 ? `${JSON.stringify(filters.colors)}` : ``}`;
  }
  let product: FilterProductApi = await AxiosCacheApi({
    url: process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL + str,
    params:
      filters.colors.length === 0
        ? null
        : { colors: `${JSON.stringify(filters.colors)}` },
  });

  if (!serachTrigger)
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
    const PriceFiltered = store.getState().details.PriceFiltered;

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
    let str = `/api/products/search?with_products=false${
      filters.categories.length > 0
        ? `&category_slugs=${JSON.stringify(filters.categories)}`
        : ""
    }${
      filters.brands.length > 0
        ? `&brand_slugs=${JSON.stringify(filters.brands)}`
        : ""
    }${
      filters?.attributes?.options?.length > 0
        ? `&attributes=${JSON.stringify(filters.attributes)}`
        : ""
    }${
      filters.prices !== null && PriceFiltered
        ? `&price=${JSON.stringify(filters.prices)}`
        : ""
    }${
      filters.boutique_slug !== "listing" && filters.boutique_slug
        ? `&boutique_slugs=${JSON.stringify([filters.boutique_slug])}`
        : ""
    }${
      filters?.searchText?.length > 0
        ? `&search_text=${filters.searchText}`
        : ""
    }${filters.colors.length > 0 ? `${JSON.stringify(filters.colors)}` : ``}`;

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
export const RoundPrice = ({ num, rate, points }): number => {
  let a = parseFloat(num);
  return parseFloat((a * rate).toFixed(points));
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
async function fetchWithRetry(url, options, retries = 2, delay = 200) {
  let attempt = 0;

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
        throw new Error("Max retries reached. Could not fetch the data.");
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
  let oldCartData: OldCartApi["data"] = await AxiosGet({
    url: process.env.NEXT_PUBLIC_BACKEND_URL + "/old-cart/get_old_cart",
    title: "Old Cart Request",
  });

  store.dispatch({
    type: "STORE-OLD-CART",
    payload: oldCartData?.original?.data,
  });
  callback([data, {}]);
};
export const AddToCartAnimation = () => {
  let productImage = document.getElementById("added-to-cart");
  let CartIcon = document.getElementById("cart-icon");
  const cartPosition = CartIcon.getBoundingClientRect();
  const productPosition = productImage.getBoundingClientRect();
  const clonedImage = productImage.cloneNode();
  // @ts-ignore
  clonedImage.classList.add("moving");
  // @ts-ignore
  clonedImage.classList.remove("h-full");
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
  // @ts-ignore
  document.body.appendChild(clonedImage);
  // @ts-ignore
  CartIcon.animate(
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
  clonedImage.animate(
    [
      {
        scale: "1",
        top: `${productPosition.top}px`,
        left: `${productPosition.left}px`,
        opacity: 1,
      },
      {
        scale: "0.1",
        top: `${cartPosition.top}px`,
        left: `${cartPosition.left}px`,
        opacity: 0,
      },
    ],
    {
      duration: 1000,
      fill: "forwards",
    }
  );
  setTimeout(() => {
    store.dispatch({ type: "LOADED-CART", payload: true });
  }, 1500);
};

export const LogError = (error, url, href) => {
  axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/mobile_error_log/store`, {
    error_description: JSON.stringify(error),
    token: UserToken(),
    url: href,
    backend_url: url,
  });
};
export const ExpiredUser = () => {
  store.dispatch({ type: "INFO_EXPIRED_TOKEN", payload: true });
};
