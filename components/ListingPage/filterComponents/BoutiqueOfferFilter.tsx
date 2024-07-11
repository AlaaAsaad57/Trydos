import React from "react";
import FilterLabel from "./FilterLabel";
import OfferRow from "./OfferRow";

function BoutiqueOfferFilter() {
  return (
    <>
      {
        <div className="flex-col justify-start align-start filter-container">
          {<FilterLabel text="Filter By Offer" />}
          <div className="boutique-category-filter flex-row">
            <OfferRow />
          </div>
        </div>
      }
    </>
  );
}

export default BoutiqueOfferFilter;
