import React from "react";
import FeaturedBanner from "./FeaturedBanner";
import FlashDealBanner from "./FlashDealBanner";

function ProductBanner({ featured, flashDeals }) {
  if (!featured && !flashDeals) return <></>;
  return (
    <div className="flex-col gap-[5px] absolute top-[0px] right-[2px] z-10 scale-[0.7] origin-bottom-right">
      {featured && <FeaturedBanner />}
      {flashDeals && <FlashDealBanner end_data={flashDeals} />}
    </div>
  );
}

export default ProductBanner;
