import ProductDetailsText from "components/products/ProductDetailsText";
import { Suspense } from "react";
import Skeleton from "react-loading-skeleton";

async function ProductDetailsTextWrapper({ globalPromise, isRtl }) {
  const product = await globalPromise;
  if (!product.details?.includes("script"))
    return <ProductDetailsText details={product.details} isRtl={isRtl} />;
  else return <></>;
}

export default ProductDetailsTextWrapper;
