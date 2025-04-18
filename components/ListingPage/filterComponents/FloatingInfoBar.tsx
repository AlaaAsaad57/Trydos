import React from "react";
import FilterInfoBar from "../FilterInfoBar";
import { useAppStore } from "store";

function FloatingInfoBar() {
  const { selectedFilter } = useAppStore();
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
