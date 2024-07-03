import React from "react";
import FilterButton from "./FilterButton";
import CategoryRow from "./CategoryRow";
import FilterLabel from "./filterComponents/FilterLabel";

function BoutiqueCategoryFilter({ filterEnabled }: { filterEnabled: boolean }) {
  return (
    <div className="flex-col justify-start align-start filter-container">
      {filterEnabled && <FilterLabel text="Filter By Category" />}
      <div className="boutique-category-filter flex-row">
        {!filterEnabled && <FilterButton />}
        <CategoryRow />
      </div>
    </div>
  );
}

export default BoutiqueCategoryFilter;
