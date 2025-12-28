import ProductDetailsText from "components/products/ProductDetailsText";
import { Suspense } from "react";
import Skeleton from "react-loading-skeleton";

async function ProductDetailsTextWrapper({ globalPromise, isRtl }) {
  const product = await globalPromise;
  if (!product.details?.includes("script"))
    return (
      <Suspense
        fallback={
          <div className={`${isRtl ? "dir-rtl" : ""} product-details-text`}>
            <div id="details" className="have-arabic ">
              <Skeleton width={200} height={13} borderRadius={4} />
            </div>
          </div>
        }
      >
        <ProductDetailsText details={product.details} isRtl={isRtl} />
      </Suspense>
    );
  else return <></>;
}

export default ProductDetailsTextWrapper;
