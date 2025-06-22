"use server";
export const getStoriesServer = async () => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  let token = await cookieStore.get("token")?.value;
  let language = await cookieStore.get("language")?.value;
  let country = await cookieStore.get("country")?.value;
  let method = { method: "GET" };

  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_STORIES_BACKEND_URL +
        "/api/v1/stories/users_stories",
      {
        ...method,
        next: {
          revalidate: parseInt(process.env.NEXT_PUBLIC_HOME_REVALIDATE),
          tags: [`stories`],
        },
        headers: new Headers({
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          lang: language || "en",
          country: country || "tr",
        }),
      }
    );
    const repo = await res.json();
    return { data: repo.data.data, next_page_url: repo.data.next_page_url };
  } catch (e) {
    console.log(e);
    return { data: [], error: e };
  }
};

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
