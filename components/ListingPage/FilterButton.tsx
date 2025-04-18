import React, { useEffect, useState } from "react";

import { useAppStore } from "store";

function FilterButton({ filters, showedFilter }) {
  const { setShowedFilter } = useAppStore();

  const onClick = () => {
    let i = filters().findIndex((s) => s.name === showedFilter);
    if (i + 1 > filters().length - 1) {
      setShowedFilter(filters()[0].name);

      document.querySelector(".filter-container").scrollLeft =
        window.innerWidth * 0;
    } else {
      setShowedFilter(filters()[i + 1].name);
      let a = 0;
      document
        .querySelectorAll(".boutique-category-filter")
        .forEach((s, index) => {
          if (index < i + 1) a += s.clientWidth;
        });
      document.querySelector(".filter-container").scrollLeft = a + 10;
    }
  };
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
  }, []);
  return (
    <div
      className="filter-button flex-row items-center h-[25px]"
      data-cy="rightScrool"
      onClick={() => onClick()}
    >
      {show &&
        filters().map((s, i) => (
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
                fill={s.name === showedFilter ? "#505050" : "#fff"}
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

export default FilterButton;
