import React from "react";
import FilterLabel from "./FilterLabel";
import ColorRow from "./ColorRow";

function BoutiqueColorsFilter({ filterEnabled }) {
  return (
    <>
      {filterEnabled && <FilterLabel text="Filter By Color" />}
      <div className="boutique-category-filter flex-row">
        <ColorRow />
      </div>
    </>
  );
}

export default BoutiqueColorsFilter;
