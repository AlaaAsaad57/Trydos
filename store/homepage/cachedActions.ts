"use server";

export const changeAppLanguageServer = async (language) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  cookieStore.set("language", language);
  cookieStore.set("lang", language);
};
export const changeToken = async ({
  key,
  value,
  deleteOption,
}: {
  key: string;
  value?: string;
  deleteOption?: boolean;
}) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  if (deleteOption) {
    cookieStore.delete(key);
  } else
    cookieStore.set(key, value, {
      sameSite: true,
      value: value,
      path: "/",
      maxAge: 360 * 7 * 24 * 60 * 60,
      priority: "high",
    });
};

export const changeAppCountryServer = async (value) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  cookieStore.set("country", value);
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
export const getCountry = (country, cookieCountry) => {
  if (country) return country;
  else if (cookieCountry) {
    return cookieCountry;
  } else {
    return null;
  }
};
