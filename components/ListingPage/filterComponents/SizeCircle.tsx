import React, { useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import { useDispatch, useSelector } from "react-redux";

function SizeCircle({ text }: { text: string }) {
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );
  const dispatch = useDispatch();
  const selectCategory = (e) => {
    dispatch({ type: "FILTER-SIZE", payload: e });
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
      {isSelected() && <ActiveCategoryIcon className="active-category-icon" />}

      <svg
        style={{ position: "absolute", zIndex: "6" }}
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
          stroke-width="0.5"
          stroke-dasharray="3 3"
        >
          <circle cx="35" cy="35" r="35" stroke="none" />
          <circle cx="35" cy="35" r="34.75" fill="none" />
        </g>
      </svg>

      <div
        className={`brand-photo ${
          isSelected() && "bold-size"
        } whitespace-pre-wrap text-center`}
        style={{ backgroundColor: "#fff", minHeight: "70px", minWidth: "70px" }}
      >
        {text}
      </div>
      <div className="category-text-container flex-col align-center">
        <span className="category-title">{text}</span>
        <span className="category-typo">1100</span>
      </div>
    </div>
  );
}

export default SizeCircle;
