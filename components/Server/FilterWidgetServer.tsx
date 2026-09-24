import FiltersWindow from "components/ListingPage/filterComponents/FiltersWindow";

async function FilterWidgetServer({
  currencyPromise,
  filtersPromise,
  parsedFilters,
  country,
  language,
  isFeatured,
  isFlashDeal,
  serverSearch = "",
}) {
  let currency = await currencyPromise;
  let filtersData = await filtersPromise;

  return (
    <div>
      <FiltersWindow
        isFeatured={isFeatured}
        isFlashDeal={isFlashDeal}
        currency={currency}
        language={language}
        country={country}
        serverSearch={serverSearch}
        initialFilters={parsedFilters}
        // FiltersWindow consumes `children` as a structured map (categories/brands/…)
        // of raw data, not JSX children — passing it as a prop is intentional.
        // eslint-disable-next-line react/no-children-prop
        children={{
          categories: filtersData.categories ?? [],
          brands: filtersData.brands ?? [],
          colors: filtersData.colors ?? [],
          sizes: filtersData.attributes?.[0]?.options ?? [],
          prices: filtersData.prices,
        }}
      />
    </div>
  );
}

export default FilterWidgetServer;
