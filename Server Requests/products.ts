"use server";

import { reportError } from "utils/error-reporter";
import { fetchServerData } from "./ServerFetch";

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

async function fetchProductSimpleDetails(
  slug: string,
  language: string,
  country: string
) {
  try {
    const response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/globalDetails/${slug}?lang=${language}`,
      method: "GET",
      tags: ["product-details"],
      revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_PRODUCT_DETAILS),
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

async function fetchProductExtendedDetails(
  slug: string,
  language: string,
  country: string
) {
  try {
    const response = await fetchServerData({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/qtyPriceDetails/${slug}?lang=${language}`,
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
