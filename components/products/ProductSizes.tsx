"use client";
import React, { useState } from "react";
import SizesIcon from "public/svg/product/SizesIcon.svg";
import ColorsInfo from "public/svg/product/colorsInfo.svg";
import NormalSizesSlider from "./NormalSizesSlider";
import DashedCircleBorder from "public/svg/product/DashedCircleBorder.svg";
import SizeInfoBox from "./SizeInfoBox";
import { RoundPrice, translateFunction } from "utils/functions";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useAppStore } from "store";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { ProductSizesPropsType } from "models/componentType/productTypes/MultiComponentOnProductPage";
import StackedSlider from "utils/Slider";
import { GAevent } from "utils/gtag";
import auth from "services/auth";

function ProductSizes({ sizes }: ProductSizesPropsType) {
  const { showInfoMessage, product, SelectedProduct, currency } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  const [extended, setExtended] = useState(false);
  const [activeColor, setActiveColorFunc] = useState(sizes[0]?.option);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const setActiveColor = (e) => {
    setActiveColorFunc(e);
    let variant = e?.option;
    let color = searchParams.get("color");
    if (color?.length) {
      variant = `${color}-${e?.option}`;
    }
    GAevent({
      action: GA_EVENT_NAMES.CHANGE_COLOR,
      params: {
        user_custom_id: auth.UserID(),
        item_id: SelectedProduct.id,
        item_name: SelectedProduct?.name,
        brand: SelectedProduct?.brand?.name,
        brand_id: SelectedProduct?.brand?.id,
        category:
          SelectedProduct?.category?.name ||
          SelectedProduct?.categories?.[0]?.name,
        category_id:
          SelectedProduct?.category?.id || SelectedProduct?.categories?.[0]?.id,
        price: RoundPrice({
          num: SelectedProduct?.offer_price,
          rate: currency?.exchange_rate,
          returnNumber: true,
          language: "en",
        }),
        selected_color: color,
        selected_size: e.option,
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
  return (
    <div
      className={`product-colors product-sizes flex-row align-start relative ${
        extended && "extended-sizes-container"
      }`}
    >
      <div className="colors-label flex-row align-center">
        <SizesIcon data-cy="SizeIcon" />
        <span style={{ marginLeft: "5px" }} data-cy="SizeSpan">
          {translate("Available ")} {sizes.length} {translate("Sizes")}
        </span>
        <ColorsInfo
          data-cy="QuestionMark"
          style={{ marginLeft: "9px" }}
          onClick={() => {
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.SHOW_AVAILABLE_SIZE_INFO_MESSAGE,
            // });
            showInfoMessage({
              showInfoMessage: true,
              title: ` Available ${sizes.length} Sizes`,
              text: "According To The Opinions Of Our Fashion Team, The Appropriate Occasions For This Product Have Been Identified Based On Long Experience. We Provide An Opinion Only And Opinions May Differ From One Person To Another. So It Is Suitable For",
              icon: "/svg/product/SizesIcon.svg",
              value: [],
            });
          }}
        />
      </div>
      <NormalSizesSlider
        close={() => setExtended(false)}
        sizes={sizes}
        activeColor={activeColor}
        active={extended}
        setActiveColor={(e) => {
          const newParams = new URLSearchParams(searchParams);
          newParams.set("size", e);
          // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
          router.push(pathname + `?${newParams.toString()}`, { shallow: true });
          setActiveColor(e);
        }}
      />
      <div
        className={`colors-row flex-row mr-[20px] ${
          extended && "colors-row-extended disable-slider"
        }`}
        style={{ width: `${120}px` }}
        onClick={() => {
          if (extended === false) {
            GAevent({
              action: GA_EVENT_NAMES.VIEW_SIZE_COLOR_CHART,
              params: {
                user_custom_id: auth.UserID(),
                item_id: SelectedProduct.id,
                item_name: SelectedProduct?.name,
                brand: SelectedProduct?.brand?.name,
                brand_id: SelectedProduct?.brand?.id,
                category:
                  SelectedProduct?.category?.name ||
                  SelectedProduct?.categories?.[0]?.name,
                category_id:
                  SelectedProduct?.category?.id ||
                  SelectedProduct?.categories?.[0]?.id,
                price: RoundPrice({
                  num: SelectedProduct?.offer_price,
                  rate: currency?.exchange_rate,
                  returnNumber: true,
                  language: "en",
                }),
              },
            });
          }
          setExtended(!extended);
        }}
      >
        <StackedSlider
          initial_index={0}
          slidesArray={sizes.map((size, index) => index)}
          slide_width={40}
          max_drag={100}
          max_scale={1}
          min_scale={0.6}
          onSlideChange={(index) => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set("size", sizes[index].name);
            router.push(pathname + `?${newParams.toString()}`, {
              scroll: false,
              // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
              shallow: true,
            });
          }}
          overlap_factor={0.4}
          renderSlide={({ index, isActive, slide_width }) => {
            let size = sizes[index];
            return (
              <div
                className={`color-circle relative w-[40px] h-[40px] ${
                  isActive && "active-color-circle"
                }`}
              >
                <div className={`size-circle ${isActive && "active-size"}`}>
                  {size.name}
                </div>

                <DashedCircleBorder />
              </div>
            );
          }}
        />
      </div>
      {extended && <SizeInfoBox />}
    </div>
  );
}

export default ProductSizes;
