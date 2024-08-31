import React, { useEffect, useState } from "react";
import SearchHistoryIcon from "public/svg/SearchHistoryIcon.svg";
import CloseIconOption from "public/svg/CloseIconOption.svg";
import home from "services/home";
import { useDispatch, useSelector } from "react-redux";

function SearchHistory({ options, setOptions }) {
  const [openMenu, setOpen] = useState(false);
  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider: HTMLDivElement = document?.querySelector(
        ".search-filter-options.s1"
      );
      let isDown = false;
      let startX: number;
      let scrollLeft: number;

      slider?.addEventListener("mousedown", (e: MouseEvent) => {
        isDown = true;
        slider.classList.add("active");
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
      slider?.addEventListener("mouseleave", () => {
        isDown = false;
        slider.classList.remove("active");
      });
      slider?.addEventListener("mouseup", () => {
        isDown = false;
        slider.classList.remove("active");
      });
      slider?.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 3; //scroll-fast
        slider.scrollLeft = scrollLeft - walk;
      });
    }
  }, []);
  const dispatch = useDispatch();
  const searchFilters = useSelector((state: any) => state.Search.searchFilters);
  const setLoading = (e) => {
    dispatch({ type: "SEARCH-PARTIAL-LOADING", payload: e });
  };

  return (
    <div
      className={` ${
        openMenu ? "flex-col" : "align-center flex-row"
      } search-filter-container`}
    >
      <div
        className="flex-row align-center cursor-pointer"
        onClick={() => setOpen(!openMenu)}
      >
        <SearchHistoryIcon />
        {openMenu && (
          <span className="filter-label-search">Search History</span>
        )}
      </div>
      {!openMenu && (
        <div className="search-filter-options s1 flex-row">
          {options.map((s, index) => (
            <>
              {s?.length > 0 && (
                <div
                  key={index}
                  className="search-filter-option"
                  onClick={(e) => {
                    // @ts-ignore
                    if (!e.target.closest(".close-icon-container")) {
                      dispatch({ type: "SEARCH-LOADING", payload: true });
                      home.UpdateFilters({
                        search_text: s || "",
                        callback: (e) => {
                          setLoading(false);
                          dispatch({ type: "EDIT-FILTER-SEARCH", payload: e });
                        },
                      });
                      home.SearchProducts({
                        search_text: s,
                        searchFilters: searchFilters,
                        callback: (e) => {
                          dispatch({ type: "FIND-PRODUCTS", payload: e });
                        },
                      });
                      setOptions(s);
                    }
                  }}
                >
                  {s}{" "}
                  {
                    <div
                      className="close-icon-container"
                      onClick={() => {
                        let arr = localStorage.getItem("search-history");

                        localStorage.setItem(
                          "search-history",
                          JSON.stringify(
                            JSON.parse(arr).filter((item) => item !== s)
                          )
                        );
                      }}
                    >
                      <CloseIconOption />
                    </div>
                  }
                </div>
              )}
            </>
          ))}
        </div>
      )}
      {openMenu && (
        <span
          className="clear-options-button"
          onClick={(e) => {
            localStorage.setItem("search-history", JSON.stringify([]));
          }}
        >
          Clear All
        </span>
      )}

      {openMenu && (
        <div className="flex-col search-filter-menu">
          {options.map((s, index) => (
            <div
              key={index}
              className="option-row-search flex-row"
              onClick={(e) => {
                if (s.isSelected === false) {
                  let arr = [...options];
                  arr[index] = { ...s, isSelected: true };
                  setOptions(arr);
                }
              }}
            >
              {s}{" "}
              {
                <div
                  className="close-icon-container"
                  onClick={() => {
                    setOptions(s);
                  }}
                >
                  <CloseIconOption />
                </div>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchHistory;
