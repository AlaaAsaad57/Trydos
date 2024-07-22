import React, { useState } from "react";
import FilterLabel from "./FilterLabel";

import PriceCancel from "public/svg/listing/PriceCancel.svg";
import PriceSlider from "./PriceSlider";
import { useDispatch, useSelector } from "react-redux";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { UpdateFilter } from "utils/functions";
const PriceChart = dynamic(() => import("./PriceChart"), {
  ssr: false,
});
function BoutiquePriceFilter() {
  const dispatch = useDispatch();
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );
  const filters = useSelector((state: any) => state.details.filters);
  const loading = useSelector((state: any) => state.details.loading);
  const pathName = useParams();

  const set_Value = (e) => {
    if (
      (e.min === selectedFilter.prices.min &&
        e.max === selectedFilter.prices.max) ||
      (e.min === filters.prices.min_price && e.max === filters.prices.max_price)
    ) {
      return;
    } else if (e.min < e.max) {
      if (!loading) {
        dispatch({ type: "FILTER-LOADING", payload: true });
        dispatch({ type: "FILTER-PRICE", payload: e });
        UpdateFilter({
          boutiqueId: pathName.productCategory,
          lang: pathName.lang,
          sizesAttr: filters.sizesAttr,
          newFiltersCallback: ({ filtersVar }) => {
            dispatch({ type: "EDIT-FILTER", payload: filtersVar });
          },
          searchText: "",
          done: () => {
            dispatch({ type: "FILTER-LOADING", payload: false });
          },
        });
      }
    }
  };

  return (
    <div className="flex-col justify-start align-start filter-container relative w-full mt-[10px] pb-6">
      {<FilterLabel text="Filter By Price" />}
      <PriceCancel
        className="price-cancel-icon"
        onClick={() => {
          dispatch({ type: "RESET-PRICE" });
        }}
      />
      <div className="price-min-max flex-row z-20">
        {selectedFilter?.prices?.min >= 0 && (
          <div className="price-min">
            Min {selectedFilter.prices.min}{" "}
            <span>{filters.prices?.currency_symbol}</span>
          </div>
        )}
        {selectedFilter?.prices?.max >= 0 && (
          <div className="price-max">
            Max {selectedFilter.prices.max}{" "}
            <span>{filters.prices?.currency_symbol}</span>
          </div>
        )}
      </div>
      <PriceSlider
        min={
          selectedFilter?.prices?.min >= 0 ? selectedFilter?.prices?.min : 100
        }
        max={selectedFilter?.prices?.max || 500}
        Value={{
          min: filters?.prices?.min_price,
          max: filters?.prices?.max_price,
        }}
        set_Value={(e) => {
          set_Value(e);
        }}
      />
      <PriceChart
        points={
          filters.prices?.priceRanges?.map((s) => s.products_count) || [0]
        }
      />
    </div>
  );
}

export default BoutiquePriceFilter;
