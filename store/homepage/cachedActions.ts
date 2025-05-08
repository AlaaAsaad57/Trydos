"use server";
import { notFound } from "next/navigation";
import { HOME_DATA_CATEGORIES_URL, HOME_DATA_URL } from "utils/endpointConfig";
import {
  CategoriesApi,
  CountriesApi,
  CurrencyApi,
  FilterProductApi,
  GetStoriesApi,
  GlobalDetailsProductApi,
  HomeBoutiqueApi,
  QuantityDetailsProductApi,
} from "models/Api";
export const getCOlorsAndSizes = async () => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_BACKEND_URL + "/web/get-colors-and-sizes",
    {
      cache: "force-cache",
    }
  );
  const data = await response.json();
  return { colors: data.data.colors, sizes: data.data.sizes };
};
export const processStrForSearch = async (str) => {
  if (!str) return null;
  let { colors: colorsData, sizes } = await getCOlorsAndSizes();
  let colors = colorsData.map((s) => ({
    translations: [{ name: s.name }],
    code: s.code,
  }));

  // Convert input to lowercase for case-insensitive matching
  const input = str.toLowerCase().split(" ");
  const result = {
    str: [],
    colors: [] as string[],
    sizes: [] as string[],
  };

  // Process each word
  input.forEach((word) => {
    let matched = false;

    // Check colors
    for (const color of colors) {
      const colorNames = color.translations.map((t) => t.name.toLowerCase());
      if (colorNames.includes(word)) {
        console.log(colorNames);

        result.colors.push(color.code);
        matched = true;
        break;
      }
    }

    // Check sizes
    const sizeMatch = sizes.find((size) => size.toLowerCase() === word);
    if (sizeMatch) {
      console.log(sizeMatch);
      result.sizes.push(sizeMatch);
      matched = true;
    }

    // If word didn't match color or size, add to remaining string
    if (!matched) {
      result.str.push(word);
    }
  });

  // If no matches found, return original string
  if (result.colors.length === 0 && result.sizes.length === 0) {
    return { str };
  }

  // Join remaining words back into string
  return {
    colors:
      result?.colors?.length === 0
        ? null
        : encodeURI(JSON.stringify(result?.colors)),
    sizes:
      result?.sizes?.length === 0
        ? null
        : encodeURI(JSON.stringify(result?.sizes)),
    str: result.str.join(" "),
  };
};

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
          tags: [`home-stories`, "home"],
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
    const repo: GetStoriesApi = await res.json();
    return { data: repo.data.data };
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
export const getCountriesApi = async () => {
  let start = new Date().getTime();
  let repo;
  try {
    repo = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/countries", {
      next: {
        revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_COUNTRIES),
        tags: ["countries"],
      },
    });
  } catch (error) {
    console.log("Countries Request Failed1" + error);
    return [
      {
        id: 219,
        parent_id: 0,
        position: 0,
        iso: "TR",
        name: null,
        nicename: "Turkey",
        iso3: "TUR",
        numcode: 32767,
        phonecode: 90,
        flat_photo_path: null,
        outline_photo_path: null,
        flag_photo_path: null,
        map_photo_path: null,
        status: 1,
        isAccess: 1,
        otp_by_whatsapp: 1,
        otp_by_sms: 0,
        created_at: null,
        updated_at: "2024-07-26T17:47:25.000000Z",
      },
      {
        id: 208,
        parent_id: 0,
        position: 0,
        iso: "SY",
        name: "syr",
        nicename: "Syrian Arab Republic",
        iso3: "SYR",
        numcode: 90,
        phonecode: 963,
        flat_photo_path: null,
        outline_photo_path: null,
        flag_photo_path: null,
        map_photo_path: null,
        status: 1,
        isAccess: 1,
        otp_by_whatsapp: 1,
        otp_by_sms: 0,
        created_at: null,
        updated_at: "2024-11-09T08:56:15.000000Z",
      },
      {
        id: 119,
        parent_id: 0,
        position: 0,
        iso: "LB",
        name: null,
        nicename: "Lebanon",
        iso3: "LBN",
        numcode: null,
        phonecode: 0,
        flat_photo_path: null,
        outline_photo_path: null,
        flag_photo_path: null,
        map_photo_path: null,
        status: 1,
        isAccess: 1,
        otp_by_whatsapp: 1,
        otp_by_sms: 0,
        created_at: null,
        updated_at: "2024-07-26T17:48:12.000000Z",
      },
    ];
  }
  try {
    let end = new Date().getTime();

    let data: CountriesApi = await repo.json();

    return data.data.countries;
  } catch (error) {
    console.log("Countries Request Failed2" + error);
    return [
      {
        id: 219,
        parent_id: 0,
        position: 0,
        iso: "TR",
        name: null,
        nicename: "Turkey",
        iso3: "TUR",
        numcode: 32767,
        phonecode: 90,
        flat_photo_path: null,
        outline_photo_path: null,
        flag_photo_path: null,
        map_photo_path: null,
        status: 1,
        isAccess: 1,
        otp_by_whatsapp: 1,
        otp_by_sms: 0,
        created_at: null,
        updated_at: "2024-07-26T17:47:25.000000Z",
      },
      {
        id: 208,
        parent_id: 0,
        position: 0,
        iso: "SY",
        name: "syr",
        nicename: "Syrian Arab Republic",
        iso3: "SYR",
        numcode: 90,
        phonecode: 963,
        flat_photo_path: null,
        outline_photo_path: null,
        flag_photo_path: null,
        map_photo_path: null,
        status: 1,
        isAccess: 1,
        otp_by_whatsapp: 1,
        otp_by_sms: 0,
        created_at: null,
        updated_at: "2024-11-09T08:56:15.000000Z",
      },
      {
        id: 119,
        parent_id: 0,
        position: 0,
        iso: "LB",
        name: null,
        nicename: "Lebanon",
        iso3: "LBN",
        numcode: null,
        phonecode: 0,
        flat_photo_path: null,
        outline_photo_path: null,
        flag_photo_path: null,
        map_photo_path: null,
        status: 1,
        isAccess: 1,
        otp_by_whatsapp: 1,
        otp_by_sms: 0,
        created_at: null,
        updated_at: "2024-07-26T17:48:12.000000Z",
      },
    ];
  }
};
export const getProductsAndFilters = async ({
  searchParams,
  lang,
  country,
  noProducts,
  noFilters,
  offset,
  boutiqueId,
  filters_offset,
  isFeatured,
}: {
  searchParams: URLSearchParams;
  lang: string;
  country: string;
  noProducts: boolean;
  noFilters: boolean;
  offset: number | boolean;
  boutiqueId?: string;
  filters_offset?: number;
  isFeatured?: boolean;
}) => {
  try {
    let params = configureSearchParams({
      searchParams,
      noProducts,
      noFilters,
      lang,
      offset,
      boutiqueId,
      filters_offset,
    });
    let configured_url = `/api/products/${
      isFeatured ? "featured" : "searchInCatalog"
    }?${params.toString()}`;
    console.log(configured_url, "configured_url");
    let response = await fetch(
      process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL + configured_url,
      {
        method: "GET",
        headers: new Headers({
          lang: lang,
          country: country,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        }),
        next: {
          revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_LISTING),
          tags: ["listing", "search-api"],
        },
      }
    );
    if (response.status !== 200) {
      const errorBody = await response.json();
      throw new Error(
        `Listing Products and Filters Error: ${
          response.status
        } ${JSON.stringify(errorBody.message)}`
      );
    }
    let data: FilterProductApi = await response.json();
    return data;
  } catch (error) {
    console.error(
      `Listing Products and Filters Error: ${error}`,
      searchParams,
      offset
    );
    return {
      data: {
        products: [],
        brands: [],
        attributes: [],
        colors: [],
        categories: [],
        boutiques: [],
        prices: {
          min_price: 0,
          max_price: 0,
          priceRanges: [],
        },
        search_time: "0.00",
        offset: 0,
        total_size: 0,
        limit: 10,
        process_time: "0.00",
      },
    };
  }
};
const configureSearchParams = ({
  searchParams,
  noFilters,
  noProducts,
  lang,
  offset,
  boutiqueId,
  filters_offset,
}): URLSearchParams => {
  let params = new URLSearchParams();
  params.set("lang", lang);
  params.set("limit", "10");
  if (offset) {
    params.set("offset", `[${offset}]`);
  }
  if (noProducts) {
    params.set("with_products", "false");
  }
  if (noFilters) {
    params.set("with_filters", "false");
  }
  if (searchParams.search_text) {
    params.set("search_text", searchParams.search_text);
  }
  if (searchParams.categories) {
    params.set("category_slugs", decodeURIComponent(searchParams.categories));
  }
  if (searchParams.prices) {
    params.set("price", decodeURIComponent(searchParams.prices));
  }
  if (searchParams.sizes) {
    params.set(
      "attributes",
      JSON.stringify([
        {
          id: 1,
          options: JSON.parse(decodeURIComponent(searchParams.sizes)),
          name: "Size",
        },
      ])
    );
  }
  if (searchParams.colors) {
    params.set("colors", decodeURIComponent(searchParams.colors));
  }
  if (searchParams.brands) {
    params.set("brand_slugs", decodeURI(searchParams.brands));
  }
  if (searchParams.boutiques) {
    params.set("boutique_slugs", decodeURI(searchParams.boutiques));
  }
  if (boutiqueId) {
    params.set("boutique_slugs", `["${boutiqueId}"]`);
  }
  if (filters_offset) {
    params.set("filters_offset", `${filters_offset}`);
  }
  // console.log(
  //   `params: ${decodeURIComponent(params.toString())} ${JSON.stringify(
  //     searchParams
  //   )}`
  // );
  return params;
};
export const getCurrency = async ({ lang, country }) => {
  let data = await fetch(
    process.env.NEXT_PUBLIC_BACKEND_URL + "/mobile/home/currency",
    {
      next: {
        revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
      },
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        lang: lang,
        country: country,
      }),
    }
  );
  let currency: CurrencyApi = await data.json();
  return currency.data.currency;
};
