import React from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import SubCategoryCircle from "./SubCategoryCircle";
import { useDispatch, useSelector } from "react-redux";
import { filterProducts, UpdateFilter } from "utils/functions";
import { useParams, useSearchParams } from "next/navigation";
function CategoryCircle({ category }) {
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );
  const filterEnabled = useSelector(
    (state: any) => state.listing.filterEnabled
  );
  const filters = useSelector((state: any) => state.details.filters);
  const dispatch = useDispatch();
  const pathName = useParams();
  const params = useSearchParams();

  const selectCategory = (e) => {
    dispatch({ type: "FILTER-CATEGORY", payload: e });
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
  const filter = () => {
    dispatch({ type: "FILTER-START" });
    dispatch({ type: "Skeleton-Listing" });
    filterProducts({
      boutiqueId:
        (params.get("boutique_slugs") && params.get("boutique_slugs")) ||
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
    return (
      selectedFilter.categories.filter((s) => s.slug === category.category.slug)
        .length > 0
    );
  };
  console.log(category);
  return (
    <>
      <div
        onClick={() => selectCategory({ ...category.category })}
        className={`category-circle flex-col align-center ${
          category?.categories_sub?.length > 0 && "extended-circle"
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
              stroke={isSelected() ? "#FF5F61" : "#fff"}
              strokeWidth="0.5"
            >
              <circle cx="35" cy="35" r="35" stroke="none" />
              <circle cx="35" cy="35" r="34.5" fill="none" />
            </g>
          </svg>
          <div className="category-shadow"></div>
          <img width={70} height={70} src={category.category.flat_photo_path} />
        </div>
        <div className="category-text-container flex-col align-center">
          <span className="category-title">{category.category.name}</span>
          {/* <span className="category-typo">1100</span> */}
        </div>
      </div>
      {category.categories_sub?.length > 0 && (
        <div
          className={`categories-sub-circles ${isSelected() && "no-transform"}`}
          style={{
            minWidth: isSelected()
              ? `${category.categories_sub.length * 55 - 5}px`
              : "10px",
          }}
        >
          {category.categories_sub.map((s, index) => {
            return (
              <SubCategoryCircle
                key={index}
                MainCategoryActive={isSelected()}
                index={index}
                category={s}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

export default CategoryCircle;
