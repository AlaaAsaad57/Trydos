"use client";
import React, { useEffect, useState } from "react";
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
import { dispatchRouteChangeEvent } from "Hooks/events";
import { useRouter } from "next/navigation";
function FilterBar({ boutique, filters }) {
  const dispatch = useDispatch();
  const setEnableFilter = (e) => {
    dispatch({ type: "filterEnabled", payload: e });
  };
  const filterEnabled = useSelector(
    (state: any) => state.listing.filterEnabled
  );
  const activeFilters = useSelector(
    (state: any) => state.details.activeFilters
  );
  const showFilterInfoBar = () => {
    if (
      activeFilters.categories.length > 0 ||
      activeFilters.brands.length > 0 ||
      activeFilters.sizes.length > 0 ||
      activeFilters.offers.length > 0 ||
      activeFilters.prices?.min
    )
      return true;
    else return false;
  };
  const router = useRouter();
  useEffect(() => {
    dispatch({ type: "FILTER-INIT", payload: filters });
  }, []);
  return (
    <>
      <div className="filter-listing-bar relative flex-row align-center">
        <div
          className="back-icon"
          onClick={() => {
            dispatchRouteChangeEvent("start", {
              to: "HomePage",
              from: "details",
            });
            router.push(`/`);
            document.documentElement.style.overflow = "hidden";
            document.documentElement.scrollTop = 0;
          }}
        >
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
      <BoutiqueHeader boutique={boutique} />
      {!filterEnabled && showFilterInfoBar && <FilterInfoBar />}
      {filterEnabled && showFilterInfoBar && <FloatingInfoBar />}
    </>
  );
}

export default FilterBar;
