import React from "react";
import FilterLabel from "./FilterLabel";
import OfferRow from "./OfferRow";

function BoutiqueOfferFilter({ filterEnabled }) {
  return (
    <>
      {filterEnabled && <FilterLabel text="Filter By Offer" />}
      <div className="boutique-category-filter flex-row">
        <OfferRow />
      </div>
    </>
  );
}

export default BoutiqueOfferFilter;
