import { useParams, useSearchParams } from "next/navigation";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { filterProducts, Sendevent, UpdateFilter } from "utils/functions";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";

function ColorCircle({ color }) {
  const selectedFilter = useSelector(
    (state: StateInterface) => state.details.selectedFilter
  );
  const pathName = useParams();
  const filters = useSelector((state: StateInterface) => state.details.filters);
  const dispatch = useDispatch();

  const filterEnabled = useSelector(
    (state: StateInterface) => state.listing.filterEnabled
  );
  const selectCategory = (e) => {
    dispatch({ type: "FILTER-COLOR", payload: e });
    Sendevent({
      event: "button_clicked",
      value: "add_filter_button",
      extra: {
        type: "color",
        name: e.name,
      },
    });
    dispatch({ type: "FILTER-LOADING", payload: true });
    UpdateFilter({
      boutiqueId: pathName.productCategory,
      lang: pathName.lang,
      sizesAttr: filters.sizesAttr,
      newFiltersCallback: ({ filtersVar }) => {
        dispatch({ type: "EDIT-FILTER", payload: filtersVar });
      },
      searchText: "",
      done: () => {
        dispatch({ type: "FILTER-LOADING", payload: false });
      },
    });
    if (!filterEnabled) {
      filter();
    } else {
    }
  };
  const SearchParams = useSearchParams();

  const filter = () => {
    dispatch({ type: "FILTER-START" });
    dispatch({ type: "Skeleton-Listing" });
    filterProducts({
      boutiqueId:
        (SearchParams.get("boutique_slugs") &&
          SearchParams.get("boutique_slugs")) ||
        pathName.productCategory,
      lang: pathName.lang,
      sizesAttr: filters.sizesAttr,
      callback: (products) => {
        dispatch({ type: "GET_PRODUCT", payload: { products } });
      },
      offset: 1,
      storeCallback: (e) => {
        dispatch({
          type: "ACTIVE-FILTER",
          payload: e,
        });
      },
      newFiltersCallback: ({ filtersVar }) => {
        dispatch({ type: "EDIT-FILTER", payload: filtersVar });
      },
    });
  };
  const isSelected = () => {
    return selectedFilter.colors.filter((s) => s === color).length > 0;
  };
  return (
    <div
      onClick={() => selectCategory(color)}
      className={`category-circle flex-col align-center ${
        true && "extended-circle"
      }`}
    >
      {" "}
      <div className="relative w-[70px] h-[70px]">
        {isSelected() && (
          <ActiveCategoryIcon className="active-category-icon" />
        )}

        <svg
          className="absolute z-10 top-0 left-0"
          xmlns="http://www.w3.org/2000/svg"
          width="70"
          height="70"
          viewBox="0 0 70 70"
        >
          <g
            id="Ellipse_283"
            data-name="Ellipse 283"
            fill="none"
            stroke={isSelected() ? "#FF5F61" : "#6b6b6b"}
            strokeWidth="0.5"
            strokeDasharray="3 3"
          >
            <circle cx="35" cy="35" r="35" stroke="none" />
            <circle cx="35" cy="35" r="34.75" fill="none" />
          </g>
        </svg>

        <div
          className={`brand-photo rounded-full  ${
            isSelected() && "bold-size"
          } whitespace-pre-wrap text-center`}
          style={{
            backgroundColor: color,
            minHeight: "70px",
            minWidth: "70px",
          }}
        ></div>
      </div>
      <div className="category-text-container flex-col align-center">
        {/* <span className="category-typo">1100</span> */}
      </div>
    </div>
  );
}

export default ColorCircle;
