import React from "react";
import FilterButton from "./FilterButton";
import CategoryRow from "./CategoryRow";
import FilterLabel from "./filterComponents/FilterLabel";

function BoutiqueCategoryFilter({ filterEnabled }: { filterEnabled: boolean }) {
  return (
    <>
      {filterEnabled && <FilterLabel text="Filter By Category" />}
      <div className="boutique-category-filter flex-row">
        <CategoryRow />
      </div>
    </>
  );
}

export default BoutiqueCategoryFilter;
