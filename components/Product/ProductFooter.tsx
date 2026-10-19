import {
  GetSocialInfoForProduct,
  GetProductGeneralData,
} from "serverRequests/product";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { getCookieServer } from "utils/cookies/server-cookie-manager";
import ProductFooterClient from "./ProductFooterClient";
import ProductStructuredData from "serverRequests/meta/StructuredData/ProductStructuredData";

async function ProductFooter({
  GlobalData,
  language,
  QtyPricesData,
  currency,
  isRtl,
  Params,
  color,
  Size,
  StarttingSettingPromise
}) {
  let [GlobalDataPromise, qtyPricePromise, currencyPromise, settingResponse] = await Promise.all(
    [GlobalData, QtyPricesData, currency, StarttingSettingPromise],
  );
  let parsedUser = await getCookieServer<{ id: string }>(
    COOKIE_NAMES.USER_DATA,
  );
  // Both depend only on the product id and are independent of each other, so fetch in parallel.
  // ratingData feeds the Product JSON-LD (truthful aggregateRating, omitted when no reviews).
  let [socialData, ratingData] = await Promise.all([
    GetSocialInfoForProduct({
      productId: GlobalDataPromise?.id,
      userId: parsedUser?.id,
    }),
    GetProductGeneralData({ id: GlobalDataPromise?.id }),
  ]);
  const isRedeemed = async () => {
    if (!qtyPricePromise?.is_luck) return false;
    let redeemed: any = await getCookieServer<any[]>("redemed_ids");
    if (
      redeemed &&
      redeemed.find((s) => String(s.id) === String(qtyPricePromise.id))
    ) {
      return false;
    } else {
      return true;
    }
  };
  const redeemed_status = await isRedeemed();

  return (
    <>
      <ProductStructuredData
        color={color}
        currency={currencyPromise}
        local={Params.lang}
        product={{
          ...GlobalDataPromise,
          ...qtyPricePromise,
        }}
        rating={ratingData?.final_rating}
        reviewCount={ratingData?.total_buyers}
        size={Size}
      />
      <ProductFooterClient
        shippingDays={settingResponse?.shipping_duration_days || 0}
        redeemed_status={redeemed_status}
        socialData={socialData}
        GlobalData={GlobalDataPromise}
        language={language}
        QtyPricesData={qtyPricePromise}
        currency={currencyPromise}
        isRtl={isRtl}
        Params={Params}
        color={color}
        Size={Size}
      />
    </>
  );
}

export default ProductFooter;
// just for performing push
