"use server";
import { getProductsAndFiltersFromElastic, getRelatedProducts } from "services/elastic/elasticSearch";
import type { GetProductsResult, GetRelatedProductsResult } from "types/listing";
import { getCookieServer } from "utils/cookies/cookie-manager";
import { normalizeListingProduct } from "utils/listing/normalizeListingProduct";
import { combineCategoriesWithRelated } from "utils/server";
import { LogServerError } from "utils/serverErrorReporter";

export async function GetFilters({
  language,
  country,
  filter_offset = 1,
  filters,
}) {
  try {
    let response = await getProductsAndFiltersFromElastic({
      country,
      language_code: language,
      filters: filters,
      filters_offset: filter_offset,
      limit: 10,
      noProducts: true,
    });

    let new_filters: any = {};
    const combinedCategories = combineCategoriesWithRelated(
      response.categories || [],
      response.related_categories || [],
    );
    if (response.categories.length) {
      new_filters.categories = response.categories;
    }
    if (response.brands?.length) {
      new_filters.brands = response.brands;
    }
    if (response.colors?.length) {
      new_filters.colors = response.colors;
    }
    if (response.attributes?.[0]?.options?.length) {
      new_filters.sizes = response.attributes?.[0]?.options;
    }

    const isRtl = language === "ar" || language === "ku";
    const params = { lang: `${country}-${language}` };
    const baseUrlOfFiltersPage = filters?.featured
      ? "/featured"
      : filters?.flashdeal
        ? "/flashDeals"
        : "/filters";

    return {
      categories: new_filters?.categories ?? [],
      brands: new_filters?.brands ?? [],
      colors: new_filters?.colors ?? [],
      sizes: new_filters?.sizes ?? [],
      prices: response.prices,
      total_size: response.total_size,
    };
  } catch (error) {
    LogServerError({
      language,
      country,
      error: error,
      scenario: "Error In GetFilters in serverRequest/listing",
    });
  }
}

export async function GetProducts({
  language,
  country,
  offset,
  parsedFilters,
  currency,
  userId = null,
  recomended_offset = null,
  sizes_filters = null,
  pit_id = null,
  sort = undefined,
}): Promise<GetProductsResult> {
  try {
  let response = await getProductsAndFiltersFromElastic({
    country,
    language_code: language,
    filters: parsedFilters,
    limit: 10,
    noFilters: true,
    search_after: offset,
    recommended_offset: recomended_offset,
    userId: userId,
    // User-facing listing sort (`?sort=`); undefined ⇒ relevance default.
    sort: sort,
    // PIT snapshot pagination (ADR-009): reuse the session snapshot id.
    usePit: true,
    pit_id: pit_id,
  });
  const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
  const products = response.products.map((product) =>
    normalizeListingProduct(product, redeemed_ids),
  );
  const newOffset = response?.offset;
  return {
    products,
    offset: newOffset,
    recomended_offset: response?.recommended_offset,
    // Rotated PIT snapshot id for the next page (ADR-009); null when PIT is off.
    pit_id: response?.pit_id ?? null,
    // Stable per-item ids, parallel to `products`, for client dedupe that does not
    // depend on the analytics array staying aligned.
    productIds: products?.map((p) => String(p?.product_id)) ?? [],
    GA_PRODUCTS_LIST: response?.products?.map((s) => ({
      item_id: s?.product_id,
      item_name: s?.name,
      category: s?.category?.name,
      category_id: s?.category?.id,
      brand: s?.brand?.name,
      brand_id: s?.brand?.id,
    })),
  };
  } catch (error) {
    LogServerError(
      { error, scenario: "GetProducts (elastic) failed", country, language },
      "/",
    );
    return {
      products: [],
      offset: undefined,
      recomended_offset: undefined,
      pit_id: null,
      productIds: [],
      GA_PRODUCTS_LIST: [],
    };
  }
}

export async function GetNextPageFilters({
  language,
  country,
  filter_offset = 1,
  filters,
  params,
  currency = null,
}) {
  try {
    let response = await getProductsAndFiltersFromElastic({
      country,
      language_code: language,
      filters: filters,
      filters_offset: filter_offset,
      limit: 10,
      noProducts: true,
    });
    let new_filters: any = {};
    const combinedCategories = combineCategoriesWithRelated(
      response.categories || [],
      response.related_categories || [],
    );
    if (combinedCategories.length) {
      new_filters.categories = combinedCategories;
    }
    if (response.brands?.length) {
      new_filters.brands = response.brands;
    }
    if (response.colors?.length) {
      new_filters.colors = response.colors;
    }
    if (response.attributes?.[0]?.options?.length) {
      new_filters.sizes = response.attributes?.[0]?.options;
    }
    if (response.prices?.[0] >= 0 && response.prices?.[1] >= 0) {
      new_filters.prices = new_filters.prices;
    }
    //   if (response.boutiques.length) {
    //     new_filters.boutiques = response.boutiques;
    //   }

    return {
      categories: new_filters?.categories ?? [],
      brands: new_filters?.brands ?? [],
      colors: new_filters?.colors ?? [],
      sizes: new_filters?.sizes ?? [],
      prices: response?.prices?.priceRanges ?? [],
      total_size: response?.total_size,
    };
  } catch (error) {
    LogServerError({
      language,
      country,
      error: error,
      scenario: "Error In GetNextPageFilters in serverRequest/listing",
    });
  }
}

export async function GetRelatedProducts({
  language,
  country,
  productId,
  offset,
  currency,
  sizes_filters = null,
  pit_id = null,
}): Promise<GetRelatedProductsResult> {
  try {
    let response = await getRelatedProducts({
      country,
      language_code: language,
      productId,
      limit: 3,
      search_after: offset,
      // PIT snapshot pagination (ADR-009): reuse the session snapshot id.
      usePit: true,
      pit_id: pit_id,
    });

    const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
    const products = response.products.map((p) =>
      normalizeListingProduct(p, redeemed_ids),
    );

    return {
      products,
      offset: response?.offset,
      total_size: response.total_size,
      pit_id: response?.pit_id ?? null,
      productIds: products?.map((p) => String(p?.product_id)) || [],
    };
  } catch (error) {
    LogServerError({
      language,
      country,
      error: error,
      scenario: "Error In GetRelatedProducts in serverRequest/listing",
    });
    return { products: [], offset: [], total_size: 0, pit_id: null, productIds: [] };
  }
}

