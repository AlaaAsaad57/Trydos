"use server";
import dynamic from "next/dynamic";

import BackBar from "components/products/BackBar";
import ProductDetailsSlider from "components/products/ProductDetailsSlider";
import ProductFooterSection from "components/products/ProductFooterSection";
const ProuctDetailsBody = dynamic(
  () => import("components/products/ProuctDetailsBody"),
  { ssr: false }
);

import React from "react";
import { getProductDetails } from "store/homepage/cachedActions";

async function ProductDetailsServer({ productId, lang }) {
  let [product, data] = await getProductDetails({ productId, lang });
  console.log("product loaded");
  return (
    <div className="product-details-container w-full">
      <BackBar link={true} close={null} data={data} />
      <ProductDetailsSlider product={product} />
      <ProuctDetailsBody product={product} />
      <ProductFooterSection product={product} />
    </div>
  );
}

export default ProductDetailsServer;
