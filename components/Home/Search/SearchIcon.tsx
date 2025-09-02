"use client";
import React, { useEffect, useState } from "react";
import Search from "public/svg/SearchIcon.svg";
import "styles/search.css";
import SearchComponent from "../SearchComponent";

import { normalizeView } from "utils/functions";
import { useAppStore } from "store";
import { useParams } from "next/navigation";
import search from "services/search";
import { DisableScroll, EnableScroll } from "utils/tinyUtils";
import DataSourceLogger from "components/global/DataSourceLogger";

function SearchIcon({ time }) {
  const { setEnableSearch, enable_search } = useAppStore();
  const { lang } = useParams();
  const [focuse, setFocus] = useState(false);
  const EnableSearch = (e: boolean) => {
    setEnableSearch(e);
  };
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
            DisableScroll();
            // Sendevent({
            //   event: GA_EVENT_NAMES.CLICK,
            //   value: GA_CLICK_EVENT_VALUES.HOME_SEARCH_BUTTON,
            // });
            normalizeView();
            EnableSearch(true);
          }
        }}
      >
        <DataSourceLogger
          dataSourceString={`Main Categories Data Source Elastic in ${time} ms`}
        />
        <Search id="search-icon" className={`${focuse && "black-fill"}`} />
        <SearchComponent
          close={() => {
            EnableScroll();
            EnableSearch(false);
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
