"use server";
import {
  GET_USERS_STORIES,
  HOME_DATA_CATEGORIES_URL,
  HOME_DATA_URL,
  LISTING_INFO_URL,
  OTP_URL,
  STORIES_URL,
} from "utils/endpointConfig";

export const getStories = async () => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  try {
    let time = new Date().getTime();
    let [headersObj, headers] = await DataApiHeaders(true);
    const res = await fetch(
      STORIES_URL +
        GET_USERS_STORIES +
        `?l=${cookieStore.get("lang").value ?? "en"}`,
      {
        next: {
          revalidate: 3600,
          tags: [`stories-${cookieStore.get("lang")?.value ?? "en"}`],
        },
        headers: { ...headersObj },
      }
    );
    // hi
    const repo = await res.json();
    time = new Date().getTime() - time;

    let returned_res = {
      type: res.type,
      headers: [...res.headers, ...headers],
      url: res.url,
      time: time + "ms",
      body: repo,
    };
    return [repo.data.data, returned_res];
  } catch (e) {
    console.log(e);
    return [[], e.toString()];
  }
};

export const getHomeData = async (str) => {
  const cookies = (await import("next/headers")).cookies;

  const cookieStore = cookies();
  let url = !str
    ? HOME_DATA_URL + `?l=${cookieStore.get("lang").value ?? "en"}`
    : HOME_DATA_URL +
      `ByCategory/${str}` +
      `?l=${cookieStore.get("lang").value ?? "en"}`;
  const [headersObj, customHeader] = await DataApiHeaders();
  try {
    let time = new Date().getTime();
    const res = await fetch(OTP_URL + url, {
      next: {
        revalidate: 3600,
        tags: [`home-boutiques-${cookieStore.get("lang")?.value ?? "en"}`],
      },
      headers: customHeader,
      credentials: "include",
      mode: "cors",
    });
    const repo = await res.json();
    time = new Date().getTime() - time;
    let returned_res = {
      type: res.type,
      headers: [...res.headers, ...customHeader],
      url: res.url,
      time: time + "ms",
      body: repo,
    };
    return [repo.data.boutiques, returned_res];
  } catch (e) {
    if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true") console.log(e);
    return [[], e.toString()];
  }
};
export const getMainCategories = async () => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  const [headersObj, customHeader] = await DataApiHeaders();
  try {
    let time = new Date().getTime();
    const res = await fetch(
      OTP_URL +
        HOME_DATA_CATEGORIES_URL +
        `?l=${cookieStore.get("lang").value ?? "en"}`,
      {
        next: {
          revalidate: 3600,
          tags: [`home-categories-${cookieStore.get("lang")?.value ?? "en"}`],
        },
        headers: { ...headersObj },
      }
    );
    const repo = await res.json();
    time = new Date().getTime() - time;
    let returned_res = {
      type: res.type,
      headers: [...res.headers, ...customHeader],
      url: res.url,
      time: time + "ms",
      body: repo,
    };
    return [repo.data.mainCategories, returned_res];
  } catch (e) {
    if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true") console.log(e);
    return ["homedata-error", e.toString()];
  }
};
export const DataApiHeaders = async (forStories) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  let headerObj = {
    lang:
      cookieStore.get("language")?.value === "ar"
        ? "ae"
        : cookieStore.get("language")?.value || "en",
    country: cookieStore.get("country") && cookieStore.get("country").value,
    authorization:
      "Bearer " + forStories
        ? cookieStore.get("stories-token")?.value
        : cookieStore.get("token")?.value,
  };
  return [
    headerObj,
    new Headers({
      lang:
        cookieStore.get("language")?.value === "ar"
          ? "ae"
          : cookieStore.get("language")?.value || "en",
      country: cookieStore.get("country") && cookieStore.get("country").value,
      Authorization:
        "Bearer " + forStories
          ? cookieStore.get("stories-token")?.value
          : cookieStore.get("token")?.value,
    }),
  ];
};
export const changeAppLanguageServer = async (language) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  cookieStore.set("language", language);
  cookieStore.set("lang", language);
};
const getHref = (s) => {
  let str = "";
  s.split("").forEach((char) => {
    if (char === "_") {
      str += "-";
    } else {
      str += char;
    }
  });
  return str;
};
export const getListingData = async (categories) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  let str = getHref(categories);
  let [headerObj, customHeader] = await DataApiHeaders();
  try {
    let time = new Date().getTime();
    const res = await fetch(
      OTP_URL +
        LISTING_INFO_URL +
        `?boutique_slug=${str}` +
        `&l=${cookieStore.get("lang").value ?? "en"}`,
      {
        next: {
          revalidate: 3600,
          tags: [`listing-data`],
        },
        headers: { ...headerObj },
        cache: "force-cache",
      }
    );
    const repo = await res.json();
    time = new Date().getTime() - time;
    let returned_res = {
      type: res.type,
      headers: [...res.headers, ...customHeader],
      url: res.url,
      time: time + "ms",
      body: repo,
    };
    return [repo.data, returned_res];
  } catch (e) {
    if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true") console.log(e);
    return ["listing-error", e.toString()];
  }
};
