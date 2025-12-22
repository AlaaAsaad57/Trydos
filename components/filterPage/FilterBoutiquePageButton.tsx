"use client";
import React from "react";
import { useAppStore } from "store";

import FilterIcon from "public/svg/listing/filterIcon";
import { DisableScroll, EnableScroll } from "utils/tinyUtils";

function FilterBoutiquePageButton() {
  const { setFilterEnabled, filterEnabled } = useAppStore();

  const handleFilterButtonClick = () => {
    if (!filterEnabled) {
      DisableScroll();
    } else {
      EnableScroll();
    }
    setFilterEnabled(!filterEnabled);
  };

  return (
    <>
      <div
        data-cy="filter-widget-button"
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
