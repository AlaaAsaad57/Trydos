export const runtime = "nodejs";
import { reportError } from "utils/error-reporter";
import { fetchServerData } from "./ServerFetch";
// import { getProductFromCache, storeProduct } from "./radis";
interface ProductDetailsResponse {
  [key: string]: any;
}
export async function fetchProductDetails(
  slug: string,
  language: string,
  country: string
): Promise<ProductDetailsResponse> {
  try {
    // let productCache = await getProductFromCache(slug, language, country);
    // let time = productCache.timeMs;
    // console.log(time);
    // if (productCache?.product?.id) {
    //   return { ...productCache, redis: true, time: time };
    // }
    const [generalDetails, extendedDetails] = await Promise.all([
      fetchProductGeneralDetails(slug, language, country),
      fetchProductExtendedDetails(slug, language, country),
    ]);
    return {
      ...extendedDetails.data,
      ...generalDetails.data,
      redis: false,
      // time: time,
    };
  } catch (error) {
    console.error("Error fetching product details:", error);
    throw error;
  }
}

export async function fetchProductGeneralDetails(
  slug: string,
  language: string,
  country: string
) {
  try {
    let response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/mobile/product/details/${slug}?lang=${language}`,
      method: "GET",
      tags: ["product-details"],
      revalidate: 0,
      local: `${country}-${language}`,
    });

    if (response.isError) {
      reportError(
        new Error(`Product Simple Details Error: ${response.status}`),
        {
          source: "products",
          page: "product-simple-details",
          language: language,
          country: country,
          response: JSON.stringify(response),
        }
      );
      throw response.error;
    }

    return response.data;
  } catch (error) {
    return { details_req: true };
  }
}
export async function fetchProductExtendedDetails(
  slug: string,
  language: string,
  country: string
) {
  try {
    let response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/qtyPriceDetails/${slug}?lang=${language}&country=${country}`,
      method: "GET",
      tags: ["product-details"],
      revalidate: 0,
      local: `${country}-${language}`,
    });

    if (response.isError) {
      reportError(
        new Error(`Product Extended Details Error: ${response.status}`),
        {
          source: "products",
          page: "product-extended-details",
          language: language,
          country: country,
        }
      );
      throw response.error;
    }
    return response.data;
  } catch (error) {
    return { qtyPriceDetails: true };
  }
}
