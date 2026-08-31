import type { ListingProduct } from "types/listing";

export function normalizeListingProduct(product: any): ListingProduct {
  const hasSyncImages =
    Array.isArray(product?.sync_color_images) &&
    product.sync_color_images.length > 0;

  const base: ListingProduct = {
    name: product?.name,
    slug: product?.slug,
    label_names: product?.label_names,
    category_tree: product?.category_tree,
    videos: product?.videos,
    colors: product?.colors,
    sync_color_images: product?.sync_color_images,
    ...(hasSyncImages ? {} : { images: product?.images }),
    price: product?.price,
    offer_price: product?.offer_price,
    luck_price: product?.luck_price,
    categories: product?.categories?.map((s: any) => ({
      name: s?.name,
      id: s?.id,
    })),
    brand: {
      id: product?.brand?.id,
      icon: product?.brand?.icon,
      is_verified: product?.brand?.is_verified,
    },
    flash_deal_end_date: product?.flash_deal_end_date,
    flash_deal_price: product?.flash_deal_price,
    product_id: product?.product_id,
  };

  // `is_luck` is a fact about the PRODUCT, not about the visitor. It used to be
  // turned off here when the shopper's `redemed_ids` cookie said they had
  // already redeemed this product — but this function now runs inside a cached
  // scope shared by every shopper, which may not read a cookie and must not
  // bake one shopper's record into markup served to the rest.
  //
  // The visitor's own record is applied in their browser instead: before first
  // paint by utils/luck/redeemedScript.ts, and on hydration by useLuckTimer.
  if (product?.is_luck && product?.luck_price) {
    base.is_luck = true;
  }

  return base;
}
