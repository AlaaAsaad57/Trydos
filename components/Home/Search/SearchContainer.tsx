import React, { useEffect, useState } from "react";
import Animated from "react-mount-animation";
import SearchHistory from "./SearchHistory";
import SearchTrending from "./SearchTrending";
import { useDispatch, useSelector } from "react-redux";
import SearchResults from "./SearchResults";
import { getSearchOptions } from "utils/functions";
function SearchContainer({ active }) {
  const [searchHistoryItems, setSearchHistory] = useState([]);
  const [searchTrendItems, setSearchTrend] = useState([
    { name: "Mango", isSelected: false, count: 1000 },
    { name: "Dress", isSelected: false, count: 1000 },
    { name: "Zara", isSelected: false, count: 1000 },
    { name: "Adiddas", isSelected: false, count: 1000 },
    { name: "Tall Dress", isSelected: false, count: 1000 },
    { name: "Short Dress", isSelected: false, count: 1000 },
    { name: "T-Shirt", isSelected: false, count: 1000 },
  ]);
  const mountAnim = ` 
    0% {transform:translateX(-800px)}
    100% {transform:translateX(0px)}
  `;
  const unmountAnim = `
  0% {transform:translateX(0px)}
  100% {transform:translateX(-800px)}
  `;
  const searchValue = useSelector((state: any) => state.Search.value);
  const dispatch = useDispatch();
  useEffect(() => {
    if (localStorage.getItem("search-history")) {
      setSearchHistory(JSON.parse(localStorage.getItem("search-history")));
    } else {
      setSearchHistory([]);
    }
  }, [searchValue]);
  const getSearchData = async () => {
    let { categories, brands, boutiques } = await getSearchOptions();
    dispatch({
      type: "SEARCH-RESULTS",
      payload: { categories, brands, boutiques },
    });
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
    >
      {searchValue.length === 0 && (
        <>
          <SearchHistory
            options={searchHistoryItems}
            setOptions={(e) => {
              dispatch({ type: "SEARCH-WORD", payload: e });
            }}
          />
          <SearchTrending
            options={searchTrendItems}
            setOptions={(e) => setSearchTrend([...e])}
          />
        </>
      )}
      {<SearchResults />}
    </Animated.div>
  );
}

export default SearchContainer;
