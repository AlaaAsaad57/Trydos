import FiltersWindow from "components/ListingPage/filterComponents/FiltersWindow";
import ImageCircel from "components/ListingPage/filterComponents/FiltersWindow/ImageCircel";
import FilterItem from "components/ListingPage/FilterItem";
import React from "react";
import { HandleIsActive, combineCategoriesWithRelated } from "utils/server";

async function FilterWidgetServer({
  currencyPromise,
  filtersPromise,
  parsedFilters,
  country,
  language,
  isFeatured,
  isFlashDeal,
}) {
  let currency = await currencyPromise;
  let filtersData = await filtersPromise;
  const combinedCategories = combineCategoriesWithRelated(
    filtersData?.categories || [],
    filtersData?.related_categories || [],
  );
  const isRtl = language === "ar" || language === "ku";
  const params = { lang: `${country}-${language}` };
  const baseUrlOfFiltersPage =
    isFeatured ? "/featured" : isFlashDeal ? "/flashDeals" : "/filters";
  return (
    <div>
      <FiltersWindow
        isFeatured={isFeatured}
        isFlashDeal={isFlashDeal}
        currency={currency}
        language={language}
        country={country}
        initialFilters={parsedFilters}
        children={{
          categories: combinedCategories.map((item) => (
            <FilterItem
              isRtl={isRtl}
              baseUrlOfFiltersPage={baseUrlOfFiltersPage}
              params={params}
              filterParams={parsedFilters}
              isUsingParsedFilters={true}
              key={item.id ?? item?.slug ?? item}
              currency={currency}
              term={"categories"}
              item={item}
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
