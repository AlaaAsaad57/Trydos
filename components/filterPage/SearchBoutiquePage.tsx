"use client";
import React from "react";
import SearchIcon from "public/svg/listing/searchIcon.svg";
import { filterProducts, Sendevent, UpdateFilter } from "utils/functions";
import { useAppStore } from "store";
import { DebounceInput } from "react-debounce-input/src";
import { useParams, useSearchParams, useRouter } from "next/navigation";
function SearchBoutiquePage() {
  const UrlParams = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const sizesAttr = filters.sizesAttr;
  const onChange = (e) => {
    setFilterLoading(true);

    searchFilter(e.target.value);
    // UpdateFilter({
    //   sizesAttr: sizesAttr,
    //   boutiqueId: UrlParams.boutiqueId,
    //   lang: UrlParams.lang,
    //   done: () => {
    //     setFilterLoading(false);
    //   },
    //   newFiltersCallback: ({ filtersVar }) => {
    //     editFilter({ ...filtersVar });
    //   },
    //   searchText: e.target.value,
    // });

    if (filterEnabled) {
    } else {
      const params = new URLSearchParams(searchParams);
      //   setSkeleton(true);
      //   filterProducts({
      //     serachTrigger: true,
      //     boutiqueId:
      //       (params.get("boutique_slugs") && params.get("boutique_slugs")) ||
      //       UrlParams.boutiqueId,
      //     lang: UrlParams.lang,
      //     sizesAttr: sizesAttr,
      //     callback: (products) => {
      //       getProducts({ products });
      //     },
      //     offset: 1,
      //     storeCallback: (e) => {
      //       setActiveFilter(e);
      //     },
      //     newFiltersCallback: ({ filtersVar }) => {
      //       editFilter(filtersVar);
      //     },
      //     searchText: e.target.value,
      //   });
      setFilterEnabled(false);
      if (e.target.value > 0) {
        params.set("searchText", e.target.value);
      } else {
        params.delete("searchText");
      }
      // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'
      router.replace(`${pathname}?${params.toString()}`, { shallow: true });
    }
  };
  return (
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
        document.querySelector<HTMLInputElement>("#filter-search")?.focus();
        if (
          document.querySelector<HTMLInputElement>(".boutique-logo-container")
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
        onFocus={() => {
          document
            .querySelector<HTMLInputElement>(".filter-bar-options")
            .classList.add("w-full");
        }}
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
            document
              .querySelector<HTMLInputElement>(".filter-bar-options")
              .classList.remove("w-full");
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
            //   filterProducts({
            //     serachTrigger: true,
            //     boutiqueId:
            //       (params.get("boutique_slugs") &&
            //         params.get("boutique_slugs")) ||
            //         UrlParams.productCategory,
            //     lang: UrlParams.lang,
            //     sizesAttr: sizesAttr,
            //     callback: (products) => {
            //       getProducts({ products });
            //     },
            //     offset: 1,
            //     storeCallback: (e) => {
            //       setActiveFilter(e);
            //     },
            //     newFiltersCallback: ({ filtersVar }) => {
            //       editFilter(filtersVar);
            //     },
            //     searchText: selectedFilter.searchText,
            //   });
            setFilterEnabled(false);
            if (selectedFilter.searchText.length > 0) {
              params.set("searchText", selectedFilter.searchText);
            } else {
              params.delete("searchText");
            }
            //   router.replace(`${pathname}?${params.toString()}`, {
            //     // @ts-expect-error 'shallow' does not exist in type 'NavigateOptions'

            //     shallow: true,
            //   });
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
  );
}

export default SearchBoutiquePage;
