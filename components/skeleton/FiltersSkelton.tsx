import FilterLabel from "components/ListingPage/filterComponents/FilterLabel";
import React from "react";
import Skeleton from "react-loading-skeleton";

function FiltersSkelton({ filterEnabled }) {
  return (
    <div
      className={`${
        filterEnabled ? "flex-col" : "flex-row"
      }  justify-start align-start filter-container overflow-hidden scroll-smooth `}
      onScroll={(e) => {
        e.preventDefault();
      }}
    >
      {filterEnabled && <FilterLabel text="Filter By Category" />}
      <div className="boutique-category-filter flex-row">
        <div className="category-row-container flex-row">
          {[1, 1, 1, 1, 1, 1, 1, , 1].map((category, key) => (
            <div className={`category-circle flex-col align-center`}>
              <div className="relative w-[70px] h-[70px]">
                <div className="category-shadow"></div>
                <Skeleton width={70} height={70} borderRadius={"50%"} />
              </div>
              <div className="category-text-container flex-col align-center">
                <span className="category-title">
                  <Skeleton width={"50"} height={"20"} borderRadius={"10"} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {filterEnabled && <FilterLabel text="Filter By Brand" />}
      <div className="boutique-category-filter flex-row">
        <div className="category-row-container flex-row">
          {[1, 1, 1, 1, 1, 1, 1, , 1].map((category, key) => (
            <div className={`category-circle flex-col align-center`}>
              <div className="relative w-[70px] h-[70px]">
                <div className="category-shadow"></div>
                <Skeleton width={70} height={70} borderRadius={"50%"} />
              </div>
              <div className="category-text-container flex-col align-center">
                <span className="category-title">
                  <Skeleton width={"50"} height={"20"} borderRadius={"10"} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {filterEnabled && <FilterLabel text="Filter By Color" />}
      <div className="boutique-category-filter flex-row">
        <div className="category-row-container flex-row">
          {[1, 1, 1, 1, 1, 1, 1, , 1].map((category, key) => (
            <div className={`category-circle flex-col align-center`}>
              <div className="relative w-[70px] h-[70px]">
                <div className="category-shadow"></div>
                <Skeleton width={70} height={70} borderRadius={"50%"} />
              </div>
              <div className="category-text-container flex-col align-center">
                <span className="category-title">
                  <Skeleton width={"50"} height={"20"} borderRadius={"10"} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {filterEnabled && <FilterLabel text="Filter By Size" />}
      <div className="boutique-category-filter flex-row">
        <div className="category-row-container flex-row">
          {[1, 1, 1, 1, 1, 1, 1, , 1].map((category, key) => (
            <div className={`category-circle flex-col align-center`}>
              <div className="relative w-[70px] h-[70px]">
                <div className="category-shadow"></div>
                <Skeleton width={70} height={70} borderRadius={"50%"} />
              </div>
              <div className="category-text-container flex-col align-center">
                <span className="category-title">
                  <Skeleton width={"50"} height={"20"} borderRadius={"10"} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FiltersSkelton;
