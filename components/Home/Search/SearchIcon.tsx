"use client";
import React, { useEffect, useState } from "react";
import Search from "public/svg/SearchIcon.svg";
import "styles/search.css";
import SearchComponent from "../SearchComponent";
import { useDispatch, useSelector } from "react-redux";
function SearchIcon() {
  const searchEnabled = useSelector((state: any) => state.Search.enable);
  const [focuse, setFocus] = useState(false);
  const [rendered, setRendered] = useState(false);
  const dispatch = useDispatch();
  const EnableSearch = (e: boolean) => {
    if (e) document.documentElement.style.overflow = "hidden";
    else document.documentElement.style.overflow = "auto";
    dispatch({ type: "ENABLE-SEARCH", payload: e });
  };
  useEffect(() => {
    if (searchEnabled) {
      setTimeout(() => {
        document.documentElement.style.overflow = "hidden";
      }, 1000);
    }
    setTimeout(() => {
      setRendered(true);
    }, 2000);
  }, []);
  return (
    <>
      {rendered && (
        <div
          className={`search-icon ${searchEnabled && "active-serach"}`}
          onClick={() => {
            if (!searchEnabled) {
              EnableSearch(true);
              document.documentElement.style.overflow = "hidden";
            }
          }}
        >
          <Search id="search-icon" className={`${focuse && "black-fill"}`} />
          <SearchComponent
            close={() => {
              EnableSearch(false);
              document.documentElement.style.overflow = "initial";
            }}
            searchEnabled={searchEnabled}
            focus={focuse}
            setFocuse={(s: boolean) => setFocus(s)}
          />
        </div>
      )}
    </>
  );
}

export default SearchIcon;
