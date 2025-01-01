import React from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import FilterInfoIcon from "public/svg/listing/FilterInfoIcon.svg";
import { useSelector } from "react-redux";
import Spinner from "components/global/Spinner";

function FilterLabel({ text }: { text: string }) {
  const loading = useSelector((state: StateInterface) => state.details.loading);
  return (
    <div className="filter-label flex-row justify-start align-center">
      <ActiveCategoryIcon />
      <div className="filter-label-text">{text}</div>
      <FilterInfoIcon className="filter-info-icon" />
      {loading && (
        <span className="ml-2">
          <Spinner />
        </span>
      )}
    </div>
  );
}

export default FilterLabel;
