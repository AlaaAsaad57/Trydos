"use client";
import React, { useState } from "react";
import { SwitchFiltersButtonProps } from "models/componentType/SwitchFiltersButtonPropsType";

function SwitchFiltersButton({ length }: SwitchFiltersButtonProps) {
  let [active, setActive] = useState(0);
  const onClick = () => {
    if (active === length - 1) {
      document.querySelector(`.scrollable-area-${0}`).scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "start",
      });
      setActive(0);
      setTimeout(() => {
        document
          .querySelector(".filter-button")
          .scrollIntoView({ block: "end", inline: "start" });
      }, 200);
    } else {
      document.querySelector(`.scrollable-area-${active + 1}`).scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "start",
      });
      setActive(active + 1);
      setTimeout(() => {
        document
          .querySelector(".filter-button")
          .scrollIntoView({ block: "end", inline: "start" });
      }, 200);
    }
  };
  return (
    <div
      className="filter-button absolute left-[15px] top-1/3 flex-row items-center h-[25px]"
      data-cy="rightScrool"
      onClick={() => onClick()}
    >
      {Array.from({ length }).map((_, i) => (
        <span
          className={`${i > 0 && "ml-[2px]"}`}
          key={i}
          data-cy="countFilters"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="7.483"
            height="7.483"
            viewBox="0 0 7.483 7.483"
          >
            <g
              id="Ellipse_221"
              data-name="Ellipse 221"
              fill={active === i ? "#505050" : "#fff"}
              stroke="#505050"
              strokeWidth="0.5"
            >
              <circle cx="3.741" cy="3.741" r="3.741" stroke="none" />
              <circle cx="3.741" cy="3.741" r="3.491" fill="none" />
            </g>
          </svg>
        </span>
      ))}
    </div>
  );
}

export default SwitchFiltersButton;
