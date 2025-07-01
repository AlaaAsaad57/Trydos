"use client";
import React, { useEffect, useState } from "react";
import Animated from "react-mount-animation";
import SearchHistory from "./SearchHistory";
import SearchTrending from "./SearchTrending";
import SearchResults from "./SearchResults";
import { LogData } from "store/homepage/actions";
import search from "services/search";
import { Suspense } from "react";
import { useAppStore } from "store";
import { useParams, useSearchParams } from "next/navigation";

function SearchContainer({ active }) {
  const { setSearchWord, value } = useAppStore();
  const [searchHistoryItems, setSearchHistory] = useState([]);
  const { lang } = useParams();

  const mountAnim = ` 
    0% {transform:translateX(-800px)}
    100% {transform:translateX(0px)}
  `;
  const unmountAnim = `
  0% {transform:translateX(0px)}
  100% {transform:translateX(-800px)}
  `;
  useEffect(() => {
    if (localStorage.getItem("search-history")) {
      setSearchHistory(JSON.parse(localStorage.getItem("search-history")));
    } else {
      setSearchHistory([]);
    }
  }, [value]);
  const searchParams = useSearchParams();
  const getSearchData = async () => {
    search.getSearchOptions({
      noProducts: true,
      lang: lang,
    });
    await search.getTrendingSearch();
  };
  useEffect(() => {
    if (!searchParams.get("changed-country") && !searchParams.get("no-country"))
      if (active) getSearchData();
  }, [active]);
  return (
    <Animated.div
      unmountTime={0.4}
      show={active}
      time={0.4}
      mountAnim={mountAnim}
      style={{ animationFillMode: "forwards" }}
      unmountAnim={unmountAnim}
      className="search-container"
      data-cy="searchContainer"
    >
      {value.length === 0 && (
        <>
          {searchHistoryItems.length > 0 && (
            <SearchHistory
              options={searchHistoryItems}
              setOptions={(e) => {
                setSearchWord(e);
              }}
              deleteOption={(e) => {
                setSearchHistory(searchHistoryItems.filter((s) => s !== e));
              }}
            />
          )}
          <SearchTrending />
        </>
      )}
      <Suspense fallback={<div>Loading...</div>}>
        <SearchResults />
      </Suspense>
    </Animated.div>
  );
}

export default SearchContainer;
