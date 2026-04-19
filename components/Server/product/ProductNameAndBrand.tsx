import { GetImageUrl } from "utils/server";

async function ProductNameAndBrand({ globalPromise, isRtl, color }) {
  let product = await globalPromise;
  const getProductText = () => {
    let text_info = [];
    text_info.push(product.name);
    product?.categories?.map((s) => {
      text_info.push(s?.name);
    });
    if (color) {
      const matchingColor = product?.sync_color_images?.find(
        (s) => s.color_option === color || s.color_name === color
      );
      if (matchingColor) {
        text_info.push(matchingColor?.color_name);
      }
    }
    return text_info.join(" | ");
  };
  return (
    <>
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } product-brand-logo flex-row items-center gap-[11px]`}
      >
        {product?.brand?.icon && (
          <img
            width={"auto"}
            height={18}
            src={GetImageUrl(product.brand.icon)}
            alt={product.brand.name}
          />
        )}
        <span>
          <img src="/icons/VerifiedIcon.svg" />
        </span>
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
          {getProductText()}
        </div>
      </div>
    </>
  );
}

export default ProductNameAndBrand;
