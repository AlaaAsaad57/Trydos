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
    const [simpleDetails, extendedDetails] = await Promise.all([
      fetchProductSimpleDetails(slug, language, country),
      fetchProductExtendedDetails(slug, language, country),
    ]);
    return {
      ...simpleDetails.data,
      ...extendedDetails.data,
      redis: false,
      // time: time,
    };
  } catch (error) {
    console.error("Error fetching product details:", error);
    throw error;
  }
}

export async function fetchProductSimpleDetails(
  slug: string,
  language: string,
  country: string
) {
  try {
    let response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/mobile/product/details_without_similar_related_products/${slug}?lang=${language}`,
      method: "GET",
      tags: ["product-details"],
      revalidate: 0,
      local: `${country}-${language}`,
    });

    if (response.isError) {
      console.error(`Product Simple Details Error: ${response.status}`);
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
      return { data: {} };
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching product simple details:", error);
    return { data: {} };
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
      console.error(`Product Extended Details Error: ${response.status}`);
      reportError(
        new Error(`Product Extended Details Error: ${response.status}`),
        {
          source: "products",
          page: "product-extended-details",
          language: language,
          country: country,
        }
      );
      return { data: {} };
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching product extended details:", error);
    return { data: {} };
  }
}
export async function fetchProductDetailsForMobile(
  slug: string,
  language: string,
  country: string
) {
  let response;
  try {
    response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/mobile/product/details/${slug}?lang=${language}&country=${country}`,
      method: "GET",
      tags: ["product-details"],
      revalidate: 0,
      local: `${country}-${language}`,
    });
    if (response.isError) {
      console.error(`Product Details for Mobile Error: ${response.status}`);
      reportError(
        new Error(`Product Details for Mobile Error: ${response.status}`),
        {
          source: "products",
          page: "product-extended-details",
          language: language,
          country: country,
        }
      );
      return response;
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching product extended details:", error);
    return { data: {} };
  }
}
export async function fetchProductWithoutRelated(
  slug: string,
  language: string,
  country: string,
  Authorization?: string
) {
  let response;
  try {
    if (response) {
      return response;
    }
    response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/mobile/product/details_without_similar_related_products/${slug}?lang=${language}&country=${country}`,
      method: "GET",
      tags: ["product-details"],
      revalidate: 0,
      local: `${country}-${language}`,
      headers: {
        Authorization: Authorization,
        lang: language,
        country: country,
      },
    });

    if (response.isError) {
      console.error(`Product Without Related Error: ${response.status}`);
      reportError(
        new Error(`Product Without Related Error: ${response.status}`),
        {
          source: "products",
          page: "product-extended-details",
          language: language,
          country: country,
        }
      );
      return response;
    }
    return response;
  } catch (error) {
    console.error("Error fetching product extended details:", error);
    return response;
  }
}
