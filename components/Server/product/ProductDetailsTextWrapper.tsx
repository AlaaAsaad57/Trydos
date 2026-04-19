import ProductDetailsText from "components/products/ProductDetailsText";

async function ProductDetailsTextWrapper({ globalPromise, isRtl }) {
  const product = await globalPromise;
  if (!product.details?.includes("script") && product?.details)
    return <ProductDetailsText details={product.details} isRtl={isRtl} />;
  else return <></>;
}

export default ProductDetailsTextWrapper;
