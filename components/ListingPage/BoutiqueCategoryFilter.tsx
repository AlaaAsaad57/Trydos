import React from "react";
import FilterButton from "./FilterButton";
import CategoryRow from "./CategoryRow";

function BoutiqueCategoryFilter() {
  return (
    <div className="boutique-category-filter flex-row">
      <FilterButton />
      <CategoryRow />
    </div>
  );
}

export default BoutiqueCategoryFilter;
