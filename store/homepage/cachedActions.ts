"use server";
import { notFound } from "next/navigation";
import { HOME_DATA_CATEGORIES_URL, HOME_DATA_URL } from "utils/endpointConfig";
import { LogData } from "./actions";
import {
  CategoriesApi,
  CountriesApi,
  FilterProductApi,
  GlobalDetailsProductApi,
  HomeBoutiqueApi,
  QuantityDetailsProductApi,
} from "models/Api";

export const getHomeData = async ({ str, lang }) => {
  const cookies = (await import("next/headers")).cookies;
  const language = lang.split("-")[1];
  const cookieStore = cookies();
  let url =
    HOME_DATA_URL +
    (str?.length
      ? `?category_slugs=["${str}"]&limit=10`
      : "?category_slugs=[]&limit=10");

  let method = { method: "GET" };

  try {
    let start = new Date().getTime();
    const res = await fetch(process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL + url, {
      ...method,
      next: {
        revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
        tags: [
          `home-boutiques home-boutiques-${
            cookieStore.get("lang")?.value ?? "en"
          }`,
        ],
      },
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        lang: await getLang(language, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      credentials: "include",
      mode: "cors",
    });
    const repo: HomeBoutiqueApi = await res.json();

    let end = new Date().getTime();
    let time = end - start;
    let returned_res = {
      type: res.type,
      headers: new Headers({
        lang: await getLang(language, cookieStore.get("language")?.value),
        country: cookieStore.get("country") && cookieStore.get("country").value,
      }),
      url: res.url,
      time: time + "ms",
      response: repo,
      request: "Get boutiques",
    };

    if (process.env.NEXT_PUBLIC_ENABLE_LOG === "true")
      return [repo.data, returned_res];
    else return [repo.data, {}];
  } catch (e) {
    console.log(e);
    return [[], e.toString()];
  }
};

export const getMainCategories = async ({
  lang,
}): Promise<[CategoriesApi["data"]["mainCategories"], any]> => {
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  const language = lang.split("-")[1];
  try {
    let start = new Date().getTime();
    const res = await fetch(
      process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL + HOME_DATA_CATEGORIES_URL,
      {
        next: {
          revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
          tags: [`home-categories-${cookieStore.get("lang")?.value ?? "en"}`],
        },
        headers: new Headers({
          "ssr-req": "true",
          lang: await getLang(language, cookieStore.get("language")?.value),
          country:
            cookieStore.get("country") && cookieStore.get("country").value,
        }),
      }
    );
    const repo: CategoriesApi = await res.json();
    let end = new Date().getTime();
    let time = end - start;
    let returned_res = {
      type: res.type,
      headers: new Headers({
        lang: await getLang(language, cookieStore.get("language")?.value),
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
    return [e.toString(), e.toString()];
  }
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
  let language = lang.split("-")[1];
  let start = new Date().getTime();
  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  if (Object.keys(searchParams).length > 0) {
    let obj: {
      search_text?: string;
      categories?: string;
      prices?: string;
      sizes?: string;
      colors?: string;
      brands?: string;
      offers?: string;
      sizesAttr?: { id: string; name: string };
      boutique_slug?: string;
    } = {};
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

    let str = `/api/products/search?limit=4${
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
    }${filters.prices ? `&price=[${JSON.stringify(obj.prices)}]` : ""}${
      filters.boutique_slug
        ? `&boutique_slugs=${JSON.stringify(categories)}`
        : ""
    }`;

    let productRes = await fetch(
      process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
        str +
        (filters.colors
          ? `&${new URLSearchParams({
              colors: `[${obj?.colors?.split(",").map((s) => `"${s}"`)}]`,
            }).toString()}`
          : ""),
      {
        method: "GET",

        next: {
          revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
        },
        headers: new Headers({
          lang: await getLang(language, cookieStore.get("language")?.value),
          country:
            cookieStore.get("country") && cookieStore.get("country").value,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        }),
      }
    );

    let repo: FilterProductApi = await productRes.json();
    let end = new Date().getTime();
    let time = end - start;
    let returned_res = {
      type: productRes.type,
      headers: new Headers({
        lang: await getLang(language, cookieStore.get("language")?.value),
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
      process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL +
      (productCategory
        ? "/api/products/search?limit=4" +
          `&category=${productCategory}${
            !str.includes("listing")
              ? `&boutique_slugs=${JSON.stringify(str)}`
              : ""
          }`
        : "/api/products/search?limit=4" +
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
    var formBody: any[] | string = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    try {
      const res = await fetch(url, {
        method: "GET",
        cache: "no-cache",

        headers: new Headers({
          lang: await getLang(language, cookieStore.get("language")?.value),
          country:
            cookieStore.get("country") && cookieStore.get("country").value,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        }),
      });
      let end = new Date().getTime();
      let time = end - start;
      const repo: FilterProductApi = await res.json();
      let returned_res = {
        type: res.type,
        headers: new Headers({
          lang: await getLang(language, cookieStore.get("language")?.value),
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
  let language = lang.split("-")[1];
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
          revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
          tags: [`product-data-${productId}`, "listing-data"],
        },
        headers: new Headers({
          lang: await getLang(language, cookieStore.get("language")?.value),
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
    const repo: GlobalDetailsProductApi = await res.json();
    let end1 = new Date().getTime() - start1;
    let start2 = new Date().getTime();
    const res1 = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + QTY_URL + `/${productId}`,
      {
        method: "GET",

        next: {
          revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
          tags: [`product-data-${productId}`, "listing-data"],
        },
        headers: new Headers({
          lang: await getLang(language, cookieStore.get("language")?.value),
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
    const repo1: QuantityDetailsProductApi = await res1.json();
    let end2 = new Date().getTime() - start2;
    let prod = { ...repo.data, ...repo1.data, message: repo1.message };
    if (prod.message === "Product not found") {
      notFound();
    }

    let returned_res = {
      type: res.type,
      headers: new Headers({
        lang: await getLang(language, cookieStore.get("language")?.value),
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
        lang: await getLang(language, cookieStore.get("language")?.value),
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
export async function getProductDataOG({ slug, lang, color }) {
  let language = lang.split("-")[1];
  let DETAILS_URL = "/web/product/globalDetails";

  const cookies = (await import("next/headers")).cookies;
  const cookieStore = cookies();
  let start1 = new Date().getTime();
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + DETAILS_URL + `/${slug}`,
      {
        method: "GET",

        next: {
          revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
          tags: [`product-data-${slug}`, "listing-data"],
        },
        headers: new Headers({
          lang: await getLang(language, cookieStore.get("language")?.value),
          country:
            cookieStore.get("country") && cookieStore.get("country").value,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        }),
      }
    );
    const repo: GlobalDetailsProductApi = await res.json();
    let end1 = new Date().getTime() - start1;

    // let returned_res = {
    //   type: res.type,
    //   headers: new Headers({
    //     lang: await getLang(lang, cookieStore.get("language")?.value),
    //     country: cookieStore.get("country") && cookieStore.get("country").value,
    //   }),
    //   url: res.url,
    //   time: end1 + "ms",
    //   response: repo,
    //   request: "Get Product Global Details For OG Images",
    // };

    let prod = { ...repo.data };

    return prod;
  } catch (e) {
    console.log(e);
  }
  return { name: "product" };
}
export const getCountriesApi = async () => {
  let start = new Date().getTime();
  let repo;
  try {
    repo = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/countries", {
      next: {
        revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
        tags: ["countries"],
      },
    });
  } catch (error) {
    throw new Error("Countries Request Failed" + error);
  }
  try {
    let end = new Date().getTime();
    LogData({ repo, desc: "countries" });
    let data: CountriesApi = await repo.json();

    return data.data.countries;
  } catch (error) {
    throw new Error("Countries Request Failed" + error);
  }
};
