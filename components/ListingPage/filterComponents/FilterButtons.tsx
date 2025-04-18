import Spinner from "components/global/Spinner";

import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import React from "react";
import { useAppStore } from "store";
import {
  filterProducts,
  normalizeView,
  Sendevent,
  UpdateFilter,
} from "utils/functions";

function FilterButtons() {
  const {
    resetSelected,
    applySelected,
    setFilterLoading,
    editFilter,
    setActiveRoute,
    setFilterEnabled,
    getProducts,
    setSkeleton,
    setLoadingProducts,
    resetListingFilter,
    setActiveFilter,
    details_loading,
    selectedFilter,
    totalProducts,
    filters,
    activeFiltersShouldUpdate,
    filterEnabled,
    activeFilters,
    isChangedFilter,
  } = useAppStore();

  const sizesAttr = filters.sizesAttr;
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
    setActiveRoute(`${pathname}?${params.toString()}`);
    // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
    replace(`${pathname}?${params.toString()}`, { shallow: true });
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
  const isSelectFilter = () => {
    if (
      selectedFilter.categories.length > 0 ||
      selectedFilter.brands.length > 0 ||
      selectedFilter.colors.length > 0 ||
      selectedFilter.sizes.length > 0 ||
      selectedFilter.searchText.length > 0 ||
      selectedFilter.prices?.pricesWord
    )
      return true;
    else return false;
  };

  return (
    <>
      {filterEnabled && (
        <div className="filter-buttons flex-row">
          {showFilterInfoBar() ? (
            <div
              className={`apply-button flex-row`}
              onClick={() => {
                if (!details_loading) {
                  Sendevent({
                    event: "button_clicked",
                    value: "apply_filter_button",
                  });
                  applySelected();
                  setLoadingProducts(true);
                  resetListingFilter();
                  setSkeleton(true);
                  filterProducts({
                    boutiqueId:
                      (SearchParams.get("boutique_slugs") &&
                        SearchParams.get("boutique_slugs")) ||
                      pathName.productCategory,

                    lang: pathName.lang,
                    sizesAttr: sizesAttr,
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
                  setFilterEnabled(false);
                  window.scrollTo({ top: 0 });
                  normalizeView();
                  if (activeFiltersShouldUpdate) handleSearch(selectedFilter);
                }
              }}
            >
              Apply
              {details_loading ? (
                <span className="ml-2">
                  <Spinner />
                </span>
              ) : (
                <span
                  className="text-[#fafafa] regular ml-2"
                  data-cy="totalProduct_filterBoutique"
                >
                  (Total Products: {totalProducts})
                </span>
              )}
            </div>
          ) : (
            <></>
          )}
          {isSelectFilter() && (
            <div
              className="reset-button flex-row"
              data-cy="resetButton"
              onClick={() => {
                Sendevent({
                  event: "button_clicked",
                  value: "reset_button",
                });
                resetSelected();
                setFilterLoading(true);
                UpdateFilter({
                  filtersVar: {
                    categories: [],
                    brands: [],
                    colors: [],
                    sizes: [],
                    boutiques: [],
                  },
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
              }}
            >
              Reset
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default FilterButtons;
