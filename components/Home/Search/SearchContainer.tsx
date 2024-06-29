import React, { useState } from "react";
import Animated from "react-mount-animation";
import SearchHistory from "./SearchHistory";
import SearchTrending from "./SearchTrending";
import { useSelector } from "react-redux";
import SearchResults from "./SearchResults";
function SearchContainer({ active }) {
  const [searchHistoryItems, setSearchHistory] = useState([
    { name: "Mango", isSelected: false },
    { name: "Dress", isSelected: false },
    { name: "Zara", isSelected: false },
    { name: "Tall Dress", isSelected: false },
    { name: "Short Dress", isSelected: false },
    { name: "Long Shirt", isSelected: false },
    { name: "T-Shirt", isSelected: false },
  ]);
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
              setSearchHistory([...e]);
            }}
          />
          <SearchTrending
            options={searchTrendItems}
            setOptions={(e) => setSearchTrend([...e])}
          />
        </>
      )}
      {searchValue.length > 0 && <SearchResults />}
    </Animated.div>
  );
}

export default SearchContainer;
