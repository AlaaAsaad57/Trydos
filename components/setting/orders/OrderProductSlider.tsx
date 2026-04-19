import Image from "next/image";
import React from "react";
import { getConfiguredImage } from "utils/functions";
import { GetImageUrl } from "utils/tinyUtils";

const OrderProductSlider = ({ products, isRtl }) => {
  return (
    <div
      className={`${
        isRtl ? "flex-row-reverse" : "flex-row"
      } items-center pl-[12px] mt-[12px] whitespace-nowrap overflow-x-scroll overflow-y-hidden [&::-webkit-scrollbar]:hidden`}
    >
      {products.map((product) => (
        <div
          key={product.id}
          className="flex-row cursor-pointer items-center relative min-w-[91px] w-[91px] h-[125px] ml-[5px]"
        >
          <Image
            className="w-[91px] h-[125px] object-cover   bg-white rounded-[15px]"
            src={getConfiguredImage({
              src: GetImageUrl(product?.image),
              width: 91,
              height: 125,
            })}
            alt={product.product_details.name}
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
        </div>
      ))}
    </div>
  );
};

export default OrderProductSlider;
