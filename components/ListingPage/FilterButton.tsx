import React from "react";
import { useDispatch } from "react-redux";

function FilterButton({ filters, showedFilter }) {
  const dispatch = useDispatch();
  const onClick = () => {
    let i = filters().findIndex((s) => s.name === showedFilter);
    if (i + 1 > filters().length - 1) {
      dispatch({ type: "SHOWED-FILTER", payload: filters()[0].name });
      document.querySelector(".filter-container").scrollLeft =
        window.innerWidth * 0;
    } else {
      dispatch({ type: "SHOWED-FILTER", payload: filters()[i + 1].name });
      document.querySelector(".filter-container").scrollLeft =
        window.innerWidth * (i + 1) - 40;
    }
  };
  return (
    <div
      className="filter-button flex-row items-center h-[25px]"
      onClick={() => onClick()}
    >
      {filters().map((s, i) => (
        <span className={`${i > 0 && "ml-[2px]"}`}>
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
              stroke-width="0.5"
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
