"use client";
import ColorsIcon from "public/svg/product/colors.svg";
import ColorsInfo from "public/svg/product/colorsInfo.svg";
import React, { useEffect, useState } from "react";
import { getConfiguredImage, translateFunction } from "utils/functions";
import "styles/listing.css";
import SquareIcon from "public/svg/product/SquareIcon.svg";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import CircleBorder from "public/svg/product/CircleBorder";
import NormalColorSlider from "./NormalColorSlider";
import { useAppStore } from "store";
import { GetImageUrl } from "utils/tinyUtils";
import { ProductColorsPropsType } from "models/componentType/productTypes/MultiComponentOnProductPage";
import StackedSlider from "utils/Slider";
import { GAevent } from "utils/gtag";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import auth from "services/auth";

function ProductColors({ colors, ProductColorsArray }: ProductColorsPropsType) {
  const { setActiveColorDetails, showInfoMessage, product } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const [extended, setExtended] = useState(false);

  const activeColor = product.activeColor;
  const setActiveColor = (e) => {
    setActiveColorDetails(e);
    let variant = e?.color_option;
    let size = searchParams.get("size");
    if (size?.length) {
      variant += `-${size}`;
    }
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
  const getSize: (i: number) => number = (i) => {
    return 40;
  };

  return (
    <div
      className={`product-colors flex-row align-start relative ${
        extended && "extended-colors-container"
      }`}
      data-cy="AvailableColor"
    >
      {extended && <SquareIcon className="square-icon" />}
      <div className="colors-label flex-row align-center">
        <ColorsIcon data-cy="ColorsIcon" />
        <span style={{ marginLeft: "5px" }} data-cy="Color-Length">
          {translate("Available ")} {colors?.length || 0} {translate("Color")}
        </span>
        <ColorsInfo
          data-cy="QuestionMark"
          style={{ marginLeft: "9px" }}
          onClick={() => {
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.SHOW_AVAILABLE_COLOR_INFO_MESSAGE,
            // });
            showInfoMessage({
              showInfoMessage: true,
              title: `Available ${colors.length} Color`,
              text: "The Colors In The Image Are Intended To Give Approximate Information About The Color Of The Product And 100% Compatibility Is Not Guaranteed. However, The Display And Resolution Of Your Electronic Device There May Be Differences Between The Color Images And The Colors Of The Products Due To The Settings. It Is Technically Possible For An Inevitable Difference To Occur. Trydos Because Of The Difference. Does Not Have Any Liability.",
              icon: "/svg/product/colors.svg",
              value: [],
            });
          }}
        />
      </div>
      <NormalColorSlider
        close={() => setExtended(false)}
        ProductColorsArray={ProductColorsArray}
        colors={colors}
        activeColor={activeColor}
        active={extended}
        setActiveColor={(e) => {
          const newParams = new URLSearchParams(searchParams);
          newParams.set("color", e.color_option);
          // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
          router.push(pathname + `?${newParams.toString()}`, { shallow: true });
          setActiveColor(e);
        }}
      />
      <div
        className={`colors-row flex-row ${
          extended ? "colors-row-extended disable-slider" : "mr-[20px]"
        }`}
        onClick={() => {
          setExtended(!extended);
        }}
      >
        <StackedSlider
          initial_index={
            (searchParams.get("color") &&
              colors.findIndex(
                (s) =>
                  s.color_option === searchParams.get("color") ||
                  s.color_name === searchParams.get("color")
              )) ??
            0
          }
          slidesArray={colors?.map((s, i) => i)}
          max_drag={100}
          max_scale={1}
          min_scale={0.6}
          overlap_factor={0.4}
          onSlideChange={(index) => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set("color", colors[index].color_option);
            router.push(pathname + `?${newParams.toString()}`, {
              scroll: false,
              // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
              shallow: true,
            });
            setActiveColor(colors[index]);
          }}
          slide_width={40}
          threshold={0.4}
          renderSlide={({ index, isActive, slide_width }) => {
            let color = colors[index];
            return (
              <div
                className={`color-circle relative ${
                  isActive && "active-color-circle"
                }`}
              >
                <img
                  width={getSize(index)}
                  className="max-w-[40px] max-h-[40px]"
                  height={getSize(index)}
                  src={getConfiguredImage({
                    src: GetImageUrl(color.images[0]),
                    width: getSize(index) * 2,
                    height: getSize(index) * 2,
                  })}
                />
                <div className="circel-inset absolute" />
                <CircleBorder
                  color={
                    isActive
                      ? ProductColorsArray?.filter(
                          (s) =>
                            s.option === color.color_option ||
                            s.option === color.color_name
                        )?.[0]?.color
                      : "#fff"
                  }
                />
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

export default ProductColors;
