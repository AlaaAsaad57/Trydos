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
  try {
    let time = new Date().getTime();
    let headers = await DataApiHeaders(true);
    const res = await fetch(STORIES_URL + GET_USERS_STORIES, {
      next: { revalidate: 3600, tags: ["stories"] },
      headers: headers,
    });
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
  let url = !str ? HOME_DATA_URL : HOME_DATA_URL + `ByCategory/${str}`;
  const customHeader = await DataApiHeaders();
  try {
    let time = new Date().getTime();
    const res = await fetch(OTP_URL + url, {
      next: { revalidate: 3600, tags: ["home-boutiques"] },
      headers: { ...customHeader },
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
  const customHeader = await DataApiHeaders();
  try {
    let time = new Date().getTime();
    const res = await fetch(OTP_URL + HOME_DATA_CATEGORIES_URL, {
      next: { revalidate: 3600, tags: ["home-categories"] },
      headers: { ...customHeader },
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
    return [repo.data.mainCategories, returned_res];
  } catch (e) {
    if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true") console.log(e);
    return ["homedata-error", e.toString()];
  }
};
export const DataApiHeaders = async (forStories) => {
  const cookies= (((await import( "next/headers")).cookies));
  const cookieStore = cookies();
  return new Headers({
    language:
      cookieStore.get("language")?.value === "ar"
        ? "ae"
        : cookieStore.get("language")?.value || "en",
    country: cookieStore.get("country") && cookieStore.get("country").value,
    Authorization:
      "Bearer " + forStories
        ? cookieStore.get("stories-token")?.value
        : cookieStore.get("token")?.value,
  });
};
export const changeAppLanguageServer =async (language) => {
  const cookies= (((await import( "next/headers")).cookies));
  const cookieStore = cookies();
  cookieStore.set("language", language);
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
  let str = getHref(categories);
  let customHeader = await DataApiHeaders();
  try {
    let time = new Date().getTime();
    const res = await fetch(
      OTP_URL + LISTING_INFO_URL + `?boutique_slug=${str}`,
      {
        next: { revalidate: 3600, tags: ["listing-data"] },
        headers: { ...customHeader },
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
