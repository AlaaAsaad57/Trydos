"use server";

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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/globalDetails/${slug}?lang=${language}`,
      {
        method: "GET",
        headers: {
          lang: language,
          country: country,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        next: { tags: ["product-details"] },
      }
    );

    if (!response.ok) {
      throw new Error(`Product Simple Details Error: ${response.status}`);
    }

    return await response.json();
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/qtyPriceDetails/${slug}?lang=${language}`,
      {
        method: "GET",
        headers: {
          lang: language,
          country: country,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        next: { tags: ["product-details"] },
      }
    );

    if (!response.ok) {
      throw new Error(`Product Extended Details Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching product extended details:", error);
    return { data: {} };
  }
}
