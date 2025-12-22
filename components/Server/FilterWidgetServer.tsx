import FiltersWindow from "components/ListingPage/filterComponents/FiltersWindow";
import ImageCircel from "components/ListingPage/filterComponents/FiltersWindow/ImageCircel";
import React from "react";
import { HandleIsActive } from "utils/server";

async function FilterWidgetServer({
  currencyPromise,
  filtersPromise,
  parsedFilters,
  country,
  language,
}) {
  let currency = await currencyPromise;
  let filtersData = await filtersPromise;
  return (
    <div>
      <FiltersWindow
        currency={currency}
        language={language}
        country={country}
        initialFilters={parsedFilters}
        children={{
          categories: filtersData.categories.map((category) => (
            <ImageCircel
              key={category.slug}
              isActive={HandleIsActive({
                values: parsedFilters.categories,
                item: category.slug,
              })}
              name={category.name}
              term={"Category"}
              value={category.slug}
              image={category.most_viewed_product_thumbnail}
              size={70}
            />
          )),
          brands: filtersData.brands.map((brand) => (
            <ImageCircel
              key={brand.slug}
              isActive={HandleIsActive({
                values: parsedFilters.brands,
                item: brand.slug,
              })}
              name={brand.name}
              term={"Brand"}
              value={brand.slug}
              image={brand.icon}
              size={70}
            />
          )),
          colors: filtersData.colors.map((color) => (
            <ImageCircel
              key={color}
              isActive={HandleIsActive({
                values: parsedFilters?.colors?.map((s) => s?.replace("#", "")),
                item: color.replace("#", ""),
              })}
              name={color}
              color={color}
              term={"Color"}
              value={color}
              size={70}
            />
          )),
          sizes: filtersData.attributes?.[0]?.options?.map((size) => (
            <ImageCircel
              key={size}
              isActive={HandleIsActive({
                values: parsedFilters.sizes,
                item: size,
              })}
              name={size}
              term={"Size"}
              value={size}
              size={70}
            />
          )),
          prices: filtersData.prices,
        }}
      />
    </div>
  );
}

export default FilterWidgetServer;
