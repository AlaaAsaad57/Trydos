import React from "react";

function SwitchFiltersButton({ length }) {
  let active = 0;
  return (
    <div
      className="filter-button flex-row items-center h-[25px]"
      data-cy="rightScrool"
      // onClick={() => onClick()}
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
