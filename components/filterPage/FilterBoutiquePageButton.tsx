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
        data-cy="settingsIcon"
        className="filter-option"
        onClick={handleFilterButtonClick}
      >
        <FilterIcon
          data-cy="settingsIcon_svg"
          className={`${filterEnabled && "filter-icon-enabled"}`}
        />
      </div>
    </>
  );
}

export default FilterBoutiquePageButton;
