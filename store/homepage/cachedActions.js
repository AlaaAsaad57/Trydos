"use server";
import {
  GET_USERS_STORIES,
  HOME_DATA_CATEGORIES_URL,
  HOME_DATA_URL,
  LISTING_INFO_URL,
  OTP_URL,
  STORIES_URL,
} from "utils/endpointConfig";

export const getStories = async ({ lang }) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  try {
    let time = new Date().getTime();
    let [headersObj, headers] = await DataApiHeaders(true);
    const res = await fetch(STORIES_URL + GET_USERS_STORIES, {
      next: {
        revalidate: 3600,
        tags: [`stories-${cookieStore.get("lang")?.value ?? lang}`],
      },
      headers: headers,
    });
    // hi
    const repo = await res.json();
    time = new Date().getTime() - time;

    let returned_res = {
      type: res.type,
      headers: headers,
      url: res.url,
      time: time + "ms",
      body: repo,
    };
    return [repo.data.data, returned_res];
  } catch (e) {
    return [[], e.toString()];
  }
};

export const getHomeData = async ({ str, lang }) => {
  const cookies = (await import("next/headers")).cookies;

  const cookieStore = cookies();
  let url = !str ? HOME_DATA_URL : HOME_DATA_URL + `ByCategory/${str}`;

  try {
    let time = new Date().getTime();
    const res = await fetch(OTP_URL + url, {
      next: {
        revalidate: 3600,
        tags: [`home-boutiques-${cookieStore.get("lang")?.value ?? "en"}`],
      },
      headers: new Headers({
        lang: getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      credentials: "include",
      mode: "cors",
    });
    const repo = await res.json();
    time = new Date().getTime() - time;
    let returned_res = {
      type: res.type,
      headers: new Headers({
        lang: getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      url: res.url,
      time: time + "ms",
      body: repo,
    };
    return [repo.data.boutiques, returned_res];
  } catch (e) {
    return [[], e.toString()];
  }
};
export const getMainCategories = async ({ lang }) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  try {
    let time = new Date().getTime();
    const res = await fetch(OTP_URL + HOME_DATA_CATEGORIES_URL, {
      next: {
        revalidate: 3600,
        tags: [`home-categories-${cookieStore.get("lang")?.value ?? "en"}`],
      },
      headers: new Headers({
        lang: getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
    });
    const repo = await res.json();
    time = new Date().getTime() - time;
    let returned_res = {
      type: res.type,
      headers: new Headers({
        lang: getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      url: res.url,
      time: time + "ms",
      body: repo,
    };
    return [repo.data.mainCategories, returned_res];
  } catch (e) {
    return ["homedata-error", e.toString()];
  }
};
export const DataApiHeaders = async (forStories) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  return new Headers({
    lang: getLang(lang, cookieStore.get("language")?.value),
    country: cookieStore.get("country") && cookieStore.get("country").value,
    Authorization:
      "Bearer " + forStories
        ? cookieStore.get("stories-token")?.value
        : cookieStore.get("token")?.value,
  });
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
export const getListingData = async ({ categories, lang }) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  let str = getHref(categories);

  try {
    let time = new Date().getTime();
    const res = await fetch(
      OTP_URL + LISTING_INFO_URL,
      JSON.stringify({ boutique_slug: str }),
      {
        next: {
          revalidate: 3600,
          tags: [`listing-data`],
        },
        headers: new Headers({
          lang: getLang(lang, cookieStore.get("language")?.value),
          country:
            cookieStore.get("country") && cookieStore.get("country").value,
        }),
      }
    );
    const repo = await res.json();
    time = new Date().getTime() - time;
    let returned_res = {
      type: res.type,
      headers: new Headers({
        lang: getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      url: res.url,
      time: time + "ms",
      body: repo,
    };
    return [repo.data, returned_res];
  } catch (e) {
    return ["listing-error", e.toString()];
  }
};
