import React, { useEffect, useState } from "react";
import Animated from "react-mount-animation";
import SearchHistory from "./SearchHistory";
import SearchTrending from "./SearchTrending";
import { useDispatch, useSelector } from "react-redux";
import SearchResults from "./SearchResults";
import { getSearchOptions } from "utils/functions";
import { LogData } from "store/homepage/actions";
import search from "services/search";

function SearchContainer({ active }) {
  const [searchHistoryItems, setSearchHistory] = useState([]);

  const mountAnim = ` 
    0% {transform:translateX(-800px)}
    100% {transform:translateX(0px)}
  `;
  const unmountAnim = `
  0% {transform:translateX(0px)}
  100% {transform:translateX(-800px)}
  `;
  const searchValue = useSelector(
    (state: StateInterface) => state.Search.value
  );
  const dispatch = useDispatch();
  useEffect(() => {
    if (localStorage.getItem("search-history")) {
      setSearchHistory(JSON.parse(localStorage.getItem("search-history")));
    } else {
      setSearchHistory([]);
    }
  }, [searchValue]);
  const getSearchData = async () => {
    let [{ categories, brands, boutiques }, res] = await getSearchOptions();
    LogData(res);
    dispatch({
      type: "SEARCH-RESULTS",
      payload: { categories, brands, boutiques },
    });
    await search.getTrendingSearch();
  };
  useEffect(() => {
    getSearchData();
  }, []);
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
      {searchValue.length === 0 && (
        <>
          <SearchHistory
            options={searchHistoryItems}
            setOptions={(e) => {
              dispatch({ type: "SEARCH-WORD", payload: e });
            }}
            deleteOption={(e) => {
              setSearchHistory(searchHistoryItems.filter((s) => s !== e));
            }}
          />
          <SearchTrending />
        </>
      )}
      {<SearchResults />}
    </Animated.div>
  );
}

export default SearchContainer;
