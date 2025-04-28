"use client";
import React, { useEffect } from "react";

import ProductItem from "./Results/ProductItem";
import BrandItem from "./Results/BrandItem";
import CategoryItem from "./Results/CategoryItem";
import BoutiqueItem from "./Results/BoutiqueItem";
import {
  onClickSearchHistory,
  Sendevent,
  translateFunction,
} from "utils/functions";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { dispatchRouteChangeEvent } from "utils/events";
import home from "services/home";
import Spinner from "components/global/Spinner";
import FilterInfoBar from "components/ListingPage/FilterInfoBar";
import { useAppStore } from "store";
import search from "services/search";
import ActiveSearchFilterBar from "./ActiveSearchFilterBar";
import NextLink from "components/global/NextLink";
import InfiniteScrollFiltersSearch from "components/ListingPage/filterComponents/InfiniteScrollFilterSearch";

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
  const handleSearch = (data) => {
    const params = new URLSearchParams(searchParams);
    //categories
    if (data.categories.length > 0) {
      params.set("categories", `${data.categories.map((s) => s.slug)}`);
    } else {
      if (params.get("categories")) {
        params.delete("categories");
      }
    }
    //brands
    if (data.brands.length > 0) {
      params.set("brands", `${data.brands.map((s) => s.slug)}`);
    } else {
      if (params.get("brands")) {
        params.delete("brands");
      }
    }
    if (data.boutiques.length > 0) {
      params.set("boutique_slugs", `${data.boutiques.map((s) => s.slug)}`);
    } else {
      if (params.get("boutique_slugs")) {
        params.delete("boutique_slugs");
      }
    }
    if (value) params.set("searchText", value);
    router.push(`/${lang}/boutiques/listing?${params.toString()}`);
  };
  const apply = () => {
    Sendevent({
      event: "button_clicked",
      value: "apply_home_search_result_button",
    });
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
    Sendevent({
      event: "button_clicked",
      value: "reset_home_search_button",
    });
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
        {(searchResults?.products?.length > 0 || partialLoading) && (
          <div className="products-results flex-col max-h-[60%] overflow-auto">
            <div className="result-label flex-row">
              {translateFunction("Find Products", languageVariable)}{" "}
              {loading_search && <Spinner className="ml-3" no />}
            </div>
            {value?.length > 0 &&
              searchResults?.products?.map((product, index) => {
                return (
                  <ProductItem
                    product={product}
                    key={index}
                    onClick={(e) => onClickSearchHistory(e)}
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
                    Sendevent({
                      event: "button_clicked",
                      value: "add_filter_button",
                      extra: {
                        type: "brand",
                        name: brand.name,
                      },
                    });
                    setSearchBrand(brand);
                    updateFiltersApi();
                  }}
                  isActive={searchFilters?.brands.some(
                    (s) => s.slug === brand.slug
                  )}
                />
              ))}
              <InfiniteScrollFiltersSearch
                term="brands"
                isActive={(item) => {
                  return searchFilters?.brands.some(
                    (s) => s.slug === item.slug
                  );
                }}
                onClick={(e) => {
                  Sendevent({
                    event: "button_clicked",
                    value: "add_filter_button",
                    extra: {
                      type: "brand",
                      name: e.name,
                    },
                  });
                  setSearchBrand(e);
                  updateFiltersApi();
                }}
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
              {partialLoading && <Spinner className="ml-3" no />}
            </div>
            <div className="brands-results-row flex-row overflow-auto">
              {searchResults?.categories?.map((category, index) => (
                <CategoryItem
                  category={category}
                  key={category?.slug}
                  onClick={(e) => {
                    Sendevent({
                      event: "button_clicked",
                      value: "add_filter_button",
                      extra: {
                        type: "category",
                        name: category.name,
                      },
                    });
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
                isActive={(item) => {
                  return searchFilters?.categories.some(
                    (s) => s.slug === item.slug
                  );
                }}
                onClick={(e) => {
                  Sendevent({
                    event: "button_clicked",
                    value: "add_filter_button",
                    extra: {
                      type: "category",
                      name: e.name,
                    },
                  });
                  setSearchCategory(e);
                  updateFiltersApi();
                }}
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
              {partialLoading && <Spinner className="ml-3" no />}
            </div>
            <div className="brands-results-row flex-row overflow-auto">
              {searchResults?.boutiques?.map((boutique, index) => (
                <BoutiqueItem
                  boutique={boutique}
                  key={boutique?.slug}
                  onClick={() => {
                    Sendevent({
                      event: "button_clicked",
                      value: "add_filter_button",
                      extra: {
                        type: "boutique",
                        name: boutique.name,
                      },
                    });
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
                onClick={(e) => {
                  Sendevent({
                    event: "button_clicked",
                    value: "add_filter_button",
                    extra: {
                      type: "boutique",
                      name: e.name,
                    },
                  });
                  setSearchBoutique(e);
                  updateFiltersApi();
                }}
                isActive={(item) => {
                  return searchFilters?.boutiques.some(
                    (s) => s.slug === item.slug
                  );
                }}
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
                data-cy="searchTotalProduct"
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
                data-cy="resetIcon"
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
