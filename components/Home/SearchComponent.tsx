import SearchCamIcon from "public/svg/SearchCamIcon.svg";
import SearchMicIcon from "public/svg/SearchMicIcon.svg";
import CloseIcon from "public/svg/CloseIcon.svg";
import SearchCloseIcon from "public/svg/SearchCloseIcon.svg";
import { useDispatch, useSelector } from "react-redux";
import { ChangeEvent } from "react";
import { caseCheck } from "utils/functions";
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
  const words = useSelector((state: any) => state.Search.searchWords);
  const dispatch = useDispatch();
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length === 0) {
      e.preventDefault();
      clearSuggestion();
    }
    dispatch({ type: "SEARCH-WORD", payload: e.target.value });
  };
  const onInput = (e) => {
    let suggestion = document.querySelector(".predicted-word");
    let arr = [];
    let regex = new RegExp("^" + e.target.value, "i");
    //loop through words array
    for (let i in words) {
      //check if input matches with any word in words array
      if (regex.test(words[i]) && e.target.value != "") {
        //Change case of word in words array according to user input
        let selectedWord = caseCheck(words[i], e.target.value);
        //display suggestion
        if (selectedWord.length > 0) {
          arr.push(selectedWord);
        } else {
        }
        break;
      } else {
        suggestion.innerText = "";
      }
    }
    if (arr.length > 0) {
      suggestion.innerText = words.filter(
        (s) =>
          s.substr(0, e.target.value.length).toUpperCase() ===
          e.target.value.toUpperCase()
      )[0];
    }
  };
  const onKeyDown = (e) => {
    let suggestion = document.querySelector(".predicted-word");

    if (e.keyCode == 13 && suggestion.innerText != "") {
      e.preventDefault();
      dispatch({ type: "SEARCH-WORD", payload: suggestion.innerText });
      //clear the suggestion
      clearSuggestion();
    }
  };
  const clearSuggestion = () => {
    let suggestion = (document.querySelector(".predicted-word").innerText = "");
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
          onKeyDown={(e) => {
            onKeyDown(e);
          }}
          onBlur={() => {
            if (searchValue.length === 0) {
              setFocuse(false);
            }
          }}
          value={searchValue}
          onChange={(e) => {
            onChange(e);
          }}
        />

        <div className="predicted-word"></div>
      </div>

      {focus ? (
        <div className="input-icons flex-row close-search-icon">
          <SearchCloseIcon
            onClick={() => {
              close();
              dispatch({ type: "SEARCH-WORD", payload: "" });
              setFocuse(false);
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
              close();
              dispatch({ type: "SEARCH-WORD", payload: "" });
            }}
          />
        </div>
      )}
    </div>
  );
}

export default SearchComponent;
