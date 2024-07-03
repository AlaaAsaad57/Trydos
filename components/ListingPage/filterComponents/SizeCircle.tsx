import React, { useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";

function SizeCircle({ text }: { text: string }) {
  const [active, setActive] = useState(false);
  return (
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
          stroke={active ? "#FF5F61" : "#6b6b6b"}
          stroke-width="0.5"
          stroke-dasharray="3 3"
        >
          <circle cx="35" cy="35" r="35" stroke="none" />
          <circle cx="35" cy="35" r="34.75" fill="none" />
        </g>
      </svg>

      <div
        className={`brand-photo ${active && "bold-size"}`}
        style={{ backgroundColor: "#fff", minHeight: "70px", minWidth: "70px" }}
      >
        {text}
      </div>
      <div className="category-text-container flex-col align-center">
        <span className="category-title">T-Shirt</span>
        <span className="category-typo">1100</span>
      </div>
    </div>
  );
}

export default SizeCircle;
