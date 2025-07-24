import "styles/listing.css";
import "styles/globals.css";
import React from "react";
import ProductsInfiniteScroll from "components/ListingPage/ProductInfiniteScroll";
import { getActiveFilters } from "./FilterList";
import { ProductListServerPropsType } from "models/componentType/boutiqueTypes/ProductListServerPropsType";
import ProductCard from "./ProductCard";

function ProductListServer({
  params,
  parsedFilters,
  products,
  currency,
  offset,
  colors,
  isFeatured = false,
  isFlashDeals = false,
}: ProductListServerPropsType) {
  const activeFilters = getActiveFilters(parsedFilters)?.colors || [];

  let activeColor = colors?.find(
    (s) => s === activeFilters[activeFilters.length - 1]
  );
  let language = params.lang.split("-")[1];
  return (
    <div
      className={"listing-container relative flex pb-[350px] max-w-[1310px]"}
    >
      {products.map((product, key) => {
        let color_name = product?.colors?.find(
          (s) => s.color === activeColor
        )?.name;
        let productColor = product?.sync_color_images?.find(
          (s) => s.color_name === color_name
        );

        return (
          <ProductCard
            language={language}
            product={product}
            params={params}
            currency={currency}
            productColor={productColor}
            key={key}
          />
        );
      })}
      <ProductsInfiniteScroll
        analyticsData={{
          items: products?.map((s) => ({
            item_id: s.slug,
            item_name: s.name,
            category: s.category?.name,
            brand: s.brand?.name,
          })),
        }}
        productIds={products.map((s) => s.slug)}
        activeColor={activeColor}
        currency={currency}
        offset={offset}
        isFeatured={isFeatured}
        isFlashDeals={isFlashDeals}
      />
    </div>
  );
}

export default ProductListServer;
