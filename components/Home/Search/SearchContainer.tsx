"use client";
import React, { useEffect, useState } from "react";
import SearchHistory from "./SearchHistory";
import SearchTrending from "./SearchTrending";
import SearchResults from "./SearchResults";
import search from "services/search";
import { Suspense } from "react";
import { useAppStore } from "store";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import SearchParamUpdater from "components/global/ParamsUpdater";

function SearchContainer({ active }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setSearchWord, value, setTrendingSearch } = useAppStore();
  const [searchHistoryItems, setSearchHistory] = useState([]);
  const { lang } = useParams();

  useEffect(() => {
    if (localStorage.getItem("search-history")) {
      setSearchHistory(JSON.parse(localStorage.getItem("search-history")));
    } else {
      setSearchHistory([]);
    }
  }, [value]);
  const searchParams = useSearchParams();
  const getSearchData = async () => {
    try {
      let data = await search.getTrendingSearch();

      setTrendingSearch(data.popular_search_terms);
      await search.getSearchOptions({
        noProducts: true,
        lang: lang,
      });
    } catch (error) {}
  };
  useEffect(() => {
    if (!searchParams.get("changed-country") && !searchParams.get("no-country"))
      if (active) getSearchData();
  }, [active]);
  return (
    <div className="search-container pt-[12px]" data-cy="searchContainer">
      <SearchParamUpdater searchKey="search" searchValue="true" />
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
    </div>
  );
}

export default SearchContainer;
