import React, { useState } from "react";
import FilterLabel from "./FilterLabel";

import PriceCancel from "public/svg/listing/PriceCancel.svg";
import PriceSlider from "./PriceSlider";
import PriceChart from "./PriceChart";
import { useDispatch, useSelector } from "react-redux";
import { filterProducts } from "utils/functions";
import { useParams } from "next/navigation";
function BoutiquePriceFilter() {
  const dispatch = useDispatch();
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );
  const filters = useSelector((state: any) => state.details.filters);
  const pathName = useParams();

  const set_Value = (e) => {
    if (e.min < e.max) {
      dispatch({ type: "FILTER-PRICE", payload: e });
      filter();
    }
  };
  const filter = () => {
    dispatch({ type: "FILTER-START" });
    filterProducts({
      boutiqueId: pathName.productCategory,
      lang: pathName.lang,
      sizesAttr: filters.sizesAttr,
      callback: (products) => {
        dispatch({ type: "GET_PRODUCT", payload: { products } });
      },
      offset: 1,
      newFiltersCallback: ({ filtersVar }) => {
        dispatch({ type: "EDIT-FILTER", payload: filtersVar });
      },
    });
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
      <div className="price-min-max flex-row z-20">
        <div className="price-min">
          Min {selectedFilter.prices.min} <span>USD</span>
        </div>
        <div className="price-max">
          Max {selectedFilter.prices.max} <span>USD</span>
        </div>
      </div>
      <PriceSlider
        min={filters?.prices?.min_price >= 0 ? filters?.prices?.min_price : 100}
        max={filters?.prices?.max_price || 500}
        Value={{
          min: selectedFilter.prices.min,
          max: selectedFilter.prices.max,
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
