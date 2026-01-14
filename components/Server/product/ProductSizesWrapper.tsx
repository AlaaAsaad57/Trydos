import HortiznalScrollBar from "components/global/HortiznalScrollBar";

import React from "react";
import { translateFunction } from "utils/server";
import SizeItemWrapper from "./SizeItemWrapper";

async function ProductSizesWrapper({
  language,
  qtyPricePromise,
  isRtl,
  activeSize,
}) {
  let productData = await qtyPricePromise;
  let sizes = productData?.choice_options?.[0]?.options;
  if (!sizes || sizes?.length === 0) return <></>;
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
            <img src="/icons/NewSizesIcon.svg" />
            <span>{translateFunction("Sizes", language)}</span>
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
        <SizeItemWrapper ActiveSize={activeSize}>
          {sizes?.map((s) => (
            <React.Fragment key={s?.option}>
              <span> {s?.name}</span>
              <span> {s?.option}</span>
            </React.Fragment>
          ))}
        </SizeItemWrapper>
      </HortiznalScrollBar>
    </div>
  );
}

export default ProductSizesWrapper;
