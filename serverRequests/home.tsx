"use server";

import { getCookieServer } from "utils/cookies/cookie-manager";
import ProductWrapper from "components/ServerWrapper/ProductWrapper";
import { getCurrency } from "./currency";
import BoutiqueWrapper from "components/ServerWrapper/BoutiqueWrapper";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
import {
  getProductsAndFiltersFromElastic,
  GetRecomendationsForUser,
} from "services/elastic/elasticSearch";
import {
  NormalizeSearchParamsForSearchRequest,
  parseNumberArray,
} from "utils/server";
export async function GetNextRecommendations({
  language,
  country,
  offset,
  userId,
  limit,
}) {
  let currency = await getCurrency(country, language);
  let response: any = await GetRecomendationsForUser({
    country: country,
    language: language,
    limit: limit,
    userId: userId,
    search_after: parseNumberArray(offset),
  });
  const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
  let productsData = response.products.map((product) => {
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
  let newOffset = response?.offset;
  let items = productsData?.map((product) => (
    <ProductWrapper
      fromRecomended={true}
      key={product?.product_id ?? product?.id}
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
  let response = await GetHomeBoutiques({
    language,
    category: category,
    country,
    offset: offset,
  });
  let newOffset = response.data.offset;
  let items = response.data.boutiques.map((boutique) => (
    <BoutiqueWrapper
      key={boutique?.slug}
      lang={`${country}-${language}`}
      boutique={boutique}
    />
  ));
  return {
    boutiques: items,
    offset: newOffset,
  };
}

export async function GetMainCategories({ country, language }) {
  let Reader = new ElasticsearchReader();
  let a = await Reader.getCategories({ country: country, size: 4000 });
  // @ts-ignore

  let mainCategories = a.hits.hits.map((s) => {
    // @ts-ignore
    return s._source?.custom_categories?.find(
      (cat) => cat.language_code?.toLowerCase() === language?.toLowerCase(),
    );
  });
  mainCategories = mainCategories.filter((c) => c !== undefined);
  mainCategories = Array.from(
    new Map(mainCategories.map((c: any) => [c.id, c])).values(),
  );
  return {
    data: {
      mainCategories: mainCategories.map((category: any) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        flat_photo_path: category.flat_photo_path,
        outline_photo_path: category.outline_photo_path,
        fill_photo_path: category.fill_photo_path,
      })),
    },
  };
}

export async function GetHomeBoutiques({
  language,
  country,
  category,
  limit = 10,
  offset = null,
}) {
  let Reader = new ElasticsearchReader();
  let boutiquesResponse: any = { boutiques: [], searchAfter: null };
  if (typeof category === "string") {
    try {
      category = JSON.parse(category);
      if (Array.isArray(category) && category.length > 0) {
        category = category?.[0];
      }
    } catch (e) {
      category = category;
    }
  }
  boutiquesResponse = await Reader.getBoutiques({
    country,
    language,
    limit,
    category: category ?? null,
    searchAfter: offset ? JSON.parse(offset.toString()) : null,
  });
  return {
    data: {
      total: boutiquesResponse.boutiques?.length || 0,
      limit,
      searchAfter: boutiquesResponse.searchAfter,
      offset: boutiquesResponse.searchAfter, // Use searchAfter as offset, like home page
      boutiques: boutiquesResponse.boutiques || [],
      category,
    },
  };
}

export async function GetRecommedndedProducts({
  country,
  language,
  limit,
  offset = null,
  userId,
}) {
  let response: any = await GetRecomendationsForUser({
    country: country,
    language: language,
    limit: limit,
    userId: userId,
    search_after: parseNumberArray(offset),
  });
  const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
  let productsData = response.products.map((product) => {
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
  let newOffset = response?.offset;
  return {
    items: productsData,
    offset: newOffset,
  };
}

export async function GetFeaturedProducts({
  country,
  language,
  category,
  limit = 10,
  offset = null,
}) {
  let filters = NormalizeSearchParamsForSearchRequest({
    searchParams: { limit, offset, category_slugs: category },
    isFeatured: true,
    isFlashDeal: false,
  });
  const params = {
    limit: Number(limit),
    search_after: parseNumberArray(offset),
    filters,
    filters_offset: 1,
    country,
    language_code: language,
    noFilters: true,
  };
  let result = await getProductsAndFiltersFromElastic(params);
  return {
    data: result,
  };
}

export async function GetFlashDealProducts({
  country,
  language,
  category,
  limit = 10,
  offset = null,
}) {
  let filters = NormalizeSearchParamsForSearchRequest({
    searchParams: { limit, offset, category_slugs: category },
    isFeatured: false,
    isFlashDeal: true,
  });
  const params = {
    limit: Number(limit),
    search_after: parseNumberArray(offset),
    filters,
    filters_offset: 1,
    country,
    language_code: language,
    noFilters: true,
  };
  let result = await getProductsAndFiltersFromElastic(params);
  return {
    data: result,
  };
}
