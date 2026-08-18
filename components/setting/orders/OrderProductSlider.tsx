import Image from "next/image";
import React from "react";
import { getConfiguredImage } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";

const OrderProductSlider = ({
  products,
  isRtl,
  // Optional Hidden-Orders affordances (default off → the live order list is
  // untouched). When a product's id is in `hiddenDetailIds`, its tile is dimmed
  // and an eye button is overlaid; tapping it calls `onRestoreProduct(id)`.
  hiddenDetailIds,
  onRestoreProduct,
}: {
  products: any[];
  isRtl: boolean;
  hiddenDetailIds?: Set<number>;
  onRestoreProduct?: (detailId: number) => void;
}) => {
  return (
    <div
      className={`${
        isRtl ? "flex-row-reverse" : "flex-row"
      } items-center pl-[12px] mt-[12px] whitespace-nowrap overflow-x-scroll overflow-y-hidden [&::-webkit-scrollbar]:hidden`}
    >
      {products.map((product) => {
        const isProductHidden = !!hiddenDetailIds?.has(product.id);
        return (
          <div
            key={product.id}
            className="flex-row cursor-pointer items-center relative min-w-[91px] w-[91px] h-[125px] ml-[5px]"
          >
            <Image
              className={`w-[91px] h-[125px] object-cover   bg-white rounded-[15px] ${
                isProductHidden ? "opacity-40" : ""
              }`}
              src={getConfiguredImage({
                src: GetImageUrl(product?.image),
                width: 91,
                height: 125,
              })}
              alt="OrderImage"
              width={100}
              height={100}
              style={{
                border: "1px solid #FFFFFF7F",
              }}
            />
            <div
              className="absolute z-10 top-0 left-0 w-full h-full "
              style={{
                boxShadow: "inset 0px 3px 6px rgba(255, 255, 255, 0.5)",
              }}
            />
            {isProductHidden && onRestoreProduct && (
              <button
                type="button"
                data-pw="restore-hidden-product"
                aria-label="Restore hidden product"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRestoreProduct(product.id);
                }}
                className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-[36px] h-[36px] rounded-full bg-white/90 shadow-md"
              >
                <img
                  className="w-[18px] h-[18px]"
                  src="/icons/EyeIcon.svg"
                  alt=""
                />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrderProductSlider;
