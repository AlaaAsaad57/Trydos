"use client";
import React, { useEffect } from "react";

import ProductItem from "./Results/ProductItem";
import BrandItem from "./Results/BrandItem";
import CategoryItem from "./Results/CategoryItem";
import BoutiqueItem from "./Results/BoutiqueItem";
import { onClickSearchHistory, translateFunction } from "utils/functions";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import Spinner from "components/global/Spinner";

import { useAppStore } from "store";
import search from "services/search";
import ActiveSearchFilterBar from "./ActiveSearchFilterBar";
import NextLink from "components/global/NextLink";
import InfiniteScrollFiltersSearch from "components/ListingPage/filterComponents/InfiniteScrollFilterSearch";
import { GA_EVENT_NAMES } from "utils/GAEvents";

function SearchResults() {
  const {
    resetSearchFilter,
    setSearchPartialLoading,
    setSearchCategory,
    setSearchBrand,
    setSearchBoutique,
    setSearchWord,
    partialLoading,
    searchResults,
    totalProducts,
    loading_search,
    searchFilters,
    setSearchLoading,
    value,
  } = useAppStore();
  const searchParams = useSearchParams();
  const showFilterBar = () => {
    return (
      searchFilters?.categories.length > 0 ||
      searchFilters?.brands.length > 0 ||
      searchFilters?.boutiques.length > 0 ||
      value.length > 0
    );
  };
  const router = useRouter();
  const { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];

  const apply = () => {
    // Sendevent({
    //   event: GA_EVENT_NAMES.CLICK,
    //   value: GA_CLICK_EVENT_VALUES.APPLY_HOME_SEARCH_RESULT_BUTTON,
    // });
    onClickSearchHistory(value || "");
  };
  useEffect(() => {
    if (typeof document !== "undefined") {
      document
        .querySelectorAll(".brands-results-row")
        .forEach((slider: HTMLDivElement) => {
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
        });
    }
  }, [searchResults]);
  const reset = () => {
    // Sendevent({
    //   event: GA_EVENT_NAMES.CLICK,
    //   value: GA_CLICK_EVENT_VALUES.RESET_HOME_SEARCH_RESULT_BUTTON,
    // });
    resetSearchFilter();
    setSearchPartialLoading(true);
    setSearchWord("");
    search.getSearchOptions({
      noProducts: true,
      lang: lang,
    });
  };
  const updateFiltersApi = async () => {
    setSearchPartialLoading(true);
    setSearchLoading(true);
    await search.getSearchOptions({
      noProducts: false,
      lang: lang,
    });
    setSearchPartialLoading(false);
    setSearchLoading(false);
  };
  const showButton = () => {
    if (
      (searchFilters?.categories.length > 0 ||
        searchFilters?.brands.length > 0 ||
        searchFilters?.boutiques.length > 0 ||
        value.length > 0) &&
      totalProducts > 0
    )
      return true;
    else return false;
  };
  return (
    <div
      className="search-results-container flex-col"
      data-cy="searchResults_body"
    >
      <>
        {value?.length > 0 && searchResults?.products?.length > 0 && (
          <div className="products-results flex-col max-h-[60%] overflow-auto">
            <div className="result-label flex-row">
              {translateFunction("Find Products", languageVariable)}{" "}
            </div>
            {searchResults?.products?.map((product, index) => {
              return (
                <ProductItem
                  product={product}
                  key={index}
                  onClick={(e) => {
                    // Sendevent({
                    //   event: GA_EVENT_NAMES.CLICK,
                    //   value: GA_CLICK_EVENT_VALUES.CHOOSE_PRODUCT_BUTTON,
                    //   extra: {
                    //     product: product.id,
                    //   },
                    // });
                    onClickSearchHistory(e);
                  }}
                />
              );
            })}
          </div>
        )}
        {(searchResults?.brands?.length > 0 || partialLoading) && (
          <div
            className="products-results brand-results"
            data-cy="ContainerOfBrands"
          >
            <div className="result-label flex-row">
              {translateFunction("Find Brands", languageVariable)}{" "}
              {partialLoading && <Spinner className="ml-3" no />}
            </div>
            <div className="brands-results-row flex-row overflow-auto">
              {searchResults?.brands?.map((brand, index) => (
                <BrandItem
                  brand={brand}
                  key={brand?.slug}
                  onClick={() => {
                    // Sendevent({
                    //   event: GA_EVENT_NAMES.CLICK,
                    //   value: GA_CLICK_EVENT_VALUES.ADD_FILTER_ITEM,
                    //   extra: {
                    //     filter: "brand",
                    //     value: brand.name,
                    //   },
                    // });
                    setSearchBrand(brand);
                    updateFiltersApi();
                  }}
                  isActive={searchFilters?.brands.some(
                    (s) => s.slug === brand.slug
                  )}
                />
              ))}
              <InfiniteScrollFiltersSearch
                shouldShow={searchResults.brands?.length === 10}
                term="brands"
              />
            </div>
          </div>
        )}

        {(searchResults?.categories?.length > 0 ||
          partialLoading ||
          loading_search) && (
          <div
            className="products-results brand-results"
            data-cy="ContainerOfCategories"
          >
            <div className="result-label flex-row">
              {translateFunction("Find Categories", languageVariable)}{" "}
              {(partialLoading || loading_search) && (
                <Spinner className="ml-3" no />
              )}
            </div>
            <div className="brands-results-row flex-row overflow-auto">
              {searchResults?.categories?.map((category, index) => (
                <CategoryItem
                  category={category}
                  key={category?.slug}
                  onClick={(e) => {
                    // Sendevent({
                    //   event: GA_EVENT_NAMES.CLICK,
                    //   value: GA_CLICK_EVENT_VALUES.ADD_FILTER_ITEM,
                    //   extra: {
                    //     filter: "category",
                    //     value: category.name,
                    //   },
                    // });
                    setSearchCategory(e);
                    updateFiltersApi();
                  }}
                  isActive={searchFilters?.categories.some(
                    (s) => s.slug === category.slug
                  )}
                />
              ))}
              <InfiniteScrollFiltersSearch
                term="categories"
                shouldShow={searchResults.categories.length === 10}
              />
            </div>
          </div>
        )}
        {(searchResults?.boutiques?.length > 0 ||
          partialLoading ||
          loading_search) && (
          <div
            className="products-results brand-results"
            data-cy="ContainerOfBoutiques"
          >
            <div className="result-label flex-row">
              {translateFunction("Find Boutiques", languageVariable)}{" "}
              {(partialLoading || loading_search) && (
                <Spinner className="ml-3" no />
              )}
            </div>
            <div className="brands-results-row flex-row overflow-auto">
              {searchResults?.boutiques?.map((boutique, index) => (
                <BoutiqueItem
                  boutique={boutique}
                  key={boutique?.slug}
                  onClick={() => {
                    // Sendevent({
                    //   event: GA_EVENT_NAMES.CLICK,
                    //   value: GA_CLICK_EVENT_VALUES.ADD_FILTER_ITEM,
                    //   extra: {
                    //     filter: "boutique",
                    //     value: boutique.name,
                    //   },
                    // });
                    setSearchBoutique(boutique);
                    updateFiltersApi();
                  }}
                  isActive={searchFilters?.boutiques.some(
                    (s) => s.slug === boutique.slug
                  )}
                />
              ))}
              <InfiniteScrollFiltersSearch
                term="boutiques"
                shouldShow={searchResults.boutiques.length === 10}
              />
            </div>
          </div>
        )}
        {(!totalProducts || totalProducts === 0) &&
          !partialLoading &&
          !loading_search && (
            <div className="flex p-3 justify-center items-center light text-[#5d5d5d] text-[14px]">
              {translateFunction("No Results Found")}
            </div>
          )}
        {showFilterBar() && <ActiveSearchFilterBar />}
        {
          <div
            className="flex-row w-full mt-3 justify-center"
            data-cy="searchResult"
          >
            {(showButton() || partialLoading || loading_search) && (
              <NextLink
                href={search.getSearchPageUrl()}
                data={{
                  is_boutique: true,
                  href: search.getSearchPageUrl(),
                }}
                aria-disabled={partialLoading || loading_search}
                className="w-full h-10 p-2 cursor-pointer flex bg-[#ff5549] text-[#fff] justify-center items-center rounded-xl"
                data-cy="apply-filters-search"
                onClick={() => {
                  apply();
                }}
              >
                {translateFunction("Search")}{" "}
                {partialLoading || loading_search ? (
                  <span className="ml-2">
                    <Spinner className="" />
                  </span>
                ) : (
                  <>
                    {totalProducts !== null && (
                      <span
                        className="text-[#fafafa] regular ml-2"
                        data-cy="countAfterFilter"
                      >
                        ({translateFunction("Total Products:")} {totalProducts})
                      </span>
                    )}
                  </>
                )}
              </NextLink>
            )}
            {(showButton() || totalProducts === 0 || loading_search) && (
              <div
                className="w-16 h-10 ml-4 cursor-pointer p-2 flex bg-[#f8f8f8] text-[#ff5549] justify-center items-center rounded-xl"
                data-cy="reset-filters-search"
                onClick={() => reset()}
              >
                {translateFunction("Reset")}
              </div>
            )}
          </div>
        }
      </>
    </div>
  );
}

export default SearchResults;
