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
import Skeleton from "react-loading-skeleton";
function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchResults = useSelector((state: any) => state.Search.searchResults);
  const loadingSearch = useSelector((state: any) => state.Search.loading);
  const searchFilters = useSelector((state: any) => state.Search.searchFilters);
  const searchValue = useSelector((state: any) => state.Search.searchValue);
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
    dispatch({ type: "SEARCH-LOADING", payload: true });
    home.UpdateFilters({
      search_text: searchValue || "",
      callback: (e) => {
        dispatch({ type: "EDIT-FILTER-SEARCH", payload: e });
      },
    });
  };
  const updateFiltersApi = () => {
    dispatch({ type: "SEARCH-LOADING", payload: true });
    home.UpdateFilters({
      search_text: searchValue || "",
      callback: (e) => {
        dispatch({ type: "EDIT-FILTER-SEARCH", payload: e });
      },
    });
  };
  return (
    <div className="search-results-container flex-col">
      {loadingSearch ? (
        <>
          <div className="products-results flex-col max-h-[60%] overflow-auto">
            <div className="result-label">Find Products</div>
            {[1, 1, 1].map((product, index) => {
              return (
                <div className="result-product flex-row">
                  <div className="image-result">
                    <Skeleton width={50} height={50} borderRadius={15} />
                  </div>
                  <div className="result-product-text">
                    <Skeleton />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="products-results brand-results">
            <div className="result-label">Find Brands</div>
            <div className="brands-results-row flex-row overflow-hidden">
              {[1, 1, 1].map((brand, index) => (
                <div className="brand-item min-w-[81px] p-0 relative ml-2 ">
                  <Skeleton
                    height={30}
                    width={80}
                    className="h-full max-h-[30px]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="products-results brand-results">
            <div className="result-label">Find Categories</div>
            <div className="brands-results-row flex-row overflow-hidden">
              {[1, 1, 1].map((category, index) => (
                <div className="brand-item min-w-[81px] p-0 relative ml-2 ">
                  <Skeleton
                    height={30}
                    width={80}
                    className="h-full max-h-[30px]"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="products-results brand-results">
            <div className="result-label">Find Boutiques</div>
            <div className="brands-results-row flex-row overflow-hidden">
              {[1, 11, 1].map((boutique, index) => (
                <div className="brand-item min-w-[81px] p-0 relative ml-2 ">
                  <Skeleton
                    height={30}
                    width={80}
                    className="h-full max-h-[30px]"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex-row w-full mt-3">
            <Skeleton className="w-full h-10 p-2 cursor-pointer flex  text-[#fff] justify-center items-center rounded-xl" />

            <Skeleton className="w-full h-10 ml-4 cursor-pointer p-2 flex  text-[#ff5549] justify-center items-center rounded-xl" />
          </div>
        </>
      ) : (
        <>
          <div className="products-results flex-col max-h-[60%] overflow-auto">
            <div className="result-label">Find Products</div>
            {searchResults.products.map((product, index) => {
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
            <div className="result-label">Find Brands</div>
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
            <div className="result-label">Find Categories</div>
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
            <div className="result-label">Find Boutiques</div>
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
          <div className="flex-row w-full mt-3">
            <div
              className="w-full h-10 p-2 cursor-pointer flex bg-[#ff5549] text-[#fff] justify-center items-center rounded-xl"
              onClick={() => apply()}
            >
              Apply
            </div>
            <div
              className="w-full h-10 ml-4 cursor-pointer p-2 flex bg-[#f8f8f8] text-[#ff5549] justify-center items-center rounded-xl"
              onClick={() => reset()}
            >
              Reset
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SearchResults;
