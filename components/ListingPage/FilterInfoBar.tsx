"use client";
import React, { useEffect } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import CloseIcon from "public/svg/CloseIcon.svg";
import { filterProducts, RoundPrice, UpdateFilter } from "utils/functions";
import { useParams, useSearchParams } from "next/navigation";
import Search from "public/svg/SearchIcon.svg";
import { useAppStore } from "store";

function FilterInfoBar({
  filtersVariable,
  reset,
  searchValue,
}: {
  filtersVariable: any;
  reset?: Function;
  searchValue?: string;
}) {
  const {
    setFilterLoading,
    resetFilter,
    editFilter,
    getProducts,
    setSkeleton,
    setLoadingProducts,
    resetListingFilter,
    setActiveFilter,
    currency,
    filters,
  } = useAppStore();

  const sizesAttr = filters.sizesAttr;
  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider: HTMLDivElement =
        document?.querySelector(".filter-info-bar");
      let isDown = false;
      let startX: number;
      let scrollLeft: number;

      slider?.addEventListener("mousedown", (e: MouseEvent) => {
        isDown = true;
        slider.classList.add("active");
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
      slider?.addEventListener("mouseleave", () => {
        isDown = false;
        slider.classList.remove("active");
      });
      slider?.addEventListener("mouseup", () => {
        isDown = false;
        slider.classList.remove("active");
      });
      slider?.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 3; //scroll-fast
        slider.scrollLeft = scrollLeft - walk;
      });
    }
  }, []);
  const pathName = useParams();
  const searchParams = useSearchParams();
  const getCategory = (slug) => {
    let variable = {
      name: "",
      most_viewed_product_thumbnail: { file_path: "" },
    };
    filters.categories.map((s) =>
      s.childes?.map((sub) => {
        variable = sub;
        if (sub.slug === slug) return sub;
      })
    );
    return variable;
  };
  return (
    <div
      className="filter-info-bar flex-row cursor-pointer align-center overflow-x-scroll overflow-y-hidden whitespace-nowrap [&> *]: select-none "
      data-cy="filterInfo"
    >
      <CloseIcon
        data-cy="closeIcon"
        className="mr-2 ml-2"
        onClick={() => {
          resetFilter();
          setFilterLoading(true);
          setLoadingProducts(true);
          resetListingFilter();
          setSkeleton(true);
          // @ts-ignore
          filterProducts({
            boutiqueId:
              (searchParams.get("boutique_slugs") &&
                searchParams.get("boutique_slugs")) ||
              pathName.productCategory,
            lang: pathName.lang,
            sizesAttr: sizesAttr,
            callback: (products) => {
              getProducts({ products });
              setFilterLoading(false);
            },
            offset: 1,
            storeCallback: (e) => {
              setActiveFilter({
                categories: [],
                brands: [],
                prices: null,
                offers: [],
                sizes: [],
                colors: [],
              });
            },
            newFiltersCallback: ({ filtersVar }) => {
              editFilter(filtersVar);
            },
            reset: true,
          });

          UpdateFilter({
            sizesAttr: sizesAttr,
            boutiqueId: pathName.productCategory,
            lang: pathName.lang,
            done: () => {
              setFilterLoading(false);
            },
            newFiltersCallback: ({ filtersVar }) => {
              editFilter({ ...filtersVar, reset: true });
            },
            searchText: "",
          });
          resetFilter();
          if (reset) reset();
        }}
      />
      {filtersVariable?.categories.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />

          {filtersVariable?.categories.map(
            (category) =>
              (category.name ||
                filters.categories.filter((s) => s.slug === category.slug)[0]
                  ?.name ||
                getCategory(category.slug)?.name) && (
                <>
                  <div className="main-category-icon flex-row min-w-[15px] min-h-[15px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      style={{ zIndex: "1" }}
                    >
                      <g
                        id="Ellipse_283"
                        data-name="Ellipse 283"
                        fill="none"
                        stroke="#ff5f61"
                        strokeWidth="0.5"
                      >
                        <circle cx="7.5" cy="7.5" r="7.5" stroke="none" />
                        <circle cx="7.5" cy="7.5" r="7.25" fill="none" />
                      </g>
                    </svg>

                    <img
                      width={20}
                      height={20}
                      src={
                        category?.icon?.file_path ??
                        category.most_viewed_product_thumbnail?.file_path ??
                        category.flat_photo_path?.file_path ??
                        filters.categories.filter(
                          (s) => s.slug === category.slug
                        )[0]?.most_viewed_product_thumbnail?.file_path ??
                        getCategory(category.slug)
                          ?.most_viewed_product_thumbnail?.file_path
                      }
                    />
                  </div>
                  <div
                    className="category-title filter-bar-main-title"
                    data-cy="mainFilter"
                  >
                    {category?.name ||
                      filters.categories.filter(
                        (s) => s.slug === category.slug
                      )[0]?.name ||
                      getCategory(category.slug)?.name}
                  </div>
                  {category?.categories_sub?.map((s) => (
                    <>
                      <div className="sub-category-icon flex-row min-h-[10px] min-w-[10px]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          style={{ zIndex: "1" }}
                        >
                          <g
                            id="Ellipse_283"
                            data-name="Ellipse 283"
                            fill="none"
                            stroke="#ff5f61"
                            strokeWidth="0.5"
                          >
                            <circle cx="5" cy="5" r="5" stroke="none" />
                            <circle cx="5" cy="5" r="4.75" fill="none" />
                          </g>
                        </svg>
                        <img
                          src={
                            s.icon?.file_path ||
                            filters.categories.filter(
                              (sub) => sub.slug === s.slug
                            )[0]?.icon?.file_path
                          }
                          width={10}
                          height={10}
                        />
                      </div>
                      <div className="category-title filter-bar-main-title">
                        {s.name ||
                          filters.categories.filter(
                            (sub) => sub.slug === s.slug
                          )[0]?.name}
                      </div>
                    </>
                  ))}
                </>
              )
          )}
        </>
      )}
      {filtersVariable?.boutiques?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {filtersVariable?.boutiques?.map(
            (category) =>
              category.name && (
                <>
                  <div className="main-category-icon flex-row min-w-[15px] min-h-[15px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      style={{ zIndex: "1" }}
                    >
                      <g
                        id="Ellipse_283"
                        data-name="Ellipse 283"
                        fill="none"
                        stroke="#ff5f61"
                        strokeWidth="0.5"
                      >
                        <circle cx="7.5" cy="7.5" r="7.5" stroke="none" />
                        <circle cx="7.5" cy="7.5" r="7.25" fill="none" />
                      </g>
                    </svg>

                    <img
                      width={20}
                      height={20}
                      src={category?.banner?.file_path}
                    />
                  </div>
                  <div className="category-title filter-bar-main-title">
                    {category?.name}
                  </div>
                </>
              )
          )}
        </>
      )}
      {filtersVariable?.brands?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {filtersVariable?.brands?.map(
            (brand) =>
              (brand.name ||
                filters.brands.filter((s) => s.slug === brand.slug)[0]
                  ?.name) && (
                <>
                  <div className="main-category-icon flex-row min-w-[15px] min-h-[15px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      style={{ zIndex: "1" }}
                    >
                      <g
                        id="Ellipse_283"
                        data-name="Ellipse 283"
                        fill="none"
                        stroke="#ff5f61"
                        strokeWidth="0.5"
                      >
                        <circle cx="7.5" cy="7.5" r="7.5" stroke="none" />
                        <circle cx="7.5" cy="7.5" r="7.25" fill="none" />
                      </g>
                    </svg>

                    <img
                      width={20}
                      height={20}
                      src={
                        brand?.icon?.file_path ||
                        filters.brands.filter(
                          (sub) => sub.slug === brand.slug
                        )[0]?.icon?.file_path
                      }
                    />
                  </div>
                  <div
                    className="category-title filter-bar-main-title"
                    data-cy="mainFilterBrand"
                  >
                    {brand?.name ||
                      filters.brands.filter((sub) => sub.slug === brand.slug)[0]
                        ?.name}
                  </div>
                </>
              )
          )}
        </>
      )}
      {filtersVariable?.colors?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {filtersVariable?.colors.map((color) => (
            <>
              <div className="main-category-icon flex-row min-w-[15px] min-h-[15px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  style={{ zIndex: "1" }}
                >
                  <g
                    id="Ellipse_283"
                    data-name="Ellipse 283"
                    fill="none"
                    stroke="#ff5f61"
                    strokeWidth="0.5"
                  >
                    <circle cx="7.5" cy="7.5" r="7.5" stroke="none" />
                    <circle cx="7.5" cy="7.5" r="7.25" fill="none" />
                  </g>
                </svg>

                <div
                  className="w-full h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </>
          ))}
        </>
      )}
      {filtersVariable?.prices?.pricesWord && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {
            <>
              <div className="category-title filter-bar-main-title">
                {currency?.symbol}{" "}
                {RoundPrice({
                  num: filtersVariable?.prices?.min,
                  rate: currency?.exchange_rate,
                })}{" "}
                /
                {RoundPrice({
                  num: filtersVariable?.prices?.max,
                  rate: currency?.exchange_rate,
                })}{" "}
              </div>
            </>
          }
        </>
      )}
      {filtersVariable?.sizes?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {filtersVariable?.sizes.map((size, index) => (
            <>
              <div
                className="category-title filter-bar-main-title uppercase"
                data-cy="sizeFilterTitle"
              >
                {size}
              </div>
              {index < filtersVariable?.sizes.length - 1 && " - "}
            </>
          ))}
        </>
      )}
      {(filtersVariable?.searchText?.length > 0 || searchValue?.length > 0) && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          <span>
            <Search className="scale-75" />
          </span>
          <div className="category-title filter-bar-main-title  text-[#5d5d5d]">
            {filtersVariable?.searchText || searchValue}
          </div>
        </>
      )}
    </div>
  );
}

export default FilterInfoBar;
