"use server";
import { notFound } from "next/navigation";
import {
  GET_USERS_STORIES,
  HOME_DATA_CATEGORIES_URL,
  HOME_DATA_URL,
} from "utils/endpointConfig";

export const getStories = async ({ lang }) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  try {
    let time = new Date().getTime();
    let [headersObj, headers] = await DataApiHeaders(true);
    const res = await fetch(
      process.env.NEXT_PUBLIC_STORIES_BACKEND_URL + GET_USERS_STORIES,
      {
        next: {
          revalidate: 3600,
          tags: [`stories-${cookieStore.get("lang")?.value ?? lang}`],
        },
        headers: headers,
      }
    );
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
  let url =
    HOME_DATA_URL + (str?.length ? `?slug=${str}&limit=10` : "?limit=10");

  let method = { method: "GET" };

  try {
    let start = new Date().getTime();
    const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + url, {
      ...method,
      next: {
        revalidate: 3600,
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

    let end = new Date().getTime();
    let time = end - start;
    let returned_res = {
      type: res.type,
      headers: new Headers({
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      url: res.url,
      time: time + "ms",
      response: repo,
      request: "Get boutiques",
    };

    if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
      return [repo.data.boutiques, returned_res];
    else return [repo.data.boutiques, {}];
  } catch (e) {
    console.log(e);
    return [[], e.toString()];
  }
};

export const getHomeDataStatic = async () => {
  let url = HOME_DATA_URL;

  let method = { method: "GET" };

  const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + url, {
    ...method,
    next: {
      revalidate: 3600,
      tags: [`home-boutiques home-boutiques`],
    },

    credentials: "include",
    mode: "cors",
  });
  const repo = await res.json();

  return repo.data.boutiques;
};

export const getMainCategories = async ({ lang }) => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  try {
    let start = new Date().getTime();
    const res = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + HOME_DATA_CATEGORIES_URL,
      {
        next: {
          revalidate: 3600,
          tags: [`home-categories-${cookieStore.get("lang")?.value ?? "en"}`],
        },
        headers: new Headers({
          "ssr-req": "true",
          lang: await getLang(lang, cookieStore.get("language")?.value),
          country:
            cookieStore.get("country") && cookieStore.get("country").value,
        }),
      }
    );
    const repo = await res.json();
    let end = new Date().getTime();
    let time = end - start;
    let returned_res = {
      type: res.type,
      headers: new Headers({
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      url: res.url,
      time: time + "ms",
      response: repo,
      request: "Get Categories Navbar",
    };

    if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
      return [repo.data.mainCategories, returned_res];
    else return [repo.data.mainCategories, {}];
  } catch (e) {
    return ["homedata-error", e.toString()];
  }
};
export const getMainCategoriesStatic = async () => {
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + HOME_DATA_CATEGORIES_URL
    );
    const repo = await res.json();

    return [repo.data.mainCategories];
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
  let start = new Date().getTime();
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

      lang: lang,
    };
    if (!categories.includes("listing")) {
      filters = {
        ...filters,
        boutique_slug: categories,
      };
    }

    let str = `/web/products?limit=4&offset=1${
      obj.categories?.length > 0
        ? `&category_slugs=${JSON.stringify(
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
          revalidate: 3600,
          tags: [`listing-data-${str}`, "listing-data"],
        },
        headers: new Headers({
          "ssr-req": "true",
          lang: await getLang(lang, cookieStore.get("language")?.value),
          country:
            cookieStore.get("country") && cookieStore.get("country").value,
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
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      url: productRes.url,
      time: time + "ms",
      response: repo,
      request: "Get Products with Filters",
    };

    if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
      return [
        {
          body: repo,
        },
        returned_res,
      ];
    else
      return [
        {
          body: repo,
        },
        {},
      ];
  } else {
    let str = categories;

    let url =
      process.env.NEXT_PUBLIC_BACKEND_URL +
      (productCategory
        ? "/web/products?limit=4&offset=1" +
          `&category=${productCategory}${
            !str.includes("listing")
              ? `&boutique_slugs=${JSON.stringify(str)}`
              : ""
          }`
        : "/web/products?limit=4&offset=1" +
          `${
            !str.includes("listing")
              ? `&boutique_slugs=${JSON.stringify(str)}`
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
    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    try {
      const res = await fetch(url, {
        method: "GET",

        next: {
          revalidate: 3600,
          tags: [`listing-data-${str}`, "listing-data"],
        },
        headers: new Headers({
          "ssr-req": "true",
          lang: await getLang(lang, cookieStore.get("language")?.value),
          country:
            cookieStore.get("country") && cookieStore.get("country").value,
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
          lang: await getLang(lang, cookieStore.get("language")?.value),
          country:
            cookieStore.get("country") && cookieStore.get("country").value,
        }),
        url: res.url,
        time: time + "ms",
        response: repo,
        request: "Get Products with Filters ",
      };

      if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
        return [
          {
            body: repo,
          },
          returned_res,
        ];
      else
        return [
          {
            body: repo,
          },
          {},
        ];
    } catch (e) {
      return ["listing-error", e.toString()];
    }
  }
};

export async function getProductDetails({ productId, lang }) {
  let start1 = new Date().getTime();
  let DETAILS_URL = "/web/product/globalDetails";
  let QTY_URL = "/web/product/qtyPriceDetails";
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + DETAILS_URL + `/${productId}`,
      {
        method: "GET",

        next: {
          revalidate: 3600,
          tags: [`product-data-${productId}`, "listing-data"],
        },
        headers: new Headers({
          lang: await getLang(lang, cookieStore.get("language")?.value),
          country:
            cookieStore.get("country") && cookieStore.get("country").value,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Authorization: `Bearer ${
            cookieStore.get("market-token")?.value ||
            cookieStore.get("DEVICE-TOKEN")?.value
          }`,
        }),
      }
    );
    const repo = await res.json();
    let end1 = new Date().getTime() - start1;
    let start2 = new Date().getTime();
    const res1 = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + QTY_URL + `/${productId}`,
      {
        method: "GET",

        next: {
          revalidate: 3600,
          tags: [`product-data-${productId}`, "listing-data"],
        },
        headers: new Headers({
          lang: await getLang(lang, cookieStore.get("language")?.value),
          country:
            cookieStore.get("country") && cookieStore.get("country").value,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Authorization: `Bearer ${
            cookieStore.get("market-token")?.value ||
            cookieStore.get("DEVICE-TOKEN")?.value
          }`,
        }),
      }
    );
    const repo1 = await res1.json();
    let end2 = new Date().getTime() - start2;
    let prod = { ...repo.data, ...repo1.data };

    if (prod.message === "Product not found") {
      notFound();
    }
    let returned_res = {
      type: res.type,
      headers: new Headers({
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      url: res.url,
      time: end1 + "ms",
      response: repo,
      request: "Get Product Global Details",
    };
    let returned_res1 = {
      type: res1.type,
      headers: new Headers({
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      url: res1.url,
      time: end2 + "ms",
      response: repo1,
      request: "Get Product quantity prices Details",
    };

    if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
      return [prod, [returned_res, returned_res1]];
    else return [prod, [{}, {}]];
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
  let start1 = new Date().getTime();
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + DETAILS_URL + `/${slug}`,
      {
        method: "GET",

        next: {
          revalidate: 3600,
          tags: [`product-data-${slug}`, "listing-data"],
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
    const repo = await res.json();
    let end1 = new Date().getTime() - start1;
    let start2 = new Date().getTime();
    const res1 = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + QTY_URL + `/${slug}`,
      {
        method: "GET",

        next: {
          revalidate: 3600,
          tags: [`product-data-${slug}`, "listing-data"],
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
    const repo1 = await res1.json();
    let end2 = new Date().getTime() - start2;
    let returned_res = {
      type: res.type,
      headers: new Headers({
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      url: res.url,
      time: end1 + "ms",
      response: repo,
      request: "Get Product Global Details For OG Images",
    };
    let returned_res1 = {
      type: res1.type,
      headers: new Headers({
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      url: res1.url,
      time: end2 + "ms",
      response: repo1,
      request: "Get Product quantity prices Details for OG Image",
    };
    let prod = { ...repo.data, ...repo1.data };

    return prod;
  } catch (e) {
    console.log(e);
  }
  return { name: "product" };
}
export const getCountriesApi = async () => {
  let start = new Date().getTime();
  let repo = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/countries", {
    next: {
      revalidate: 60000,
      tags: ["countries"],
    },
  });
  let end = new Date().getTime();

  let data = await repo.json();

  return data.data.countries;
};

export const FetchApi = async ({ url, method, body, lang, country }) => {
  // let cacheVar;
  // if (url.includes("cart")) {
  //   cacheVar = {
  //     cache: "no-cache",
  //   };
  // } else {
  //   cacheVar = {
  //     next: {
  //       revalidate: 3600,
  //     },
  //   };
  // }
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  let start = new Date().getTime();
  let response = await fetch(url, {
    method: method,

    next: {
      revalidate: 36000,
    },
    body: body,
    headers: new Headers({
      "ssr-req": "true",
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
  let end = new Date().getTime() - start;
  let returned_res = {
    url,
    method,
    body,
    response: data,
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
    time: `${end}ms`,
  };

  if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
    return [data, returned_res];
  else return [data, {}];
};

export const getListingDataProd = async () => {
  let str = `/web/products?limit=1000&offset=1`;
  let res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + str, {
    method: "GET",

    next: {
      revalidate: 3600,
      tags: [`listing-data-${str}`, "listing-data"],
    },
  });
  let repo = await res.json();
  return repo;
};
export const getHomeDataOffset = async ({ str, lang, offset }) => {
  const cookies = (await import("next/headers")).cookies;

  const cookieStore = cookies();
  let url =
    HOME_DATA_URL +
    (str?.length
      ? `?slug=${str}&limit=10&offset=${offset}`
      : `?limit=10&offset=${offset}`);

  let method = { method: "GET" };

  try {
    let start = new Date().getTime();
    const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + url, {
      ...method,
      next: {
        revalidate: 3600,
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

    let end = new Date().getTime();
    let time = end - start;
    let returned_res = {
      type: res.type,
      headers: new Headers({
        lang: await getLang(lang, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      url: res.url,
      time: time + "ms",
      response: repo,
      request: "Get boutiques",
    };

    if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
      return [repo.data.boutiques, returned_res];
    else return [repo.data.boutiques, {}];
  } catch (e) {
    console.log(e);
    return [[], e.toString()];
  }
};
