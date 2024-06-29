import React from "react";
import { useSelector } from "react-redux";
import ProductItem from "./Results/ProductItem";
import BrandItem from "./Results/BrandItem";
import CategoryItem from "./Results/CategoryItem";
import BoutiqueItem from "./Results/BoutiqueItem";

function SearchResults() {
  const searchResults = useSelector((state: any) => state.Search.searchResults);
  return (
    <div className="search-results-container flex-col">
      <div className="products-results flex-col">
        <div className="result-label">Find Products</div>
        {searchResults.products.map((product) => {
          return <ProductItem product={product} />;
        })}
      </div>
      <div className="products-results brand-results">
        <div className="result-label">Find Brands</div>
        <div className="brands-results-row flex-row">
          {searchResults.brands.map((brand) => (
            <BrandItem brand={brand} />
          ))}
        </div>
      </div>
      <div className="products-results brand-results">
        <div className="result-label">Find Categories</div>
        <div className="brands-results-row flex-row">
          {searchResults.categories.map((category) => (
            <CategoryItem category={category} />
          ))}
        </div>
      </div>
      <div className="products-results brand-results">
        <div className="result-label">Find Boutiques</div>
        <div className="brands-results-row flex-row">
          {searchResults.categories.map((boutique) => (
            <BoutiqueItem boutique={boutique} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchResults;
