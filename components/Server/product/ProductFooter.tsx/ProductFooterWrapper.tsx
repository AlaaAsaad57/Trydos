import { GetImageUrl } from "utils/tinyUtils";
import ProductFooter from "./ProductFooter";

function ProductFooterWrapper({
  isRtl,
  globalPromise,
  QtyPricePromise,
  color,
  size,
  currencyPromise,
  local,
  redeemed_status,
  socialData,
}) {
  let product = {
    ...globalPromise,
    ...QtyPricePromise,
  };

  QtyPricePromise = { ...QtyPricePromise, is_luck: redeemed_status };
  return (
    <>
      <ProductFooter
        isRtl={isRtl}
        productLightData={{
          id: product.id,
          image: GetImageUrl(
            product?.sync_color_images?.[0]?.images?.[0] ??
              product?.images?.[0],
          ),
          sync_color_images: product?.sync_color_images,
          slug: product?.slug,
          name: product?.name,
          details: product?.details,
          brand: product.brand,
          category: product.category,
          price: product.price,
          offer_price: product?.offer_price,
          total_likes: socialData?.total_likes || 0,
          is_liked: socialData?.is_liked,
          total_comments: socialData?.total_comments,
          total_shares: socialData?.total_shares,
          owner_id: product?.owner_id,
          owner_type: product?.owner_type,
          is_luck: QtyPricePromise?.is_luck,
          luck_price: QtyPricePromise?.luck_price,
          boutique_id: product?.boutique_id,
        }}
      />
    </>
  );
}

export default ProductFooterWrapper;
