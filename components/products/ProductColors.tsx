"use client";
import ColorsIcon from "public/svg/product/colors.svg";
import ColorsInfo from "public/svg/product/colorsInfo.svg";
import React, { useEffect, useState } from "react";
import {
  getConfiguredImage,
  RoundPrice,
  translateFunction,
} from "utils/functions";
import "styles/listing.css";
import TrendColorIcon from "public/svg/product/TrendColorIcon.svg";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { useAppStore } from "store";
import { GetImageUrl } from "utils/tinyUtils";
import { ProductColorsPropsType } from "models/componentType/productTypes/MultiComponentOnProductPage";

import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import auth from "services/auth";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Image from "next/image";

function ProductColors({ colors, ProductColorsArray }: ProductColorsPropsType) {
  const {
    setActiveColorDetails,

    product,
    SelectedProduct,
  } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };

  const setActiveColor = (e) => {
    setActiveColorDetails(e);
    let variant = e?.color_option;
    let size = searchParams.get("size");

    if (size?.length) {
      variant += `-${size}`;
    }
    GAevent({
      action: GA_EVENT_NAMES.CHANGE_COLOR,
      params: {
        user_id_custom: auth.UserID(),
        item_id: SelectedProduct.id,
        item_name: SelectedProduct?.name,
        brand: SelectedProduct?.brand?.name,
        brand_id: SelectedProduct?.brand?.id,
        category:
          SelectedProduct?.category?.name ||
          SelectedProduct?.categories?.[0]?.name,
        category_id:
          SelectedProduct?.category?.id || SelectedProduct?.categories?.[0]?.id,
        price: SelectedProduct?.offer_price,
        selected_color: e?.color_option,
        selected_size: size,
      },
    });
    GAevent({
      action: GA_EVENT_NAMES.ITEM_VARIANT_EXCHANGE,
      params: {
        user_id_custom: auth.UserID(),
        item_id: product?.id,
        item_name: product.name,
        brand: product?.brand?.name,
        category: product?.category?.name,
        item_variant: variant,
        screen_name: GA_GLOBAL_SCREEN.PRODUCT_SCREEN,
        screen_path: window.location.pathname,
      },
    });
  };

  // const setActiveColor = (e) => {
  //   setActiveColorFunc(e);
  // };
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const getBorder = (color, activeColor) => {
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
  const renderColors = () => {
    let activeColor =
      searchParams.get("color") &&
      colors.find(
        (s) =>
          s.color_option === searchParams.get("color") ||
          s.color_name === searchParams.get("color")
      );
    const handleSelectColor = (color) => {
      const newParams = new URLSearchParams(searchParams);
      const colorOption = color?.color_option || color?.color_name;
      if (colorOption) {
        newParams.set("color", colorOption);
        router.push(pathname + `?${newParams.toString()}`, {
          // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
          shallow: true,
        });
      }
      setActiveColor(color);
    };
    return (
      <HortiznalScrollBar
        id="products-colors-slider"
        className="flex-row  w-auto max-w-[50%] gap-[2px] h-[84px] items-center translate-y-[-6px]"
      >
        {colors.map((color) => (
          <div
            className="min-w-[50px] w-[50px] h-[73px] relative select-none cursor-pointer"
            onClick={() => {
              handleSelectColor(color);
            }}
          >
            {color?.color_trend && (
              <span className="absolute top-[-6px] left-[-2px] z-50">
                <TrendColorIcon />
              </span>
            )}
            {getBorder(color?.color_name, activeColor?.color_name)}
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
        ))}
      </HortiznalScrollBar>
    );
  };
  return (
    <div
      className={`product-colors mt-[12px] flex-row align-start justify-between relative`}
      data-cy="AvailableColor"
    >
      <div className="colors-label flex-col align-start py-[8px] justify-center gap-[4px]">
        <ColorsIcon data-cy="ColorsIcon" />
        <span
          data-cy="Color-Length"
          className="regular text-[9px] text-[#1d1d1d] "
        >
          {translate("Available ")} {colors?.length || 0} {translate("Color")}
        </span>
        <span
          data-cy="Color-Length"
          className="regular text-[11px] flex-row gap-[3px] text-[#1d1d1d] "
        >
          {colors?.length || 0} {translate("Color")} {translate("Available ")}
        </span>
      </div>
      {renderColors()}
    </div>
  );
}

export default ProductColors;
