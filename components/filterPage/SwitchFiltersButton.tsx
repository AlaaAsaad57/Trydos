"use client";
import { useState } from "react";

function SwitchFiltersButton({ length, language }) {
  let [active, setActive] = useState(0);
  const onClick = () => {
    // Walk to the next row, wrapping back to the first after the last one.
    const next = active === length - 1 ? 0 : active + 1;

    // The rows are found by class name, and a row that is not on the page
    // answers null: one still streaming in, or a `length` that does not match
    // the rows actually drawn. Scrolling to it is skipped, but the dots still
    // advance — a missing row must not trap the shopper on it for every
    // further tap.
    document
      .querySelector(`.scrollable-area-${next}`)
      ?.scrollIntoView({ behavior: "smooth", block: "end", inline: "start" });
    setActive(next);
    setTimeout(() => {
      document
        .querySelector(".filter-button")
        ?.scrollIntoView({ block: "end", inline: "start" });
    }, 200);
  };
  const isRtl = language === "ar" || language === "ku";

  return (
    <div
      className={`filter-button absolute ${
        isRtl ? "right-[15px]" : "left-[15px]"
      } top-1/3 flex-row items-center h-[25px]`}
      data-pw="rightScrool"
      onClick={() => onClick()}
    >
      {Array.from({ length }).map((_, i) => (
        <span
          className={`${i > 0 && "ml-[2px]"}`}
          key={i}
          data-pw="countFilters"
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
