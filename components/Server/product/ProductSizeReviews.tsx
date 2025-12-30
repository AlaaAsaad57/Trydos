import React from "react";
import { GetProductGeneralData } from "serverRequests/product";
import { translateFunction } from "utils/server";

async function ProductSizeReviews({ qtyPricePromise, language, isRtl }) {
  let productData = await qtyPricePromise;
  let sizes = productData?.choice_options?.[0]?.options;

  if (sizes?.length === 0) return <></>;

  let size_reviews = await GetProductGeneralData({
    id: productData?.id,
  });

  let sizeFitData = size_reviews.size_analysis;
  let reviews_arr = [
    { value: sizeFitData?.true_percentage ?? 0, title: "True" },
    { value: sizeFitData?.small_percentage ?? 0, title: "Small" },
    { value: sizeFitData?.large_percentage ?? 0, title: "Large" },
    // { value: sizeFitData?.big_percentage ?? 0, title: "Big" },
  ];

  return (
    <div
      className={`${
        isRtl && "items-end"
      } flex-col mt-[12px] px-[10px] w-full h-[50px]`}
    >
      <div className="text-[#1d1d1d] text-[11px] regular">
        {translateFunction("Buyers Reviews On Product Sizing", language)}
      </div>
      <div
        className={`flex-row w-full mt-[12px] flex-wrap gap-y-[8px] gap-x-[15px]`}
        style={{
          direction: isRtl ? "rtl" : "ltr",
        }}
      >
        {reviews_arr.map((r) => (
          <ReviewProgress
            language={language}
            title={r.title}
            value={r.value}
            key={r.title}
          />
        ))}
      </div>
    </div>
  );
}

export default ProductSizeReviews;

const ReviewProgress = ({ value, title, language }) => {
  return (
    <div className="flex-col gap-[4px] min-w-[120px] w-1/3 max-w-[30%]">
      <div className="flex-row items-center text-[#1d1d1d] text-[11px] regular gap-[6px]">
        <span>{translateFunction(title, language)}</span>
        <span className="bold">{value} %</span>
      </div>
      <div className="flex-row w-full h-[5px] rounded-[5px] bg-[#FCFCFC] relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="5"
          className="absolute top-0 left-0"
        >
          <rect
            x="0.25"
            y="0.25"
            width="calc(100%)"
            height="4.5"
            rx="2.25"
            fill="none"
            stroke="#d3d3d3"
            strokeWidth="0.5"
          />
        </svg>
        <div
          className={`h-[5px] rounded-[5px] bg-[#1d1d1d]`}
          style={{
            width: `${value}%`,
          }}
        />
      </div>
    </div>
  );
};
