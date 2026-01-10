import ListingSkeleton from "components/skeleton/listing";
import React, { Suspense } from "react";
import ProductListServer from "./ProductList";
import { getCookieServer } from "utils/cookies/cookie-manager";

async function ProductListConainer({
  currencyPromise,
  filtersDataPromise,
  boutiquePromise,
  parsedFilters,
  Params,
  isFlashDeals = false,
  isFeatured = false,
}) {
  let [filtersData, currency, boutique] = await Promise.all([
    filtersDataPromise,
    currencyPromise,
    boutiquePromise,
  ]);
  const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
  let productsData = filtersData.products.map((product) => {
    if (product?.is_redeem) {
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
        product_id: product.product_id,
        is_redeem:
          product.redeem_price &&
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
        product_id: product.product_id,
      };
  });
  let parsedFiltersVar = {
    ...parsedFilters,
    search_text:
      filtersData?.isAnalyzed?.name ?? parsedFilters?.search_text?.[0],
  };

  return (
    <Suspense
      key={`Suspense-product-list-${JSON.stringify(parsedFilters)}`}
      fallback={<ListingSkeleton forProducts={true} />}
    >
      <ProductListServer
        boutique={boutique?.name}
        products={productsData ?? []}
        offset={filtersData?.offset}
        currency={currency}
        key={`product-list-${JSON.stringify(parsedFilters)}`}
        parsedFilters={parsedFiltersVar}
        params={Params}
        isFeatured={isFeatured}
        isFlashDeals={isFlashDeals}
      />
    </Suspense>
  );
}

export default ProductListConainer;
