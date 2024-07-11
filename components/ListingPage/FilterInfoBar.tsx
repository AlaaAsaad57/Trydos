"use client";
import React from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import { useSelector } from "react-redux";

function FilterInfoBar() {
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );
  return (
    <div className="filter-info-bar flex-row align-center">
      <ActiveCategoryIcon style={{ height: "21px" }} />
      {selectedFilter.categories.map((category) => (
        <>
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

            <img width={20} height={20} src={category.icon} />
          </div>
          <div className="category-title filter-bar-main-title">
            {category.name}
          </div>
          {category.category_sub.map((s) => (
            <>
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
                <img src={s.icon} width={10} height={10} />
              </div>
              <div className="category-title filter-bar-main-title">
                {s.name}
              </div>
            </>
          ))}
        </>
      ))}
      {selectedFilter.brands.map((brand) => (
        <>
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

            <img width={20} height={20} src={brand.image} />
          </div>
          <div className="category-title filter-bar-main-title">
            {brand.name}
          </div>
        </>
      ))}
    </div>
  );
}

export default FilterInfoBar;
