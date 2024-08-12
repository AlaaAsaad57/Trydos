"use server";
import { notFound } from "next/navigation";
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
        revalidate: 60,
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
  let url = HOME_DATA_URL + (str?.length ? `?slug=${str}` : "");

  let method = { method: "GET" };
  console.log(url);
  try {
    let time = new Date().getTime();
    const res = await fetch(OTP_URL + url, {
      ...method,
      next: {
        revalidate: 60,
        tags: [
          `home-boutiques home-boutiques-${
            cookieStore.get("lang")?.value ?? "en"
          }`,
        ],
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
    console.log(e);
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
        revalidate: 60,
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
export const getListingData = async ({
  categories,
  lang,
  productCategory,
  searchParams,
}) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  if (Object.keys(searchParams).length > 0) {
    let obj = {};
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
      boutique_slug: categories,
      lang: lang.split("-")[1],
    };
    let str = `/web/products/with_filter?${
      obj.categories
        ? `category_slugs=${JSON.stringify(
            obj.categories.split(",").map((s) => s)
          )}`
        : ""
    }${
      obj.brands?.length > 0
        ? `&brand_slugs=${JSON.stringify(obj.brands.split(",").map((s) => s))}`
        : ""
    }${
      obj.sizes
        ? `&attributes={id:${obj.sizesAttr.id},name:${
            obj.sizesAttr.name
          },options:${JSON.stringify(obj.sizes.split(","))}}`
        : ""
    }${
      obj.search_text?.length > 0
        ? `${`&search_text=${obj.search_text || ""}`}`
        : ""
    }${
      filters.prices !== null ? `&prices=[${JSON.stringify(obj.prices)}]` : ""
    }&boutique_slugs=${JSON.stringify(categories)}`;

    let productRes = await fetch(
      OTP_URL +
        str +
        `&${new URLSearchParams({
          colors: `[${obj?.colors?.split(",").map((s) => `"${s}"`)}]`,
        }).toString()}`,
      {
        method: "GET",

        next: {
          revalidate: 60,
          tags: [`listing-data-${str}`, "listing-data"],
        },
        headers: new Headers({
          lang: await getLang(lang, cookieStore.get("language")?.value),
          country:
            cookieStore.get("country") && cookieStore.get("country").value,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        }),
      }
    );
    let repo = await productRes.json();

    return [
      [],
      {
        body: repo,
      },
    ];
  } else {
    let str = categories;
    let url =
      OTP_URL +
      (productCategory
        ? "/web/products/with_filter" +
          `?category=${productCategory}&boutique_slugs=${JSON.stringify(str)}`
        : "/web/products/with_filter" +
          `?boutique_slugs=${JSON.stringify([str])}`);
    var details = productCategory
      ? {
          boutique_slug: [str],
          category: productCategory,
        }
      : {
          boutique_slug: [str],
        };
    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    try {
      let time = new Date().getTime();
      const res = await fetch(url, {
        method: "GET",

        next: {
          revalidate: 60,
          tags: [`listing-data-${str}`, "listing-data"],
        },
        headers: new Headers({
          lang: await getLang(lang, cookieStore.get("language")?.value),
          country:
            cookieStore.get("country") && cookieStore.get("country").value,
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
          country:
            cookieStore.get("country") && cookieStore.get("country").value,
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
  }
};

export async function getProductDetails({ productId, lang }) {
  let DETAILS_URL = "/web/product/globalDetails";
  let QTY_URL = "/web/product/qtyPriceDetails";
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  try {
    const res = await fetch(OTP_URL + DETAILS_URL + `/${productId}`, {
      method: "GET",

      next: {
        revalidate: 60,
        tags: [`product-data-${productId}`, "listing-data"],
      },
      headers: new Headers({
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      }),
    });
    const repo = await res.json();
    const res1 = await fetch(OTP_URL + QTY_URL + `/${productId}`, {
      method: "GET",

      next: {
        revalidate: 60,
        tags: [`product-data-${productId}`, "listing-data"],
      },
      headers: new Headers({
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      }),
    });
    const repo1 = await res1.json();

    let prod = { ...repo.data, ...repo1.data };

    if (prod.message === "Product not found") {
      notFound();
    }
    return prod;
  } catch (e) {
    console.log(e);
    notFound();
  }
}
export async function getProductDataOG({ slug, lang }) {
  let DETAILS_URL = "/web/product/globalDetails";
  let QTY_URL = "/web/product/qtyPriceDetails";

  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  try {
    const res = await fetch(OTP_URL + DETAILS_URL + `/${slug}`, {
      method: "GET",

      next: {
        revalidate: 60,
        tags: [`product-data-${slug}`, "listing-data"],
      },
      headers: new Headers({
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      }),
    });
    const repo = await res.json();
    const res1 = await fetch(OTP_URL + QTY_URL + `/${slug}`, {
      method: "GET",

      next: {
        revalidate: 60,
        tags: [`product-data-${slug}`, "listing-data"],
      },
      headers: new Headers({
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      }),
    });
    const repo1 = await res1.json();

    let prod = { ...repo.data, ...repo1.data };

    return prod;
  } catch (e) {
    console.log(e);
  }
}
export const getCountriesApi = async () => {
  let repo = await fetch(OTP_URL + "/countries");
  let data = await repo.json();
  return data.data.countries;
};

export const FetchApi = async ({ url, method, body, lang, country }) => {
  let cacheVar;
  if (url.includes("cart")) {
    cacheVar = {
      cache: "no-cache",
    };
  } else {
    cacheVar = {
      next: {
        revalidate: 60,
      },
    };
  }
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  let response = await fetch(url, {
    method: method,

    ...{ cacheVar },

    body: body,
    headers: new Headers({
      lang: await getLang(lang, cookieStore.get("language")?.value),
      country: await getCountry(
        country,
        cookieStore.get("country") && cookieStore.get("country").value
      ),
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Authorization: `Bearer ${
        cookieStore.get("market-token")?.value ??
        cookieStore.get("DEVICE-TOKEN")?.value
      }`,
    }),
  });

  let data = await response.json();
  return data;
};
export const getCurrency = async ({ lang, country }) => {
  let currency = await FetchApi({
    url: OTP_URL + "/mobile/home/currency",
    body: null,
    method: "GET",
    lang: lang,
    country: country,
  });

  return currency.data.currency;
};
