import type { ListingProduct } from "types/listing";

export function normalizeListingProduct(
  product: any,
  redeemedIds: any[] = [],
): ListingProduct {
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

  if (product?.is_luck && product?.luck_price) {
    base.is_luck = !redeemedIds.find((s) => s.id === product.product_id);
  }

  return base;
}
