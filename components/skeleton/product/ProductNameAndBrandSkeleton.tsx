import Skeleton from "react-loading-skeleton";

function ProductNameAndBrandSkeleton({ isRtl }) {
  return (
    <>
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } product-brand-logo flex-row items-center gap-[11px]`}
      >
        <Skeleton width={40} height={18} borderRadius={4} />
      </div>
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } product-text-section  align-center h-auto`}
      >
        <div
          className={`${
            isRtl && "dir-rtl"
          } text-[#1D1D1D] regular capitalize text-[13px]`}
          data-cy="productName_productPage"
        >
          <Skeleton width={90} height={14} borderRadius={4} />
        </div>
      </div>
    </>
  );
}

export default ProductNameAndBrandSkeleton;
