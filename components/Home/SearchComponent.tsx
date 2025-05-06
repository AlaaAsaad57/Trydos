"use client";
import CloseIcon from "public/svg/CloseIcon.svg";
import SearchCloseIcon from "public/svg/SearchCloseIcon.svg";

import { ChangeEvent } from "react";
import {
  caseCheck,
  onClickSearchHistory,
  Sendevent,
  translateFunction,
} from "utils/functions";
import { DebounceInput } from "react-debounce-input";
import { dispatchRouteChangeEvent } from "utils/events";
import { useParams } from "next/navigation";
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
    setSearchPartialLoading,
    findProducts,
    setSearchLoading,
    setSearchWord,
    value,
    searchWords,
  } = useAppStore();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchWord(e.target.value);
    SearchService.getSearchOptions({
      noProducts: false,
      lang: lang,
    });
    router.prefetch(SearchService.getSearchPageUrl());
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
  const { lang } = useParams();
  const router = useRouter();
  const onKeyDown = (e) => {
    if (e.keyCode == 13 && e.target.value.length > 0) {
      onClickSearchHistory(value);
      dispatchRouteChangeEvent("start", {
        is_boutique: true,
      });
      router.push(SearchService.getSearchPageUrl());
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
          // @ts-ignore
          placeholder={translateFunction("Search", lang?.split("-")[1])}
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
      </div>

      {searchEnabled && (
        <>
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
                    SearchService.getSearchOptions({
                      noProducts: true,
                      lang: lang,
                    });
                  } else {
                    Sendevent({
                      event: "button_clicked",
                      value: "search_close_icon_button",
                    });

                    close();
                    setSearchWord("");
                    setFocuse(false);
                    SearchService.getSearchOptions({
                      noProducts: true,
                      lang: lang,
                    });
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
                    SearchService.getSearchOptions({
                      noProducts: true,
                      lang: lang,
                    });
                  } else {
                    close();
                    setSearchWord("");
                    SearchService.getSearchOptions({
                      noProducts: true,
                      lang: lang,
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
