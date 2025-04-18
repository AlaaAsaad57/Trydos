import React from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";

import { useParams, useSearchParams } from "next/navigation";
import { filterProducts, Sendevent, UpdateFilter } from "utils/functions";
import { useAppStore } from "store";

function BrandCircle({ brand }) {
  const {
    setFilterLoading,
    filterBrand,
    editFilter,
    filterStart,
    getProducts,
    setSkeleton,
    setActiveFilter,
    selectedFilter,
    filters,
    filterEnabled,
  } = useAppStore();

  const pathName = useParams();
  const SearchParams = useSearchParams();

  const selectCategory = (e) => {
    Sendevent({
      event: "button_clicked",
      value: "add_filter_button",
      extra: {
        type: "brand",
        name: e.name,
      },
    });
    filterBrand(e);
    setFilterLoading(true);
    UpdateFilter({
      boutiqueId: pathName.productCategory,
      lang: pathName.lang,
      sizesAttr: filters.sizesAttr,
      newFiltersCallback: ({ filtersVar }) => {
        editFilter(filtersVar);
      },
      searchText: "",
      done: () => {
        setFilterLoading(false);
      },
    });
    if (!filterEnabled) {
      filter();
    } else {
    }
  };

  const isSelected = () => {
    return (
      selectedFilter.brands.filter((s) => s.slug === brand.slug).length > 0
    );
  };
  const filter = () => {
    filterStart();
    setSkeleton(true);
    filterProducts({
      boutiqueId:
        (SearchParams.get("boutique_slugs") &&
          SearchParams.get("boutique_slugs")) ||
        pathName.productCategory,
      lang: pathName.lang,
      sizesAttr: filters.sizesAttr,
      callback: (products) => {
        getProducts({ products });
      },
      offset: 1,
      storeCallback: (e) => {
        setActiveFilter(e);
      },
      newFiltersCallback: ({ filtersVar }) => {
        editFilter(filtersVar);
      },
    });
  };
  return (
    <div
      onClick={() => selectCategory(brand)}
      className={`category-circle flex-col align-center ${
        true && "extended-circle"
      }`}
      data-cy="categoryShadow"
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
            strokeWidth="0.5"
          >
            <circle cx="35" cy="35" r="35" stroke="none" />
            <circle cx="35" cy="35" r="34.5" fill="none" />
          </g>
        </svg>
        <div className="category-shadow"></div>
        <img
          className="brand-photo"
          width={70}
          height={70}
          src={brand.icon?.file_path}
        />
      </div>

      <div className="category-text-container flex-col align-center">
        <span className="category-title" data-cy="brandTitle">
          {brand.name}
        </span>
        {/* <span className="category-typo">1100</span> */}
      </div>
    </div>
  );
}

export default BrandCircle;
