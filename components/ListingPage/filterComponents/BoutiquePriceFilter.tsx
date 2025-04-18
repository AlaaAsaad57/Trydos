import React from "react";
import FilterLabel from "./FilterLabel";

import PriceCancel from "public/svg/listing/PriceCancel.svg";
import PriceSlider from "./PriceSlider";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { RoundPrice, Sendevent, UpdateFilter } from "utils/functions";
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

  const pathName = useParams();

  const set_Value = (e) => {
    if (
      (e.min === selectedFilter.prices.min &&
        e.max === selectedFilter.prices.max) ||
      (e.min === filters.prices.min_price && e.max === filters.prices.max_price)
    ) {
      return;
    } else if (e.min < e.max) {
      setFilterLoading(true);
      Sendevent({
        event: "button_clicked",
        value: "add_filter_button",
        extra: {
          type: "price",
          name: `${e.min / currency?.exchange_rate} - ${
            e.max / currency?.exchange_rate
          }`,
        },
      });
      filterPrice({
        min: e.min / currency?.exchange_rate,
        max: e.max / currency?.exchange_rate,
      });
      UpdateFilter({
        boutiqueId: pathName.productCategory,
        lang: pathName.lang,
        sizesAttr: filters.sizesAttr,
        newFiltersCallback: ({ filtersVar }) => {
          editFilter(filtersVar);
        },
        searchText: "",
        done: () => {
          setFilterLoading(false);
        },
      });
    }
  };

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
      <PriceSlider
        min={
          getPrice(selectedFilter?.prices?.min) >= 0
            ? getPrice(selectedFilter?.prices?.min)
            : 100
        }
        max={getPrice(selectedFilter?.prices?.max) || 500}
        Value={{
          min: getPrice(filters?.prices?.min_price),
          max: getPrice(filters?.prices?.max_price),
        }}
        set_Value={(e) => {
          set_Value(e);
        }}
      />
      <PriceChart
        points={
          filters?.prices?.priceRanges?.map((s) => s.products_count) || [0]
        }
      />
    </div>
  );
}

export default BoutiquePriceFilter;
