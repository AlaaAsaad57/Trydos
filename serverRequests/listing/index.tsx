"use server";
import ImageCircel from "components/ListingPage/filterComponents/FiltersWindow/ImageCircel";
import FilterItem from "components/ListingPage/FilterItem";
import ProductWrapper from "components/ServerWrapper/ProductWrapper";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import { getCookieServer } from "utils/cookies/cookie-manager";
import { HandleIsActive } from "utils/server";
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

    return {
      categories: new_filters?.categories?.map((category) => (
        <ImageCircel
          key={category.slug}
          isActive={HandleIsActive({
            values: filters.categories,
            item: category.slug,
          })}
          name={category.name}
          term={"Category"}
          value={category.slug}
          image={category.most_viewed_product_thumbnail}
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
}) {
  let response = await getProductsAndFiltersFromElastic({
    country,
    language_code: language,
    filters: parsedFilters,
    limit: 10,
    noFilters: true,
    search_after: offset,
    recommended_offset: recomended_offset,
    userId: userId,
  });
  const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
  let productsData: any = response.products.map((product) => {
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
      key={product?.product_id ?? product?.id ?? product?.slug}
      category_tree={product?.categories?.map((s) => s.name)}
      labels={product?.label_names}
      color={product?.sync_color_images?.[0]?.color_name}
      InitialProductData={{ ...product, id: product?.product_id }}
      country={country}
      images={product?.sync_color_images?.[0]?.images ?? product?.images}
      videos={product?.videos}
      name={product.name}
      slug={product.slug}
      Sliders={true}
      brand={{
        name: product?.brand?.name,
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
      sizes_filters={sizes_filters?.length > 0 ? sizes_filters : null}
    />
  ));
  return {
    items: items,
    offset: newOffset,
    recomended_offset: response?.recommended_offset,
    GA_PRODUCTS_LIST: response?.products?.map((s) => ({
      item_id: s?.product_id,
      item_name: s?.name,
      category: s?.category?.name,
      category_id: s?.category?.id,
      brand: s?.brand?.name,
      brand_id: s?.brand?.id,
    })),
  };
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
