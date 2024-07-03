import React from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import FilterInfoIcon from "public/svg/listing/FilterInfoIcon.svg";

function FilterLabel({ text }: { text: string }) {
  return (
    <div className="filter-label flex-row justify-start align-center">
      <ActiveCategoryIcon />
      <div className="filter-label-text">{text}</div>
      <FilterInfoIcon className="filter-info-icon" />
    </div>
  );
}

export default FilterLabel;
