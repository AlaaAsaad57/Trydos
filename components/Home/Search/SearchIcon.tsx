"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Search from "public/svg/SearchIcon";
import "styles/search.css";
import {
  normalizeView,
  onClickSearchHistory,
  translateFunction,
} from "utils/functions";
import search from "services/search";
import {
  buildParamsFromFilters,
  DisableScroll,
  EnableScroll,
} from "utils/tinyUtils";
import { GetSearchData } from "serverRequests/Search";
import SearchHistory from "./SearchHistory";
import SearchTrending from "./SearchTrending";
import ProductItem from "./Results/ProductItem";
import Spinner from "components/global/Spinner";
import BrandItem from "./Results/BrandItem";
import CategoryItem from "./Results/CategoryItem";
import BoutiqueItem from "./Results/BoutiqueItem";
import CloseIcon from "public/svg/CloseIcon";
import SearchVoice from "./SearchVoice";
import SearchImage from "./SearchImage";
import SearchCloseIcon from "public/svg/SearchCloseIcon";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import ActiveSearchFilterBar from "./ActiveSearchFilterBar";
import NextLink from "components/global/NextLink";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "store";

function SearchIcon({ language, country }) {
  const { setIsNavigating } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  // UI States
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState(false);
  const [value, setValue] = useState("");

  // Data States
  const [trending, setTrending] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  // Results State (Consolidated for cleaner updates)
  const [results, setResults] = useState({
    categories: [],
    brands: [],
    boutiques: [],
    products: [],
    total_size: 0,
  });

  // Pagination & Filter States
  const [appliedFilters, setAppliedFilters] = useState({
    categories: [],
    brands: [],
    boutiques: [],
  });

  const [offsets, setOffsets] = useState({
    brands: 1,
    categories: 1,
    boutiques: 1,
  });

  // Visibility of Load More buttons (if < 10 items, set to false)
  const [hasMore, setHasMore] = useState({
    brands: true,
    categories: true,
    boutiques: true,
  });

  // Refs for handling Race Conditions and Debouncing
  const latestRequestRef = useRef(0);
  const debounceTimeoutRef = useRef(null);

  // --- Initial Data Load (Trending & History) ---
  useEffect(() => {
    const history = localStorage.getItem("search-history");
    if (history) {
      setSearchHistory(JSON.parse(history));
    }

    if (searchEnabled) {
      getInitialStaticData();
    }
  }, [searchEnabled]);

  const getInitialStaticData = async () => {
    try {
      // Only fetch trending here. Search results depend on user input.
      const [trendingRes, intial_res] = await Promise.all([
        search.getTrendingSearch(),
        performSearch({ isInitial: true }),
      ]);
      setTrending(trendingRes.popular_search_terms);
    } catch (error) {
      console.error(error);
    }
  };
  const normalizeFilters = (applied_filters) => {
    let obj = {};
    if (applied_filters?.categories) {
      obj = {
        ...obj,
        categories: applied_filters?.categories?.map((s) => s.slug),
      };
    }
    if (applied_filters?.brands) {
      obj = { ...obj, brands: applied_filters?.brands?.map((s) => s.slug) };
    }
    if (applied_filters?.boutiques) {
      obj = {
        ...obj,
        boutiques: applied_filters?.boutiques?.map((s) => s.slug),
      };
    }

    return obj;
  };
  // --- Main Search Logic (Debounced + Race Condition Handled) ---
  const performSearch = useCallback(
    async ({ searchTerm = "", isInitial = false }) => {
      // Increment Request ID to track the latest request
      const requestId = ++latestRequestRef.current;

      setLoading(true);

      try {
        // Reset Offsets and HasMore on new search
        setOffsets({ brands: 1, categories: 1, boutiques: 1 });
        setHasMore({ brands: true, categories: true, boutiques: true });
        console.log(appliedFilters);
        const res = await GetSearchData({
          language,
          country,
          filters: { ...normalizeFilters(appliedFilters), search_text: value },
          noProducts: isInitial, // We usually want products on search
          filters_offset: 1,
          // Assuming server action accepts query text
        });
        console.log(res);
        // RACE CONDITION CHECK: Only update if this is the latest request
        if (requestId === latestRequestRef.current) {
          setResults({
            boutiques: res.boutiques || [],
            brands: res.brands || [],
            categories: res.categories || [],
            products: isInitial ? [] : res.products || [],
            total_size: res.total_size,
          });

          // Update HasMore flags based on initial limit (10)
          setHasMore({
            brands: (res.brands?.length || 0) >= 10,
            categories: (res.categories?.length || 0) >= 10,
            boutiques: (res.boutiques?.length || 0) >= 10,
          });

          setLoading(false);
        }
      } catch (error) {
        if (requestId === latestRequestRef.current) {
          setLoading(false);
        }
      }
    },
    [language, country, appliedFilters, value]
  );

  // --- Watch Input Change for Debounce ---

  // Ensure useEffect triggers search when appliedFilters changes
  useEffect(() => {
    if (!searchEnabled) return;

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    debounceTimeoutRef.current = setTimeout(() => {
      const hasFilters = Object.values(appliedFilters).some(
        (arr) => arr.length > 0
      );

      if (value.length > 0 || hasFilters) {
        // Requirement #1: Trigger search on value OR filter change
        performSearch({ searchTerm: value });
      } else {
        // Requirement #2: When both are empty, reset results and fetch initial data
        setResults({
          categories: [],
          brands: [],
          boutiques: [],
          products: [],
          total_size: 0,
        });
        // This ensures we show the "initial" state (Trending/History)
        performSearch({ isInitial: true });
      }
    }, 400);

    return () => clearTimeout(debounceTimeoutRef.current);
  }, [value, appliedFilters, searchEnabled, performSearch]);

  // --- Pagination Logic (Load More) ---
  const handleLoadMore = async (type) => {
    // type: 'brands' | 'categories' | 'boutiques'
    if (loading) return;

    const nextOffset = offsets[type] + 1;
    const currentRequestId = latestRequestRef.current; // Keep same request ID context if needed, or don't track for pagination purely

    // We create a local loading state for load more usually, but using global loading for now as requested
    setLoading(true);

    try {
      const res = await GetSearchData({
        language,
        country,
        filters: { ...appliedFilters, search_text: value },
        noProducts: true,
        filters_offset: nextOffset,
        // type: type, // Optimization: Tell server we only want this specific type if supported
      });

      const newItems = res[type] || [];

      // Update State
      setResults((prev) => ({
        ...prev,
        [type]: [...prev[type], ...newItems],
      }));

      setOffsets((prev) => ({
        ...prev,
        [type]: nextOffset,
      }));

      // If fewer than 10 items returned, no more pages
      if (newItems.length < 10) {
        setHasMore((prev) => ({ ...prev, [type]: false }));
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  // --- UI Handlers ---
  const handleClose = () => {
    setSearchEnabled(false);
    EnableScroll();
    setValue("");
    setFocus(false);
    setResults({
      categories: [],
      brands: [],
      boutiques: [],
      products: [],
      total_size: 0,
    });
  };
  const { lang } = useParams();
  const router = useRouter();
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      let pathParams = buildParamsFromFilters({
        categories: appliedFilters?.categories?.map((s) => s.slug),
        brands: appliedFilters?.brands?.map((s) => s.slug),
        boutiques: appliedFilters?.boutiques?.map((s) => s.slug),
        search: [value],
      });
      setIsNavigating({
        is_boutique: true,
      });
      router.push(`/${lang}/filters/${pathParams.join("/")}`);
    }
  };
  return (
    <>
      <div
        className={`search-icon flex items-center h-full cursor-pointer duration-[0.4s] min-w-[50px] ${
          searchEnabled && "active-serach min-w-full"
        }`}
        data-cy="searchIcon_mainPage"
        onClick={() => {
          if (!searchEnabled) {
            DisableScroll();
            normalizeView();
            setSearchEnabled(true);
          }
        }}
      >
        <Search
          id="search-icon"
          className={`absolute duration-[0.4s] ml-[10px] z-50 ${
            focus && "black-fill"
          }`}
        />
        <div className="search-component-container flex-row">
          <div className={`search-input-parent ${focus && "focuse"}`}>
            <input
              maxLength={90}
              data-cy="inputField"
              onKeyDown={handleKeyDown}
              id="search-element"
              disabled={!searchEnabled}
              className="search-input"
              placeholder={translateFunction("Search", language?.split("-")[1])}
              onFocus={() => setFocus(true)}
              onBlur={() => {
                if (value.length === 0) setFocus(false);
              }}
              value={value} // No regex replace here for smoother typing, handle in logic if needed
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          {searchEnabled && (
            <>
              {focus || value.length > 0 ? (
                <div className="input-icons flex-row close-search-icon">
                  <SearchCloseIcon
                    data-cy="SearchInputCloseIcon"
                    onClick={() => {
                      if (value.length > 0) {
                        setValue("");
                      } else {
                        handleClose();
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="input-icons flex-row h-full">
                  <SearchImage
                    setSearchValue={(e) => {
                      if (e) setValue(e);
                    }}
                  />
                  <SearchVoice
                    setSearchValue={(e) => {
                      if (e) setValue(e);
                    }}
                  />
                </div>
              )}
              {!focus && value.length === 0 && (
                <div className="search-colse-icon flex-row">
                  <CloseIcon
                    data-cy="closeIcon_searchPage"
                    onClick={handleClose}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {searchEnabled && (
        <SearchContainer
          setSearchEnable={setSearchEnabled}
          total_size={results.total_size}
          setAppliedFilters={setAppliedFilters}
          isRtl={isRtl}
          setOffsets={setOffsets}
          language={language}
          value={value}
          setValue={setValue}
          loading={loading}
          // Data
          products={results.products}
          brands={results.brands}
          categories={results.categories}
          boutiques={results.boutiques}
          trending={trending}
          searchHistoryItems={searchHistory}
          setSearchHistory={setSearchHistory}
          applied_filter={appliedFilters}
          // Logic
          EnableSearch={setSearchEnabled}
          onClickSearchHistory={(val) => {
            setValue(val);
            const updatedHistory = onClickSearchHistory(val);
            setSearchHistory(updatedHistory);
          }}
          // Load More Handlers
          hasMore={hasMore}
          loadMoreBrands={() => handleLoadMore("brands")}
          loadMoreCategories={() => handleLoadMore("categories")}
          loadMoreBoutiques={() => handleLoadMore("boutiques")}
        />
      )}
    </>
  );
}

export default SearchIcon;

// ------------------------------------------------------------------
// Sub-Component: SearchContainer
// ------------------------------------------------------------------

const SearchContainer = ({
  value,
  setValue,
  loading,
  products,
  brands,
  categories,
  boutiques,
  trending,
  searchHistoryItems,
  setSearchHistory,
  isRtl,
  language,
  onClickSearchHistory,
  EnableSearch,
  hasMore,
  loadMoreBrands,
  loadMoreCategories,
  loadMoreBoutiques,
  setAppliedFilters,
  applied_filter,
  setOffsets,
  total_size,
  setSearchEnable,
}) => {
  // Helper to handle filter clicks (Mock implementation based on context)
  const toggleFilter = (type, item) => {
    if (loading) return;

    setAppliedFilters((prev) => {
      let updatedSection = [...prev[type]];

      // For categories: Handle parent/child mutual exclusivity FIRST
      if (type === "categories") {
        // A. If clicking a CHILD: Remove any parents that contain this child
        if (!item.childes || item.childes.length === 0) {
          // is child
          updatedSection = updatedSection.filter(
            (filteredItem) =>
              !filteredItem.childes?.some((c) => c.slug === item.slug)
          );
        }

        // B. If clicking a PARENT: Remove any of its own children
        if (item.childes?.length > 0) {
          // is parent
          const childSlugs = item.childes.map((c) => c.slug);
          updatedSection = updatedSection.filter(
            (filteredItem) => !childSlugs.includes(filteredItem.slug)
          );
        }
      }

      // Now check if the clicked item should be toggled (AFTER parent/child cleanup)
      const isAlreadySelected = updatedSection.some(
        (s) => s.slug === item.slug
      );

      if (isAlreadySelected) {
        // Remove it
        updatedSection = updatedSection.filter((s) => s.slug !== item.slug);
      } else {
        // Add it
        updatedSection.push(item);
      }
      return {
        ...prev,
        [type]: updatedSection,
      };
    });

    setOffsets({ brands: 1, categories: 1, boutiques: 1 });
  };
  const showButton = () => {
    if (
      (applied_filter?.categories.length > 0 ||
        applied_filter?.brands.length > 0 ||
        applied_filter?.boutiques.length > 0 ||
        value.length > 0) &&
      total_size > 0
    )
      return true;
    else return false;
  };
  const { lang } = useParams();
  const pageUrl = () => {
    let pathParams = buildParamsFromFilters({
      categories: applied_filter?.categories?.map((s) => s.slug),
      brands: applied_filter?.brands?.map((s) => s.slug),
      boutiques: applied_filter?.boutiques?.map((s) => s.slug),
      search: value,
    });
    return `/${lang}/filters/${pathParams.join("/")}`;
  };
  return (
    <div
      className="search-container pt-[12px] pb-[40px]"
      data-cy="searchContainer"
    >
      {/* 1. Empty State: History & Trending */}
      {value.length === 0 && (
        <>
          {searchHistoryItems.length > 0 && (
            <SearchHistory
              options={searchHistoryItems}
              setOptions={setValue}
              deleteOption={(e) => {
                setSearchHistory(searchHistoryItems.filter((s) => s !== e));
                localStorage.setItem(
                  "search-history",
                  JSON.stringify(searchHistoryItems.filter((s) => s !== e))
                );
              }}
            />
          )}
          <SearchTrending
            clearAll={() => setValue("")}
            setValue={setValue}
            trending={trending}
          />
        </>
      )}

      {/* 2. Results State */}
      <div
        className="search-results-container flex-col"
        data-cy="searchResults_body"
      >
        {/* Products */}
        {value.length > 0 && (loading || products?.length > 0) && (
          <div className="products-results flex-col max-h-[60%] overflow-auto">
            <div
              className={`result-label flex-row ${
                isRtl ? "flex-row-reverse pr-2" : ""
              }`}
            >
              {translateFunction("Find Products", language)}
            </div>
            {products.map((product, index) => (
              <ProductItem
                product={product}
                index={index + 1}
                key={product?.product_id || index}
                onClick={(e) => {
                  onClickSearchHistory(value);
                  EnableSearch(false);
                }}
              />
            ))}
          </div>
        )}

        {/* Brands */}
        {(brands?.length > 0 || loading) && (
          <div
            className="products-results brand-results"
            data-cy="ContainerOfBrands"
          >
            <div
              className={`result-label flex-row ${
                isRtl ? "flex-row-reverse pr-2" : ""
              }`}
            >
              {translateFunction("Find Brands", language)}
              {loading && <Spinner className="mx-[12px]" no />}
            </div>
            <HortiznalScrollBar
              id="search-brands-wrapper"
              className={`brands-results-row m-0 pt-[10px] flex-row overflow-auto ${
                isRtl ? "flex-row-reverse" : ""
              }`}
            >
              {brands.map((brand) => (
                <BrandItem
                  brand={brand}
                  key={brand?.slug}
                  onClick={() => toggleFilter("brands", brand)}
                  isActive={applied_filter?.brands.some(
                    (s) => s.slug === brand.slug
                  )}
                />
              ))}
              {hasMore.brands && brands.length >= 10 && (
                <LoadMoreComponent loading={loading} onClick={loadMoreBrands} />
              )}
            </HortiznalScrollBar>
          </div>
        )}

        {/* Categories */}
        {(categories?.length > 0 || loading) && (
          <div
            className="products-results brand-results"
            data-cy="ContainerOfCategories"
          >
            <div
              className={`result-label flex-row ${
                isRtl ? "flex-row-reverse pr-2" : ""
              }`}
            >
              {translateFunction("Find Categories", language)}
              {loading && <Spinner className="mx-[12px]" no />}
            </div>
            <HortiznalScrollBar
              id="search-categories-wrapper"
              className={`brands-results-row m-0 pt-[10px] flex-row overflow-auto ${
                isRtl ? "flex-row-reverse" : ""
              }`}
            >
              {categories.map((category) => (
                <CategoryItem
                  applied_filter={applied_filter}
                  category={category}
                  key={category?.slug}
                  onClick={(e) => toggleFilter("categories", e)}
                  isActive={applied_filter?.categories.some(
                    (s) => s.slug === category.slug
                  )}
                />
              ))}
              {hasMore.categories && categories.length >= 10 && (
                <LoadMoreComponent
                  loading={loading}
                  onClick={loadMoreCategories}
                />
              )}
            </HortiznalScrollBar>
          </div>
        )}

        {/* Boutiques */}
        {(boutiques?.length > 0 || loading) && (
          <div
            className="products-results brand-results"
            data-cy="ContainerOfBoutiques"
          >
            <div
              className={`result-label flex-row ${
                isRtl ? "flex-row-reverse pr-2" : ""
              }`}
            >
              {translateFunction("Find Boutiques", language)}
              {loading && <Spinner className="mx-[12px]" no />}
            </div>
            <HortiznalScrollBar
              id="search-boutique-wrapper"
              className={`brands-results-row m-0 pt-[10px] flex-row overflow-auto ${
                isRtl ? "flex-row-reverse" : ""
              }`}
            >
              {boutiques.map((boutique) => (
                <BoutiqueItem
                  boutique={boutique}
                  key={boutique?.slug}
                  onClick={() => toggleFilter("boutiques", boutique)}
                  isActive={applied_filter?.boutiques.some(
                    (s) => s.slug === boutique.slug
                  )}
                />
              ))}
              {hasMore.boutiques && boutiques.length >= 10 && (
                <LoadMoreComponent
                  loading={loading}
                  onClick={loadMoreBoutiques}
                />
              )}
            </HortiznalScrollBar>
          </div>
        )}
      </div>
      <div className="w-full max-w-[1200px] px-[25px] fixed bottom-[40px] left-0 right-0 mx-auto flex flex-col">
        <ActiveSearchFilterBar
          appliedFilters={applied_filter}
          reset={() => {
            setValue("");
            setAppliedFilters({
              categories: [],
              brands: [],
              boutiques: [],
            });
          }}
          value={value}
        />
        <div
          className="flex-row w-full mt-3 justify-center"
          data-cy="searchResult"
        >
          {showButton() &&
            (loading ? (
              <div
                aria-disabled={loading}
                className="w-full h-10 p-2 cursor-pointer flex bg-[#ff5549] text-[#fff] justify-center items-center rounded-xl"
                data-cy="apply-filters-search"
              >
                {translateFunction("Search")}{" "}
                {loading ? (
                  <span className="ml-2">
                    <Spinner className="" />
                  </span>
                ) : (
                  <>
                    {total_size > 0 && (
                      <span
                        className="text-[#fafafa] regular ml-2"
                        data-cy="countAfterFilter"
                      >
                        ({translateFunction("Total Products:")} {total_size})
                      </span>
                    )}
                  </>
                )}
              </div>
            ) : (
              <NextLink
                href={pageUrl()}
                data={{
                  is_boutique: true,
                }}
                onClick={() => {
                  setSearchEnable(false);
                }}
                aria-disabled={loading}
                className="w-full h-10 p-2 cursor-pointer flex bg-[#ff5549] text-[#fff] justify-center items-center rounded-xl"
                data-cy="apply-filters-search"
              >
                {translateFunction("Search")}{" "}
                {loading ? (
                  <span className="ml-2">
                    <Spinner className="" />
                  </span>
                ) : (
                  <>
                    {total_size > 0 && (
                      <span
                        className="text-[#fafafa] regular ml-2"
                        data-cy="countAfterFilter"
                      >
                        ({translateFunction("Total Products:")} {total_size})
                      </span>
                    )}
                  </>
                )}
              </NextLink>
            ))}
          {(showButton() || total_size === 0) && (
            <div
              className="w-16 h-10 ml-4 cursor-pointer p-2 flex bg-[#f8f8f8] text-[#ff5549] justify-center items-center rounded-xl"
              data-cy="reset-filters-search"
              onClick={() => {
                setValue("");
                setAppliedFilters({
                  categories: [],
                  brands: [],
                  boutiques: [],
                });
              }}
            >
              {translateFunction("Reset")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Sub-Component: LoadMoreComponent
// ------------------------------------------------------------------

const LoadMoreComponent = ({ loading, onClick }) => {
  // If globally loading, we show spinners.
  // Ideally, we'd have a specific "loadingMore" state to avoid replacing the button with spinners
  // every time a search happens, but based on requirements, this works for "load more" actions.

  if (loading) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="brand-item min-w-[81px] p-0 relative ml-2" key={i}>
            <Spinner />
          </div>
        ))}
      </>
    );
  }

  return (
    <div
      className="category-item brand-item whitespace-nowrap relative pr-4 z-10 text-[#1d1d1d] cursor-pointer"
      onClick={onClick}
    >
      {translateFunction("Load More")}
    </div>
  );
};
