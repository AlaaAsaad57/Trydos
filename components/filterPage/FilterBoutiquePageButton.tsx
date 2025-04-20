"use client";
import React from "react";
import { useAppStore } from "store";
import { Sendevent } from "utils/functions";
import FilterIcon from "public/svg/listing/filterIcon.svg";

function FilterBoutiquePageButton() {
  const { setFilterEnabled, filterEnabled } = useAppStore();
  return (
    <div
      className="filter-option"
      data-cy="settingsIcon"
      onClick={() => {
        setFilterEnabled(!filterEnabled);

        if (filterEnabled) {
          Sendevent({
            event: "button_clicked",
            value: "filter_close_icon_button",
          });
        } else {
          Sendevent({
            event: "button_clicked",
            value: "product_listing_filter_icon_button",
          });

          window.scrollTo({ top: 0 });
        }
      }}
    >
      <FilterIcon className={`${filterEnabled && "filter-icon-enabled"}`} />
    </div>
  );
}

export default FilterBoutiquePageButton;
