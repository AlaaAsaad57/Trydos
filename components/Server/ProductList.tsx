import "styles/listing.css";
import "styles/globals.css";

import React, { Suspense } from "react";
import { RoundPrice } from "utils/functions";
import ProductsInfiniteScroll from "components/ListingPage/ProductInfiniteScroll";

import { getActiveFilters } from "./FilterList";

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
}: {
  params: any;
  parsedFilters: Record<string, string[]>;
  products: any;
  currency: any;
  offset: any;
  colors: any;
  isFeatured?: boolean;
  isFlashDeals?: boolean;
}) {
  const activeFilters = getActiveFilters(parsedFilters)?.colors || [];

  let activeColor = colors?.find(
    (s) => s === activeFilters[activeFilters.length - 1]
  );

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
            product={product}
            params={params}
            currency={currency}
            productColor={productColor}
            key={key}
          />
        );
      })}
      <ProductsInfiniteScroll
        productIds={products.map((s) => s.slug)}
        activeColor={activeColor}
        currency={currency}
        offset={offset}
        parsedFilters={parsedFilters}
        boutiqueId={params.boutiqueId}
        isFeatured={isFeatured}
        isFlashDeals={isFlashDeals}
      />
    </div>
  );
}

export default ProductListServer;
