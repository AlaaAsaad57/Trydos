"use client";
import React, { useEffect } from "react";
import "styles/listing-components.css";
import SearchIcon from "public/svg/listing/searchIcon.svg";
import SortIcon from "public/svg/listing/sortIcon.svg";
import FilterIcon from "public/svg/listing/filterIcon.svg";
import ShareIcon from "public/svg/listing/shareIcon.svg";
import BackIcon from "public/svg/listing/backIcon.svg";
import BoutiqueHeader from "./BoutiqueHeader";
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
import { DebounceInput } from "node_modules/react-debounce-input/src";
import { PrefetchKind } from "node_modules/next/dist/client/components/router-reducer/router-reducer-types";
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
  const onChange = (e) => {
    setFilterLoading(true);

    searchFilter(e.target.value);
    UpdateFilter({
      sizesAttr: sizesAttr,
      boutiqueId: pathName.productCategory,
      lang: pathName.lang,
      done: () => {
        setFilterLoading(false);
      },
      newFiltersCallback: ({ filtersVar }) => {
        editFilter({ ...filtersVar });
      },
      searchText: e.target.value,
    });

    if (filterEnabled) {
    } else {
      const params = new URLSearchParams(searchParams);
      setSkeleton(true);
      filterProducts({
        serachTrigger: true,
        boutiqueId:
          (params.get("boutique_slugs") && params.get("boutique_slugs")) ||
          pathName.productCategory,
        lang: paramsVar.lang,
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
        searchText: e.target.value,
      });
      setEnableFilter(false);
      if (e.target.value > 0) {
        params.set("searchText", e.target.value);
      } else {
        params.delete("searchText");
      }
      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
      router.replace(`${pathname}?${params.toString()}`, { shallow: true });
    }
  };

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
        >
          <div
            className={`filter-option transition-all filter-search-option relative ${
              search &&
              "w-[75%] [&>input]:w-full [&>input]:bg-[#f8f8f8] [&>input]:h-[40px]"
            }`}
            data-cy="searchIcon_boutiquePage"
            onClick={() => {
              Sendevent({
                event: "button_clicked",
                value: "open_search_field_button",
              });
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
              setFilterSearch(true);
            }}
          >
            <DebounceInput
              data-cy="inputFiled"
              id="filter-search"
              debounceTimeout={400}
              value={selectedFilter.searchText}
              onBlur={() => {
                if (selectedFilter?.searchText.length === 0) {
                  if (
                    document.querySelector<HTMLInputElement>(
                      ".boutique-logo-container"
                    )
                  )
                    document.querySelector<HTMLInputElement>(
                      ".boutique-logo-container"
                    ).style.display = "flex";
                  setFilterSearch(false);
                }
              }}
              onChange={(e) => {
                onChange(e);
              }}
              onKeyDown={(e) => {
                //@ts-ignore
                if (e.keyCode == 13) {
                  const params = new URLSearchParams(searchParams);
                  setSkeleton(true);
                  filterProducts({
                    serachTrigger: true,
                    boutiqueId:
                      (params.get("boutique_slugs") &&
                        params.get("boutique_slugs")) ||
                      pathName.productCategory,
                    lang: paramsVar.lang,
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
                    searchText: selectedFilter.searchText,
                  });
                  setEnableFilter(false);
                  if (selectedFilter.searchText.length > 0) {
                    params.set("searchText", selectedFilter.searchText);
                  } else {
                    params.delete("searchText");
                  }
                  router.replace(`${pathname}?${params.toString()}`, {
                    // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'

                    shallow: true,
                  });
                  // @ts-ignore
                  e.target.blur();
                }
              }}
              className={`${
                search && "pl-[40px]"
              } rounded-[15px]  w-0 h-full border-0 outline-none text-[#5d5d5d]`}
            />
            <SearchIcon
              className={`absolute z-10 ${
                search ? "top-[9px] left-[14px]" : "top-0 left-0"
              }`}
            />
          </div>
          <div className="filter-option">
            <SortIcon data-cy="closeSearchInput" />
          </div>
          <div
            className="filter-option"
            data-cy="settingsIcon"
            onClick={() => {
              setEnableFilter(!filterEnabled);

              if (filterEnabled) {
                Sendevent({
                  event: "button_clicked",
                  value: "filter_close_icon_button",
                });
                normalizeView();
              } else {
                Sendevent({
                  event: "button_clicked",
                  value: "product_listing_filter_icon_button",
                });
                expandView({ filter: true });
                window.scrollTo({ top: 0 });
              }
            }}
          >
            {(products.length > 1 || productsServer > 1) && (
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
        showFilters={products?.length > 1 || productsServer > 1}
      />
      {!filterEnabled && showFilterInfoBar() && (
        <FilterInfoBar filtersVariable={activeFilters} />
      )}
      {filterEnabled && showFilterInfoBar() && <FloatingInfoBar />}
    </>
  );
}

export default FilterBar;
