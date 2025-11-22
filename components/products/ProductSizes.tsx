"use client";
import React, { useState } from "react";
import NewSizesIcon from "public/svg/NewSizesIcon";

import { translateFunction } from "utils/functions";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useAppStore } from "store";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { ProductSizesPropsType } from "models/componentType/productTypes/MultiComponentOnProductPage";
// import StackedSlider from "utils/Slider";
import { GAevent } from "utils/gtag";
import auth from "services/auth";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";

function ProductSizes({ sizes, language }: ProductSizesPropsType) {
  const { product, SelectedProduct, editInfo } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang?) => {
    return translateFunction(key, languageVariable);
  };
  // const [extended, setExtended] = useState(false);
  const searchParams = useSearchParams();
  let sizeFromUrl = searchParams?.get("size");
  const [activeColor, setActiveColorFunc] = useState(
    sizes?.find(
      (s) =>
        s.option?.toLowerCase() === sizeFromUrl?.toLowerCase() ||
        s.name?.toLowerCase() === sizeFromUrl?.toLowerCase()
    )?.option ?? sizes[0]?.option
  );

  const pathname = usePathname();
  const router = useRouter();
  const setActiveColor = (e) => {
    editInfo({
      ...SelectedProduct,
      ActiveSize: e?.option ?? e,
    });
    setActiveColorFunc(e);
    let variant = e?.option ?? e;
    let color = searchParams.get("color");
    if (color?.length) {
      variant = `${color}-${e?.option ?? e}`;
    }
    GAevent({
      action: GA_EVENT_NAMES.CHANGE_SIZE,
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
  const isRtl = language === "ar" || language === "ku";

  let new_sizes_options = ["Standard", "EU", "IN", "US", "UK"];
  return (
    <div className="w-full rounded-[15px] mt-[20px] bg-[#FCFCFC] py-[8px] pr-[8px] pl-[10px] h-[135px] flex-col">
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } w-full flex-row justify-between`}
      >
        <div
          className={`${isRtl ? "flex-row-reverse" : "flex-row"}  gap-[20px]`}
        >
          <div className="flex-col text-[#1d1d1d] text-[9px] regular gap-[5px]">
            <NewSizesIcon />
            <span>{translate("Sizes")}</span>
          </div>
          <div
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } flex-row gap-[2px]`}
          >
            <div
              className="uppercase cursor-pointer flex-col rounded-[6px] bg-[#F4F4F4] text-[#1d1d1d] text-[11px] w-auto h-[20px] items-center px-[6px]"
              style={{
                border: "1px solid #D3D3D37f",
              }}
            >
              IN
            </div>
            <div
              className="uppercase cursor-pointer flex-col rounded-[6px] bg-[#fff] text-[#1d1d1d] text-[11px] w-auto h-[20px] items-center px-[6px]"
              style={{
                border: "1px solid #D3D3D37f",
              }}
            >
              CM
            </div>
          </div>
        </div>
        <div
          className={`${
            isRtl ? "flex-row-reverse" : "flex-row"
          } gap-[2px] items-start`}
        >
          {new_sizes_options?.map((s) => (
            <div
              key={s}
              className={`uppercase cursor-pointer rounded-[6px] flex-col w-auto h-[20px] items-center px-[6px] ${
                s === "Standard" ? "bg-[#F4F4F4]" : "bg-[#fff]"
              } text-[#1d1d1d] text-[11px]`}
              style={{
                border: "1px solid #D3D3D37f",
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
      <span
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        }  mt-[5px] text-[#1d1d1d]`}
      >
        {sizes?.length} {translateFunction("Sizes Available", language)}
      </span>
      <HortiznalScrollBar
        className={`w-full mt-[8px] ${
          isRtl ? "flex-row-reverse" : "flex-row"
        } gap-[2px]`}
        id="sizes-new-bar"
      >
        {sizes.map((s) => (
          <div
            key={s?.option}
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set("size", s?.option);
              router.push(pathname + `?${newParams.toString()}`, {
                // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
                shallow: true,
                scroll: false,
              });
              setActiveColor(s?.option);
            }}
            className={`uppercase justify-center cursor-pointer rounded-[6px] flex-col  w-auto h-[46px]  min-w-[50px] items-center px-[6px] ${
              s?.option === activeColor ? "bg-[#F4F4F4]" : "bg-[#fff]"
            } text-[#1d1d1d] text-[11px]`}
            style={{
              border: "1px solid #D3D3D37f",
            }}
          >
            <span> {s?.name}</span>
            <span> {s?.option}</span>
          </div>
        ))}
      </HortiznalScrollBar>
    </div>
  );
}

export default ProductSizes;
