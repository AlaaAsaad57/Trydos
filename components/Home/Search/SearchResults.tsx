import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ProductItem from "./Results/ProductItem";
import BrandItem from "./Results/BrandItem";
import CategoryItem from "./Results/CategoryItem";
import BoutiqueItem from "./Results/BoutiqueItem";
import { onClickSearchHistory } from "utils/functions";
import { useSearchParams, useRouter } from "next/navigation";
import { dispatchRouteChangeEvent } from "Hooks/events";
import home from "services/home";
import Spinner from "components/global/Spinner";
import Skeleton from "react-loading-skeleton";
function SearchResults() {
  const loading = useSelector((state: any) => state.Search.partialLoading);
  const setLoading = (e) => {
    dispatch({ type: "SEARCH-PARTIAL-LOADING", payload: e });
  };
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchResults = useSelector((state: any) => state.Search.searchResults);
  const totalProducts = useSelector((state: any) => state.Search.totalProducts);
  const loadingSearch = useSelector((state: any) => state.Search.loading);
  const searchFilters = useSelector((state: any) => state.Search.searchFilters);
  const searchValue = useSelector((state: any) => state.Search.value);
  const dispatch = useDispatch();
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
    if (searchValue) params.set("searchText", searchValue);
    router.push(`/boutiques/listing?${params.toString()}`);
  };
  const apply = () => {
    onClickSearchHistory(searchValue || "");
    handleSearch(searchFilters);
    dispatchRouteChangeEvent("start", { to: "boutique" });
    document.documentElement.style.overflow = "hidden";
    document.documentElement.scrollTop = 0;
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
  }, []);
  const reset = () => {
    dispatch({ type: "RESET-SEARCH-FILTER" });

    home.UpdateFilters({
      search_text: searchValue || "",
      callback: (e) => {
        dispatch({ type: "EDIT-FILTER-SEARCH", payload: e });
      },
    });
  };
  const updateFiltersApi = () => {
    setLoading(true);

    home.UpdateFilters({
      search_text: searchValue || "",
      callback: (e) => {
        setLoading(false);
        dispatch({ type: "EDIT-FILTER-SEARCH", payload: e });
      },
    });
  };
  const showButton = () => {
    if (
      (searchFilters.categories.length > 0 ||
        searchFilters.brands.length > 0 ||
        searchFilters.boutiques.length > 0 ||
        searchValue.length > 0) &&
      totalProducts > 0
    )
      return true;
    else return false;
  };
  return (
    <div className="search-results-container flex-col">
      <>
        <div className="products-results flex-col max-h-[60%] overflow-auto">
          <div className="result-label flex-row">
            Find Products {loadingSearch && <Spinner className="ml-3" no />}
          </div>
          {searchValue?.length > 0 &&
            searchResults.products.map((product, index) => {
              return (
                <ProductItem
                  product={product}
                  key={index}
                  onClick={(e) => onClickSearchHistory(e)}
                />
              );
            })}
        </div>
        <div className="products-results brand-results">
          <div className="result-label flex-row">
            Find Brands {loading && <Spinner className="ml-3" no />}
          </div>
          <div className="brands-results-row flex-row overflow-hidden">
            {searchResults.brands.map((brand, index) => (
              <BrandItem
                brand={brand}
                key={index}
                onClick={() => {
                  dispatch({ type: "SEARCH-BRAND", payload: brand.slug });
                  updateFiltersApi();
                }}
                isActive={searchFilters.brands.some(
                  (s) => s.slug === brand.slug
                )}
              />
            ))}
          </div>
        </div>

        <div className="products-results brand-results">
          <div className="result-label flex-row">
            Find Categories {loading && <Spinner className="ml-3" no />}
          </div>
          <div className="brands-results-row flex-row overflow-hidden">
            {searchResults.categories.map((category, index) => (
              <CategoryItem
                category={category}
                key={index}
                onClick={() => {
                  dispatch({
                    type: "SEARCH-CATEGORY",
                    payload: category.slug,
                  });
                  updateFiltersApi();
                }}
                isActive={searchFilters.categories.some(
                  (s) => s.slug === category.slug
                )}
              />
            ))}
          </div>
        </div>
        <div className="products-results brand-results">
          <div className="result-label flex-row">
            Find Boutiques {loading && <Spinner className="ml-3" no />}
          </div>
          <div className="brands-results-row flex-row overflow-hidden">
            {searchResults.boutiques.map((boutique, index) => (
              <BoutiqueItem
                boutique={boutique}
                key={index}
                onClick={() => {
                  dispatch({
                    type: "SEARCH-BOUTIQUE",
                    payload: boutique.slug,
                  });
                  updateFiltersApi();
                }}
                isActive={searchFilters.boutiques.some(
                  (s) => s.slug === boutique.slug
                )}
              />
            ))}
          </div>
        </div>
        {showButton() && (
          <div className="flex-row w-full mt-3">
            <div
              className="w-full h-10 p-2 cursor-pointer flex bg-[#ff5549] text-[#fff] justify-center items-center rounded-xl"
              onClick={() => apply()}
            >
              Search{" "}
              {loading ? (
                <span className="ml-2">
                  <Spinner className="" />
                </span>
              ) : (
                <>
                  {totalProducts !== null && (
                    <span className="text-[#fafafa] regular ml-2">
                      (Total Products: {totalProducts})
                    </span>
                  )}
                </>
              )}
            </div>
            <div
              className="w-16 h-10 ml-4 cursor-pointer p-2 flex bg-[#f8f8f8] text-[#ff5549] justify-center items-center rounded-xl"
              onClick={() => reset()}
            >
              Reset
            </div>
          </div>
        )}
      </>
    </div>
  );
}

export default SearchResults;
