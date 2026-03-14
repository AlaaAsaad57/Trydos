import { GetSocialInfoForProduct } from "serverRequests/product";
import { COOKIE_NAMES, getCookieServer } from "utils/cookies/cookie-manager";
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
}) {
  let [GlobalDataPromise, qtyPricePromise, currencyPromise] = await Promise.all(
    [GlobalData, QtyPricesData, currency],
  );
  let parsedUser = await getCookieServer<{ id: string }>(
    COOKIE_NAMES.USER_DATA,
  );
  let socialData = await GetSocialInfoForProduct({
    productId: GlobalDataPromise?.id,
    userId: parsedUser?.id,
  });
  const isRedeemed = async () => {
    if (!qtyPricePromise?.is_luck) return false;
    let redeemed: any = await getCookieServer<any[]>("redeemd_ids");
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
        size={Size}
      />
      <ProductFooterClient
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
