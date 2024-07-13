"use client";
import React, { useEffect } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import { useSelector } from "react-redux";

function FilterInfoBar() {
  const activeFilters = useSelector(
    (state: any) => state.details.activeFilters
  );
  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider: HTMLDivElement =
        document?.querySelector(".filter-info-bar");
      let isDown = false;
      let startX: number;
      let scrollLeft: number;

      slider?.addEventListener("mousedown", (e: MouseEvent) => {
        isDown = true;
        slider.classList.add("active");
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
      slider?.addEventListener("mouseleave", () => {
        isDown = false;
        slider.classList.remove("active");
      });
      slider?.addEventListener("mouseup", () => {
        isDown = false;
        slider.classList.remove("active");
      });
      slider?.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 3; //scroll-fast
        slider.scrollLeft = scrollLeft - walk;
      });
    }
  }, []);
  return (
    <div className="filter-info-bar flex-row cursor-pointer align-center overflow-x-scroll overflow-y-hidden whitespace-nowrap [&> *]: select-none ">
      {activeFilters.categories.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {activeFilters.categories.map((category) => (
            <>
              <div className="main-category-icon flex-row min-w-[15px] min-h-[15px]">
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
                    strokeWidth="0.5"
                  >
                    <circle cx="7.5" cy="7.5" r="7.5" stroke="none" />
                    <circle cx="7.5" cy="7.5" r="7.25" fill="none" />
                  </g>
                </svg>

                <img width={20} height={20} src={category?.icon} />
              </div>
              <div className="category-title filter-bar-main-title">
                {category?.name}
              </div>
              {category?.category_sub?.map((s) => (
                <>
                  <div className="sub-category-icon flex-row min-h-[10px] min-w-[10px]">
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
                        strokeWidth="0.5"
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
        </>
      )}
      {activeFilters.brands.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {activeFilters.brands.map((brand) => (
            <>
              <div className="main-category-icon flex-row min-w-[15px] min-h-[15px]">
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
                    strokeWidth="0.5"
                  >
                    <circle cx="7.5" cy="7.5" r="7.5" stroke="none" />
                    <circle cx="7.5" cy="7.5" r="7.25" fill="none" />
                  </g>
                </svg>

                <img width={20} height={20} src={brand?.image} />
              </div>
              <div className="category-title filter-bar-main-title">
                {brand?.name}
              </div>
            </>
          ))}
        </>
      )}
      {activeFilters.prices?.min >= 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {
            <>
              <div className="category-title filter-bar-main-title">
                {`USD ${activeFilters.prices?.min} / ${activeFilters.prices?.max} `}
              </div>
            </>
          }
        </>
      )}
      {activeFilters.sizes.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {activeFilters.sizes.map((size, index) => (
            <>
              <div className="category-title filter-bar-main-title">{size}</div>
              {index < activeFilters.sizes.length - 1 && " - "}
            </>
          ))}
        </>
      )}
    </div>
  );
}

export default FilterInfoBar;
