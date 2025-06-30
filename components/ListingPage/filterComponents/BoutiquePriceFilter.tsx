import React from "react";
import FilterLabel from "./FilterLabel";

import PriceCancel from "public/svg/listing/PriceCancel.svg";
import PriceSlider from "./PriceSlider";
import dynamic from "next/dynamic";
import { RoundPrice } from "utils/functions";
import { useAppStore } from "store";

const PriceChart = dynamic(() => import("./PriceChart"), {
  ssr: false,
});
function BoutiquePriceFilter() {
  const {
    setFilterLoading,
    filterPrice,
    resetPrice,
    editFilter,
    selectedFilter,
    filters,
    currency,
    settings,
  } = useAppStore();

  const getPrice = (num) => {
    return RoundPrice({
      num: num,
      rate: currency?.exchange_rate,
      points:
        (settings && settings["starting-setting"]?.decimal_point_settings) || 0,
    });
  };
  return (
    <div className="flex-col justify-start align-start filter-container relative w-full mt-[10px] pb-6">
      {<FilterLabel text="Filter By Price" />}
      <PriceCancel
        className="price-cancel-icon"
        onClick={() => {
          resetPrice();
        }}
      />
      <div className="price-min-max flex-row z-20">
        {selectedFilter?.prices?.min >= 0 && (
          <div className="price-min">
            Min {getPrice(filters.prices?.min_price)}{" "}
            <span>{currency?.symbol}</span>
          </div>
        )}
        {selectedFilter?.prices?.max >= 0 && (
          <div className="price-max">
            Max {getPrice(filters.prices?.max_price)}{" "}
            <span>{currency?.symbol}</span>
          </div>
        )}
      </div>
      <PriceSlider />
      <PriceChart
        points={
          filters?.prices?.priceRanges?.map((s) => s.products_count) || [0]
        }
      />
    </div>
  );
}

export default BoutiquePriceFilter;
