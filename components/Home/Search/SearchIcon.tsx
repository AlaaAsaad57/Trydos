import React, { useState } from "react";
import Search from "public/svg/SearchIcon.svg";
import "styles/search.css";
import SearchComponent from "../SearchComponent";
import { useDispatch, useSelector } from "react-redux";
function SearchIcon() {
  const searchEnabled = useSelector((state: any) => state.Search.enable);
  const [focuse, setFocus] = useState(false);
  const dispatch = useDispatch();
  const EnableSearch = (e: boolean) => {
    if (e) document.documentElement.style.overflow = "hidden";
    else document.documentElement.style.overflow = "auto";
    dispatch({ type: "ENABLE-SEARCH", payload: e });
  };

  return (
    <div
      className={`search-icon ${searchEnabled && "active-serach"}`}
      onClick={() => {
        if (!searchEnabled) EnableSearch(true);
      }}
    >
      <Search id="search-icon" className={`${focuse && "black-fill"}`} />
      <SearchComponent
        close={() => EnableSearch(false)}
        searchEnabled={searchEnabled}
        focus={focuse}
        setFocuse={(s: boolean) => setFocus(s)}
      />
    </div>
  );
}

export default SearchIcon;
