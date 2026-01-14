import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import Image from "next/image";
import React from "react";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";

function SizeSelect({
  sizes,
  selectedSize,
  setSelectedSize,
  qty,
  isSizeNotified,
  sizeQty,
  isCollectAfterOrder,
}) {
  let new_sizes_options = ["Standard", "EU", "IN", "US", "UK"];
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      className={` w-full flex-col mt-[12px] px-[12px] gap-[12px]`}
      id={"size-select"}
    >
      <div
        className={`${
          isRtl ? "flex-row-reverse" : "flex-row"
        } flex h-[28px] w-full rounded-[10px] bg-[#F8F8F8] relative items-center px-[12px] gap-[4px]`}
      >
        <Image
          alt="sizes-icon"
          src={"/icons/NewSizesIcon.svg"}
          width={14}
          height={14}
          className="max-h-[14px] object-contain"
        />
        <span className="text-[#1d1d1d] text-[11px] regular">
          {translateFunction("Select Your Required Size")}
        </span>
      </div>
      <div className="flex flex-col w-full">
        <div
          className={`${
            isRtl ? "flex-row-reverse" : "flex-row"
          } flex justify-between w-full px-[12px]`}
        >
          <div
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } flex gap-[2px]`}
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
              className="uppercase cursor-pointer flex-col rounded-[6px] bg-[#FCFCFC] text-[#1d1d1d] text-[11px] w-auto h-[20px] items-center px-[6px]"
              style={{
                border: "1px solid #D3D3D37f",
              }}
            >
              CM
            </div>
          </div>
          <div
            className={`${
              isRtl ? "flex-row-reverse" : "flex-row"
            } flex gap-[2px] items-start`}
          >
            {new_sizes_options?.map((s) => (
              <div
                key={s}
                className={`uppercase cursor-pointer rounded-[6px] flex-col w-auto h-[20px] items-center px-[6px] ${
                  s === "Standard" ? "bg-[#F4F4F4]" : "bg-[#FCFCFC]"
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
        <HortiznalScrollBar
          className={`w-full ${
            isRtl ? "flex-row-reverse" : "flex-row"
          } flex gap-[2px] px-[22px] pt-[11px]`}
          id="sizes-new-bar-cart"
        >
          {sizes.map((s) => (
            <div
              key={s?.option}
              onClick={() => {
                setSelectedSize(s?.option);
              }}
              data-cy="add-to-cart-size"
              className={`${
                sizeQty(s?.option) === 0 && !isCollectAfterOrder
                  ? "bg-[#FFF2F2]"
                  : s?.option === selectedSize
                  ? "bg-[#F4F4F4] relative"
                  : "bg-[#FCFCFC]"
              } uppercase relative justify-center cursor-pointer rounded-[6px] flex-col  w-auto h-[47px]  min-w-[50px] items-center px-[6px] text-[#1d1d1d] text-[11px]`}
              style={{
                border:
                  sizeQty(s?.option) === 0 && !isCollectAfterOrder
                    ? "1px solid #FF5F617f"
                    : "1px solid #D3D3D37f",
              }}
            >
              {selectedSize &&
                (s?.option === selectedSize ||
                  s?.option === selectedSize?.option) && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    height="47"
                    className="absolute top-0 left-0 z-20"
                  >
                    <rect
                      x="0.25"
                      y="0.25"
                      width="calc(100% - 0.5px)"
                      height="46.5"
                      rx="5.75"
                      stroke="#513aaf"
                      strokeWidth="0.5"
                      fill="none"
                    />
                  </svg>
                )}
              {isSizeNotified(s?.option ?? s) && (
                <span
                  className="absolute top-[-6px] left-[4px]"
                  data-cy="is-size-notified"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                  >
                    <defs>
                      <clipPath id="12234">
                        <rect
                          id="Rectangle_6498"
                          data-name="Rectangle 6498"
                          width="12"
                          height="12"
                          transform="translate(200 852.245)"
                          fill="none"
                        />
                      </clipPath>
                    </defs>
                    <g
                      id="Mask_Group_858"
                      data-name="Mask Group 858"
                      transform="translate(-200 -852.245)"
                      clipPath="url(#12234)"
                    >
                      <g id="ringing-2" transform="translate(200.511 851.981)">
                        <g
                          id="Group_14969"
                          data-name="Group 14969"
                          transform="translate(8.499 0.383)"
                        >
                          <path
                            id="Path_23675"
                            data-name="Path 23675"
                            d="M24.272,6.115a.511.511,0,0,1-.511-.511A5.332,5.332,0,0,0,22.19,1.81a.511.511,0,0,1,.723-.723A6.346,6.346,0,0,1,24.783,5.6.511.511,0,0,1,24.272,6.115Z"
                            transform="translate(-22.04 -0.937)"
                            fill="#513aaf"
                          />
                        </g>
                        <g
                          id="Group_14970"
                          data-name="Group 14970"
                          transform="translate(0 0.383)"
                        >
                          <path
                            id="Path_23676"
                            data-name="Path 23676"
                            d="M1.761,6.115A.511.511,0,0,1,1.25,5.6,6.346,6.346,0,0,1,3.121,1.087a.511.511,0,1,1,.723.723A5.331,5.331,0,0,0,2.272,5.6a.511.511,0,0,1-.511.511Z"
                            transform="translate(-1.25 -0.937)"
                            fill="#513aaf"
                          />
                        </g>
                        <g
                          id="Group_14971"
                          data-name="Group 14971"
                          transform="translate(0.511 0)"
                        >
                          <path
                            id="Path_23677"
                            data-name="Path 23677"
                            d="M12.4,8.643a3.423,3.423,0,0,1-1.216-2.619V4.6A3.58,3.58,0,0,0,8.121,1.063V.511A.511.511,0,1,0,7.1.511v.552A3.579,3.579,0,0,0,4.033,4.6V6.024a3.426,3.426,0,0,1-1.22,2.623.894.894,0,0,0,.582,1.573h8.432A.894.894,0,0,0,12.4,8.643Z"
                            transform="translate(-2.5 0)"
                            fill="#513aaf"
                          />
                          <path
                            id="Path_23678"
                            data-name="Path 23678"
                            d="M12.285,27.783a1.919,1.919,0,0,0,1.877-1.533H10.407A1.919,1.919,0,0,0,12.285,27.783Z"
                            transform="translate(-7.175 -15.519)"
                            fill="#513aaf"
                          />
                        </g>
                      </g>
                    </g>
                  </svg>
                </span>
              )}
              <span> {s?.name}</span>
              <span className="lowercase"> {s?.option}</span>
            </div>
          ))}
        </HortiznalScrollBar>
      </div>
      {selectedSize ? (
        <SizeWarning
          isCollectAfterOrder={isCollectAfterOrder}
          size={selectedSize}
          qty={qty}
        />
      ) : (
        <></>
      )}
    </div>
  );
}

export default SizeSelect;

const SizeWarning = ({ qty, size, isCollectAfterOrder }) => {
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  if (qty > 0 || isCollectAfterOrder) {
    return (
      <div className="flex flex-row items-center mt-[11px] gap-[4px] w-full justify-center px-[24px]">
        <Image
          alt="sizes-icon"
          src={"/icons/RecomendedSize.svg"}
          width={14}
          height={14}
          className="max-h-[14px] object-contain"
        />
        <div className="flex flex-row items-center text-[11px] text-[#404040] regular gap-[4px] align-baseline pt-[1px]">
          <span className="bold flex items-center">M | 38</span>
          <span className="flex items-center">
            {translateFunction("Recommended")}
          </span>
          <span className="bold flex items-center">
            {translateFunction("Size")}
          </span>
          <span className="flex items-center">
            {translateFunction("For You")}
          </span>
          {qty <= 10 && !isCollectAfterOrder && (
            <span
              className={`${
                isRtl && "dir-rtl"
              } text-[#FF6200] flex items-center`}
            >
              {translateFunction("Last")} {qty}
            </span>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex flex-row items-center mt-[11px] gap-[4px] w-full justify-center px-[24px]">
        <div className="flex flex-row items-center text-[11px] text-[#FF5F61] regular gap-[4px] align-baseline pt-[1px]">
          <span className="bold flex items-center">
            {size?.name ?? size} | {size?.name ?? size}
          </span>
          <span className="flex items-center">
            {translateFunction("Not Available Now, Stock Is Sold Out")}
          </span>
        </div>
      </div>
    );
  }
};
