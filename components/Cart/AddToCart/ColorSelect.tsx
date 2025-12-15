import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import { getBorder } from "components/products/ProductColors";
import Image from "next/image";
import React from "react";
import { useAppStore } from "store";
import { getConfiguredImage, translateFunction } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";

function ColorSelect({
  colors,
  setSelectedColor,
  selectedColor,
  isQtyIsLast,
  IsColorHasDiscount,
}) {
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      className={`w-full flex-col mt-[12px] px-[12px] gap-[12px]`}
      id={"color-select"}
    >
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } flex h-[28px] w-full rounded-[10px] bg-[#F8F8F8] relative items-center px-[12px] gap-[4px]`}
      >
        <Image
          alt="colors-icon"
          src={"/svg/product/colors.svg"}
          width={14}
          height={14}
          className="max-h-[14px] object-contain"
        />
        <span className="text-[#1d1d1d] text-[11px] regular">
          {translateFunction("Select Color")}
        </span>
      </div>
      <HortiznalScrollBar
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } flex items-start w-full gap-[2px]`}
        id="colors-select-for-cart"
      >
        {colors.map((color) => {
          return (
            <div
              className="flex-col items-center"
              key={color.color_option}
              data-cy="add-to-cart-color"
            >
              <div
                key={color?.color_name || color?.color_option}
                className="min-w-[50px] w-[50px] h-[73px] relative select-none cursor-pointer f"
                onClick={() => {
                  setSelectedColor(color);
                }}
              >
                {getBorder(color?.color_name, selectedColor?.color_name)}
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
              {color?.color_option === selectedColor?.color_option ? (
                <span
                  className="mt-[3px] semibold text-[7px] text-[#505050]"
                  data-cy="selected-color-name"
                >
                  {color.color_name}
                </span>
              ) : isQtyIsLast?.(color) &&
                Number(isQtyIsLast(color)?.qty) >= 0 &&
                Number(isQtyIsLast(color)?.qty) <= 10 ? (
                <span
                  style={{
                    direction: isRtl ? "rtl" : "ltr",
                  }}
                  className="mt-[3px] semibold text-[7px] text-[#FF6200]"
                  data-cy="selected-color-name"
                >
                  {translateFunction("Last")} {isQtyIsLast(color)?.qty}
                </span>
              ) : IsColorHasDiscount(color) > 0 ? (
                <span
                  style={{
                    direction: isRtl ? "rtl" : "ltr",
                  }}
                  className="mt-[3px] semibold text-[7px] text-[#513AAF]"
                  data-cy="selected-color-name"
                >
                  {translateFunction("Sale")}{" "}
                  <span>{IsColorHasDiscount(color)} %</span>
                </span>
              ) : (
                <></>
              )}
            </div>
          );
        })}
      </HortiznalScrollBar>
    </div>
  );
}

export default ColorSelect;
