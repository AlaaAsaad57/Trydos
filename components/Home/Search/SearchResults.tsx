import React from "react";
import { useSelector } from "react-redux";
import ProductItem from "./Results/ProductItem";
import BrandItem from "./Results/BrandItem";
import CategoryItem from "./Results/CategoryItem";
import BoutiqueItem from "./Results/BoutiqueItem";
import { onClickSearchHistory } from "utils/functions";

function SearchResults() {
  const searchResults = useSelector((state: any) => state.Search.searchResults);
  const searchValue = useSelector((state: any) => state.Search.value);

  return (
    <div className="search-results-container flex-col">
      <div className="products-results flex-col">
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
        <div className="brands-results-row flex-row">
          {searchResults.brands.map((brand, index) => (
            <BrandItem brand={brand} key={index} />
          ))}
        </div>
      </div>
      <div className="products-results brand-results">
        <div className="result-label">Find Categories</div>
        <div className="brands-results-row flex-row">
          {searchResults.categories.map((category, index) => (
            <CategoryItem category={category} key={index} />
          ))}
        </div>
      </div>
      <div className="products-results brand-results">
        <div className="result-label">Find Boutiques</div>
        <div className="brands-results-row flex-row">
          {searchResults.boutiques.map((boutique, index) => (
            <BoutiqueItem boutique={boutique} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchResults;
