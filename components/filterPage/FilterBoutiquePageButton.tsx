"use client";
import React from "react";
import { useAppStore } from "store";

import FilterIcon from "public/svg/listing/filterIcon.svg";

function FilterBoutiquePageButton() {
  const { setFilterEnabled, filterEnabled } = useAppStore();

  const handleFilterButtonClick = () => {
    setFilterEnabled(!filterEnabled);
  };

  return (
    <>
      <div
        className="filter-option"
        data-cy="settingsIcon"
        onClick={handleFilterButtonClick}
      >
        <FilterIcon className={`${filterEnabled && "filter-icon-enabled"}`} />
      </div>
    </>
  );
}

export default FilterBoutiquePageButton;
