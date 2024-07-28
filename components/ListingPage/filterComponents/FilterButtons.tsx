import Spinner from "components/global/Spinner";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { filterProducts, normalizeView, UpdateFilter } from "utils/functions";

function FilterButtons() {
  const loading = useSelector((state: any) => state.details.loading);

  const dispatch = useDispatch();
  const selectedFilter = useSelector(
    (state: any) => state.details.selectedFilter
  );

  const sizesAttr = useSelector(
    (state: any) => state.details.filters.sizesAttr
  );

  const activeFiltersShouldUpdate = useSelector(
    (state: any) => state.details.activeFiltersShouldUpdate
  );
  const filterEnabled = useSelector(
    (state: any) => state.listing.filterEnabled
  );
  const activeFilters = useSelector(
    (state: any) => state.details.activeFilters
  );
  const isChangedFilter = useSelector(
    (state: any) => state.details.isChangedFilter
  );
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const pathName = useParams();
  const handleSearch = (data) => {
    const params = new URLSearchParams(searchParams);
    //categories
    if (data.categories.length > 0) {
      params.set("categories", `${data.categories.map((s) => s.slug)}`);
    } else {
      if (params.get("categories")) {
        params.delete("categories");
      }
    }
    //colors
    if (data.colors.length > 0) {
      params.set("colors", `${data.colors.map((s) => s)}`);
    } else {
      if (params.get("colors")) {
        params.delete("colors");
      }
    }
    //brands
    if (data.brands.length > 0) {
      params.set("brands", `${data.brands.map((s) => s.slug)}`);
    } else {
      if (params.get("brands")) {
        params.delete("brands");
      }
    }
    //sizes
    if (data.sizes.length > 0) {
      params.set("sizes", `${data.sizes.map((s) => s)}`);
      params.set("attr-var", `{id:'${sizesAttr.id}',name:'${sizesAttr.name}'}`);
    } else {
      if (params.get("sizes")) {
        params.delete("sizes");
        params.delete("attr-var");
      }
    }
    //offers
    if (data.offers.length > 0) {
      params.set("offers", `${data.offers.map((s) => s)}`);
    } else {
      if (params.get("offers")) {
        params.delete("offers");
      }
    }
    //prices
    if (data.prices && data.prices?.min >= 0 && data.prices?.max >= 0) {
      params.set("max-pr", `${data.prices.max}`);
      params.set("min-pr", `${data.prices.min}`);
    } else {
      if (params.get("max-pr") && params.get("max-pr")) {
        params.delete("max-pr");
        params.delete("min-pr");
      }
    }
    if (data.searchText?.length > 0) {
      params.set("searchText", data.searchText);
    } else {
      params.delete("searchText");
    }
    dispatch({
      type: "ACTIVE-ROUTE",
      payload: `${pathname}?${params.toString()}`,
    });
    replace(`${pathname}?${params.toString()}`);
  };
  const showFilterInfoBar = () => {
    if (
      filterEnabled &&
      isChangedFilter &&
      (selectedFilter.categories.length !== activeFilters.categories.length ||
        selectedFilter.colors.length !== activeFilters.colors.length ||
        selectedFilter.sizes.length !== activeFilters.sizes.length ||
        selectedFilter.offers.length !== activeFilters.offers.length ||
        selectedFilter.brands.length !== activeFilters.brands.length ||
        selectedFilter?.searchText !== activeFilters.searchText ||
        selectedFilter?.prices?.pricesWord)
    ) {
      return true;
    } else {
      return false;
    }
  };
  const SearchParams = useSearchParams();

  return (
    <>
      {showFilterInfoBar() && (
        <div className="filter-buttons flex-row">
          <div
            className={`apply-button flex-row`}
            onClick={() => {
              if (!loading) {
                dispatch({ type: "APPLY-SELECTED" });
                dispatch({ type: "PRODUCT_LOADING" });
                dispatch({ type: "RESET_LISTING_FILTER" });
                dispatch({ type: "Skeleton-Listing" });
                filterProducts({
                  boutiqueId: (SearchParams.get("boutique_slugs") &&
                    SearchParams.get("boutique_slugs")) || [
                    pathName.productCategory,
                  ],
                  lang: pathName.lang,
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
                });
                dispatch({ type: "filterEnabled", payload: false });
                window.scrollTo({ top: 0 });
                normalizeView();
                if (activeFiltersShouldUpdate) handleSearch(selectedFilter);
              }
            }}
          >
            Apply
            {loading && (
              <span className="ml-2">
                <Spinner />
              </span>
            )}
          </div>
          <div
            className="reset-button flex-row"
            onClick={() => {
              dispatch({ type: "RESET-SELECTED" });
              dispatch({ type: "FILTER-LOADING", payload: true });
              UpdateFilter({
                filtersVar: {
                  categories: [],
                  brands: [],
                  colors: [],
                  sizes: [],
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
                searchText: "",
              });
            }}
          >
            Reset
          </div>
        </div>
      )}
    </>
  );
}

export default FilterButtons;
