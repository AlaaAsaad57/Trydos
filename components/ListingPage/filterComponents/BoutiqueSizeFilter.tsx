import React from "react";
import FilterLabel from "./FilterLabel";
import SizeRow from "./SizeRow";

function BoutiqueOfferFilter() {
  return (
    <div className="flex-col justify-start align-start filter-container size-filter-container">
      {<FilterLabel text="Filter By Size" />}
      <div className="boutique-category-filter flex-row">
        <SizeRow />
      </div>
    </div>
  );
}

export default BoutiqueOfferFilter;
