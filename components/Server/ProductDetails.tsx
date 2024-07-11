"use server";
import BackBar from "components/products/BackBar";
import ProductDetailsSlider from "components/products/ProductDetailsSlider";
import ProductFooterSection from "components/products/ProductFooterSection";
import ProuctDetailsBody from "components/products/ProuctDetailsBody";
import { dispatchRouteChangeEvent } from "Hooks/events";

import React from "react";
import { getProductDetails } from "store/homepage/cachedActions";

async function ProductDetailsServer({ productId, lang }) {
  let product = await getProductDetails({ productId, lang });

  return (
    <div className="product-details-container w-full">
      <BackBar link={true} close={null} />
      <ProductDetailsSlider product={product} />
      <ProuctDetailsBody product={product} />
      <ProductFooterSection product={product} />
    </div>
  );
}

export default ProductDetailsServer;
