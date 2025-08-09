"use client";
import CloseIcon from "public/svg/CloseIcon.svg";
import SearchCloseIcon from "public/svg/SearchCloseIcon.svg";
import { ChangeEvent, useEffect, useRef, useCallback } from "react";
import { onClickSearchHistory, translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import SearchVoice from "./Search/SearchVoice";
import SearchImage from "./Search/SearchImage";
import SearchService from "services/search";
import { useAppStore } from "store";
import {
  GA_EVENT_NAMES,
  GA_GLOBAL_PLATFORM,
  GA_GLOBAL_SCREEN,
} from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { pollinateInput } from "utils/tinyUtils";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
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
  } = useAppStore();

  const { lang } = useParams();
  const [country, language] = (lang as string).split("-");

  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback(
    async (searchValue: string) => {
      const currentRequestId = ++requestIdRef.current;
      try {
        setSearchPartialLoading(true);
        setSearchLoading(true);
        const filterObj = {
          boutiques: searchFilters?.boutiques?.map((b) => b.slug) || [],
          categories: searchFilters?.categories?.map((c) => c.slug) || [],
          brands: searchFilters?.brands?.map((b) => b.slug) || [],
          colors:
            searchFilters?.colors?.map((c) =>
              typeof c === "string" ? c : c.toString()
            ) || [],
          sizes:
            searchFilters?.sizes?.map((s) =>
              typeof s === "string" ? s : s.toString()
            ) || [],
          prices:
            searchFilters?.prices &&
            searchFilters.prices.min_price !== null &&
            searchFilters.prices.min_price !== undefined &&
            searchFilters.prices.max_price !== null &&
            searchFilters.prices.max_price !== undefined &&
            !isNaN(Number(searchFilters.prices.min_price)) &&
            !isNaN(Number(searchFilters.prices.max_price)) &&
            Number(searchFilters.prices.min_price) >= 0 &&
            Number(searchFilters.prices.max_price) > 0
              ? [searchFilters.prices.min_price, searchFilters.prices.max_price]
              : [],
          search_text:
            searchValue?.length > 0
              ? searchValue
              : value?.length > 0
              ? value
              : null,
        };

        const filtersResponse = await getProductsAndFiltersFromElastic({
          country: country,
          language_code: language,
          filters: filterObj,
          filters_offset: 1,
          limit: 10,
        });
        // if (currentRequestId !== requestIdRef.current) {
        //   return; // Ignore outdated responses
        // }
        if (!filtersResponse) {
          throw new Error("");
        }
        const {
          products,
          categories,
          brands,
          boutiques,
          colors,
          attributes: attributes,
          total_size,
        } = filtersResponse;
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
            prices_ranges: /*filtersResponse?.prices?.priceRanges*/ [],
          },
          true
        );
        setSearchPartialLoading(false);
        setSearchLoading(false);
        // Only prefetch if the request wasn't cancelled
        if (filtersResponse !== null) {
          router.prefetch(SearchService.getSearchPageUrl({ lang: lang }));
        }
      } catch (error) {
        setSearchPartialLoading(false);
        setSearchLoading(false);
        showErrorNotification(
          translateFunction("Failed To Retrive Results Please Try Again")
        );
      }
    },
    [lang, router, value]
  );
  const requestIdRef = useRef<number>(0);
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  return (
    <div className="search-component-container flex-row">
      <div className={`search-input-parent ${focus && "focuse"}`}>
        <input
          maxLength={90}
          data-cy="inputField"
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
