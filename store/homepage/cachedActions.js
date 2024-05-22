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
  let url = !str ? HOME_DATA_URL : HOME_DATA_URL + `ByCategory`;
  var details = {
    slug: str,
  };

  var formBody = [];
  for (var property in details) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  formBody = formBody.join("&");
  console.log(formBody);
  let method = str ? { method: "POST", body: formBody } : { method: "GET" };

  try {
    let time = new Date().getTime();
    const res = await fetch(OTP_URL + url, {
      ...method,
      next: {
        revalidate: 3600,
        tags: [`home-boutiques-${cookieStore.get("lang")?.value ?? "en"}`],
      },
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        lang: await getLang(lang, cookieStore.get("language")?.value),
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
        lang: await getLang(lang, cookieStore.get("language")?.value),
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
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
    });
    const repo = await res.json();
    time = new Date().getTime() - time;
    let returned_res = {
      type: res.type,
      headers: new Headers({
        lang: await getLang(lang, cookieStore.get("language")?.value),
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
    lang: await getLang(lang, cookieStore.get("language")?.value),
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
  let str = categories;
  var details = {
    boutique_slug: str,
  };
  var formBody = [];
  for (var property in details) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  formBody = formBody.join("&");
  console.log(formBody);
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();

  try {
    let time = new Date().getTime();
    const res = await fetch(OTP_URL + LISTING_INFO_URL, {
      method: "POST",
      body: formBody,
      next: {
        revalidate: 3600,
        tags: [`listing-data-${str}`, "listing-data"],
      },
      headers: new Headers({
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      }),
    });
    const repo = await res.json();
    time = new Date().getTime() - time;
    let returned_res = {
      type: res.type,
      headers: new Headers({
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      url: res.url,
      time: time + "ms",
      body: repo,
      reqBody: formBody,
    };

    return [repo.data, returned_res];
  } catch (e) {
    return ["listing-error", e.toString()];
  }
};
