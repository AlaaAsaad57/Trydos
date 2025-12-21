"use server";

import { api } from "lib/eden";
import { getCookieServer } from "utils/cookies/cookie-manager";
import ProductWrapper from "components/ServerWrapper/ProductWrapper";
import { getCurrency } from "./currency";
import BoutiqueWrapper from "components/ServerWrapper/BoutiqueWrapper";
export async function GetNextRecommendations({
  language,
  country,
  offset,
  userId,
  limit,
}) {
  let currency = await getCurrency(country, language);
  let response: any = await api.products.recomended.get({
    headers: { language, country },
    query: {
      offset: offset,
      user_id: userId,
      limit: limit,
    },
  });

  const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
  let productsData = response.data.data.products.map((product) => {
    if (product?.is_redeem) {
      return {
        name: product?.name,
        slug: product?.slug,
        label_names: product?.label_names,
        category_tree: product?.category_tree,
        videos: product.videos,
        colors: product?.colors,
        sync_color_images: product?.sync_color_images,
        ...(!product?.sync_color_images ||
        product?.sync_color_images?.length === 0
          ? { images: product.images }
          : {}),
        price: product.price,
        offer_price: product.offer_price,
        redeem_price: product.redeem_price,
        categories: product?.categories?.map((s) => ({
          name: s.name,
          id: s.id,
        })),
        brand: {
          id: product?.brand?.id,
          icon: product?.brand?.icon,
          is_verified: product?.brand?.is_verified,
        },
        flash_deal_end_date: product.flash_deal_end_date,
        flash_deal_price: product.flash_deal_price,
        product_id: product.product_id,
        is_redeem: !redeemed_ids.find((s) => s.id === product.product_id),
      };
    } else
      return {
        name: product?.name,
        slug: product?.slug,
        label_names: product?.label_names,
        category_tree: product?.category_tree,
        videos: product.videos,
        colors: product?.colors,
        sync_color_images: product?.sync_color_images,
        ...(!product?.sync_color_images ||
        product?.sync_color_images?.length === 0
          ? { images: product.images }
          : {}),
        price: product.price,
        offer_price: product.offer_price,
        redeem_price: product.redeem_price,
        categories: product?.categories?.map((s) => ({
          name: s.name,
          id: s.id,
        })),
        brand: {
          id: product?.brand?.id,
          icon: product?.brand?.icon,
          is_verified: product?.brand?.is_verified,
        },
        flash_deal_end_date: product.flash_deal_end_date,
        flash_deal_price: product.flash_deal_price,
        product_id: product.product_id,
      };
  });
  let newOffset = response?.data?.data?.offset;
  let items = productsData?.map((product) => (
    <ProductWrapper
      category_tree={product?.categories?.map((s) => s.name)}
      labels={product?.label_names}
      color={product?.sync_color_images?.[0]?.color_name}
      InitialProductData={{ ...product, id: product?.product_id }}
      country={country}
      images={product?.sync_color_images?.[0]?.images ?? product?.images}
      videos={product?.videos}
      name={product.name}
      slug={product.slug}
      Sliders={false}
      brand={{
        name: product.brand.name,
        icon: product.brand.icon?.file_path ?? product?.brand,
        is_verified: product.brand.is_verified,
      }}
      redeem_price={product.redeem_price}
      currency={currency}
      endDate={product.flash_deal_end_date}
      flash_deal_price={product.flash_deal_price}
      id={product?.product_id ?? product?.id}
      is_flashDeal={product.flash_deal_end_date}
      is_redeem={product.is_redeem}
      language={language}
      offer_price={product.offer_price}
      price={product.price}
    />
  ));
  return {
    items: items,
    offset: newOffset,
  };
}

export async function GetNextBoutiques({
  language,
  country,
  category,
  offset,
}) {
  let query: any = { offset: offset };
  if (category) {
    query = { ...query, category_slugs: category };
  }

  let response: any = await api.home.boutiques.get({
    headers: { country, language },
    query: query,
  });
  let newOffset = response.data.data.offset;
  let items = response.data.data.boutiques.map((boutique) => (
    <BoutiqueWrapper lang={`${country}-${language}`} boutique={boutique} />
  ));
  return {
    boutiques: items,
    offset: newOffset,
  };
}
