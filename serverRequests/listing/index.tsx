"use server";
import CategoryImageCircel from "components/ListingPage/filterComponents/FiltersWindow/CategoryImageCircel";
import ImageCircel from "components/ListingPage/filterComponents/FiltersWindow/ImageCircel";
import FilterItem from "components/ListingPage/FilterItem";
import ProductWrapper from "components/ServerWrapper/ProductWrapper";
import { getProductsAndFiltersFromElastic, getRelatedProducts } from "services/elastic/elasticSearch";
import type { GetProductsResult, GetRelatedProductsResult } from "types/listing";
import { getCookieServer } from "utils/cookies/cookie-manager";
import { normalizeListingProduct } from "utils/listing/normalizeListingProduct";
import { HandleIsActive, combineCategoriesWithRelated } from "utils/server";
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
      categories: new_filters?.categories?.map((item) => (
        <CategoryImageCircel
          key={item.slug}
          isActive={HandleIsActive({
            values: filters.categories,
            item: item.slug,
          })}
          name={item.name}
          term={"Category"}
          value={item.slug}
          image={item.most_viewed_product_thumbnail}
          childes={item.childes}
          values={filters.categories}
          isRtl={isRtl}
        />
      )),
      brands: new_filters?.brands?.map((brand) => (
        <ImageCircel
          key={brand.slug}
          isActive={HandleIsActive({
            values: filters.brands,
            item: brand.slug,
          })}
          name={brand.name}
          term={"Category"}
          value={brand.slug}
          image={brand.icon}
        />
      )),
      colors: new_filters?.colors?.map((color) => (
        <ImageCircel
          key={color}
          isActive={HandleIsActive({
            values: filters?.colors?.map((s) => s?.replace("#", "")),
            item: color.replace("#", ""),
          })}
          color={color}
          name={color}
          value={color}
          term={"Color"}
        />
      )),
      sizes: new_filters?.sizes?.map((size) => (
        <ImageCircel
          isActive={HandleIsActive({
            values: filters?.sizes,
            item: size,
          })}
          key={size}
          name={size}
          value={size}
          term={"Size"}
        />
      )),
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
  const baseUrlOfFiltersPage = () => {
    if (filters.isFeatured || filters?.featured) return `/featured`;
    if (filters.isFlashDeals || filters?.flashdeal) return "/flashDeals";
    return "/filters";
  };
  const isRtl = language === "ar" || language === "ku";
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
      categories: new_filters?.categories?.map((item) => (
        <FilterItem
          isRtl={isRtl}
          baseUrlOfFiltersPage={baseUrlOfFiltersPage()}
          params={params}
          filterParams={filters}
          isUsingParsedFilters={true}
          key={item.id ?? item?.slug ?? item}
          currency={null}
          term={"categories"}
          item={item}
        />
      )),
      brands: new_filters?.brands?.map((item) => (
        <FilterItem
          isRtl={isRtl}
          baseUrlOfFiltersPage={baseUrlOfFiltersPage()}
          params={params}
          filterParams={filters}
          isUsingParsedFilters={true}
          key={item.id ?? item?.slug ?? item}
          currency={null}
          term={"brands"}
          item={item}
        />
      )),
      colors: new_filters?.colors?.map((item) => {
        return (
          <FilterItem
            isRtl={isRtl}
            baseUrlOfFiltersPage={baseUrlOfFiltersPage()}
            params={params}
            filterParams={filters}
            isUsingParsedFilters={true}
            key={item.id ?? item?.slug ?? item}
            currency={null}
            term={"colors"}
            item={item}
          />
        );
      }),
      sizes: new_filters?.sizes?.map((item) => (
        <FilterItem
          isRtl={isRtl}
          baseUrlOfFiltersPage={baseUrlOfFiltersPage()}
          params={params}
          filterParams={filters}
          isUsingParsedFilters={true}
          key={item}
          currency={null}
          term={"sizes"}
          item={item}
        />
      )),
      prices: response?.prices?.priceRanges?.map((item) => {
        return (
          <FilterItem
            isRtl={isRtl}
            baseUrlOfFiltersPage={baseUrlOfFiltersPage()}
            params={params}
            filterParams={filters}
            isUsingParsedFilters={true}
            key={`${item.min_price}-${item.max_price}`}
            currency={currency}
            term={"prices"}
            item={item}
          />
        );
      }),
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

