import ActiveColorDetailsSlider from "components/products/ActiveColorDetailsSlider";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { getCookieServer } from "utils/cookies/server-cookie-manager";
import { Suspense } from "react";
import { GetSocialInfoForProduct } from "serverRequests/product";
import { getColorImageGroups } from "./colorImageGroups";

async function ProductExtendedSliderWrapper({
  globalPromise,
  qtyPricePromise,
  color,
}) {
  let [globalDetails, priceDetails] = await Promise.all([
    globalPromise,
    qtyPricePromise,
  ]);

  let parsedUser = await getCookieServer<{ id: string }>(
    COOKIE_NAMES.USER_DATA,
  );
  let socialData = await GetSocialInfoForProduct({
    productId: globalDetails?.id,
    userId: parsedUser?.id,
  });
  return (
    <Suspense fallback={<></>}>
      <ActiveColorDetailsSlider
        serverColor={color}
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
        // same groups as the main slider — the zoom overlay maps clicks to
        // slides by index, so the two image lists must stay identical
        imagesByColor={getColorImageGroups(globalDetails)}
      />
    </Suspense>
  );
}

export default ProductExtendedSliderWrapper;
