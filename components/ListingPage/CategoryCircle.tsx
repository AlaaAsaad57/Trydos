import React, { useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import SubCategoryCircle from "./SubCategoryCircle";
import { useDispatch, useSelector } from "react-redux";
function CategoryCircle({ category }) {
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );
  const dispatch = useDispatch();
  const selectCategory = (e) => {
    dispatch({ type: "FILTER-CATEGORY", payload: e });
  };
  const isSelected = () => {
    return (
      selectedFilter.categories.filter((s) => s.id === category.id).length > 0
    );
  };
  return (
    <>
      <div
        onClick={() => selectCategory(category)}
        className={`category-circle flex-col align-center ${
          category.category_sub.length > 0 && "extended-circle"
        }`}
      >
        {isSelected() && (
          <ActiveCategoryIcon className="active-category-icon" />
        )}
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
            stroke={isSelected() ? "#FF5F61" : "#fff"}
            stroke-width="0.5"
          >
            <circle cx="35" cy="35" r="35" stroke="none" />
            <circle cx="35" cy="35" r="34.5" fill="none" />
          </g>
        </svg>
        <div className="category-shadow"></div>
        <img width={70} height={70} src={category.icon} />
        <div className="category-text-container flex-col align-center">
          <span className="category-title">{category.name}</span>
          <span className="category-typo">1100</span>
        </div>
      </div>
      <div
        className={`categories-sub-circles ${isSelected() && "no-transform"}`}
        style={{
          minWidth: isSelected()
            ? `${category.category_sub.length * 55 - 5}px`
            : "10px",
        }}
      >
        {category.category_sub.map((s, index) => {
          return (
            <SubCategoryCircle
              key={index}
              MainCategoryActive={isSelected()}
              index={index}
              category={s}
            />
          );
        })}
      </div>
    </>
  );
}

export default CategoryCircle;
