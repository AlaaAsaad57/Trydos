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
    // Despite the "likesDetails" path, this endpoint ships the product's
    // notification (notify-me-when-available) settings — that's why its response
    // is held in `notificationsSettings` and only `variation` / notify flags are
    // consumed below. The `is_liked` / `count_of_likes` fields it also returns
    // are IGNORED here (liked state is resolved elsewhere). Shape:
    //   data: {
    //     id,
    //     variation: [{ id, type, variant_notify_for_user }],
    //     is_product_notify_for_user,
    //     is_liked,        // ignored
    //     count_of_likes,  // ignored
    //   }
    // Requires the user token (MARKET-TOKEN → DEVICE-TOKEN) so the notify flags
    // are resolved per user. Migrated from Laravel to the Go backend.
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

  // The notification-settings call runs server-side and fetchServerData swallows
  // failures into `isError`, so a failure here is otherwise silent and hard to
  // trace — capture it to Sentry explicitly with the slug/locale context.
  // (`notificationsSettings` holds the likesDetails/notify response.)
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
