"use server";
import { reportError } from "utils/error-reporter";
import { fetchServerData } from "./ServerFetch";
import { getRedis, setRedis } from "./radis";
interface ProductDetailsResponse {
  [key: string]: any;
}
export async function fetchProductDetails(
  slug: string,
  language: string,
  country: string
): Promise<ProductDetailsResponse> {
  try {
    const [simpleDetails, extendedDetails] = await Promise.all([
      fetchProductSimpleDetails(slug, language, country),
      fetchProductExtendedDetails(slug, language, country),
    ]);

    return {
      ...simpleDetails.data,
      ...extendedDetails.data,
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
    let response = await getRedis(
      `/web/product/globalDetails/${slug}?lang=${language}&country=${country}`
    );
    if (response?.data) {
      return response?.data;
    }
    response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/globalDetails/${slug}?lang=${language}`,
      method: "GET",
      tags: ["product-details"],
      revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_PRODUCT_DETAILS),
      local: `${country}-${language}`,
    });
    console.log(response, "1");
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
    setRedis(
      `/web/product/globalDetails/${slug}?lang=${language}&country=${country}`,
      response
    );
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
    let response = await getRedis(
      `/web/product/qtyPriceDetails/${slug}?lang=${language}&country=${country}`
    );
    if (response?.data) {
      return response.data;
    }

    response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/qtyPriceDetails/${slug}?lang=${language}&country=${country}`,
      method: "GET",
      tags: ["product-details"],
      revalidate: 0,
      local: `${country}-${language}`,
    });
    console.log(response, "2");

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
    setRedis(
      `/web/product/qtyPriceDetails/${slug}?lang=${language}&country=${country}`,
      response
    );
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
    response = await getRedis(
      `/mobile/product/details/${slug}?lang=${language}&country=${country}`
    );
    if (response) {
      return response;
    }

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
    setRedis(
      `/mobile/product/details/${slug}?lang=${language}&country=${country}`,
      response
    );
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
    response = await getRedis(
      `/mobile/product/details_without_similar_related_products/${slug}?lang=${language}&country=${country}`
    );
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
    setRedis(
      `/mobile/product/details_without_similar_related_products/${slug}?lang=${language}&country=${country}`,
      response
    );
    return response;
  } catch (error) {
    console.error("Error fetching product extended details:", error);
    return response;
  }
}
