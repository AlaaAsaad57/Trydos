import { GetImageUrl } from "utils/server";
import ProductFooter from "./ProductFooter";
import { GetSocialInfoForProduct } from "serverRequests/product";
import { getCookieServer, COOKIE_NAMES } from "utils/cookies/cookie-manager";
import ProductStructuredData from "serverRequests/meta/StructuredData/ProductStructuredData";

async function ProductFooterWrapper({
  isRtl,
  globalPromise,
  QtyPricePromise,
  color,
  size,
  currencyPromise,
  local,
}) {
  let [globalData, qtyData, currencyData] = await Promise.all([
    globalPromise,
    QtyPricePromise,
    currencyPromise,
  ]);
  let product = {
    ...globalData,
    ...qtyData,
  };
  let parsedUser = await getCookieServer<{ id: string }>(
    COOKIE_NAMES.USER_DATA,
  );
  let socialData = await GetSocialInfoForProduct({
    productId: product?.id,
    userId: parsedUser?.id,
  });
  const isRedeemed = async () => {
    if (!qtyData?.is_luck) return false;
    let redeemed: any = await getCookieServer<any[]>("redeemd_ids");
    if (redeemed && redeemed.find((s) => String(s.id) === String(qtyData.id))) {
      return false;
    } else {
      return true;
    }
  };
  const redeemed_status = await isRedeemed();
  qtyData = { ...qtyData, is_luck: redeemed_status };
  return (
    <>
      <ProductStructuredData
        color={color}
        currency={currencyData}
        local={local}
        product={product}
        size={size}
      />
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
          is_luck: qtyData?.is_luck,
          luck_price: qtyData?.luck_price,
          boutique_id: product?.boutique_id,
        }}
      />
    </>
  );
}

export default ProductFooterWrapper;
