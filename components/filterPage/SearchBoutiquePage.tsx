"use client";
import { useEffect, useState } from "react";
import { DebounceInput } from "react-debounce-input/src";
import { useRouter } from "next/navigation";
import { buildParamsFromFilters, pollinateInput } from "utils/tinyUtils";
import { useAppStore } from "store";
import { showSuccessNotification } from "store/notifications/reducer";
import { LogError } from "utils/functions";
function SearchBoutiquePage({ search_text, parsedFilters, lang, isAnalyzed }) {
  const router = useRouter();

  // Parse current filters from URL path

  const currentFilters = parsedFilters;
  const [search, setSearch] = useState(
    parsedFilters?.search_text?.[0] ?? parsedFilters?.search_text ?? "",
  );
  const [focuse, setFocus] = useState(
    parsedFilters?.search_text?.[0]?.length ??
      parsedFilters?.search_text?.length ??
      false,
  );
  const onChange = (e) => {
    setSearch(e.target.value);
  };
  const onKeyDown = (e) => {
    try {
      if (isAnalyzed?.colors?.length > 0 && parsedFilters?.colors?.length > 0) {
        currentFilters.colors = currentFilters.colors?.filter(
          (color) =>
            !isAnalyzed.colors
              ?.map((s) => s.toLowerCase())
              .includes(color?.toLowerCase()),
        );
        if (currentFilters.colors?.length === 0) {
          delete currentFilters.colors;
        }
      }
      if (isAnalyzed?.sizes?.length > 0 && parsedFilters?.sizes?.length > 0) {
        currentFilters.sizes = currentFilters.sizes?.filter(
          (size) =>
            !isAnalyzed.sizes
              ?.map((s) => s.toLowerCase())
              .includes(size?.toLowerCase()),
        );
        if (currentFilters.sizes?.length === 0) delete currentFilters.sizes;
      }
      const newFilters = { ...currentFilters };
      if (e.target.value.length > 0) {
        newFilters.search_text = [e.target.value];
      } else {
        delete newFilters.search_text;
      }

      const pathParams = buildParamsFromFilters({
        ...newFilters,
        search: newFilters.search_text,
      });

      const newPath =
        pathParams.length > 0
          ? `/${lang}/filters/${pathParams.join("/")}`
          : `/${lang}/filters`;
      const { setIsNavigating } = useAppStore.getState();
      setIsNavigating({
        is_filter_search: true,
        href: newPath,
      });
      router.push(newPath);
    } catch (error) {
      LogError({
        error: error,
        scenario:
          "on Enter pressed in search bar in listing page - SearhcBoutique Component",
        filters: currentFilters,
      });
    }
  };
  useEffect(() => {
    if (search_text?.length > 0) {
      document.querySelector<HTMLInputElement>("#searchIconBoutique")?.click();
      document.querySelector<HTMLInputElement>("#filter-search")?.focus();
    } else {
      document.querySelector<HTMLInputElement>("#filter-search")?.blur();
    }
  }, []);

  return (
    <div
      data-cy="searchIcon_boutiquePage"
      id="searchIconBoutique"
      className={`filter-option transition-all filter-search-option relative ${
        (search?.length || focuse) &&
        "w-[75%] [&>input]:w-full [&>input]:bg-[#f8f8f8] [&>input]:h-[40px]"
      }`}
      onClick={() => {
        document.querySelector<HTMLInputElement>("#filter-search")?.focus();
        if (
          document.querySelector<HTMLInputElement>(".boutique-logo-container")
        )
          document.querySelector<HTMLInputElement>(
            ".boutique-logo-container",
          ).style.display = "none";
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
          setFocus(true);
        }}
        value={pollinateInput(search_text)}
        onBlur={() => {
          setFocus(false);
          if (search.length === 0) {
            if (
              document.querySelector<HTMLInputElement>(
                ".boutique-logo-container",
              )
            ) {
              document.querySelector<HTMLInputElement>(
                ".boutique-logo-container",
              ).style.display = "flex";
            }

            document
              .querySelector<HTMLInputElement>(".filter-bar-options")
              .classList.remove("w-full");
          }
        }}
        onChange={(e) => {
          if (e.target.value.length === 0) {
            onKeyDown(e);
          }
          onChange(e);
        }}
        onKeyDown={(e: any) => {
          //@ts-ignore
          if (e.keyCode == 13) {
            onKeyDown(e);
            e.target.blur();
          }
        }}
        className={`${
          (search?.length || focuse) && "pl-[40px]"
        } rounded-[15px]  w-0 h-full border-0 outline-hidden text-[#5d5d5d]`}
      />
      <img
        src="/icons/searchIcon.svg"
        className={`absolute z-10 ${
          search?.length || focuse ? "top-[9px] left-[14px]" : "top-0 left-0"
        }`}
      />
    </div>
  );
}

export default SearchBoutiquePage;
