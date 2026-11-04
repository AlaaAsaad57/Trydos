"use client";

import "styles/search.css";
import Image from "next/image";
import { useParams } from "next/navigation";
import { getConfiguredImage, translateFunction } from "utils/functions";
import { buildParamsFromFilters, GetImageUrl } from "utils/tinyUtils";
import Spinner from "components/global/Spinner";
import HortiznalScrollBar from "components/global/HortiznalScrollBar";
import NextLink from "components/global/NextLink";
import SearchHistory from "./SearchHistory";
import SearchTrending from "./SearchTrending";
import ProductItem from "./Results/ProductItem";
import BrandItem from "./Results/BrandItem";
import CategoryItem from "./Results/CategoryItem";
import BoutiqueItem from "./Results/BoutiqueItem";
import ActiveSearchFilterBar from "./ActiveSearchFilterBar";

/*
  The search's results body: history and trending before the shopper types,
  then products, brands, categories, related categories and boutiques, with
  the filter bar and the "Search" button at the bottom. Moved out of
  SearchIcon.tsx unchanged, so the old search box and the new search page
  (/[lang]/search, Stage 7, D-44: old results under the new input) share it.
*/

// ------------------------------------------------------------------
// Sub-Component: SearchContainer
// ------------------------------------------------------------------

export const SearchContainer = ({
  inPage = false,
  value,
  setValue,
  loading,
  products,
  brands,
  categories,
  boutiques,
  related_categories,
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
}: any) => {
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
              !filteredItem.childes?.some((c) => c.slug === item.slug),
          );
        }

        // B. If clicking a PARENT: Remove any of its own children
        if (item.childes?.length > 0) {
          // is parent
          const childSlugs = item.childes.map((c) => c.slug);
          updatedSection = updatedSection.filter(
            (filteredItem) => !childSlugs.includes(filteredItem.slug),
          );
        }
      }

      // Now check if the clicked item should be toggled (AFTER parent/child cleanup)
      const isAlreadySelected = updatedSection.some(
        (s) => s.slug === item.slug,
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
    const pathParams = buildParamsFromFilters({
      categories: applied_filter?.categories?.map((s) => s.slug),
      brands: applied_filter?.brands?.map((s) => s.slug),
      boutiques: applied_filter?.boutiques?.map((s) => s.slug),
    });
    const base = `/${lang}/filters${
      pathParams.length ? `/${pathParams.join("/")}` : ""
    }`;
    return value?.trim()
      ? `${base}?search=${encodeURIComponent(value.trim())}`
      : base;
  };
  return (
    <div
      className="search-container pt-[12px] max-h-full mx-auto left-0 right-0"
      data-pw="searchContainer"
      // On the search page (/[lang]/search) the results sit in the page's
      // flow, under the new header, not over the old header (search.css
      // places the old box absolute, 146 px down, over the page).
      style={
        inPage
          ? { position: "relative", top: 0, height: "auto", zIndex: "auto" }
          : undefined
      }
    >
      {/* 1. Empty State: History & Trending */}
      {value.length === 0 && (
        <>
          {searchHistoryItems.length > 0 && (
            <SearchHistory
              options={searchHistoryItems}
              setOptions={setValue}
              deleteOption={(e) => {
                // Functional update: Clear All calls this once per word.
                setSearchHistory((list) => list.filter((s) => s !== e));
                localStorage.setItem(
                  "search-history",
                  JSON.stringify(searchHistoryItems.filter((s) => s !== e)),
                );
              }}
            />
          )}
          <SearchTrending
            setValue={setValue}
            trending={trending}
          />
        </>
      )}

      {/* 2. Results State */}
      <div
        className="search-results-container flex-col  overflow-y-scroll pb-[115px]"
        data-pw="searchResults_body"
      >
        {/* Products */}
        {value.length > 0 && (loading || products?.length > 0) && (
          <div className="products-results shrink-0 flex-col max-h-[60%] overflow-auto">
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
                searchValue={value}
                resultsProducts={products}
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
            className="products-results shrink-0 brand-results"
            data-pw="ContainerOfBrands"
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
                    (s) => s.slug === brand.slug,
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
            className="products-results shrink-0 brand-results"
            data-pw="ContainerOfCategories"
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
                    (s) => s.slug === category.slug,
                  )}
                  relatedCategories={[]}
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

        {/* Related Categories - shown when a category is actively filtered */}
        {(() => {
          if (!applied_filter?.categories.length || !related_categories?.length)
            return null;

          const relevantRelated = related_categories.filter((relatedCategory) =>
            applied_filter.categories.some((appliedCat) =>
              relatedCategory?.realted?.includes?.(appliedCat.slug),
            ),
          );

          if (relevantRelated.length === 0) return null;

          return (
            <div
              className="products-results shrink-0 brand-results"
              data-pw="ContainerOfRelatedCategories"
            >
              <div
                className={`result-label flex-row ${
                  isRtl ? "flex-row-reverse pr-2" : ""
                }`}
              >
                {translateFunction("Related Categories", language)}
                {loading && <Spinner className="mx-[12px]" no />}
              </div>
              <HortiznalScrollBar
                id="search-related-categories-wrapper"
                className={`brands-results-row m-0 pt-[10px] flex-row overflow-auto ${
                  isRtl ? "flex-row-reverse" : ""
                }`}
              >
                {relevantRelated
                  .filter(
                    (s) =>
                      !applied_filter.categories.some(
                        (c) => (c?.slug ?? c) === s.slug,
                      ),
                  )
                  .map((related, index) => (
                    <div
                      key={related.slug || index}
                      className="category-item brand-item whitespace-nowrap relative pr-4 w-auto"
                      onClick={() => toggleFilter("categories", related)}
                    >
                      <img
                        src="/icons/TopStar.svg"
                        style={{ top: "-8px", right: "-4px", scale: "0.8" }}
                        className="absolute w-[15px] h-[15px]"
                      />
                      <Image
                        alt={related.name || "Image"}
                        width={30}
                        height={30}
                        src={getConfiguredImage({
                          src: GetImageUrl(
                            related?.flat_photo_path?.file_path || related.icon,
                          ),
                          height: 40,
                        })}
                      />
                      {related.name}
                    </div>
                  ))}
              </HortiznalScrollBar>
            </div>
          );
        })()}

        {/* Boutiques */}
        {(boutiques?.length > 0 || loading) && (
          <div
            className="products-results shrink-0 brand-results"
            data-pw="ContainerOfBoutiques"
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
                    (s) => s.slug === boutique.slug,
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
      <div className="w-full max-w-[1200px] z-50 px-[25px] fixed bottom-[calc(40px+var(--app-bar-room,0px))] left-0 right-0 mx-auto flex flex-col">
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
          data-pw="searchResult"
        >
          {showButton() &&
            (loading ? (
              <div
                aria-disabled={loading}
                className="w-full h-10 p-2 cursor-pointer flex bg-[#ff5549] text-white justify-center items-center rounded-xl"
                data-pw="apply-filters-search"
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
                        data-pw="countAfterFilter"
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
                className="w-full h-10 p-2 cursor-pointer flex bg-[#ff5549] text-white justify-center items-center rounded-xl"
                data-pw="apply-filters-search"
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
                        data-pw="countAfterFilter"
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
              data-pw="reset-filters-search"
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
