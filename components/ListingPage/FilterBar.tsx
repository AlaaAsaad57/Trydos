"use client";
import React, { useEffect } from "react";

import BackIcon from "public/svg/listing/backIcon.svg";
import FilterInfoBar from "./FilterInfoBar";
import {
  expandView,
  filterProducts,
  normalizeView,
  Sendevent,
  UpdateFilter,
} from "utils/functions";
import FloatingInfoBar from "./filterComponents/FloatingInfoBar";

import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import NextLink from "components/global/NextLink";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { useAppStore } from "store";

function FilterBar({ boutique, filters: filtersObj, productsServer }) {
  const {
    disableAddToCartOption,
    resetSelectedBack,
    initFilter,
    setFilterLoading,
    resetFilters,
    editFilter,
    setFilterSearch,
    searchFilter,
    setFilterEnabled,
    getProducts,
    setSkeleton,
    resetBoutique,
    setActiveFilter,
    selectedFilter,
    filterEnabled,
    activeFilters,
    products,
    filters,
    search,
  } = useAppStore();

  const pathName = useParams();

  const setEnableFilter = (e) => {
    setFilterEnabled(e);
  };

  const sizesAttr = filters.sizesAttr;
  const showFilterInfoBar = () => {
    if (
      selectedFilter.categories.length > 0 ||
      selectedFilter.brands.length > 0 ||
      selectedFilter.sizes.length > 0 ||
      selectedFilter.colors.length > 0 ||
      selectedFilter.offers.length > 0 ||
      activeFilters.prices?.pricesWord ||
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

  useEffect(() => {
    let filtersVar = {
      categories: filtersObj?.categories || [],
      brands: filtersObj?.brands || [],
      attributes: filtersObj?.attributes || [],
      offers: filtersObj?.offers || [],
      prices: filtersObj?.prices || null,
      search_text: filtersObj?.result_for || "",
      colors: filtersObj?.colors || [],
    };
    initFilter(filtersVar);

    disableAddToCartOption();
    router.prefetch(`/${paramsVar.lang}`, {
      kind: PrefetchKind.FULL,
    });
  }, []);

  return (
    <>
      <div className="filter-listing-bar relative flex-row align-center">
        <NextLink
          href={filterEnabled ? "#" : "/"}
          className="back-icon"
          data-cy="backIcon_pageAfterClickSearchTotal"
          onClick={() => {
            if (!filterEnabled) {
              // router.push(`/`);
              Sendevent({
                event: "button_clicked",
                value: "back_app_button",
              });
              resetFilters();
              resetBoutique();
              // dispatchRouteChangeEvent("start", {
              //   to: "HomePage",
              //   from: "details",
              // });

              // document.documentElement.style.overflow = "hidden";
              // document.documentElement.scrollTop = 0;
            } else {
              resetSelectedBack();

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
                  setFilterLoading(false);
                },
                newFiltersCallback: ({ filtersVar }) => {
                  editFilter(filtersVar);
                },
                searchText: selectedFilter?.searchText,
              });
              setEnableFilter(false);
              normalizeView();
            }
          }}
        >
          <BackIcon data-cy="back_icon_boutique_page" />
        </NextLink>
        <div
          className={`filter-bar-options flex-row align-center ${
            search && "w-full"
          }`}
        ></div>
      </div>
      {/* <BoutiqueHeader
        boutique={boutique}
        showFilters={products?.length > 1 || productsServer > 1}
      /> */}
      {!filterEnabled && showFilterInfoBar() && (
        <FilterInfoBar filtersVariable={activeFilters} />
      )}
      {filterEnabled && showFilterInfoBar() && <FloatingInfoBar />}
    </>
  );
}

export default FilterBar;
