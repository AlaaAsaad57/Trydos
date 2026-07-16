import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { translateFunction } from "utils/functions";
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
        <img src="/icons/SearchTrendingicon.svg" />
        {openMenu && (
          <span className="filter-label-search">{translateFunction("Popular Search")}</span>
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
          {translateFunction("Clear All")}
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
                <img src="/icons/SearchMiniIcon.svg" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchTrending;
