import React from "react";
import FeaturedBanner from "./FeaturedBanner";
import FlashDealBanner from "./FlashDealBanner";
import ProductsLabels from "./ProductsLabels";

function ProductBanner({ flashDeals }) {
  if (!flashDeals) return <></>;
  return (
    <>
      {/* {featured && <FeaturedBanner />} */}
      {flashDeals && <FlashDealBanner end_data={flashDeals} />}
    </>
  );
}

export default ProductBanner;
