import React, { useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import SubCategoryCircle from "./SubCategoryCircle";
function CategoryCircle() {
  const [active, setActive] = useState(false);
  return (
    <>
      <div
        onClick={() => setActive(!active)}
        className={`category-circle flex-col align-center ${
          true && "extended-circle"
        }`}
      >
        {active && <ActiveCategoryIcon className="active-category-icon" />}
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
            stroke={active ? "#FF5F61" : "#fff"}
            stroke-width="0.5"
          >
            <circle cx="35" cy="35" r="35" stroke="none" />
            <circle cx="35" cy="35" r="34.5" fill="none" />
          </g>
        </svg>
        <div className="category-shadow"></div>
        <img
          width={70}
          height={70}
          src="https://s13emagst.akamaized.net/products/53803/53802380/images/res_678a307460a8c283499576d3cdca1304.jpg"
        />
        <div className="category-text-container flex-col align-center">
          <span className="category-title">T-Shirt</span>
          <span className="category-typo">1100</span>
        </div>
      </div>
      <div
        onClick={() => !active && setActive(true)}
        className={`categories-sub-circles ${active && "no-transform"}`}
        style={{
          minWidth: active ? `${[1, 1, 1, 1].length * 55 - 5}px` : "10px",
        }}
      >
        {[1, 1, 1, 1].map((s, index) => {
          return (
            <SubCategoryCircle MainCategoryActive={active} index={index} />
          );
        })}
      </div>
    </>
  );
}

export default CategoryCircle;
