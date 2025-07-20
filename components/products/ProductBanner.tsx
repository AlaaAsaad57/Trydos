import React from "react";
import FeaturedBanner from "./FeaturedBanner";
import FlashDealBanner from "./FlashDealBanner";
import ProductsLabels from "./ProductsLabels";

function ProductBanner({ featured, flashDeals, labels }) {
  if (labels?.length === 0 && !flashDeals) return <></>;
  return (
    <div className="flex-col gap-[5px]  z-10  origin-bottom-right">
      {/* {featured && <FeaturedBanner />} */}
      {flashDeals && <FlashDealBanner end_data={flashDeals} />}
    </div>
  );
}

export default ProductBanner;
