import { translations } from "public/translations/translations.js";
import profilePicture from "public/images/profileNo.png";
import StoryServiceClass from "services/story";
import { store } from "store";
import Cookies from "js-cookie";
import { HOME_DATA_URL } from "./endpointConfig";
import { notFound } from "next/navigation";
import axios from "axios";
import { FetchApi } from "store/homepage/cachedActions";
import { LogData } from "store/homepage/actions";
import { AxiosCacheApi, AxiosGet } from "./constants";
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

    next: { tags: ["stories"], revalidate: 60 },
  };
};
export const GeneralCahcedHeader = (apiName) => {
  return {
    next: { tags: [apiName], revalidate: 60 },
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
export const getBoutiquesUrl = async ({ str }) => {
  var details = {
    slug: str,
  };
  let start = new Date();
  var formBody = [];
  for (var property in details) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  // @ts-ignore
  formBody = formBody.join("&");
  // @ts-ignore
  let response = await fetch(
    process.env.NEXT_PUBLIC_BACKEND_URL + HOME_DATA_URL,
    {
      method: "POST",
      // @ts-ignore
      body: formBody,
    }
  );
  let data = await response.json();
  let end = new Date();
  LogData({
    request: "Get boutiques by category",
    url: process.env.NEXT_PUBLIC_BACKEND_URL + HOME_DATA_URL,
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
  return data.data.boutiques;
};

export const getProductMeta = async ({ productId, lang }) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  let start = new Date();
  let [langauge, country] = lang.split("-");

  let resp = await fetch(
    process.env.NEXT_PUBLIC_BACKEND_URL +
      `/web/product/simpleDetails/${productId}`,
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
        revalidate: 36000,
      },
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        lang: await getLang(langauge, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
    }
  );
  let data = await resp.json();
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
  if (data.code === "boutique_not_found") {
    notFound();
  }

  return data.data;
};
export const getBoutiqueFilters = async ({ boutiqueId, lang }) => {
  let start = new Date();
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  let [langauge, country] = lang.split("-");
  let resp = await fetch(
    process.env.NEXT_PUBLIC_BACKEND_URL +
      `/web/products/filters?${
        boutiqueId !== "listing" &&
        `boutique_slugs=${JSON.stringify([boutiqueId])}`
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

  let data = await resp.json();
  let end = new Date();
  LogData({
    request: "Get Boutique Filters",
    url:
      process.env.NEXT_PUBLIC_BACKEND_URL +
      `/web/products/filters?${
        boutiqueId !== "listing" &&
        `boutique_slugs=${JSON.stringify([boutiqueId])}`
      }`,
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
  if (document.querySelector<HTMLElement>(".home-navbar")) {
    document.querySelector<HTMLElement>(".home-navbar").classList.add("fixed");
    document
      .querySelector<HTMLElement>(".home-navbar")
      .classList.add("z-[999999999]");
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
    document.querySelector<HTMLElement>(".filter-listing-bar").style.top =
      "98px";
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
  document
    .querySelector<HTMLElement>(".boutique-top-info")
    ?.classList.remove("move-anim");
  document
    .querySelector<HTMLElement>(".home-navbar")
    ?.classList.remove("fixed");
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
    str = `/web/products?${
      boutiqueId !== "listing" &&
      `boutique_slugs=${JSON.stringify([boutiqueId])}`
    }`;
  } else {
    str = `/web/products?${
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
        ? `&prices=${JSON.stringify(filters.prices)}`
        : ""
    }${
      filters.boutique_slug !== "listing"
        ? `&boutique_slugs=${JSON.stringify([filters.boutique_slug])}`
        : ""
    }${
      filters?.searchText?.length > 0
        ? `&search_text=${filters.searchText}`
        : ""
    }${filters.colors.length > 0 ? `${JSON.stringify(filters.colors)}` : ``}`;
  }
  let product = await AxiosCacheApi({
    url: process.env.NEXT_PUBLIC_BACKEND_URL + str,
    params:
      filters.colors.length === 0
        ? null
        : { colors: `${JSON.stringify(filters.colors)}` },
  });
  console.log(product);
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
    let str = `/web/products/filters?${
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
        ? `&prices=${JSON.stringify(filters.prices)}`
        : ""
    }${
      filters.boutique_slug !== "listing"
        ? `&boutique_slugs=${JSON.stringify([filters.boutique_slug])}`
        : ""
    }${
      filters?.searchText?.length > 0
        ? `&search_text=${filters.searchText}`
        : ""
    }${filters.colors.length > 0 ? `${JSON.stringify(filters.colors)}` : ``}`;

    let product = await AxiosCacheApi({
      url: process.env.NEXT_PUBLIC_BACKEND_URL + str,
      params:
        filters.colors.length === 0
          ? null
          : { colors: `${JSON.stringify(filters.colors)}` },
    });
    newFiltersCallback({
      filtersVar: {
        categories: product.data.categories,
        brands: product.data.brands,
        sizes:
          product.data.attributes.filter((s) => s.name === "Size")[0]
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
export const getSearchOptions = async () => {
  let categories = await AxiosGet({
    url: process.env.NEXT_PUBLIC_BACKEND_URL + "/web/search/filters",
  });
  console.log(categories);
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
  // let [data, response] = await FetchApi({
  //   url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/cart_shipping",
  //   method: "GET",
  //   body: null,
  //   country: null,
  //   lang: null,
  // });
  let data = await AxiosGet({
    url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/cart_shipping",
  });

  callback([data, {}]);
};
export const AddToCartAnimation = (e) => {
  let shopping_cart = document.querySelector<SVGAElement>(".cart-icon");
  let target_parent = document.querySelector<HTMLDivElement>(
    `.image-container-cart`
  );
  target_parent.style.zIndex = "99999999999";
  // Creating separate Image
  let imgs = target_parent.querySelectorAll(`#img${e}`);
  // @ts-ignore
  imgs.forEach((img) => {
    // Finding position of flying image
    // @ts-ignore
    const flying_img_pos = img.getBoundingClientRect();

    // @ts-ignore
    const shopping_cart_pos = shopping_cart.getBoundingClientRect();

    let data = {
      left: shopping_cart_pos.left,
      top: shopping_cart_pos.top,
    };

    // @ts-ignore
    img.style.cssText = `
                                  --left : ${data.left.toFixed(2)}px;
                                  --top : ${data.top.toFixed(2)}px;
                                  left:${flying_img_pos.left}px;
                                  top:${flying_img_pos.top}px;
                                  z-index: 99999999999999;
                                  `;
    // @ts-ignore
    img.classList.add("flying-img");
  });

  // setTimeout(() => {
  //   store.dispatch({ type: "ANIMATION-END", payload: e });
  // }, 1300);
  // @ts-ignoreZ
};
export const AxiosInstaceRequest = async ({ url, method, body }) => {
  let start = new Date().getTime();
  let lang = Cookies.get("language");
  let country = Cookies.get("country");
  let axios = (await import("axios")).default;
  if (method === "GET") {
    let res = await axios.get(url, {
      headers: {
        lang: lang,
        country: country,
      },
    });
    let end = new Date().getTime() - start;
    let returned_res = {
      url,
      method,
      headers: {
        lang: lang,
        country: country,
      },
    };
  } else if (method === "POST") {
    let res = await axios.post(url, JSON.stringify(body), {
      headers: {
        lang: lang,
        country: country,
      },
    });
    let end = new Date().getTime() - start;
    let returned_res = {
      url,
      method,
      body,
      headers: {
        lang: lang,
        country: country,
      },
    };
  }
};
export const getListingDataFilters = async ({
  categories,
  lang,
  productCategory,
  searchParams,
  callback,
}) => {
  let start = new Date().getTime();

  if (Object.keys(searchParams).length > 0) {
    let obj = {
      categories: ``,
      brands: ``,
      sizes: ``,
      colors: ``,
      search_text: "",
      offers: "",
      sizesAttr: null,
      prices: "",
    };
    if (Object.keys(searchParams).includes("searchText")) {
      obj = { ...obj, search_text: searchParams.searchText };
    }
    if (Object.keys(searchParams).includes("categories"))
      obj = {
        ...obj,
        categories: `${
          searchParams.categories.includes(",")
            ? searchParams.categories.split(",")
            : [searchParams.categories]
        }`,
      };
    if (Object.keys(searchParams).includes("colors"))
      obj = {
        ...obj,
        colors: `${
          searchParams.colors.includes(",")
            ? searchParams.colors.split(",")
            : [searchParams.colors]
        }`,
      };
    if (Object.keys(searchParams).includes("brands"))
      obj = {
        ...obj,
        brands: `${
          searchParams.brands.includes(",")
            ? searchParams.brands.split(",")
            : [searchParams.brands]
        }`,
      };
    if (Object.keys(searchParams).includes("offers"))
      obj = {
        ...obj,
        offers: `${
          searchParams.offers.includes(",")
            ? searchParams.offers.split(",")
            : [searchParams.offers]
        }`,
      };
    if (Object.keys(searchParams).includes("sizes"))
      obj = {
        ...obj,
        sizes: `${
          searchParams.sizes.includes(",")
            ? searchParams.sizes.split(",")
            : [searchParams.sizes]
        }`,
        sizesAttr: { id: "1", name: "Size" },
      };
    if (
      Object.keys(searchParams).includes("max-pr") &&
      Object.keys(searchParams).includes("min-pr")
    )
      obj = {
        ...obj,
        prices: `${searchParams["min-pr"]}-${searchParams["max-pr"]}`,
      };

    let filters = {
      ...obj,
      boutique_slug: null,
      lang: lang,
    };
    if (!categories.includes("listing")) {
      filters = {
        ...filters,
        boutique_slug: categories,
      };
    }

    let str = `/web/products/filters?${
      obj.categories?.length > 0
        ? `category_slugs=${JSON.stringify(
            obj.categories.split(",").map((s) => s)
          )}`
        : ""
    }${
      obj.brands?.length > 0
        ? `&brand_slugs=${JSON.stringify(obj.brands.split(",").map((s) => s))}`
        : ""
    }${
      obj.sizes?.length > 0
        ? `&attributes={id:${obj.sizesAttr.id},name:${
            obj.sizesAttr.name
          },options:${JSON.stringify(obj.sizes.split(","))}}`
        : ""
    }${
      obj.search_text?.length > 0
        ? `${`&search_text=${obj.search_text || ""}`}`
        : ""
    }${filters.prices ? `&prices=[${JSON.stringify(obj.prices)}]` : ""}${
      filters.boutique_slug
        ? `&boutique_slugs=${JSON.stringify(categories)}`
        : ""
    }`;

    let productRes = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        str +
        (filters.colors
          ? `&${new URLSearchParams({
              colors: `[${obj?.colors?.split(",").map((s) => `"${s}"`)}]`,
            }).toString()}`
          : ""),
      {
        method: "GET",

        next: {
          revalidate: 36000,
          tags: [`listing-data-${str}`, "listing-data"],
        },
        headers: new Headers({
          lang: Cookies.get("language"),
          country: Cookies.get("country"),
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        }),
      }
    );
    let repo = await productRes.json();
    let end = new Date().getTime();
    let time = end - start;
    let returned_res = {
      type: productRes.type,
      headers: new Headers({
        lang: Cookies.get("language"),
        country: Cookies.get("country"),
      }),
      url: productRes.url,
      time: time + "ms",
      response: repo,
      request: "Get Products with Filters",
    };

    if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
      callback({
        body: repo,
      });
    else
      callback({
        body: repo,
      });
  } else {
    let str = categories;

    let url =
      process.env.NEXT_PUBLIC_BACKEND_URL +
      (productCategory
        ? "/web/products/filters" +
          `?category=${productCategory}${
            !str.includes("listing")
              ? `&boutique_slugs=${JSON.stringify(str)}`
              : ""
          }`
        : "/web/products/filters" +
          `${
            !str.includes("listing")
              ? `?boutique_slugs=${JSON.stringify(str)}`
              : ""
          }`);
    var details = productCategory
      ? {
          boutique_slug: [str],
          category: productCategory,
        }
      : {
          boutique_slug: [str],
        };

    try {
      const res = await fetch(url, {
        method: "GET",

        next: {
          revalidate: 36000,
          tags: [`listing-data-${str}`, "listing-data"],
        },
        headers: new Headers({
          lang: Cookies.get("language"),
          country: Cookies.get("country"),
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        }),
      });
      let end = new Date().getTime();
      let time = end - start;
      const repo = await res.json();

      let returned_res = {
        type: res.type,
        headers: new Headers({
          lang: Cookies.get("language"),
          country: Cookies.get("country"),
        }),
        url: res.url,
        time: time + "ms",
        response: repo,
        request: "Get Products with Filters ",
      };

      if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
        callback({
          body: repo,
        });
      else
        callback({
          body: repo,
        });
    } catch (e) {
      console.log(e);
    }
  }
};
