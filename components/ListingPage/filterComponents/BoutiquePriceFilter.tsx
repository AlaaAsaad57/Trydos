import React, { useState } from "react";
import FilterLabel from "./FilterLabel";
import PriceRow from "./PriceRow";
import PriceCancel from "public/svg/listing/PriceCancel.svg";
import PriceSlider from "./PriceSlider";
import PriceChart from "./PriceChart";
import { useDispatch, useSelector } from "react-redux";
function BoutiquePriceFilter() {
  const dispatch = useDispatch();
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );
  const filters = useSelector((state: any) => state.details.filters);
  const set_Value = (e) => {
    dispatch({ type: "FILTER-PRICE", payload: e });
  };
  return (
    <div className="flex-col justify-start align-start filter-container relative">
      {<FilterLabel text="Filter By Price" />}
      <PriceCancel
        className="price-cancel-icon"
        onClick={() => {
          dispatch({ type: "RESET-PRICE" });
        }}
      />
      <div className="price-min-max flex-row">
        <div className="price-min">
          Min {selectedFilter.prices.min} <span>USD</span>
        </div>
        <div className="price-max">
          Max {selectedFilter.prices.max} <span>USD</span>
        </div>
      </div>
      <PriceSlider
        min={filters.prices.min_price}
        max={filters.prices.max_price}
        Value={{
          min: selectedFilter.prices.min,
          max: selectedFilter.prices.max,
        }}
        set_Value={(e) => {
          set_Value(e);
        }}
      />
      <PriceChart />
    </div>
  );
}

export default BoutiquePriceFilter;
