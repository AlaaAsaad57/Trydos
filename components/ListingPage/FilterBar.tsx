import React from "react";
import "styles/listing-components.css";
import SearchIcon from "public/svg/listing/searchIcon.svg";
import SortIcon from "public/svg/listing/sortIcon.svg";
import FilterIcon from "public/svg/listing/filterIcon.svg";
import ShareIcon from "public/svg/listing/shareIcon.svg";
import BackIcon from "public/svg/listing/backIcon.svg";
import BoutiqueHeader from "./BoutiqueHeader";
function FilterBar() {
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
          <div className="filter-option">
            <FilterIcon />
          </div>
          <div className="filter-option">
            <ShareIcon />
          </div>
        </div>
      </div>
      <BoutiqueHeader />
    </>
  );
}

export default FilterBar;
