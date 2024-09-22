import React, { useEffect, useState } from "react";
import ActiveCategoryIcon from "public/svg/listing/ActiveCategoryIcon.svg";
import { useDispatch, useSelector } from "react-redux";

import { useParams, useSearchParams } from "next/navigation";
import { filterProducts, RoundPrice, UpdateFilter } from "utils/functions";

function SizeCircle({
  text,
}: {
  text: {
    min_price: number;
    max_price: number;
    min_price_formated: string;
    max_price_formated: string;
  };
}) {
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
    let { min_price, max_price, min_price_formated, max_price_formated } = e;

    dispatch({ type: "FILTER-LOADING", payload: true });
    dispatch({
      type: "FILTER-PRICE",
      payload: {
        min: Math.round(min_price),
        max: Math.round(max_price),
      },
    });
    dispatch({
      type: "FILTER-PRICE-TEXT",
      payload: `${min_price_formated} - ${max_price_formated}`,
    });
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
        (s) => s === `${text.min_price_formated} - ${text.max_price_formated}`
      ).length > 0
    );
  };
  const decimal_point_settings = useSelector(
    (state: any) => state.homepage.settings
  );
  const currency = useSelector((state: any) => state.homepage.currency) || 1;

  return (
    <div
      onClick={() => selectCategory(text)}
      className={`category-circle flex-col align-center ${
        true && "extended-circle"
      }`}
    >
      {" "}
      <div className="relative w-[140px] h-[70px]">
        {isSelected() && (
          <ActiveCategoryIcon className="active-category-icon" />
        )}

        <div
          className={`brand-photo ${
            isSelected() && "bold-size"
          } whitespace-pre-wrap text-center uppercase rounded-xl ${
            isSelected()
              ? "border-[#FF5F61] border-[1px] border-dashed"
              : " border-[#6b6b6b] border-[1px] border-dashed"
          }`}
          style={{
            backgroundColor: "#fff",
            minHeight: "70px",
            minWidth: "140px",
          }}
        >
          {currency?.currency_symbol}
          {` ${RoundPrice({
            num: text.min_price_formated,
            points: decimal_point_settings,
            rate: currency.exchange_rate,
          })} - ${RoundPrice({
            num: text.max_price_formated,
            points: decimal_point_settings,
            rate: currency.exchange_rate,
          })}`}
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
          price.products_count > 0 && <SizeCircle text={price} key={key} />
      )}
    </div>
  );
}

export default PricesRow;
