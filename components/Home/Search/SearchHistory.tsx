import React, { useEffect, useState } from "react";
import SearchHistoryIcon from "public/svg/SearchHistoryIcon.svg";
import CloseIconOption from "public/svg/CloseIconOption.svg";
import { useAppStore } from "store";
import search from "services/search";
import { useParams } from "next/navigation";

function SearchHistory({ options, setOptions, deleteOption }) {
  const { setSearchPartialLoading, setSearchLoading } = useAppStore();
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

  const { lang } = useParams();
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
        <SearchHistoryIcon data-cy="SearchHistoryIcon" />
        {openMenu && (
          <span
            className="filter-label-search"
            data-cy="SearchHistoryStatement"
          >
            Search History
          </span>
        )}
      </div>
      {!openMenu && (
        <div className="search-filter-options s1 flex-row">
          {options.map((s, index) => {
            if (s.length > 0)
              return (
                <div
                  key={index}
                  className="search-filter-option"
                  data-cy="search-history-option"
                  onClick={(e) => {
                    // @ts-ignore
                    if (!e.target.closest(".close-icon-container")) {
                      setSearchPartialLoading(true);
                      setSearchLoading(true);
                      setOptions(s);
                      search.getSearchOptions({
                        noProducts: false,
                        lang: lang,
                      });
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
                        deleteOption(s);
                      }}
                    >
                      <CloseIconOption />
                    </div>
                  }
                </div>
              );
          })}
        </div>
      )}
      {openMenu && (
        <span
          className="clear-options-button"
          data-cy="clearAll"
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
              key={`${s}-${index}`}
              className="option-row-search flex-row"
              onClick={(e) => {
                // @ts-ignore
                if (!e.target.closest(".close-icon-container")) {
                  setSearchPartialLoading(true);
                  setSearchLoading(true);
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
                    setOpen(false);
                    setOpen(true);
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
