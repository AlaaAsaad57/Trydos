import React, { memo } from "react";
import FlashDealBanner from "./FlashDealBanner";

function ProductBanner({ flashDeals }) {
  if (!flashDeals) return <></>;
  return (
    <>
      {/* {featured && <FeaturedBanner />} */}
      {flashDeals && <FlashDealBanner end_data={flashDeals} />}
    </>
  );
}

export default memo(ProductBanner);
