import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ProductItem from "./Results/ProductItem";
import BrandItem from "./Results/BrandItem";
import CategoryItem from "./Results/CategoryItem";
import BoutiqueItem from "./Results/BoutiqueItem";
import { onClickSearchHistory } from "utils/functions";
import { useSearchParams, useRouter } from "next/navigation";

function SearchResults() {
  const searchResults = useSelector((state: any) => state.Search.searchResults);
  const searchFilters = useSelector((state: any) => state.Search.searchFilters);
  const dispatch = useDispatch();

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

  return (
    <div className="search-results-container flex-col">
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
              onClick={() =>
                dispatch({ type: "SEARCH-BRAND", payload: brand.slug })
              }
              isActive={searchFilters.brands.some((s) => s.slug === brand.slug)}
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
              onClick={() =>
                dispatch({ type: "SEARCH-CATEGORY", payload: category.slug })
              }
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
              onClick={() =>
                dispatch({ type: "SEARCH-BOUTIQUE", payload: boutique.slug })
              }
              isActive={searchFilters.boutiques.some(
                (s) => s.slug === boutique.slug
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchResults;
