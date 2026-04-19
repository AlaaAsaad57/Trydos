import React, { memo } from "react";
import FlashDealBanner from "./FlashDealBanner";

function ProductBanner({ flashDeals, language }) {
  if (!flashDeals) return <></>;
  return (
    <>
      {/* {featured && <FeaturedBanner />} */}
      {flashDeals && (
        <FlashDealBanner language={language} end_data={flashDeals} />
      )}
    </>
  );
}

export default memo(ProductBanner);
