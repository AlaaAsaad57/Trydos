import React from "react";
import FilterLabel from "./FilterLabel";
import SizeRow from "./SizeRow";

function BoutiqueOfferFilter({ filterEnabled }) {
  return (
    <>
      {filterEnabled && <FilterLabel text="Filter By Size" />}
      <div className="boutique-category-filter flex-row">
        <SizeRow />
      </div>
    </>
  );
}

export default BoutiqueOfferFilter;
