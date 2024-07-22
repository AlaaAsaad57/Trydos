"use client";
import React, { useEffect } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import { useDispatch, useSelector } from "react-redux";
import CloseIcon from "public/svg/CloseIcon.svg";
import { filterProducts } from "utils/functions";
import { useParams } from "next/navigation";

function FilterInfoBar() {
  const activeFilters = useSelector(
    (state: any) => state.details.activeFilters
  );
  const currency_symbol = useSelector((state: any) => state.homepage.settings);
  const sizesAttr = useSelector(
    (state: any) => state.details.filters.sizesAttr
  );
  const dispatch = useDispatch();
  const filters = useSelector((state: any) => state.details.filters);
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
  const pathName = useParams();
  return (
    <div className="filter-info-bar flex-row cursor-pointer align-center overflow-x-scroll overflow-y-hidden whitespace-nowrap [&> *]: select-none ">
      <CloseIcon
        className="mr-2 ml-2"
        onClick={() => {
          dispatch({ type: "PRODUCT_LOADING" });
          dispatch({ type: "RESET_LISTING_FILTER" });
          dispatch({ type: "Skeleton-Listing" });
          filterProducts({
            boutiqueId: pathName.productCategory,
            lang: pathName.lang,
            sizesAttr: sizesAttr,
            callback: (products) => {
              dispatch({ type: "GET_PRODUCT", payload: { products } });
            },
            offset: 1,
            storeCallback: (e) => {
              dispatch({
                type: "ACTIVE-FILTER",
                payload: {
                  categories: [],
                  brands: [],
                  prices: null,
                  offers: [],
                  sizes: [],
                  colors: [],
                },
              });
            },
            newFiltersCallback: ({ filtersVar }) => {
              dispatch({ type: "EDIT-FILTER", payload: filtersVar });
            },
            reset: true,
          });
          dispatch({ type: "RESET-FILTER" });
        }}
      />
      {activeFilters.categories.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {activeFilters.categories.map(
            (category) =>
              (category.name ||
                filters.categories.filter((s) => s.slug === category.slug)[0]
                  ?.name) && (
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

                    <img
                      width={20}
                      height={20}
                      src={
                        category?.icon ||
                        filters.categories.filter(
                          (s) => s.slug === category.slug
                        )[0]?.icon
                      }
                    />
                  </div>
                  <div className="category-title filter-bar-main-title">
                    {category?.name ||
                      filters.categories.filter(
                        (s) => s.slug === category.slug
                      )[0]?.name}
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
                        <img
                          src={
                            s.icon ||
                            filters.categories.filter(
                              (sub) => sub.slug === s.slug
                            )[0]?.icon
                          }
                          width={10}
                          height={10}
                        />
                      </div>
                      <div className="category-title filter-bar-main-title">
                        {s.name ||
                          filters.categories.filter(
                            (sub) => sub.slug === s.slug
                          )[0]?.name}
                      </div>
                    </>
                  ))}
                </>
              )
          )}
        </>
      )}
      {activeFilters.brands.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {activeFilters.brands.map(
            (brand) =>
              (brand.name ||
                filters.brands.filter((s) => s.slug === brand.slug)[0]
                  ?.name) && (
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

                    <img
                      width={20}
                      height={20}
                      src={
                        brand?.image ||
                        filters.brands.filter(
                          (sub) => sub.slug === brand.slug
                        )[0]?.image
                      }
                    />
                  </div>
                  <div className="category-title filter-bar-main-title">
                    {brand?.name ||
                      filters.brands.filter((sub) => sub.slug === brand.slug)[0]
                        ?.name}
                  </div>
                </>
              )
          )}
        </>
      )}
      {activeFilters.colors.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {activeFilters.colors.map((color) => (
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

                <div
                  className="w-full h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </>
          ))}
        </>
      )}
      {activeFilters.prices?.pricesWord && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {
            <>
              <div className="category-title filter-bar-main-title">
                {`${
                  filters.prices?.currency_symbol ||
                  (currency_symbol &&
                    currency_symbol["starting-setting"]?.currency_symbol) ||
                  ""
                } ${activeFilters.prices?.min} / ${activeFilters.prices?.max} `}
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
              <div className="category-title filter-bar-main-title uppercase">
                {size}
              </div>
              {index < activeFilters.sizes.length - 1 && " - "}
            </>
          ))}
        </>
      )}
    </div>
  );
}

export default FilterInfoBar;
