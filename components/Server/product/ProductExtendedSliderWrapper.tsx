import ProductDetailsSlider from "components/products/ProductDetailsSlider";
import { cookies } from "next/headers";
import React, { Suspense } from "react";
import { GetSocialInfoForProduct } from "serverRequests/product";

async function ProductExtendedSliderWrapper({
  globalPromise,
  qtyPricePromise,
  color,
}) {
  let [globalDetails, priceDetails] = await Promise.all([
    globalPromise,
    qtyPricePromise,
  ]);

  let cookiesStore = await cookies();
  let user = cookiesStore.get("User-Data")?.value;
  let parsedUser = user ? JSON.parse(user) : null;
  let socialData = await GetSocialInfoForProduct({
    productId: globalDetails?.id,
    userId: parsedUser?.id,
  });
  return (
    <Suspense fallback={<></>}>
      <ProductDetailsSlider
        key={color}
        resetLoader={true}
        productGA={{
          item_id: globalDetails.id,
          item_name: globalDetails?.name,
          brand: globalDetails?.brand?.name,
          brand_id: globalDetails?.brand?.id,
          category: globalDetails?.categories?.[0]?.name,
          category_id: globalDetails?.categories?.[0]?.id,
          price: priceDetails?.offer_price ?? priceDetails?.price,
          interaction_type: "view",
          likes_count: socialData.total_likes,
          boutique_id: globalDetails?.boutique_id,
        }}
        images={
          globalDetails?.sync_color_images?.find(
            (s) => s.color_option === color || s?.color_name === color,
          )?.images ??
          globalDetails?.sync_color_images?.[0]?.images ??
          globalDetails?.images
        }
      />
    </Suspense>
  );
}

export default ProductExtendedSliderWrapper;
