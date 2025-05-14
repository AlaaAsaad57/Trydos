"use client";
import React, { useEffect } from "react";
import SearchIcon from "public/svg/listing/searchIcon.svg";
import { Sendevent } from "utils/functions";
import { useAppStore } from "store";
import { DebounceInput } from "react-debounce-input/src";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { dispatchRouteChangeEvent } from "utils/events";
function SearchBoutiquePage({ search_text, boutique }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    setFilterLoading,

    setFilterSearch,
    searchFilter,
    setFilterEnabled,

    setSkeleton,

    searchFilters,
    filterEnabled,
    value,
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
      if (e.target.value.length > 0) {
        params.set("search_text", e.target.value);
      } else {
        params.delete("search_text");
      }
      try {
        dispatchRouteChangeEvent("start", {
          is_filter_search: true,
          ...boutique,
        });
        router.replace(`${pathname}?${params.toString()}`);
      } catch (error) {
        console.log(error);
      }
    }
  };
  useEffect(() => {
    if (search_text?.length > 0) {
      setFilterSearch(true);
      document.querySelector<HTMLInputElement>("#searchIconBoutique")?.click();
      document.querySelector<HTMLInputElement>("#filter-search")?.focus();
    } else {
      setFilterSearch(false);

      document.querySelector<HTMLInputElement>("#filter-search")?.blur();
    }
  }, []);
  return (
    <div
      data-cy="searchIcon_boutiquePage"
      id="searchIconBoutique"
      className={`filter-option transition-all filter-search-option relative ${
        (search ||
          value?.length > 0 ||
          searchParams.get("search_text")?.length > 0) &&
        "w-[75%] [&>input]:w-full [&>input]:bg-[#f8f8f8] [&>input]:h-[40px]"
      }`}
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
        debounceTimeout={600}
        onFocus={() => {
          document
            .querySelector<HTMLInputElement>(".filter-bar-options")
            .classList.add("w-full");
        }}
        value={search_text || value}
        onBlur={() => {
          console.log(value, searchParams.get("search_text"));
          if (
            value.length === 0 &&
            (!searchParams.get("search_text") ||
              searchParams.get("search_text")?.length === 0)
          ) {
            if (
              document.querySelector<HTMLInputElement>(
                ".boutique-logo-container"
              )
            ) {
              document.querySelector<HTMLInputElement>(
                ".boutique-logo-container"
              ).style.display = "flex";
            }
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
            setFilterEnabled(false);
            if (value.length > 0) {
              params.set("search_text", value);
            } else {
              params.delete("search_text");
            }
            router.replace(`${pathname}?${params.toString()}`);
            // @ts-ignore

            e.target.blur();
          }
        }}
        className={`${
          (search || search_text?.length > 0) && "pl-[40px]"
        } rounded-[15px]  w-0 h-full border-0 outline-none text-[#5d5d5d]`}
      />
      <SearchIcon
        className={`absolute z-10 ${
          search || search_text?.length > 0
            ? "top-[9px] left-[14px]"
            : "top-0 left-0"
        }`}
      />
    </div>
  );
}

export default SearchBoutiquePage;
