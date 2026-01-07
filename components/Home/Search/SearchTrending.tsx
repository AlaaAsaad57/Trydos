import React, { useEffect, useState } from "react";
import SearchTrendingicon from "public/svg/SearchTrendingicon";
import SearchMiniIcon from "public/svg/SearchMiniIcon";
import { useParams } from "next/navigation";
function SearchTrending({ trending, clearAll, setValue }) {
  const [openMenu, setOpen] = useState(false);
  const { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const isRtl = languageVariable === "ar" || languageVariable === "ku";

  return (
    <div
      className={` ${
        openMenu ? "flex-col" : "align-center flex-row"
      } search-filter-container ${isRtl ? "flex-row-reverse pr-2" : " "}`}
    >
      <div
        className="flex-row align-center cursor-pointer"
        onClick={() => setOpen(!openMenu)}
      >
        <SearchTrendingicon />
        {openMenu && (
          <span className="filter-label-search">Popular Search</span>
        )}
      </div>

      {!openMenu && (
        <div className="search-filter-options s2 flex-row">
          {trending.map((s, index) => (
            <div
              key={index}
              className="search-filter-option"
              data-cy="search-trending-option"
              onClick={(e) => {
                setValue(s.term);
              }}
            >
              {s.term}
              {/* {s.isSelected && (
                <div
                  className="close-icon-container"
                  onClick={() => {

                  }}
                >
                  <CloseIconOption />
                </div>
              )} */}
            </div>
          ))}
        </div>
      )}
      {openMenu && (
        <span
          className="clear-options-button"
          onClick={(e) => {
            clearAll();
          }}
        >
          Clear All
        </span>
      )}
      {openMenu && (
        <div className="flex-col search-filter-menu">
          {trending.map((s, index) => (
            <div
              key={index}
              className="option-row-search flex-row"
              data-cy="search-trending-option"
              onClick={(e) => {
                setValue(s.term);
                // Sendevent({
                //   event: GA_EVENT_NAMES.CLICK,
                //   value: GA_CLICK_EVENT_VALUES.SEARCH_TRENDING_OPTION,
                // });
              }}
            >
              {s.term}{" "}
              {/* {s.isSelected && (
                <div
                  className="close-icon-container"
                  onClick={() => {
                    let arr = [...options];
                    arr[index] = { ...s, isSelected: false };
                    setOptions(arr);
                  }}
                >
                  <CloseIconOption />
                </div>
              )} */}
              <div className="flex-row trend-count">
                <span>{s.count}</span>
                <SearchMiniIcon />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchTrending;
