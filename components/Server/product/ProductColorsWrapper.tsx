import ProductColors from "components/products/ProductColors";
import Image from "next/image";

import {
  getConfiguredImage,
  GetImageUrl,
  translateFunction,
} from "utils/server";

import "styles/listing.css";
import NextLink from "components/global/NextLink";
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
      data-cy="AvailableColor"
    >
      <div
        className={`${
          isRtl && "items-end"
        } colors-label flex-col align-start py-[8px] justify-center gap-[4px]`}
      >
        <img src="/icons/colors.svg" data-cy="ColorsIcon" />
        <span
          data-cy="Color-Length"
          className="regular text-[9px] text-[#1d1d1d] "
        >
          {translateFunction("Available ", language)} {colors?.length || 0}{" "}
          {translateFunction("Color", language)}
        </span>
        <span
          data-cy="Color-Length"
          className="regular text-[11px] flex-row gap-[3px] text-[#1d1d1d] "
        >
          {colors?.length} {translateFunction("Color", language)}{" "}
          {translateFunction("Available ", language)}
        </span>
      </div>
      <ProductColors isRtl={isRtl}>
        {colors?.map((color) =>
          color?.color_name === activeColor ||
          color?.color_option === activeColor ? (
            <div
              key={color?.color_name || color?.color_option}
              className="min-w-[50px] w-[50px] h-[73px] relative select-none cursor-pointer"
            >
              {color?.color_trend && (
                <span className="absolute top-[-6px] left-[-2px] z-50">
                  <img src="/icons/TrendColorIcon.svg" />
                </span>
              )}
              {getBorder(color?.color_name, activeColor)}
              <Image
                src={getConfiguredImage({
                  src: GetImageUrl(color?.images?.[0]),
                  width: 70,
                  height: 90,
                })}
                width={50}
                height={73}
                className="w-[50px] h-[73px] rounded-[6px] select-none"
                alt={color.color_name}
              />
            </div>
          ) : (
            <NextLink
              href={`/${country}-${language}/products/${slug}?color=${color?.color_option}`}
              key={color?.color_name || color?.color_option}
              className="min-w-[50px] w-[50px] h-[73px] relative select-none cursor-pointer"
            >
              {color?.color_trend && (
                <span className="absolute top-[-6px] left-[-2px] z-50">
                  <img src="/icons/TrendColorIcon.svg" />
                </span>
              )}
              {getBorder(color?.color_name, activeColor)}
              <Image
                src={getConfiguredImage({
                  src: GetImageUrl(color?.images?.[0]),
                  width: 70,
                  height: 90,
                })}
                width={50}
                height={73}
                className="w-[50px] h-[73px] rounded-[6px] select-none"
                alt={color.color_name}
              />
            </NextLink>
          )
        )}
      </ProductColors>
    </div>
  );
}

export default ProductColorsWrapper;
export const getBorder = (color, activeColor) => {
  if (color === activeColor)
    return (
      <svg
        className="absolute top-0 left-0 z-40"
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="73"
        viewBox="0 0 50 73"
      >
        <g id="Path_23648" data-name="Path 23648" fill="none">
          <path
            d="M6,0H44a6,6,0,0,1,6,6V67a6,6,0,0,1-6,6H6a6,6,0,0,1-6-6V6A6,6,0,0,1,6,0Z"
            stroke="none"
          />
          <path
            d="M 6 0.5 C 2.967288970947266 0.5 0.5 2.967292785644531 0.5 6 L 0.5 67 C 0.5 70.03270721435547 2.967288970947266 72.5 6 72.5 L 44 72.5 C 47.03271102905273 72.5 49.5 70.03270721435547 49.5 67 L 49.5 6 C 49.5 2.967292785644531 47.03271102905273 0.5 44 0.5 L 6 0.5 M 6 0 L 44 0 C 47.3137092590332 0 50 2.686286926269531 50 6 L 50 67 C 50 70.31369781494141 47.3137092590332 73 44 73 L 6 73 C 2.686290740966797 73 0 70.31369781494141 0 67 L 0 6 C 0 2.686286926269531 2.686290740966797 0 6 0 Z"
            stroke="none"
            fill="#513AAF"
          />
        </g>
      </svg>
    );
  else
    return (
      <svg
        className="absolute top-0 left-0 z-40"
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="73"
        viewBox="0 0 50 73"
      >
        <g id="Path_23648" data-name="Path 23648" fill="none">
          <path
            d="M6,0H44a6,6,0,0,1,6,6V67a6,6,0,0,1-6,6H6a6,6,0,0,1-6-6V6A6,6,0,0,1,6,0Z"
            stroke="none"
          />
          <path
            d="M 6 0.5 C 2.967288970947266 0.5 0.5 2.967292785644531 0.5 6 L 0.5 67 C 0.5 70.03270721435547 2.967288970947266 72.5 6 72.5 L 44 72.5 C 47.03271102905273 72.5 49.5 70.03270721435547 49.5 67 L 49.5 6 C 49.5 2.967292785644531 47.03271102905273 0.5 44 0.5 L 6 0.5 M 6 0 L 44 0 C 47.3137092590332 0 50 2.686286926269531 50 6 L 50 67 C 50 70.31369781494141 47.3137092590332 73 44 73 L 6 73 C 2.686290740966797 73 0 70.31369781494141 0 67 L 0 6 C 0 2.686286926269531 2.686290740966797 0 6 0 Z"
            stroke="none"
            fill="#d3d3d3"
          />
        </g>
      </svg>
    );
};
