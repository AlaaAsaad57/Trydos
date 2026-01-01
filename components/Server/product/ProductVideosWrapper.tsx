import ProductVideo from "components/products/ProductVideo";
import React from "react";

async function ProductVideosWrapper({ globalPromise, language }) {
  let product = await globalPromise;
  if (product?.videos?.length === 0) return <></>;
  return <ProductVideo language={language} videos={product?.videos} />;
}

export default ProductVideosWrapper;
