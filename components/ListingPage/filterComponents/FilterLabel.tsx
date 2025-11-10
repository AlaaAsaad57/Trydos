"use client";
import React from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon";
import FilterInfoIcon from "public/svg/listing/FilterInfoIcon";

import Spinner from "components/global/Spinner";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
import { FilterLabelPropsType } from "models/componentType/FilterLabelPropsType";
import { useParams } from "node_modules/next/navigation";

function FilterLabel({ text }: FilterLabelPropsType) {
  const { details_loading, filterEnabled } = useAppStore();
  if (!filterEnabled) return null;
  return (
    <div className={`filter-label flex-row justify-start align-center`}>
      <ActiveCategoryIcon />
      <div className="filter-label-text">{translateFunction(text)}</div>
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
