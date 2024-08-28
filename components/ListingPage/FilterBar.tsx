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
import {
  expandView,
  filterProducts,
  getListingDataFilters,
  normalizeView,
  UpdateFilter,
} from "utils/functions";
import FloatingInfoBar from "./filterComponents/FloatingInfoBar";
import { dispatchRouteChangeEvent } from "Hooks/events";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import useDebounce from "Hooks/useDebounce";
import NextLink from "Hooks/NextLink";
function FilterBar({ boutique, filters, productsServer }) {
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );

  const pathName = useParams();
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
  const products = useSelector((state: any) => state.listing.products);
  const ActiveSearch = useSelector((state: any) => state.details.search);
  const sizesAttr = useSelector(
    (state: any) => state.details.filters.sizesAttr
  );
  const showFilterInfoBar = () => {
    if (
      selectedFilter.categories.length > 0 ||
      selectedFilter.brands.length > 0 ||
      selectedFilter.sizes.length > 0 ||
      selectedFilter.colors.length > 0 ||
      selectedFilter.offers.length > 0 ||
      selectedFilter.prices?.pricesWord ||
      selectedFilter.searchText?.length > 0
    ) {
      return true;
    } else {
      return false;
    }
  };
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const paramsVar = useParams();
  const router = useRouter();
  const onChange = (e) => {
    dispatch({ type: "FILTER-LOADING", payload: true });
    dispatch({ type: "SEARCH-FILTER", payload: e.target.value });
    UpdateFilter({
      sizesAttr: sizesAttr,
      boutiqueId: pathName.productCategory,
      lang: pathName.lang,
      done: () => {
        dispatch({ type: "FILTER-LOADING", payload: false });
      },
      newFiltersCallback: ({ filtersVar }) => {
        dispatch({
          type: "EDIT-FILTER",
          payload: { ...filtersVar },
        });
      },
      searchText: e.target.value,
    });
    if (filterEnabled) {
    } else {
      const params = new URLSearchParams(searchParams);
      dispatch({ type: "Skeleton-Listing" });
      filterProducts({
        serachTrigger: true,
        boutiqueId:
          (params.get("boutique_slugs") && params.get("boutique_slugs")) ||
          pathName.productCategory,
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
      setEnableFilter(false);
      if (e.target.value > 0) {
        params.set("searchText", e.target.value);
      } else {
        params.delete("searchText");
      }
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  useEffect(() => {
    getListingDataFilters({
      ...filters,
      callback: (Listing_Data_res) => {
        let filtersVar = {
          categories: Listing_Data_res.body.data?.categories || [],
          brands: Listing_Data_res.body.data?.brands || [],
          attributes: Listing_Data_res.body.data?.attributes || [],
          offers: Listing_Data_res.body.data?.offers || [],
          prices: Listing_Data_res.body.data?.prices || null,
          search_text: Listing_Data_res.body.data?.result_for || "",
          colors: Listing_Data_res.body.data?.colors || [],
        };

        dispatch({ type: "FILTER-INIT", payload: filtersVar });
      },
    });
  }, []);
  return (
    <>
      <div className="filter-listing-bar relative flex-row align-center">
        <NextLink
          href={filterEnabled ? "#" : "/"}
          className="back-icon"
          onClick={() => {
            if (!filterEnabled) {
              // router.push(`/`);
              window.location.href = `/`;
              dispatch({ type: "RESET-FILTERS" });

              // dispatchRouteChangeEvent("start", {
              //   to: "HomePage",
              //   from: "details",
              // });

              // document.documentElement.style.overflow = "hidden";
              // document.documentElement.scrollTop = 0;
            } else {
              dispatch({ type: "RESET-SELECTED-Back" });

              UpdateFilter({
                filtersVar: {
                  categories: activeFilters.categories,
                  brands: activeFilters.brands,
                  colors: activeFilters.colors,
                  sizes: activeFilters.sizes,
                },
                sizesAttr: sizesAttr,
                boutiqueId: pathName.productCategory,
                lang: pathName.lang,
                done: () => {
                  dispatch({ type: "FILTER-LOADING", payload: false });
                },
                newFiltersCallback: ({ filtersVar }) => {
                  dispatch({
                    type: "EDIT-FILTER",
                    payload: { ...filtersVar, reset: true },
                  });
                },
                searchText: selectedFilter?.searchText,
              });
              setEnableFilter(false);
              normalizeView();
            }
          }}
        >
          <BackIcon />
        </NextLink>
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
              if (
                document.querySelector<HTMLInputElement>(
                  ".boutique-logo-container"
                )
              )
                document.querySelector<HTMLInputElement>(
                  ".boutique-logo-container"
                ).style.display = "none";
              dispatch({ type: "FILTER-SEARCH-ENABLE", payload: true });
            }}
          >
            <input
              id="filter-search"
              value={selectedFilters.searchText}
              onBlur={() => {
                if (selectedFilters?.searchText.length === 0) {
                  if (
                    document.querySelector<HTMLInputElement>(
                      ".boutique-logo-container"
                    )
                  )
                    document.querySelector<HTMLInputElement>(
                      ".boutique-logo-container"
                    ).style.display = "flex";
                  dispatch({ type: "FILTER-SEARCH-ENABLE", payload: false });
                }
              }}
              onChange={(e) => {
                onChange(e);
              }}
              onKeyDown={(e) => {
                //@ts-ignore
                if (e.keyCode == 13) {
                  const params = new URLSearchParams(searchParams);
                  dispatch({ type: "Skeleton-Listing" });
                  filterProducts({
                    serachTrigger: true,
                    boutiqueId:
                      (params.get("boutique_slugs") &&
                        params.get("boutique_slugs")) ||
                      pathName.productCategory,
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
                    searchText: selectedFilters.searchText,
                  });
                  setEnableFilter(false);
                  if (selectedFilters.searchText > 0) {
                    params.set("searchText", selectedFilters.searchText);
                  } else {
                    params.delete("searchText");
                  }
                  router.replace(`${pathname}?${params.toString()}`);
                  // @ts-ignore
                  e.target.blur();
                }
              }}
              className={`${
                ActiveSearch && "pl-[40px]"
              } rounded-[15px]  w-0 h-full border-0 outline-none text-[#5d5d5d]`}
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
            {(products.length > 1 || productsServer?.length > 1) && (
              <FilterIcon
                className={`${filterEnabled && "filter-icon-enabled"}`}
              />
            )}
          </div>
          <div
            className="filter-option"
            onClick={() => {
              let url = document.location.href;

              navigator.clipboard.writeText(url).then(
                function () {},
                function () {}
              );
            }}
          >
            <ShareIcon />
          </div>
        </div>
      </div>
      <BoutiqueHeader
        boutique={boutique}
        showFilters={products?.length > 1 || productsServer?.length > 1}
      />
      {!filterEnabled && showFilterInfoBar() && (
        <FilterInfoBar filtersVariable={activeFilters} />
      )}
      {filterEnabled && showFilterInfoBar() && <FloatingInfoBar />}
    </>
  );
}

export default FilterBar;
