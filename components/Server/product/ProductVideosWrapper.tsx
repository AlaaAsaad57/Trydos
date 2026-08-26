import ProductVideo from "components/products/ProductVideo";

function ProductVideosWrapper({ globalPromise, language }) {
  globalPromise;
  if (globalPromise?.videos?.length === 0) return <></>;
  return <ProductVideo language={language} videos={globalPromise?.videos} />;
}

export default ProductVideosWrapper;
