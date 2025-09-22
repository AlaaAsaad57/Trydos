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
    console.log(`Product Simple Details Error`, error);
    throw error;
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
    console.log(`Product Extended Details  Error`, error);
    throw error;
  }
}
