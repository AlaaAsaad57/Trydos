"use client";
import React, { useEffect, useState } from "react";
import Search from "public/svg/SearchIcon.svg";
import "styles/search.css";
import SearchComponent from "../SearchComponent";

import { normalizeView, Sendevent } from "utils/functions";
import { useAppStore } from "store";
import { useParams } from "next/navigation";
import search from "services/search";

function SearchIcon() {
  const { setEnableSearch, enable_search, setSearchLoading, loading_search } =
    useAppStore();
  const { lang } = useParams();
  const [focuse, setFocus] = useState(false);
  const [rendered, setRendered] = useState(true);

  const EnableSearch = (e: boolean) => {
    if (e) document.documentElement.style.overflow = "hidden";
    else document.documentElement.style.overflow = "auto";
    setEnableSearch(e);
  };
  useEffect(() => {
    if (enable_search) {
      setTimeout(() => {
        document.documentElement.style.overflow = "hidden";
      }, 1000);
    }
  }, []);
  useEffect(() => {
    if (enable_search) {
      search.getSearchOptions({ noProducts: true, lang: lang });
    }
  }, [enable_search]);

  return (
    <>
      <div
        className={`search-icon ${enable_search && "active-serach"}`}
        data-cy="searchIcon_mainPage"
        onClick={() => {
          if (!enable_search) {
            Sendevent({
              event: "button_clicked",
              value: "home_search_button",
            });
            normalizeView();
            document.documentElement.scrollTo({ top: 0 });
            EnableSearch(true);
            document.documentElement.style.overflow = "hidden";
          }
        }}
      >
        <Search id="search-icon" className={`${focuse && "black-fill"}`} />
        <SearchComponent
          close={() => {
            Sendevent({
              event: "button_clicked",
              value: "search_close_icon_button",
            });

            EnableSearch(false);
            document.documentElement.style.overflow = "initial";
          }}
          searchEnabled={enable_search}
          focus={focuse}
          setFocuse={(s: boolean) => setFocus(s)}
        />
      </div>
    </>
  );
}

export default SearchIcon;
