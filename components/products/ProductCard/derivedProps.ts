// components/products/ProductCard/derivedProps.ts
import type { ListingProduct } from "types/listing";

export interface CardContext {
  currency: any;
  country: string;
  language: string;
  sliders?: boolean;
  sizesFilters?: string[] | null;
  fromRecomended?: any;
}

/** ListingProduct + context → the exact props ProductWrapper used to receive.
 *  This is the single source of truth that replaces the 3 duplicated blocks in
 *  GetProducts, GetRelatedProducts, and ProductListServer. */
export function deriveCardProps(product: ListingProduct, ctx: CardContext) {
  return {
    id: product?.product_id ?? (product as any)?.id,
    slug: product.slug,
    name: product.name,
    language: ctx.language,
    country: ctx.country,
    currency: ctx.currency,
    Sliders: ctx.sliders ?? false,
    color: product?.sync_color_images?.[0]?.color_name ?? null,
    category_tree: product?.categories?.map((s) => s?.name),
    labels: product?.label_names,
    images: product?.sync_color_images?.[0]?.images ?? product?.images,
    videos: product?.videos,
    brand: {
      name: product?.brand?.name,
      icon: (product?.brand?.icon as any)?.file_path ?? product?.brand,
      is_verified: product?.brand?.is_verified,
    },
    luck_price: product.luck_price,
    endDate: product.flash_deal_end_date,
    flash_deal_price: product.flash_deal_price,
    is_flashDeal: product.flash_deal_end_date,
    is_luck: product.is_luck,
    offer_price: product.offer_price,
    price: product.price,
    InitialProductData: { ...product, id: product?.product_id },
    fromRecomended: ctx.fromRecomended ?? null,
    sizes_filters:
      ctx.sizesFilters && ctx.sizesFilters.length > 0 ? ctx.sizesFilters : null,
  };
}
