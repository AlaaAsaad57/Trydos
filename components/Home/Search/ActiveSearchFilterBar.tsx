"use client";
import React, { useEffect } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import CloseIcon from "public/svg/CloseIcon.svg";
import { useParams, useSearchParams } from "next/navigation";
import Search from "public/svg/SearchIcon.svg";
import { useAppStore } from "store";
import search from "services/search";
import { Sendevent } from "utils/functions";
import { GA_CLICK_EVENT_VALUES, GA_EVENT_NAMES } from "utils/GAEvents";

function ActiveSearchFilterBar() {
  const { value, searchFilters, resetSearchFilter, setSearchWord } =
    useAppStore();

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
  const getCategory = (slug) => {
    let variable = {
      name: "",
      most_viewed_product_thumbnail: "",
    };
    searchFilters.categories.map((s) =>
      s.childes?.map((sub) => {
        variable = sub;
        if (sub.slug === slug) return sub;
      })
    );
    return variable;
  };
  const { lang } = useParams();
  return (
    <div
      className="filter-info-bar flex-row cursor-pointer align-center overflow-x-scroll overflow-y-hidden whitespace-nowrap [&> *]: select-none "
      data-cy="filterInfo"
    >
      <CloseIcon
        data-cy="closeIcon"
        className="mr-2 ml-2"
        onClick={() => {
          Sendevent({
            event: GA_EVENT_NAMES.CLICK,
            value: GA_CLICK_EVENT_VALUES.RESET_HOME_SEARCH_BUTTON,
          });
          resetSearchFilter();
          setSearchWord("");
          search.getSearchOptions({
            noProducts: true,
            lang: lang,
          });
        }}
      />
      {searchFilters?.categories.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />

          {searchFilters?.categories.map(
            (category, key) =>
              (category.name ||
                searchFilters.categories.filter(
                  (s) => s.slug === category.slug
                )[0]?.name ||
                getCategory(category.slug)?.name) && (
                <>
                  <div
                    className="main-category-icon flex-row min-w-[15px] min-h-[15px]"
                    key={category.slug}
                  >
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
                        category.most_viewed_product_thumbnail ??
                        category.flat_photo_path?.file_path ??
                        searchFilters.categories.filter(
                          (s) => s.slug === category.slug
                        )[0]?.most_viewed_product_thumbnail ??
                        getCategory(category.slug)
                          ?.most_viewed_product_thumbnail
                      }
                    />
                  </div>
                  <div
                    className="category-title filter-bar-main-title"
                    data-cy="mainFilter"
                  >
                    {category?.name ||
                      searchFilters.categories.filter(
                        (s) => s.slug === category.slug
                      )[0]?.name ||
                      getCategory(category.slug)?.name}
                  </div>
                  {category?.categories_sub?.map((s) => (
                    <>
                      <div
                        className="sub-category-icon flex-row min-h-[10px] min-w-[10px]"
                        key={s.slug}
                      >
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
                            searchFilters.categories.filter(
                              (sub) => sub.slug === s.slug
                            )[0]?.icon?.file_path
                          }
                          width={10}
                          height={10}
                        />
                      </div>
                      <div
                        className="category-title filter-bar-main-title"
                        key={`${s.slug}-name`}
                      >
                        {s.name ||
                          searchFilters.categories.filter(
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
      {searchFilters?.boutiques?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {searchFilters?.boutiques?.map(
            (category) =>
              category.name && (
                <>
                  <div
                    className="main-category-icon flex-row min-w-[15px] min-h-[15px]"
                    key={category.slug}
                  >
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
                  <div
                    className="category-title filter-bar-main-title"
                    key={`${category.slug}-name`}
                  >
                    {category?.name}
                  </div>
                </>
              )
          )}
        </>
      )}
      {searchFilters?.brands?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          {searchFilters?.brands?.map(
            (brand) =>
              (brand.name ||
                searchFilters.brands.filter((s) => s.slug === brand.slug)[0]
                  ?.name) && (
                <>
                  <div
                    className="main-category-icon flex-row min-w-[15px] min-h-[15px]"
                    key={brand.slug}
                  >
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
                        searchFilters.brands.filter(
                          (sub) => sub.slug === brand.slug
                        )[0]?.icon?.file_path
                      }
                    />
                  </div>
                  <div
                    className="category-title filter-bar-main-title"
                    data-cy="mainFilterBrand"
                    key={`${brand.slug}-name`}
                  >
                    {brand?.name ||
                      searchFilters.brands.filter(
                        (sub) => sub.slug === brand.slug
                      )[0]?.name}
                  </div>
                </>
              )
          )}
        </>
      )}

      {value?.length > 0 && (
        <>
          <ActiveCategoryIcon style={{ height: "21px" }} />
          <span>
            <Search className="scale-75" />
          </span>
          <div className="category-title filter-bar-main-title  text-[#5d5d5d]">
            {value}
          </div>
        </>
      )}
    </div>
  );
}

export default ActiveSearchFilterBar;
