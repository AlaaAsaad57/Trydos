import React from "react";
import FeaturedBanner from "./FeaturedBanner";
import FlashDealBanner from "./FlashDealBanner";
import ProductsLabels from "./ProductsLabels";

function ProductBanner({ featured, flashDeals, labels }) {
  if (labels?.length === 0 || !flashDeals) return <></>;
  return (
    <div className="flex-col gap-[5px] absolute top-[0px] right-[2px] z-10 scale-[0.7] origin-bottom-right">
      {/* {featured && <FeaturedBanner />} */}
      {flashDeals && <FlashDealBanner end_data={flashDeals} />}
      {labels && <ProductsLabels labels={labels} />}
    </div>
  );
}

export default ProductBanner;
