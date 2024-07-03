import React, { useState } from "react";
import FilterLabel from "./FilterLabel";
import PriceRow from "./PriceRow";
import PriceCancel from "public/svg/listing/PriceCancel.svg";
import PriceSlider from "./PriceSlider";
import PriceChart from "./PriceChart";
function BoutiquePriceFilter() {
  const [Value, set_Value] = useState({ min: 200, max: 500 });

  return (
    <div className="flex-col justify-start align-start filter-container relative">
      {<FilterLabel text="Filter By Price" />}
      <PriceCancel className="price-cancel-icon" />
      <div className="price-min-max flex-row">
        <div className="price-min">
          Min {Value.min} <span>USD</span>
        </div>
        <div className="price-max">
          Max {Value.max} <span>USD</span>
        </div>
      </div>
      <PriceSlider
        Value={Value}
        set_Value={(e) => {
          set_Value(e);
        }}
      />
      <PriceChart />
    </div>
  );
}

export default BoutiquePriceFilter;
