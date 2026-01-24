"use server";
import { LogServerError } from "utils/serverErrorReporter";
import { fetchServerData } from "./ServerFetch";
import { ReportError } from "utils/errorReported";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { cookies } from "next/headers";
// import { getProductFromCache, storeProduct } from "./radis";
interface ProductDetailsResponse {
  [key: string]: any;
}
export async function fetchProductDetails(
  slug: string,
  language: string,
  country: string,
): Promise<ProductDetailsResponse> {
  try {
    let [generalDetails, extendedDetails] = await Promise.all([
      fetchProductGeneralDetails(slug, language, country),
      fetchProductExtendedDetails(slug, language, country),
    ]);
    return {
      ...extendedDetails.data,
      ...generalDetails.data,
      redis: false,
    };
  } catch (error) {
    LogServerError({
      slug,
      language,
      country,
      error: error,
      scenario: "Error In fetchProductDetails in serverRequest/products",
    });
    throw error;
  }
}

async function fetchProductGeneralDetails(
  slug: string,
  language: string,
  country: string,
) {
  try {
    let response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/mobile/product/details/${slug}?lang=${language}`,
      method: "GET",
      revalidate: 0,
      local: `${country}-${language}`,
    });

    if (response.isError) {
      LogServerError(
        {
          request: `/mobile/product/details/${slug}?lang=${language} || ${response.status}`,
          message: JSON.stringify(response),
          language,
          country,
        },
        `/mobile/product/details/${slug}?lang=${language}`,
      );
      ReportError(
        new Error(`Product Simple Details Error: ${response.status}`),
        {
          source: "products",
          page: "product-simple-details",
          language,
          country,
          response: JSON.stringify(response),
        },
      );
      throw response.error;
    }

    return response.data;
  } catch (error) {
    LogServerError({
      slug,
      language,
      country,
      error: error,
      scenario: "Error In fetchProductGeneralDetails in serverRequest/products",
    });
    throw error;
  }
}
export async function fetchProductExtendedDetails(
  slug: string,
  language: string,
  country: string,
) {
  try {
    let response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/qtyPriceDetails/${slug}?lang=${language}&country=${country}`,
      method: "GET",
      revalidate: 0,
      local: `${country}-${language}`,
    });

    if (response.isError) {
      LogServerError(
        {
          request: `/web/product/qtyPriceDetails/${slug}?lang=${language}&country=${country} || ${response.status}`,
          message: JSON.stringify(response),
          language,
          country,
        },
        `/web/product/qtyPriceDetails/${slug}?lang=${language}&country=${country}`,
      );
      ReportError(
        new Error(`Product Extended Details Error: ${response.status}`),
        {
          source: "products",
          page: "product-extended-details",
          language,
          country,
        },
      );
      throw response.error;
    }
    return response.data;
  } catch (error) {
    LogServerError({
      slug,
      language,
      country,
      error: error,
      scenario:
        "Error In fetchProductExtendedDetails in serverRequest/products",
    });
    throw error;
  }
}

export async function getProductDataForAddToCart({ language, country, slug }) {
  let cookiesStore = await cookies();
  let token =
    cookiesStore.get(COOKIE_NAMES.MARKET_TOKEN)?.value ||
    cookiesStore.get(COOKIE_NAMES.DEVICE_TOKEN)?.value ||
    "";
  let [globalData, pricesData, notificationsSettings] = await Promise.all([
    fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/globalDetails/${slug}`,
      method: "GET",
      headers: {
        language: language,
        lang: language,
        country: country,
      },
    }),
    fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/qtyPriceDetails/${slug}`,
      method: "GET",
      headers: {
        language: language,
        lang: language,
        country: country,
      },
    }),
    fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/likesDetails/${slug}`,
      headers: {
        Authorization: `Bearer ${token}`,
        language: language,
        lang: language,
        country: country,
      },
    }),
  ]);

  let variants_arr = pricesData.data.data.variation;
  let newVariants = notificationsSettings?.data?.data?.variation?.map(
    (item) => {
      let d = variants_arr.find((s) => s.type === item.type);
      if (d)
        return {
          ...item,
          ...d,
        };
      else {
        return item;
      }
    },
  );

  return {
    ...globalData.data?.data,
    ...pricesData.data?.data,
    variation: newVariants,
  };
}
