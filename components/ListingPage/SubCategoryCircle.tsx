import React, { useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";

function SubCategoryCircle({
  index,
  MainCategoryActive,
  category,
  onClick,
  active,
}) {
  return (
    <div
      className="sub-circle"
      onClick={() => {
        onClick();
      }}
      style={{
        transform: `translateX(-${(index + 1) * 45 - (index + 1) * 3}px)`,
        zIndex: 4 - index,
      }}
    >
      {MainCategoryActive && active && (
        <ActiveCategoryIcon
          className="active-category-icon"
          style={{ top: "-5px", left: "-5px" }}
        />
      )}
      <div
        style={{
          position: "absolute",
          zIndex: "7",
          width: "50px",
          height: "50px",
        }}
        className="category-shadow"
      ></div>
      <svg
        style={{ position: "absolute", zIndex: "6" }}
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="50"
        viewBox="0 0 50 50"
      >
        <g
          id="Ellipse_283"
          data-name="Ellipse 283"
          fill="none"
          stroke={active && MainCategoryActive ? "#FF5F61" : "#fff"}
          strokeWidth="0.5"
        >
          <circle cx="25" cy="25" r="25" stroke="none" />
          <circle cx="25" cy="25" r="25" fill="none" />
        </g>
      </svg>

      <img
        width={50}
        height={50}
        src={
          category.most_viewed_product_thumbnail ??
          category.flat_photo_path ??
          category?.icon
        }
      />
      {MainCategoryActive && (
        <div className="category-text-container flex-col align-center">
          <span className="category-title">{category.name}</span>
          {/* <span className="category-typo">1100</span> */}
        </div>
      )}
    </div>
  );
}

export default SubCategoryCircle;
