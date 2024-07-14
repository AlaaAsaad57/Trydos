import React from "react";
import FilterLabel from "./FilterLabel";
import BrandRow from "./BrandRow";

function BoutiqueBrandFilter({ filterEnabled }) {
  return (
    <>
      {filterEnabled && <FilterLabel text="Filter By Brand" />}
      <div className="boutique-category-filter flex-row">
        <BrandRow />
      </div>
    </>
  );
}

export default BoutiqueBrandFilter;
