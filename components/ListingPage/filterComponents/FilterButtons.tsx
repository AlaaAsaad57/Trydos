import React from "react";
import { useDispatch } from "react-redux";
import { normalizeView } from "utils/functions";

function FilterButtons() {
  const dispatch = useDispatch();
  return (
    <div className="filter-buttons flex-row">
      <div
        className="apply-button flex-row"
        onClick={() => {
          dispatch({ type: "filterEnabled", payload: false });
          window.scrollTo({ top: 0 });
          normalizeView();
        }}
      >
        Apply
      </div>
      <div className="reset-button flex-row">Reset</div>
    </div>
  );
}

export default FilterButtons;
