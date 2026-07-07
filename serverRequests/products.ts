"use server";
import { LogServerError } from "utils/serverErrorReporter";
import { fetchServerData } from "./ServerFetch";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { cookies } from "next/headers";
// import { getProductFromCache, storeProduct } from "./radis";

interface ProductData {
  id: number;
  name: string;
  slug: string;
  share_link: string;
  details: string;
  images: Array<string>;
  videos: Array<any>;
  categories: Array<{
    id: number;
    name: string;
    position: number;
    icon: string;
  }>;
  brand: {
    id: number;
    slug: string;
    name: string;
    icon: string;
  };
  label_names: any;
  flash_deal_end_date: any;
  colors: Array<{
    name: string;
    code: string;
    option: string;
  }>;
  sync_color_images: Array<{
    color_name: string;
    color_option: string;
    color_code: string;
    images: Array<string | { file_path?: string }>;
    color_trend: boolean;
  }>;
  choice_options?: Array<{
    name?: string;
    title?: string;
    options: Array<{
      option?: string;
      name?: string;
    }>;
  }>;
  flash_deal_max_allowed_quantity: any;
  shipping_days: number;
  is_featured: boolean;
  description: any;
  model: any;
  variations: Array<{
    id: string;
    size: string;
    color: {
      name: string;
      code: string;
    };
    type: string;
    price: number;
    offer_price: number;
    luck_price: number;
    sku: string;
    qty: number;
    product_variation_id?: string;
    variation_id?: string;
  }>;
  sizes: Array<string>;
  max_allowed_qty: string;
  shipping_cost_multiply_with_quantity: boolean;
  shipping_cost: number;
  price: number;
  is_luck: boolean;
  luck_price: number;
  offer_price: number;
  offer_type: string;
  unit_price: number;
  seller_id: number;
  seller: {
    name: any;
    f_name: string;
    l_name: string;
    email: string;
    gender: any;
    birthdate: string;
    review: number;
    image: string;
  };
  shop: {
    image: string;
    name: string;
  };
  owner_type: string;
  owner_id: number;
  has_whole_sale: boolean;
  whole_sale_link: any;
  views_count: number;
  descriptors: Array<any>;
  is_country_restricted: boolean;
  is_active: boolean;
  packed_after_ordering: number;
  available_quantity: number;
  variation: Array<{
    variant_notify_for_user: boolean;
    type: string;
    id: string;
    size: string;
    color: {
      name: string;
      code: string;
    };
    price: number;
    offer_price: number;
    luck_price: number;
    sku: string;
    qty: number;
    product_variation_id?: string;
    variation_id?: string;
    notify_for_user?: boolean;
  }>;
}

export async function fetchProductDetails(
  slug: string,
  language: string,
  country: string,
): Promise<ProductData> {
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
      url: `${process.env.NEXT_PUBLIC_GO_BACKEND_URL}/web/product/qtyPriceDetails/${slug}?lang=${language}&country=${country}`,
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

export async function getProductDataForAddToCart({
  language,
  country,
  slug,
}): Promise<ProductData> {
  let cookiesStore = await cookies();
  let token =
    cookiesStore.get(COOKIE_NAMES.MARKET_TOKEN)?.value ||
    cookiesStore.get(COOKIE_NAMES.DEVICE_TOKEN)?.value ||
    "";
  let [globalData, pricesData, notificationsSettings] = await Promise.all([
    fetchServerData({
      url: `${process.env.NEXT_PUBLIC_GO_BACKEND_URL}/web/product/globalDetails/${slug}`,
      method: "GET",
      headers: {
        language: language,
        lang: language,
        country: country,
      },
    }),
    fetchServerData({
      url: `${process.env.NEXT_PUBLIC_GO_BACKEND_URL}/web/product/qtyPriceDetails/${slug}`,
      method: "GET",
      headers: {
        language: language,
        lang: language,
        country: country,
      },
    }),
    fetchServerData({
      // url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/web/product/likesDetails/${slug}`,
      url: `${process.env.NEXT_PUBLIC_GO_BACKEND_URL}/web/product/likesDetails/${slug}`,
      headers: {
        Authorization: `Bearer ${token}`,
        language: language,
        lang: language,
        country: country,
      },
    }),
  ]);

  // likesDetails was migrated to the Go service. It runs server-side and
  // fetchServerData swallows failures into `isError`, so a failure here is
  // otherwise silent and hard to trace — capture it to Sentry explicitly with
  // the slug/locale context. (`notificationsSettings` holds the likesDetails
  // response.)
  if (notificationsSettings?.isError) {
    LogServerError({
      scenario: "likesDetails go service failed in getProductDataForAddToCart",
      slug,
      language,
      country,
      status: notificationsSettings?.status,
      error: notificationsSettings?.error,
      url: notificationsSettings?.url,
    });
  }

  const variants_arr = Array.isArray(pricesData?.data?.data?.variations)
    ? pricesData.data.data.variations
    : Array.isArray(pricesData?.data?.data?.variation)
      ? pricesData.data.data.variation
      : [];

  const notifyVariants = Array.isArray(
    notificationsSettings?.data?.data?.variation,
  )
    ? notificationsSettings.data.data.variation
    : [];

  const newVariants = notifyVariants.length
    ? notifyVariants.map((item) => {
        let d = variants_arr.find(
          (s) =>
            (s.product_variation_id ?? s.id) ===
            (item.product_variation_id ?? item.id),
        );
        if (d)
          return {
            ...item,
            ...d,
          };
        return item;
      })
    : variants_arr;

  return {
    ...globalData.data?.data,
    ...pricesData.data?.data,
    variation: newVariants,
  };
}
