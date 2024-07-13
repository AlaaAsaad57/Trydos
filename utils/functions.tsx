import { translations } from "public/translations/translations.js";
import profilePicture from "public/images/profileNo.png";
import StoryServiceClass from "services/story";
import { store } from "store";
import Cookies from "js-cookie";
import { HOME_DATA_URL, LISTING_INFO_URL, OTP_URL } from "./endpointConfig";
import { notFound } from "next/navigation";
import axios from "axios";
export const SSRDetect = () => {
  return typeof window !== "undefined";
};
export const getStories = async () => {
  try {
    // hi
    const res = await StoryServiceClass.getStories();
    const repo = res;
    return repo;
  } catch (e) {
    return [];
  }
};
export function translate(key, language) {
  if (translations[language] && translations[language][key]) {
    return translations[language][key] || key;
  } else return key;
}

const token = SSRDetect() && localStorage.getItem("STORIES-TOKEN");
export const getStoriesHeaders = () => {
  return {
    headers: {
      Authentication: `Bearer ${token}`,
      Authorization: `Bearer ${token}`,
    },

    next: { tags: ["stories"], revalidate: 300 },
  };
};
export const GeneralCahcedHeader = (apiName) => {
  return {
    next: { tags: [apiName], revalidate: 300 },
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
    localStorage.getItem("USER-CHAT") &&
    JSON.parse(localStorage.getItem("USER"))
  );
};
export const getUserChat = () => {
  return (
    localStorage.getItem("USER-CHAT") &&
    JSON.parse(localStorage.getItem("USER-CHAT"))
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
export const Sendevent = async (params: any) => {
  try {
    let userId = localStorage.getItem("USER")
      ? JSON.parse(localStorage.getItem("USER"))?.id
      : JSON.parse(localStorage.getItem("guest-user"))?.id;
    (window as any).gtag("event", params.event, {
      event_category: params.category,
      event_label: params.label,
      clicked_button_name: params.value,
      country_name: Cookies.get("country"),
      userID: userId,
      device_language: Cookies.get("language"),
      time_stamp: new Date().toISOString(),
      user_name:
        localStorage.getItem("USER") &&
        JSON.parse(localStorage.getItem("USER"))?.name,
      sessionID: store.getState().homepage.session_id,
      previous_event_button_name:
        store.getState().homepage.previous_event_button_name,
    });
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
  if (src.file_path?.includes("cloudinary")) {
    return src.file_path.replace(
      "/upload",
      `/upload/h_${height}/f_avif/q_auto`
    );
  } else return src.file_path;
};
export const getLang = (lang, cookieLang) => {
  if (lang) {
    if (lang === "ar") {
      return "ae";
    } else {
      return lang;
    }
  } else {
    if (cookieLang) {
      if (cookieLang === "ar") {
        return "ae";
      } else {
        return cookieLang;
      }
    } else {
      return "en";
    }
  }
};
export const getBoutiquesUrl = async ({ str }) => {
  var details = {
    slug: str,
  };

  var formBody = [];
  for (var property in details) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  // @ts-ignore
  formBody = formBody.join("&");
  // @ts-ignore
  let response = await fetch(OTP_URL + HOME_DATA_URL, {
    method: "POST",
    // @ts-ignore
    body: formBody,
  });
  let data = await response.json();
  return data.data.boutiques;
};
export const getProductsUrl = async () => {
  let response = await fetch(
    OTP_URL + LISTING_INFO_URL + "?boutique_slug=family-section-12"
  );
  let data = await response.json();
  return data.data.products;
};
export const getProductMeta = async ({ productId, lang }) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  let [langauge, country] = lang.split("-");
  let resp = await fetch(OTP_URL + `/web/product/simpleDetails/${productId}`, {
    headers: new Headers({
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      lang: await getLang(langauge, cookieStore.get("language")?.value),
      country: cookieStore.get("country") && cookieStore.get("country").value,
    }),
  });
  let data = await resp.json();
  if (data.message === "Product Not Found") {
    notFound();
  }
  return data.data;
};
export const getBoutiqueMeta = async ({ boutiqueId, lang }) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  let [langauge, country] = lang.split("-");
  let resp = await fetch(
    OTP_URL + `/web/boutique/simpleDetails/${boutiqueId}`,
    {
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        lang: await getLang(langauge, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
    }
  );
  let data = await resp.json();
  if (data.code === "boutique_not_found") {
    notFound();
  }
  return data.data;
};
export const getBoutiqueFilters = async ({ boutiqueId, lang }) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  let [langauge, country] = lang.split("-");
  let resp = await fetch(
    OTP_URL + `/web/products/filters?boutique_slug=${boutiqueId}`,
    {
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        lang: await getLang(langauge, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
    }
  );
  let data = await resp.json();
  return data.data;
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
  document.querySelector<HTMLElement>(".home-navbar").classList.add("fixed");
  document.querySelector<HTMLElement>(".home-navbar").style.zIndex =
    "9999999999";
  document.querySelector<HTMLElement>(".filter-listing-bar").style.position =
    "fixed";
  document
    .querySelector<HTMLElement>(".filter-listing-bar")
    .classList.remove("relative");
  document.querySelector<HTMLElement>(
    ".filter-listing-bar"
  ).style.paddingRight = "5px";
  document.querySelector<HTMLElement>(".filter-listing-bar").style.zIndex =
    "9999999999";
  document.querySelector<HTMLElement>(".filter-listing-bar").style.top = "98px";
  document.querySelector<HTMLElement>(".filter-listing-bar").style.left = "0px";
  document.querySelector<HTMLElement>(".boutique-header").style.marginTop =
    !filter ? "214px" : "118px";
  document.querySelector<HTMLElement>(
    ".boutique-top-info .boutique-text"
  ).style.display = "none";
  document
    .querySelectorAll(".boutique-top-info .boutique-logo-container svg")
    .forEach((s: HTMLElement) => {
      s.style.display = "none";
    });
  document.querySelector<HTMLElement>(
    ".boutique-photo-holder .offer-slider-container"
  ).style.maxHeight = "0px";
  document.querySelector<HTMLElement>(".boutique-top-info").style.zIndex =
    "9999999999";
  document.querySelector<HTMLElement>(".boutique-top-info").style.width =
    "auto";
  document.querySelector<HTMLElement>(".boutique-top-info").style.marginLeft =
    "40px";
  document
    .querySelector<HTMLElement>(".boutique-top-info")
    .classList.add("move-anim");
  document
    .querySelector<HTMLElement>(".boutique-top-info")
    .classList.add("items-end");
  document
    .querySelector<HTMLElement>(".boutique-top-info")
    .classList.remove("items-center");
};
export const normalizeView = () => {
  let filterEnabled = store.getState().listing.filterEnabled;
  if (filterEnabled) {
    return;
  }
  document
    .querySelector<HTMLElement>(".boutique-top-info")
    ?.classList.remove("move-anim");
  document
    .querySelector<HTMLElement>(".home-navbar")
    ?.classList.remove("fixed");
  document.querySelector<HTMLElement>(".filter-listing-bar").style.position =
    "static";
  document.querySelector<HTMLElement>(
    ".filter-listing-bar"
  ).style.paddingRight = "20px";
  document.querySelector<HTMLElement>(".filter-listing-bar").style.top =
    "initial";
  document
    .querySelector<HTMLElement>(".filter-listing-bar")
    .classList.add("relative");

  document.querySelector<HTMLElement>(".boutique-header").style.marginTop =
    "0px";
  document.querySelector<HTMLElement>(
    ".boutique-top-info .boutique-text"
  ).style.display = "flex";
  document.querySelector<HTMLElement>(
    ".boutique-photo-holder .offer-slider-container"
  ).style.maxHeight = "342px";
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

  document.querySelector<HTMLElement>(".boutique-top-info").style.zIndex = "1";
  document.querySelector<HTMLElement>(".boutique-top-info").style.width =
    "100%";
  document.querySelector<HTMLElement>(".boutique-top-info").style.marginLeft =
    "0px";
  document.querySelector<HTMLElement>(".boutique-top-info").style.top =
    "initial";
  document.querySelector<HTMLElement>(".boutique-top-info").style.left =
    "initial";
  document.querySelector<HTMLElement>(".boutique-photo-holder").style.height =
    "auto";
  document
    .querySelector<HTMLElement>(".boutique-top-info")
    .classList.remove("move-anim");
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
}) => {
  const filterObj = store.getState().details.selectedFilter;
  storeCallback(filterObj);

  let filters = {
    categories: filterObj.categories.map((s) => s.id),
    prices: filterObj.prices
      ? [
          `${filterObj.prices.min.toString()}-${filterObj.prices.max.toString()}`,
        ]
      : null,
    brands: filterObj.brands.map((brand) => brand.id),
    attributes: { ...sizesAttr, ...filterObj.sizes },
    boutique_slug: boutiqueId,
    lang: lang.split("-")[1],
    country: lang.split("-")[0],
    searchText: searchText || filterObj.searchText,
  };
  let str = "";
  if (reset) {
    str = `/web/products/with_filter?&boutique_slug=${boutiqueId}`;
  } else {
    str = `/web/products/with_filter?categories=${JSON.stringify(
      filters.categories
    )}&brands=${JSON.stringify(filters.brands)}${
      filters?.attributes?.options?.length > 0
        ? `&attributes=${JSON.stringify(filters.attributes)}`
        : ""
    }${
      filters.prices !== null ? `&prices=${JSON.stringify(filters.prices)}` : ""
    }&boutique_slug=${filters.boutique_slug}${
      filters?.searchText?.length > 0
        ? `&search_text=${filters.searchText}`
        : ""
    }`;
  }
  let product = await axios.get(OTP_URL + str, {
    headers: {
      lang: filters.lang,
      country: filters.country,
    },
  });
  newFiltersCallback({
    filtersVar: {
      categories: product.data.data.categories,
      brands: product.data.data.brands,
      sizes:
        product.data.data.attributes.filter((s) => s.name === "Size")[0]
          ?.options || [],
      prices: product.data.data.prices || null,
      offers:
        product.data.data.attributes.filter((s) => s.name === "Offer")[0]
          ?.options || [],
      reset: reset,
    },
  });
  callback(product.data.data.products);
};
