"use client";
import CloseIcon from "public/svg/CloseIcon";
import SearchCloseIcon from "public/svg/SearchCloseIcon";
import { ChangeEvent, useEffect, useRef, useCallback } from "react";
import { onClickSearchHistory, translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import SearchVoice from "./Search/SearchVoice";
import SearchImage from "./Search/SearchImage";
import SearchService from "services/search";
import { useAppStore } from "store";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { pollinateInput } from "utils/tinyUtils";
import { showErrorNotification } from "store/notifications/reducer";
interface SearchComponentProps {
  searchEnabled: boolean;
  close: Function;
  focus: boolean;
  setFocuse: (e: boolean) => void;
}
function SearchComponent({
  searchEnabled,
  close,
  focus,
  setFocuse,
}: SearchComponentProps) {
  const {
    setSearchPartialLoading,
    findProducts,
    setSearchLoading,
    setSearchWord,
    value,
    setSearchResults,
    searchFilters,
    setTotalSizeOfProducts,
    setEnableSearch,
    setResettingLoadMore,
    resetLoadingMore,
  } = useAppStore();

  const { lang } = useParams();
  const [country, language] = (lang as string).split("-");

  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedSearch = useCallback(
    async (searchValue: string) => {
      const currentRequestId = ++requestIdRef.current;
      setResettingLoadMore(true);
      try {
        setSearchPartialLoading(true);
        setSearchLoading(true);

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        // Build query params compatible with your API route
        const params = new URLSearchParams();

        if (searchFilters?.boutiques?.length) {
          params.set(
            "boutique_slugs",
            JSON.stringify(searchFilters.boutiques.map((b) => b.slug))
          );
        }
        if (searchFilters?.categories?.length) {
          params.set(
            "category_slugs",
            JSON.stringify(searchFilters.categories.map((c) => c.slug))
          );
        }
        if (searchFilters?.brands?.length) {
          params.set(
            "brand_slugs",
            JSON.stringify(searchFilters.brands.map((b) => b.slug))
          );
        }
        if (searchFilters?.colors?.length) {
          params.set(
            "colors",
            JSON.stringify(
              searchFilters.colors.map((c) =>
                typeof c === "string" ? c : c.toString()
              )
            )
          );
        }
        // Search text
        const finalSearchValue =
          searchValue?.length > 0
            ? searchValue
            : value?.length > 0
            ? value
            : "";
        if (finalSearchValue) {
          params.set("search_text", finalSearchValue);
        }
        // Pagination / limits
        params.set("filters_offset", "1");
        params.set("limit", "10");
        // Perform GET request to your API route
        const response = await fetch(
          `/api/products/searchInCatalog?${params}`,
          {
            method: "GET",
            headers: {
              country,
              language: language,
            },
            signal,
            credentials: "omit",
          }
        );

        if (signal.aborted || currentRequestId !== requestIdRef.current) {
          return;
        }

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const filtersResponse = await response.json();

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        const {
          products,
          categories,
          brands,
          boutiques,
          colors,
          attributes,
          total_size,
        } = filtersResponse.data;

        setTotalSizeOfProducts({ total_size });
        setSearchResults(
          {
            products,
            categories,
            brands,
            boutiques,
            colors,
            sizes: attributes?.[0]?.options || [],
            prices: {
              min_price: filtersResponse?.prices?.min_price || null,
              max_price: filtersResponse?.prices?.max_price || null,
            },
            prices_ranges: [],
          },
          true
        );

        setSearchPartialLoading(false);
        setSearchLoading(false);
        setResettingLoadMore(false);
        router.prefetch(SearchService.getSearchPageUrl({ lang }));
      } catch (error) {
        if (
          error.name !== "AbortError" &&
          currentRequestId === requestIdRef.current
        ) {
          setResettingLoadMore(false);
          setSearchPartialLoading(false);
          setSearchLoading(false);
          showErrorNotification(
            translateFunction("Failed To Retrieve Results Please Try Again")
          );
        }
      }
    },
    [lang, router, value]
  );

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    let input = pollinateInput(e.target.value);

    setSearchWord(input);
    e.target.value = input;

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      debouncedSearch(input);
    }, 500);
  };
  const onKeyDown = (e) => {
    if (e.keyCode == 13 && e.target.value.length > 0) {
      const { setIsNavigating } = useAppStore.getState();
      setIsNavigating({
        is_boutique: true,
        href: SearchService.getSearchPageUrl({ lang: lang }),
      });
      router.push(SearchService.getSearchPageUrl({ lang: lang }));
      onClickSearchHistory(value);
      setEnableSearch(false);
      //go to listing
    } else {
    }
  };

  useEffect(() => {
    if (searchEnabled) {
      GAevent({
        action: GA_EVENT_NAMES.SCREEN_VIEW,
        params: {
          screen_name: GA_GLOBAL_SCREEN.SEARCH_SCREEN,
          screen_path: window.location.pathname,
        },
      });
    }
  }, [searchEnabled]);

  // Cleanup timeout and abort controller on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  return (
    <div className="search-component-container flex-row">
      <div className={`search-input-parent ${focus && "focuse"}`}>
        <input
          maxLength={90}
          data-cy="inputField"
          id="search-element"
          disabled={!searchEnabled}
          className="search-input"
          // @ts-ignore
          placeholder={translateFunction("Search", lang?.split("-")[1])}
          onFocus={() => setFocuse(true)}
          onKeyUp={(e) => {
            onKeyDown(e);
          }}
          onBlur={() => {
            if (value.length === 0) {
              setFocuse(false);
            } else {
              // Sendevent({
              //   event: GA_EVENT_NAMES.CLICK,
              //   value: GA_CLICK_EVENT_VALUES.ADD_FILTER_ITEM,
              //   extra: {
              //     filter: "search_text",
              //     value: value,
              //   },
              // });
            }
          }}
          value={value.replace(/[<>/,:!@#$%^&*()]/g, "").slice(0, 90)}
          onChange={(e) => {
            onChange(e);
          }}
        />
      </div>

      {searchEnabled && (
        <>
          {focus ? (
            <div className="input-icons flex-row close-search-icon">
              <SearchCloseIcon
                data-cy="SearchInputCloseIcon"
                onClick={() => {
                  if (value.length > 0) {
                    // Sendevent({
                    //   event: GA_EVENT_NAMES.CLICK,
                    //   value: GA_CLICK_EVENT_VALUES.RESET_HOME_SEARCH_BUTTON,
                    // });
                    setSearchLoading(true);
                    setSearchWord("");

                    findProducts([]);
                    SearchService.getSearchOptions({
                      noProducts: true,
                      lang: lang,
                    }).catch(() => {
                      // Ignore cancelled requests
                    });
                  } else {
                    // Sendevent({
                    //   event: GA_EVENT_NAMES.CLICK,
                    //   value: GA_CLICK_EVENT_VALUES.SEARCH_CLOSE_ICON_BUTTON,
                    // });

                    close();
                    setSearchWord("");
                    setFocuse(false);
                    SearchService.getSearchOptions({
                      noProducts: true,
                      lang: lang,
                    }).catch(() => {
                      // Ignore cancelled requests
                    });
                  }
                }}
              />
            </div>
          ) : (
            <div className="input-icons flex-row h-full">
              <SearchImage
                setSearchValue={(e) => {
                  if (e?.length > 0) {
                    // Sendevent({
                    //   event: "button_clicked",
                    //   value: "search_with_image_button",
                    // });

                    setSearchWord(e);
                    setSearchLoading(true);
                  }
                }}
              />

              <SearchVoice
                setSearchValue={(e) => {
                  if (e?.length > 0) {
                    // Sendevent({
                    //   event: GA_EVENT_NAMES.CLICK,
                    //   value: GA_CLICK_EVENT_VALUES.SEARCH_WITH_VOICE_BUTTON,
                    // });

                    setSearchWord(e);
                    setSearchLoading(true);
                  }
                }}
              />
            </div>
          )}
          {!focus && (
            <div className="search-colse-icon flex-row">
              <CloseIcon
                data-cy="closeIcon_searchPage"
                onClick={() => {
                  // Sendevent({
                  //   event: GA_EVENT_NAMES.CLICK,
                  //   value: GA_CLICK_EVENT_VALUES.SEARCH_CLOSE_ICON_BUTTON,
                  // });
                  if (value.length > 0) {
                    setSearchWord("");
                    findProducts([]);
                    setSearchLoading(true);
                    SearchService.getSearchOptions({
                      noProducts: true,
                      lang: lang,
                    }).catch(() => {
                      // Ignore cancelled requests
                    });
                  } else {
                    close();
                    setSearchWord("");
                    SearchService.getSearchOptions({
                      noProducts: true,
                      lang: lang,
                    }).catch(() => {
                      // Ignore cancelled requests
                    });
                  }
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SearchComponent;
