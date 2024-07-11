import { useParams } from "next/navigation";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { filterProducts, normalizeView } from "utils/functions";

function FilterButtons() {
  const dispatch = useDispatch();
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );
  const sizesAttr = useSelector(
    (state: any) => state.details.filters.sizesAttr
  );

  const pathName = useParams();
  return (
    <div className="filter-buttons flex-row">
      <div
        className="apply-button flex-row"
        onClick={() => {
          dispatch({ type: "PRODUCT_LOADING" });
          dispatch({ type: "RESET_LISTING_FILTER" });
          filterProducts({
            boutiqueId: pathName.productCategory,
            lang: pathName.lang,
            filterObj: {
              ...selectedFilter,
              sizes: { ...sizesAttr, options: selectedFilter.sizes },
            },
            callback: (products) => {
              dispatch({ type: "GET_PRODUCT", payload: { products } });
            },
            offset: 1,
          });
          dispatch({ type: "filterEnabled", payload: false });
          window.scrollTo({ top: 0 });
          normalizeView();
        }}
      >
        Apply
      </div>
      <div
        className="reset-button flex-row"
        onClick={() => {
          dispatch({ type: "RESET-FILTER" });
        }}
      >
        Reset
      </div>
    </div>
  );
}

export default FilterButtons;
