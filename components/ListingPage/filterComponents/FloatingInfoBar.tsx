import React from "react";
import FilterInfoBar from "../FilterInfoBar";
import { useSelector } from "react-redux";

function FloatingInfoBar() {
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );

  return (
    <div className="floating-info">
      <div className="floating-info-details">
        The Products Will Be Shown As Below
      </div>
      <FilterInfoBar filtersVariable={selectedFilter} />
    </div>
  );
}

export default FloatingInfoBar;
