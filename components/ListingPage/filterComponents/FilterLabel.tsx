"use client";
import React from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import FilterInfoIcon from "public/svg/listing/FilterInfoIcon.svg";

import Spinner from "components/global/Spinner";
import { useAppStore } from "store";

function FilterLabel({ text }: { text: string }) {
  const { details_loading, filterEnabled } = useAppStore();
  if (!filterEnabled) return null;
  return (
    <div className="filter-label flex-row justify-start align-center">
      <ActiveCategoryIcon />
      <div className="filter-label-text">{text}</div>
      <FilterInfoIcon className="filter-info-icon" />
      {details_loading && (
        <span className="ml-2">
          <Spinner />
        </span>
      )}
    </div>
  );
}

export default FilterLabel;
