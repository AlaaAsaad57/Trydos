import React, { useEffect, useState } from "react";
import SearchTrendingicon from "public/svg/SearchTrendingicon.svg";
import CloseIconOption from "public/svg/CloseIconOption.svg";
import SearchMiniIcon from "public/svg/SearchMiniIcon.svg";
import { useDispatch, useSelector } from "node_modules/react-redux/es";
import home from "services/home";

function SearchTrending() {
  const [openMenu, setOpen] = useState(false);
  const options = useSelector((state: StateInterface) => state.Search.trending);
  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider: HTMLDivElement = document?.querySelector(
        ".search-filter-options.s2"
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
  const setLoading = (e) => {
    dispatch({ type: "SEARCH-PARTIAL-LOADING", payload: e });
  };
  const searchFilters = useSelector(
    (state: StateInterface) => state.Search.searchFilters
  );
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
        <SearchTrendingicon />
        {openMenu && (
          <span className="filter-label-search">Popular Search</span>
        )}
      </div>

      {!openMenu && (
        <div className="search-filter-options s2 flex-row">
          {options.map((s, index) => (
            <div
              key={index}
              className="search-filter-option"
              onClick={(e) => {
                dispatch({ type: "SEARCH-WORD", payload: s.term });
                dispatch({
                  type: "SEARCH-PARTIAL-LOADING",
                  payload: true,
                });
                dispatch({ type: "SEARCH-LOADING", payload: true });
                home.UpdateFilters({
                  search_text: s.term || "",
                  callback: (e) => {
                    setLoading(false);
                    dispatch({ type: "EDIT-FILTER-SEARCH", payload: e });
                  },
                });
                home.SearchProducts({
                  search_text: s.term,
                  searchFilters: searchFilters,
                  callback: (e) => {
                    dispatch({ type: "FIND-PRODUCTS", payload: e });
                  },
                });
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
            setLoading(true);
            dispatch({ type: "SEARCH-WORD", payload: "" });

            dispatch({ type: "FIND-PRODUCTS", payload: [] });
            home.UpdateFilters({
              search_text: "",
              callback: (e) => {
                setLoading(false);
                dispatch({ type: "EDIT-FILTER-SEARCH", payload: e });
              },
            });
            home.SearchProducts({
              search_text: "",
              searchFilters: searchFilters,
              callback: (e) => {
                dispatch({ type: "FIND-PRODUCTS", payload: e });
              },
            });
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
                dispatch({ type: "SEARCH-WORD", payload: s.term });
                dispatch({
                  type: "SEARCH-PARTIAL-LOADING",
                  payload: true,
                });
                dispatch({ type: "SEARCH-LOADING", payload: true });
                home.UpdateFilters({
                  search_text: s.term || "",
                  callback: (e) => {
                    setLoading(false);
                    dispatch({ type: "EDIT-FILTER-SEARCH", payload: e });
                  },
                });
                home.SearchProducts({
                  search_text: s.term,
                  searchFilters: searchFilters,
                  callback: (e) => {
                    dispatch({ type: "FIND-PRODUCTS", payload: e });
                  },
                });
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
