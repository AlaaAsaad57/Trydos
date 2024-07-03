import React from "react";
import FilterLabel from "./FilterLabel";
import BrandRow from "./BrandRow";

function BoutiqueBrandFilter() {
  return (
    <div className="flex-col justify-start align-start filter-container">
      {<FilterLabel text="Filter By Brand" />}
      <div className="boutique-category-filter flex-row">
        <BrandRow />
      </div>
    </div>
  );
}

export default BoutiqueBrandFilter;
