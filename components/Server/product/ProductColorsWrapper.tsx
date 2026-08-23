import ProductColors from "components/products/ProductColors";
import ProductColorItem from "components/products/ProductColorItem";

import {
  getConfiguredImage,
  GetImageUrl,
  translateFunction,
} from "utils/server";

import "styles/listing.css";
async function ProductColorsWrapper({
  isRtl,
  globalPromise,
  activeColor,
  language,
  country,
  slug,
}) {
  let product = await globalPromise;
  let colors = product?.sync_color_images;
  if (!colors || colors?.length <= 1) {
    return <></>;
  }
  return (
    <div
      className={`product-colors ${
        isRtl ? "flex-row-reverse " : "flex-row"
      } mt-[12px]  align-start justify-between relative`}
      data-pw="AvailableColor"
    >
      <div
        className={`${
          isRtl && "items-end"
        } colors-label flex-col align-start py-[8px] justify-center gap-[4px]`}
      >
        <img src="/icons/colors.svg" data-pw="ColorsIcon" />
        <span
          data-pw="Color-Length"
          className="regular text-[9px] text-[#1d1d1d] "
        >
          {translateFunction("Available ", language)} {colors?.length || 0}{" "}
          {translateFunction("Color", language)}
        </span>
        <span
          data-pw="Color-Length"
          className="regular text-[11px] flex-row gap-[3px] text-[#1d1d1d] "
        >
          {colors?.length} {translateFunction("Color", language)}{" "}
          {translateFunction("Available ", language)}
        </span>
      </div>
      <ProductColors isRtl={isRtl}>
        {colors?.map((color) => (
          <ProductColorItem
            key={color?.color_name || color?.color_option}
            colorKeys={[color?.color_option, color?.color_name].filter(
              Boolean,
            )}
            serverColor={activeColor}
            href={`/${country}-${language}/products/${slug}?color=${color?.color_option}`}
            imgSrc={getConfiguredImage({
              src: GetImageUrl(color?.images?.[0]),
              width: 70,
              height: 90,
            })}
            alt={color?.color_name}
            trend={Boolean(color?.color_trend)}
          />
        ))}
      </ProductColors>
    </div>
  );
}

export default ProductColorsWrapper;
