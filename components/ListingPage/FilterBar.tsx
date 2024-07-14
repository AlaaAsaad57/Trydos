"use client";
import React, { useEffect, useState } from "react";
import "styles/listing-components.css";
import SearchIcon from "public/svg/listing/searchIcon.svg";
import SortIcon from "public/svg/listing/sortIcon.svg";
import FilterIcon from "public/svg/listing/filterIcon.svg";
import ShareIcon from "public/svg/listing/shareIcon.svg";
import BackIcon from "public/svg/listing/backIcon.svg";
import BoutiqueHeader from "./BoutiqueHeader";
import FilterInfoBar from "./FilterInfoBar";
import { useDispatch, useSelector } from "react-redux";
import { expandView, filterProducts, normalizeView } from "utils/functions";
import FloatingInfoBar from "./filterComponents/FloatingInfoBar";
import { dispatchRouteChangeEvent } from "Hooks/events";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
function FilterBar({ boutique, filters }) {
  const dispatch = useDispatch();
  const setEnableFilter = (e) => {
    dispatch({ type: "filterEnabled", payload: e });
  };
  const filterEnabled = useSelector(
    (state: any) => state.listing.filterEnabled
  );
  const activeFilters = useSelector(
    (state: any) => state.details.activeFilters
  );
  const selectedFilters = useSelector(
    (state: any) => state.details.selectedFilter
  );
  const ActiveSearch = useSelector((state: any) => state.details.search);
  const sizesAttr = useSelector(
    (state: any) => state.details.filters.sizesAttr
  );
  const showFilterInfoBar = () => {
    if (
      activeFilters.categories.length > 0 ||
      activeFilters.brands.length > 0 ||
      activeFilters.sizes.length > 0 ||
      activeFilters.offers.length > 0 ||
      activeFilters.prices?.min >= 0
    ) {
      return true;
    } else {
      return false;
    }
  };
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const paramsVar = useParams();
  const { replace, push } = useRouter();
  const onChange = (e) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value.length > 2 || e.target.value === 0) {
      dispatch({ type: "Skeleton-Listing" });
      filterProducts({
        serachTrigger: true,
        boutiqueId: paramsVar.productCategory,
        lang: paramsVar.lang,
        sizesAttr: sizesAttr,
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
        searchText: e.target.value,
      });
      params.set("searchText", e.target.value);
    } else {
      params.delete("searchText");
    }
    replace(`${pathname}?${params.toString()}`);
    filterProducts({
      boutiqueId: paramsVar.productCategory,
      lang: paramsVar.lang,
      sizesAttr: sizesAttr,
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
      searchText: e.target.value,
    });
  };

  useEffect(() => {
    dispatch({ type: "FILTER-INIT", payload: filters });
  }, []);
  return (
    <>
      <div className="filter-listing-bar relative flex-row align-center">
        <div
          className="back-icon"
          onClick={() => {
            dispatchRouteChangeEvent("start", {
              to: "HomePage",
              from: "details",
            });
            push(`/`);
            document.documentElement.style.overflow = "hidden";
            document.documentElement.scrollTop = 0;
          }}
        >
          <BackIcon />
        </div>
        <div
          className={`filter-bar-options flex-row align-center ${
            ActiveSearch && "w-full"
          }`}
        >
          <div
            className={`filter-option transition-all filter-search-option relative ${
              ActiveSearch &&
              "w-[75%] [&>input]:w-full [&>input]:bg-[#f8f8f8] [&>input]:h-[40px]"
            }`}
            onClick={() => {
              document
                .querySelector<HTMLInputElement>("#filter-search")
                ?.focus();
              dispatch({ type: "FILTER-SEARCH-ENABLE", payload: true });
            }}
          >
            <input
              id="filter-search"
              value={selectedFilters.searchText}
              onBlur={() => {
                if (selectedFilters?.searchText.length === 0) {
                  dispatch({ type: "FILTER-SEARCH-ENABLE", payload: false });
                }
              }}
              onChange={(e) => {
                onChange(e);
                dispatch({ type: "SEARCH-FILTER", payload: e.target.value });
              }}
              className={`${
                ActiveSearch && "pl-[40px]"
              } rounded-[15px]  w-0 h-full border-0 outline-none`}
            />
            <SearchIcon
              className={`absolute z-10 ${
                ActiveSearch ? "top-[9px] left-[14px]" : "top-0 left-0"
              }`}
            />
          </div>
          <div className="filter-option">
            <SortIcon />
          </div>
          <div
            className="filter-option"
            onClick={() => {
              setEnableFilter(!filterEnabled);

              if (filterEnabled) {
                normalizeView();
              } else {
                expandView({ filter: true });
                window.scrollTo({ top: 0 });
              }
            }}
          >
            <FilterIcon
              className={`${filterEnabled && "filter-icon-enabled"}`}
            />
          </div>
          <div
            className="filter-option"
            onClick={() => {
              let url = document.location.href;

              navigator.clipboard.writeText(url).then(
                function () {
                  console.log("Copied!");
                },
                function () {
                  console.log("Copy error");
                }
              );
            }}
          >
            <ShareIcon />
          </div>
        </div>
      </div>
      <BoutiqueHeader boutique={boutique} />
      {!filterEnabled && showFilterInfoBar() && <FilterInfoBar />}
      {filterEnabled && showFilterInfoBar() && <FloatingInfoBar />}
    </>
  );
}

export default FilterBar;
