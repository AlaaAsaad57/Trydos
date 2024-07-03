"use client";
import React, { useState } from "react";
import "styles/listing-components.css";
import SearchIcon from "public/svg/listing/searchIcon.svg";
import SortIcon from "public/svg/listing/sortIcon.svg";
import FilterIcon from "public/svg/listing/filterIcon.svg";
import ShareIcon from "public/svg/listing/shareIcon.svg";
import BackIcon from "public/svg/listing/backIcon.svg";
import BoutiqueHeader from "./BoutiqueHeader";
import FilterInfoBar from "./FilterInfoBar";
import { useDispatch, useSelector } from "react-redux";
import { expandView, normalizeView } from "utils/functions";
import FloatingInfoBar from "./filterComponents/FloatingInfoBar";
function FilterBar() {
  const dispatch = useDispatch();
  const setEnableFilter = (e) => {
    dispatch({ type: "filterEnabled", payload: e });
  };
  const filterEnabled = useSelector(
    (state: any) => state.listing.filterEnabled
  );
  return (
    <>
      <div className="filter-listing-bar relative flex-row align-center">
        <div className="back-icon">
          <BackIcon />
        </div>
        <div className="filter-bar-options flex-row align-center">
          <div className="filter-option">
            <SearchIcon />
          </div>
          <div className="filter-option">
            <SortIcon />
          </div>
          <div
            className="filter-option"
            onClick={() => {
              setEnableFilter(!filterEnabled);

              if (filterEnabled) {
                normalizeView();
              } else {
                expandView({ filter: true });
                window.scrollTo({ top: 0 });
              }
            }}
          >
            <FilterIcon
              className={`${filterEnabled && "filter-icon-enabled"}`}
            />
          </div>
          <div className="filter-option">
            <ShareIcon />
          </div>
        </div>
      </div>
      <BoutiqueHeader />
      {!filterEnabled && <FilterInfoBar />}
      {filterEnabled && <FloatingInfoBar />}
    </>
  );
}

export default FilterBar;
