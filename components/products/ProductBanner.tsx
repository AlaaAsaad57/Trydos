import React from "react";
import FeaturedBanner from "./FeaturedBanner";
import FlashDealBanner from "./FlashDealBanner";
import ProductsLabels from "./ProductsLabels";

function ProductBanner({ featured, flashDeals, labels }) {
  if (labels?.length === 0 && !flashDeals) return <></>;
  return (
    <>
      {/* {featured && <FeaturedBanner />} */}
      {flashDeals && <FlashDealBanner end_data={flashDeals} />}
    </>
  );
}

export default ProductBanner;
