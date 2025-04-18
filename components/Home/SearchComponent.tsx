"use client";
import CloseIcon from "public/svg/CloseIcon.svg";
import SearchCloseIcon from "public/svg/SearchCloseIcon.svg";

import { ChangeEvent, useEffect } from "react";
import {
  caseCheck,
  onClickSearchHistory,
  Sendevent,
  translateFunction,
} from "utils/functions";
import home from "services/home";
import { DebounceInput } from "react-debounce-input";
import { dispatchRouteChangeEvent } from "utils/events";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import SearchVoice from "./Search/SearchVoice";
import SearchImage from "./Search/SearchImage";
import SearchService from "services/search";
import { useAppStore } from "store";
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
    editFilterSearch,
    setSearchPartialLoading,
    findProducts,
    setSearchLoading,
    setSearchWord,
    value,
    searchFilters,
    searchWords,
  } = useAppStore();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(SearchService.ProcessSearchInput(e.target.value));
    if (e.target.value.length === 0) {
      e.preventDefault();
    }

    setSearchWord(e.target.value);
    setSearchPartialLoading(true);
    setSearchLoading(true);
    home.UpdateFilters({
      search_text: e.target.value || "",
      callback: (e) => {
        setLoading(false);
        editFilterSearch(e);
      },
    });
  };
  const onInput = (e) => {
    let suggestion = document.querySelector<HTMLDivElement>(".predicted-word");
    let arr = [];
    let regex = new RegExp("^" + e.target.value.toUpperCase(), "i");
    //loop through words array
    for (let i in searchWords) {
      //check if input matches with any word in words array
      if (regex.test(searchWords[i].toUpperCase()) && e.target.value != "") {
        //Change case of word in words array according to user input
        let selectedWord = caseCheck(
          searchWords[i].toUpperCase(),
          e.target.value.toUpperCase()
        );
        //display suggestion
        if (selectedWord.length > 0) {
          arr.push(selectedWord);
        } else {
        }
        break;
      } else {
        // @ts-ignore
        // suggestion.innerText = "";
      }
    }

    if (
      searchWords.filter(
        (s) =>
          s.substr(0, e.target.value.length).toUpperCase() ===
          e.target.value.toUpperCase()
      ).length > 0
    ) {
    }
  };
  const searchParams = useSearchParams();

  const { lang } = useParams();
  const router = useRouter();
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
    //brands
    if (data.brands.length > 0) {
      params.set("brands", `${data.brands.map((s) => s.slug)}`);
    } else {
      if (params.get("brands")) {
        params.delete("brands");
      }
    }
    if (data.boutiques.length > 0) {
      params.set("boutique_slugs", `${data.boutiques.map((s) => s.slug)}`);
    } else {
      if (params.get("boutique_slugs")) {
        params.delete("boutique_slugs");
      }
    }
    params.set("searchText", value);

    router.push(`/${lang}/boutiques/listing?${params.toString()}`);
  };

  const onKeyDown = (e) => {
    let suggestion = document.querySelector(".predicted-word");
    // @ts-ignore
    // if (e.keyCode == 13 && suggestion.innerText !== "") {
    //   // @ts-ignore
    //   onClickSearchHistory(suggestion.innerText);
    //   e.preventDefault();
    //   // @ts-ignore
    //   // dispatch({ type: "SEARCH-WORD", payload: suggestion.innerText });
    //   //clear the suggestion
    //   clearSuggestion();
    //   // @ts-ignore
    // } else
    if (e.keyCode == 13 && e.target.value.length > 0) {
      onClickSearchHistory(value);
      handleSearch(searchFilters);
      dispatchRouteChangeEvent("start", { to: "boutique" });
      document.documentElement.style.overflow = "hidden";
      document.documentElement.scrollTop = 0;
      //go to listing
    } else {
    }
  };

  const setLoading = (e) => {
    setSearchPartialLoading(e);
  };

  return (
    <div className="search-component-container flex-row">
      <div className={`search-input-parent ${focus && "focuse"}`}>
        <DebounceInput
          minLength={0}
          data-cy="inputField"
          className="search-input"
          placeholder={translateFunction("Search")}
          onFocus={() => setFocuse(true)}
          onInput={(e) => {
            onInput(e);
          }}
          onKeyUp={(e) => {
            onKeyDown(e);
          }}
          onBlur={() => {
            if (value.length === 0) {
              setFocuse(false);
            }
          }}
          onSubmit={(e) => {
            onClickSearchHistory(value);
          }}
          value={value}
          onChange={(e) => {
            onChange(e);
          }}
          debounceTimeout={400}
        />
        {/* <div className="predicted-word hidden">
          {searchValue.length > 0 &&
            searchValue.length < 30 &&
            words.filter(
              (s) =>
                s.substr(0, searchValue.length).toUpperCase() ===
                searchValue.toUpperCase()
            )[0]}
        </div> */}
      </div>

      {focus ? (
        <div className="input-icons flex-row close-search-icon">
          <SearchCloseIcon
            data-cy="SearchInputCloseIcon"
            onClick={() => {
              if (value.length > 0) {
                Sendevent({
                  event: "button_clicked",
                  value: "reset_home_search_button",
                });
                setLoading(true);
                setSearchWord("");

                findProducts([]);
                home.UpdateFilters({
                  search_text: "",
                  callback: (e) => {
                    setLoading(false);
                    editFilterSearch(e);
                  },
                });
                home.SearchProducts({
                  search_text: "",
                  searchFilters: searchFilters,
                  callback: (e) => {
                    findProducts(e);
                  },
                });
              } else {
                Sendevent({
                  event: "button_clicked",
                  value: "search_close_icon_button",
                });

                close();
                setSearchWord("");
                setFocuse(false);
              }
            }}
          />
        </div>
      ) : (
        <div className="input-icons flex-row">
          <div className="input-icon">
            <SearchImage
              setSearchValue={(e) => {
                if (e?.length > 0) {
                  Sendevent({
                    event: "button_clicked",
                    value: "search_with_image_button",
                  });

                  setSearchWord(e);
                  setSearchLoading(true);
                  home.UpdateFilters({
                    search_text: e || "",
                    callback: (e) => {
                      setLoading(false);
                      editFilterSearch(e);
                    },
                  });
                  home.SearchProducts({
                    search_text: e,
                    searchFilters: searchFilters,
                    callback: (e) => {
                      findProducts(e);
                    },
                  });
                }
              }}
            />
          </div>
          <div className="input-icon">
            <SearchVoice
              setSearchValue={(e) => {
                if (e?.length > 0) {
                  Sendevent({
                    event: "button_clicked",
                    value: "search_with_voice_button",
                  });

                  setSearchWord(e);
                  setSearchLoading(true);
                  home.UpdateFilters({
                    search_text: e || "",
                    callback: (e) => {
                      setLoading(false);
                      editFilterSearch(e);
                    },
                  });
                  home.SearchProducts({
                    search_text: e,
                    searchFilters: searchFilters,
                    callback: (e) => {
                      findProducts(e);
                    },
                  });
                }
              }}
            />
          </div>
        </div>
      )}
      {!focus && (
        <div className="search-colse-icon flex-row">
          <CloseIcon
            data-cy="closeIcon_searchPage"
            onClick={() => {
              if (value.length > 0) {
                setSearchWord("");
                findProducts([]);
                setSearchLoading(true);
                home.UpdateFilters({
                  search_text: "",
                  callback: (e) => {
                    setLoading(false);
                    editFilterSearch(e);
                  },
                });
                home.SearchProducts({
                  search_text: "",
                  searchFilters: searchFilters,
                  callback: (e) => {
                    findProducts(e);
                  },
                });
              } else {
                close();
                setSearchWord("");
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

export default SearchComponent;
