import SearchCamIcon from "public/svg/SearchCamIcon.svg";
import SearchMicIcon from "public/svg/SearchMicIcon.svg";
import CloseIcon from "public/svg/CloseIcon.svg";
import SearchCloseIcon from "public/svg/SearchCloseIcon.svg";
import { useDispatch, useSelector } from "react-redux";
import { ChangeEvent, useEffect } from "react";
import { caseCheck, onClickSearchHistory } from "utils/functions";
import home from "services/home";
import useDebounce from "Hooks/useDebounce";
import { dispatchRouteChangeEvent } from "Hooks/events";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchValue = useSelector((state: any) => state.Search.value);

  const searchFilters = useSelector((state: any) => state.Search.searchFilters);
  const words = useSelector((state: any) => state.Search.searchWords);
  const dispatch = useDispatch();
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length === 0) {
      e.preventDefault();
      clearSuggestion();
    }

    dispatch({ type: "SEARCH-WORD", payload: e.target.value });
    dispatch({ type: "SEARCH-PARTIAL-LOADING", payload: true });
  };
  const onInput = (e) => {
    let suggestion = document.querySelector<HTMLDivElement>(".predicted-word");
    let arr = [];
    let regex = new RegExp("^" + e.target.value.toUpperCase(), "i");
    //loop through words array
    for (let i in words) {
      //check if input matches with any word in words array
      if (regex.test(words[i].toUpperCase()) && e.target.value != "") {
        //Change case of word in words array according to user input
        let selectedWord = caseCheck(
          words[i].toUpperCase(),
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
        suggestion.innerText = "";
      }
    }

    if (
      words.filter(
        (s) =>
          s.substr(0, e.target.value.length).toUpperCase() ===
          e.target.value.toUpperCase()
      ).length > 0
    ) {
    }
  };
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);
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
    params.set("searchText", searchValue);
    window.location.pathname = `/boutiques/listing?${params.toString()}`;
    // router.push(`/boutiques/listing?${params.toString()}`);
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
      onClickSearchHistory(searchValue);
      handleSearch(searchFilters);
      dispatchRouteChangeEvent("start", { to: "boutique" });
      document.documentElement.style.overflow = "hidden";
      document.documentElement.scrollTop = 0;
      //go to listing
    } else {
      if (e.target.value.length > 0) {
        dispatch({ type: "SEARCH-LOADING", payload: true });
        home.UpdateFilters({
          search_text: e.target.value || "",
          callback: (e) => {
            setLoading(false);
            dispatch({ type: "EDIT-FILTER-SEARCH", payload: e });
          },
        });
        home.SearchProducts({
          search_text: e.target.value,
          searchFilters: searchFilters,
          callback: (e) => {
            dispatch({ type: "FIND-PRODUCTS", payload: e });
          },
        });
      }
    }
  };
  const clearSuggestion = () => {
    // @ts-ignore
    let suggestion = (document.querySelector(".predicted-word").innerText = "");
  };
  const setLoading = (e) => {
    dispatch({ type: "SEARCH-PARTIAL-LOADING", payload: e });
  };

  return (
    <div className="search-component-container flex-row">
      <div className={`search-input-parent ${focus && "focuse"}`}>
        <input
          className="search-input"
          placeholder="Search"
          onFocus={() => setFocuse(true)}
          onInput={(e) => {
            onInput(e);
          }}
          onKeyUp={(e) => {
            onKeyDown(e);
          }}
          onBlur={() => {
            if (searchValue.length === 0) {
              setFocuse(false);
            }
          }}
          onSubmit={(e) => {
            onClickSearchHistory(searchValue);
          }}
          value={searchValue}
          onChange={(e) => {
            onChange(e);
          }}
        />

        <div className="predicted-word hidden">
          {searchValue.length > 0 &&
            searchValue.length < 30 &&
            words.filter(
              (s) =>
                s.substr(0, searchValue.length).toUpperCase() ===
                searchValue.toUpperCase()
            )[0]}
        </div>
      </div>

      {focus ? (
        <div className="input-icons flex-row close-search-icon">
          <SearchCloseIcon
            onClick={() => {
              if (searchValue.length > 0) {
                setLoading(true);
                dispatch({ type: "SEARCH-WORD", payload: "" });
                dispatch({ type: "FIND-PRODUCTS", payload: [] });
              } else {
                close();
                dispatch({ type: "SEARCH-WORD", payload: "" });
                setFocuse(false);
              }
            }}
          />
        </div>
      ) : (
        <div className="input-icons flex-row">
          <div className="input-icon">
            <SearchCamIcon />
          </div>
          <div className="input-icon">
            <SearchMicIcon />
          </div>
        </div>
      )}
      {!focus && (
        <div className="search-colse-icon flex-row">
          <CloseIcon
            onClick={() => {
              if (searchValue.length > 0) {
                dispatch({ type: "SEARCH-WORD", payload: "" });
                dispatch({ type: "FIND-PRODUCTS", payload: [] });
              } else {
                close();
                dispatch({ type: "SEARCH-WORD", payload: "" });
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

export default SearchComponent;
