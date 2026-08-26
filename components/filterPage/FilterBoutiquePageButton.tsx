"use client";
import { useAppStore } from "store";

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
        data-pw="filter-widget-button"
        className="filter-option"
        onClick={handleFilterButtonClick}
      >
        <img
          src="/icons/filterIcon.svg"
          data-pw="settingsIcon_svg"
          className={`${filterEnabled && "filter-icon-enabled"}`}
        />
      </div>
    </>
  );
}

export default FilterBoutiquePageButton;
