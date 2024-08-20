import React, { useEffect, useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import { useDispatch, useSelector } from "react-redux";

import { useParams, useSearchParams } from "next/navigation";
import { filterProducts, RoundPrice, UpdateFilter } from "utils/functions";

function SizeCircle({ text }: { text: string }) {
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );
  const pathName = useParams();
  const filters = useSelector((state: any) => state.details.filters);
  const dispatch = useDispatch();
  const filterEnabled = useSelector(
    (state: any) => state.listing.filterEnabled
  );
  const selectCategory = (e) => {
    let { min, max } = getPrice(e);

    dispatch({ type: "FILTER-LOADING", payload: true });
    dispatch({
      type: "FILTER-PRICE",
      payload: {
        min: Math.round(min / currency?.exchange_rate),
        max: Math.round(max / currency?.exchange_rate),
      },
    });
    dispatch({ type: "FILTER-PRICE-TEXT", payload: `${min} - ${max}` });
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
    return (
      selectedFilter?.pricesSelected.filter(
        (s) => s === `${getPrice(text).min} - ${getPrice(text).max}`
      ).length > 0
    );
  };
  const decimal_point_settings = useSelector(
    (state: any) => state.homepage.settings
  );
  const currency = useSelector((state: any) => state.homepage.currency) || 1;
  const getPrice = (text) => {
    let [min, max] = text.split(" - ");

    min = RoundPrice({
      num: min,
      points:
        (decimal_point_settings &&
          decimal_point_settings["starting-setting"]?.decimal_point_settings) ||
        0,
      rate: currency?.exchange_rate,
    });
    max = RoundPrice({
      num: max,
      points:
        (decimal_point_settings &&
          decimal_point_settings["starting-setting"]?.decimal_point_settings) ||
        0,
      rate: currency?.exchange_rate,
    });

    return { min, max };
  };
  return (
    <div
      onClick={() => selectCategory(text)}
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
          className={`brand-photo ${
            isSelected() && "bold-size"
          } whitespace-pre-wrap text-center uppercase`}
          style={{
            backgroundColor: "#fff",
            minHeight: "70px",
            minWidth: "70px",
          }}
        >
          {`${getPrice(text).min} - ${getPrice(text).max}`}
        </div>
      </div>
      <div className="category-text-container flex-col align-center">
        {/* <span className="category-typo">1100</span> */}
      </div>
    </div>
  );
}

function PricesRow() {
  const filters = useSelector((state: any) => state.details.filters);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider: HTMLDivElement = document?.querySelector(".prices-row");
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
  return (
    <div className="category-row-container brand-row prices-row flex-row">
      {filters?.prices?.priceRanges.map(
        (price, key) =>
          price.products_count > 0 && <SizeCircle text={price.text} key={key} />
      )}
    </div>
  );
}

export default PricesRow;
