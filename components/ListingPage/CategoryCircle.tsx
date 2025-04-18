import React, { useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import SubCategoryCircle from "./SubCategoryCircle";
import { filterProducts, Sendevent, UpdateFilter } from "utils/functions";
import { useParams, useSearchParams } from "next/navigation";
import { useAppStore } from "store";

function CategoryCircle({ category }) {
  const {
    setFilterLoading,
    filterCategory,
    editFilter,
    filterStart,
    getProducts,
    setSkeleton,
    selectedFilter,
    filterEnabled,
    filters,
    setActiveFilter,
  } = useAppStore();

  const pathName = useParams();
  const params = useSearchParams();
  const selectCategory = (e) => {
    Sendevent({
      event: "button_clicked",
      value: "add_filter_button",
      extra: {
        type: "category",
        name: e.name,
      },
    });
    if (
      selectedFilter.categories.filter((s) =>
        category.childes.map((sub) => sub.slug).includes(s.slug)
      ) &&
      selectedFilter.categories.filter((s) => s.slug === category.slug).length >
        0
    ) {
      let arr = selectedFilter.categories.filter((s) =>
        category.childes.map((sub) => sub.slug).includes(s.slug)
      );
      arr.map((s) => {
        filterCategory(s);
      });
    }
    filterCategory(e);
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
  const filter = () => {
    filterStart();
    setSkeleton(true);
    filterProducts({
      boutiqueId:
        (params.get("boutique_slugs") && params.get("boutique_slugs")) ||
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
  const isSelected = () => {
    return (
      selectedFilter.categories.filter((s) => s.slug === category.slug).length >
      0
    );
  };
  const isSelectedChild = () => {
    if (
      selectedFilter.categories.filter(
        (s) =>
          category?.childes?.filter((sub) => sub.slug === s.slug)?.length > 0
      ).length > 0
    )
      return true;
    else return false;
  };
  const [expanded, setExpanded] = useState(isSelected() || isSelectedChild());

  return (
    <>
      <div
        onClick={() => {
          if (expanded && !isSelected()) {
            selectCategory({ ...category });
          } else if (expanded || isSelected()) {
            selectCategory({ ...category });
            if (!isSelectedChild()) {
              setExpanded(false);
            }
          } else {
            selectCategory({ ...category });
            setExpanded(!expanded);
          }
        }}
        className={`category-circle flex-col align-center ${
          category?.categories_sub?.length > 0 && "extended-circle"
        }`}
        data-cy="category_botiquePage"
      >
        <div className="relative w-[70px] h-[70px] z-10">
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
          <img
            width={70}
            height={70}
            className="object-center"
            src={
              category.most_viewed_product_thumbnail?.file_path ??
              category.flat_photo_path?.file_path ??
              category?.icon?.file_path
            }
          />
        </div>
        <div className="category-text-container flex-col align-center">
          <span className="category-title" data-cy="categoryTitle">
            {category.name}
          </span>
          {/* <span className="category-typo">1100</span> */}
        </div>
      </div>
      {category.childes?.length > 0 && (
        <div
          className={`categories-sub-circles ${
            (isSelectedChild() || expanded) && "no-transform"
          } z-0`}
          style={{
            minWidth: isSelectedChild() || expanded ? "max-content" : "10px",
          }}
        >
          {category.childes.map((s, index) => {
            return (
              <SubCategoryCircle
                key={index}
                active={
                  selectedFilter.categories.filter((sub) => sub.slug === s.slug)
                    .length > 0
                }
                onClick={(sub) => {
                  if (isSelected()) filterCategory(category);
                  filterCategory(sub);
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
                }}
                MainCategoryActive={expanded}
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
