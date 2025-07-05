"use client";
import CloseIcon from "public/svg/CloseIcon.svg";
import SearchCloseIcon from "public/svg/SearchCloseIcon.svg";
import { ChangeEvent, useEffect, useRef, useCallback } from "react";
import {
  caseCheck,
  onClickSearchHistory,
  translateFunction,
} from "utils/functions";
import { dispatchRouteChangeEvent } from "utils/events";
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
    searchWords,
    setEnableSearch,
  } = useAppStore();

  const { lang } = useParams();
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback(
    async (searchValue: string) => {
      const result = await SearchService.getSearchOptions({
        noProducts: false,
        lang: lang,
        searchValue: searchValue,
      });
      // Only prefetch if the request wasn't cancelled
      if (result !== null) {
        router.prefetch(SearchService.getSearchPageUrl({ lang: lang }));
      }
    },
    [lang, router, value]
  );

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    // Remove special characters
    input = input.replace(/[<>/,:!@#$%^&*()]/g, "");
    if (input.length > 90) {
      input = input.slice(0, 90);
    }

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
      dispatchRouteChangeEvent("start", {
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

  const setLoading = (e) => {
    setSearchPartialLoading(e);
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
                    setLoading(true);
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
