import ListingSkeleton from "components/skeleton/listing";
import React, { Suspense } from "react";
import ProductListServer from "./ProductList";
import { getCookieServer } from "utils/cookies/cookie-manager";
import { getTitleAndTargetofListing } from "serverRequests/meta/StructuredData/utils";
import ListingBreadcrumbList from "serverRequests/meta/StructuredData/ListingBreadcrumbList";
import ClientLogger from "components/global/ClientLogger";

async function ProductListConainer({
  currencyPromise,
  filtersDataPromise,
  boutiquePromise,
  parsedFilters,
  Params,
  isFlashDeals = false,
  isFeatured = false,
  language,
}) {
  let [filtersData, currency, boutique] = await Promise.all([
    filtersDataPromise,
    currencyPromise,
    boutiquePromise,
  ]);
  const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
  let productsData = filtersData.products.map((product) => {
    if (product?.is_luck) {
      return {
        name: product?.name,
        slug: product?.slug,
        label_names: product?.label_names,
        category_tree: product?.category_tree,
        videos: product.videos,
        flash_deal_price: product.flash_deal_price,
        colors: product?.colors,
        sync_color_images: product?.sync_color_images,
        ...(!product?.sync_color_images ||
        product?.sync_color_images?.length === 0
          ? { images: product.images }
          : {}),
        price: product.price,
        offer_price: product.offer_price,
        luck_price: product.luck_price,
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
        product_id: product.product_id,
        is_luck:
          product.luck_price &&
          !redeemed_ids.find((s) => s.id === product.product_id),
      };
    } else
      return {
        name: product?.name,
        slug: product?.slug,
        label_names: product?.label_names,
        flash_deal_price: product.flash_deal_price,
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
        luck_price: product.luck_price,
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
        product_id: product.product_id,
      };
  });
  let parsedFiltersVar = {
    ...parsedFilters,
    search_text:
      filtersData?.isAnalyzed?.name ?? parsedFilters?.search_text?.[0],
  };
  let { path, title } = getTitleAndTargetofListing({
    filters: parsedFilters,
    filtersData: filtersData,
    language: language,
  });

  return (
    <Suspense
      key={`Suspense-product-list-${JSON.stringify(parsedFilters)}`}
      fallback={<ListingSkeleton forProducts={true} />}
    >
      <ClientLogger
        value={{
          elasticMainQueryTime: filtersData.time,
          currencyTime: { time: currency.time, redis: currency.redis },
          source: "ProductListContainer",
        }}
      />
      <ListingBreadcrumbList
        currency={currency}
        local={Params.lang}
        products={productsData}
        target={path}
        title={title}
      />
      <ProductListServer
        recomended_offset={filtersData?.recommended_offset}
        boutique={boutique?.name}
        products={productsData ?? []}
        offset={filtersData?.offset}
        pit_id={filtersData?.pit_id ?? null}
        currency={currency}
        key={`product-list-${JSON.stringify(parsedFilters)}`}
        parsedFilters={parsedFiltersVar}
        params={Params}
        isFeatured={isFeatured}
        isFlashDeals={isFlashDeals}
        target={path}
        title={title}
      />
    </Suspense>
  );
}

export default ProductListConainer;
