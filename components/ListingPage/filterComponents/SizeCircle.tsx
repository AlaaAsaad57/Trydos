import React, { useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import { useDispatch, useSelector } from "react-redux";

import { useParams, useSearchParams } from "next/navigation";
import { filterProducts, UpdateFilter } from "utils/functions";

function SizeCircle({ text }: { text: string }) {
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );
  const pathName = useParams();
  const filters = useSelector((state: any) => state.details.filters);
  const dispatch = useDispatch();
  const filterEnabled = useSelector(
    (state: any) => state.listing.filterEnabled
  );
  const selectCategory = (e) => {
    dispatch({ type: "FILTER-LOADING", payload: true });
    dispatch({ type: "FILTER-SIZE", payload: e });
    UpdateFilter({
      boutiqueId: pathName.productCategory,
      lang: pathName.lang,
      sizesAttr: filters.sizesAttr,
      newFiltersCallback: ({ filtersVar }) => {
        dispatch({ type: "EDIT-FILTER", payload: filtersVar });
      },
      searchText: "",
      done: () => {
        dispatch({ type: "FILTER-LOADING", payload: false });
      },
    });
    if (!filterEnabled) {
      filter();
    }
  };
  const SearchParams = useSearchParams();
  const filter = () => {
    dispatch({ type: "FILTER-START" });
    dispatch({ type: "Skeleton-Listing" });
    filterProducts({
      boutiqueId:
        (SearchParams.get("boutique_slugs") &&
          SearchParams.get("boutique_slugs")) ||
        pathName.productCategory,
      lang: pathName.lang,
      sizesAttr: filters.sizesAttr,
      callback: (products) => {
        dispatch({ type: "GET_PRODUCT", payload: { products } });
      },
      offset: 1,
      storeCallback: (e) => {
        dispatch({
          type: "ACTIVE-FILTER",
          payload: e,
        });
      },
      newFiltersCallback: ({ filtersVar }) => {
        dispatch({ type: "EDIT-FILTER", payload: filtersVar });
      },
    });
  };
  const isSelected = () => {
    return selectedFilter.sizes.filter((s) => s === text).length > 0;
  };
  return (
    <div
      onClick={() => selectCategory(text)}
      className={`category-circle flex-col align-center ${
        true && "extended-circle"
      }`}
    >
      {" "}
      <div className="relative w-[70px] h-[70px]">
        {isSelected() && (
          <ActiveCategoryIcon className="active-category-icon" />
        )}

        <svg
          className="absolute z-10 top-0 left-0"
          xmlns="http://www.w3.org/2000/svg"
          width="70"
          height="70"
          viewBox="0 0 70 70"
        >
          <g
            id="Ellipse_283"
            data-name="Ellipse 283"
            fill="none"
            stroke={isSelected() ? "#FF5F61" : "#6b6b6b"}
            strokeWidth="0.5"
            strokeDasharray="3 3"
          >
            <circle cx="35" cy="35" r="35" stroke="none" />
            <circle cx="35" cy="35" r="34.75" fill="none" />
          </g>
        </svg>

        <div
          className={`brand-photo ${
            isSelected() && "bold-size"
          } whitespace-pre-wrap text-center uppercase`}
          style={{
            backgroundColor: "#fff",
            minHeight: "70px",
            minWidth: "70px",
          }}
        >
          {text}
        </div>
      </div>
      <div className="category-text-container flex-col align-center">
        <span className="category-title">{text}</span>
        {/* <span className="category-typo">1100</span> */}
      </div>
    </div>
  );
}

export default SizeCircle;
