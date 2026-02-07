import { GetImageUrl } from "utils/server";
import ProductFooter from "./ProductFooter";
import { GetSocialInfoForProduct } from "serverRequests/product";
import { cookies } from "next/headers";
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
  let cookiesStore = await cookies();
  let user = cookiesStore.get("User-Data")?.value;
  let parsedUser = user ? JSON.parse(user) : null;
  let socialData = await GetSocialInfoForProduct({
    productId: product?.id,
    userId: parsedUser?.id,
  });
  const isRedeemed = async () => {
    if (!qtyData?.is_redeem) return false;
    const cookiesStore = await cookies();
    let redeemed: any = cookiesStore.get("redeemd_ids")?.value;
    redeemed = redeemed ? JSON.parse(redeemed) : null;
    if (redeemed && redeemed.find((s) => String(s.id) === String(qtyData.id))) {
      return false;
    } else {
      return true;
    }
  };
  const redeemed_status = await isRedeemed();
  qtyData = { ...qtyData, is_redeem: redeemed_status };
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
          is_redeem: qtyData?.is_redeem,
          redeem_price: qtyData?.redeem_price,
          boutique_id: product?.boutique_id,
        }}
      />
    </>
  );
}

export default ProductFooterWrapper;
