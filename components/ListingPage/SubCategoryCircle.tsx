import React, { useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";

function SubCategoryCircle({ index, MainCategoryActive }) {
  const [active, setActive] = useState(false);
  return (
    <div
      className="sub-circle"
      onClick={() => {
        if (MainCategoryActive) setActive(!active);
      }}
      style={{
        transform: `translateX(-${(index + 1) * 50 - (index + 1) * 3}px)`,
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
          stroke-width="0.5"
        >
          <circle cx="25" cy="25" r="25" stroke="none" />
          <circle cx="25" cy="25" r="25" fill="none" />
        </g>
      </svg>

      <img
        width={50}
        height={50}
        src="https://s13emagst.akamaized.net/products/53803/53802380/images/res_678a307460a8c283499576d3cdca1304.jpg"
      />
      {MainCategoryActive && (
        <div className="category-text-container flex-col align-center">
          <span className="category-title">T-Shirt</span>
          <span className="category-typo">1100</span>
        </div>
      )}
    </div>
  );
}

export default SubCategoryCircle;
