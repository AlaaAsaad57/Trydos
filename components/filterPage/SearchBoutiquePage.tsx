"use client";
import React, { useEffect } from "react";
import SearchIcon from "public/svg/listing/searchIcon.svg";

import { useAppStore } from "store";
import { DebounceInput } from "react-debounce-input/src";
import { useParams, useRouter, usePathname } from "next/navigation";
import { dispatchRouteChangeEvent } from "utils/events";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import {
  parseFiltersFromParams,
  buildParamsFromFilters,
} from "utils/tinyUtils";
import { SearchBoutiquePageProps } from "models/componentType/boutiqueTypes/SearchBoutiquePageProps";
function SearchBoutiquePage({
  search_text,
  boutique,
}: SearchBoutiquePageProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  // Parse current filters from URL path
  const { lang, filters: filterParams } = params;
  const currentFilters = filterParams
    ? parseFiltersFromParams(filterParams as string[])
    : {};
  const {
    setFilterLoading,
    setFilterSearch,
    searchFilter,
    setFilterEnabled,
    setSkeleton,
    filterEnabled,
    value,
    filters,
    search,
  } = useAppStore();
  const onChange = (e) => {
    // Sendevent({
    //   event: GA_EVENT_NAMES.CLICK,
    //   value: GA_CLICK_EVENT_VALUES.ADD_FILTER_ITEM,
    //   extra: {
    //     filter: "search_text",
    //     value: e?.target.value,
    //   },
    // });
    try {
      setFilterLoading(true);
      searchFilter(e.target.value);

      if (filterEnabled) {
      } else {
        setFilterEnabled(false);

        // Update filters with new search text
        const newFilters = { ...currentFilters };
        if (e.target.value.length > 0) {
          newFilters.search = [e.target.value];
        } else {
          delete newFilters.search;
        }

        // Build new path-based URL
        const pathParams = buildParamsFromFilters(newFilters);
        const newPath =
          pathParams.length > 0
            ? `/${lang}/filters/${pathParams.join("/")}`
            : `/${lang}/filters`;

        dispatchRouteChangeEvent("start", {
          is_filter_search: true,
          href: newPath,
          ...boutique,
        });
        console.log(newPath);
        router.push(newPath); // Navigate to filters page
      }
    } catch (error) {
      console.error(error);
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
          currentFilters?.search_text?.[0]?.length > 0) &&
        "w-[75%] [&>input]:w-full [&>input]:bg-[#f8f8f8] [&>input]:h-[40px]"
      }`}
      onClick={() => {
        // Sendevent({
        //   event: GA_EVENT_NAMES.CLICK,
        //   value: GA_CLICK_EVENT_VALUES.OPEN_SEARCH_FIELD_BUTTON,
        // });
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
        value={search_text}
        onBlur={() => {
          if (
            value.length === 0 &&
            (!currentFilters?.search_text?.[0] ||
              currentFilters.search_text[0]?.length === 0)
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
            setSkeleton(true);
            setFilterEnabled(false);

            // Update filters with search value
            const newFilters = { ...currentFilters };
            if (value.length > 0) {
              newFilters.search_text = [value];
            } else {
              delete newFilters.search_text;
            }

            // Build new path-based URL
            const pathParams = buildParamsFromFilters(newFilters);
            const newPath =
              pathParams.length > 0
                ? `/${lang}/filters/${pathParams.join("/")}`
                : `/${lang}/filters`;

            router.push(newPath); // Navigate to filters page
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
