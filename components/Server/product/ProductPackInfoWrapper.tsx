import { translateFunction } from "utils/server";
import { getPackInfo, PackInfoLabel } from "components/products/packInfo";

// Shows the pack facts (count and sale unit) under the product name.
// It renders nothing when qtyPriceDetails has neither field.
async function ProductPackInfoWrapper({
  qtyPricePromise,
  language,
  isRtl,
}: {
  qtyPricePromise: any;
  language: string;
  isRtl: boolean;
}) {
  const productQtyData = await qtyPricePromise;
  const info = getPackInfo(productQtyData);
  if (!info) return null;
  return (
    <PackInfoLabel
      info={info}
      isRtl={isRtl}
      className="mt-[6px] text-[11px]"
      t={(key) => translateFunction(key, language)}
    />
  );
}

export default ProductPackInfoWrapper;
