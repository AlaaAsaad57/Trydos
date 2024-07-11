import React, { useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import { useDispatch, useSelector } from "react-redux";
import { filterProducts } from "utils/functions";
import { useParams } from "next/navigation";
function BrandCircle({ brand }) {
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );
  const pathName = useParams();
  const filters = useSelector((state: any) => state.details.filters);

  const dispatch = useDispatch();
  const selectCategory = (e) => {
    dispatch({ type: "FILTER-BRAND", payload: e });
    filter();
  };
  const filter = () => {
    dispatch({ type: "FILTER-START" });

    filterProducts({
      boutiqueId: pathName.productCategory,
      lang: pathName.lang,
      sizesAttr: filters.sizesAttr,
      callback: (products) => {
        dispatch({ type: "GET_PRODUCT", payload: { products } });
      },
      offset: 1,
      newFiltersCallback: ({ filtersVar }) => {
        dispatch({ type: "EDIT-FILTER", payload: filtersVar });
      },
    });
  };
  const isSelected = () => {
    return selectedFilter.brands.filter((s) => s.id === brand.id).length > 0;
  };
  return (
    <div
      onClick={() => selectCategory(brand)}
      className={`category-circle flex-col align-center ${
        true && "extended-circle"
      }`}
    >
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
            stroke={isSelected() ? "#FF5F61" : "#C4C2C2"}
            stroke-width="0.5"
          >
            <circle cx="35" cy="35" r="35" stroke="none" />
            <circle cx="35" cy="35" r="34.5" fill="none" />
          </g>
        </svg>
        <div className="category-shadow"></div>
        <img className="brand-photo" width={70} height={70} src={brand.image} />
      </div>

      <div className="category-text-container flex-col align-center">
        <span className="category-title">{brand.name}</span>
        <span className="category-typo">1100</span>
      </div>
    </div>
  );
}

export default BrandCircle;
