import React from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";

function FilterInfoBar() {
  return (
    <div className="filter-info-bar flex-row align-center">
      <ActiveCategoryIcon style={{ height: "21px" }} />
      <div className="main-category-icon flex-row">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 15 15"
          style={{ zIndex: "1" }}
        >
          <g
            id="Ellipse_283"
            data-name="Ellipse 283"
            fill="none"
            stroke="#ff5f61"
            stroke-width="0.5"
          >
            <circle cx="7.5" cy="7.5" r="7.5" stroke="none" />
            <circle cx="7.5" cy="7.5" r="7.25" fill="none" />
          </g>
        </svg>

        <img
          width={20}
          height={20}
          src="https://s13emagst.akamaized.net/products/53803/53802380/images/res_678a307460a8c283499576d3cdca1304.jpg"
        />
      </div>
      <div className="category-title filter-bar-main-title">T-Shirt</div>
      <div className="sub-category-icon flex-row">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          style={{ zIndex: "1" }}
        >
          <g
            id="Ellipse_283"
            data-name="Ellipse 283"
            fill="none"
            stroke="#ff5f61"
            stroke-width="0.5"
          >
            <circle cx="5" cy="5" r="5" stroke="none" />
            <circle cx="5" cy="5" r="4.75" fill="none" />
          </g>
        </svg>
        <img
          src="https://s13emagst.akamaized.net/products/53803/53802380/images/res_678a307460a8c283499576d3cdca1304.jpg"
          width={10}
          height={10}
        />
      </div>
      <div className="category-title filter-bar-main-title">T-Shirt</div>
    </div>
  );
}

export default FilterInfoBar;
