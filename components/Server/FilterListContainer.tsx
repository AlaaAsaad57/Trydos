import ListingSkeleton from "components/skeleton/listing";
import { Suspense } from "react";
import FilterList from "./FilterList";
import { combineCategoriesWithRelated } from "utils/server";

async function FilterListContainer({
  filtersPromis,
  Params,
  parsedFilters,
  currencyPromise,
}) {
  let [filtersData, currency] = await Promise.all([
    filtersPromis,
    currencyPromise,
  ]);
  if (filtersData?.applied?.colors?.length) {
    parsedFilters.colors = [
      ...new Set(
        [
          ...(parsedFilters?.colors || []),
          ...(filtersData?.applied?.colors || []),
        ].map((s) => s),
      ),
    ];
  }
  if (filtersData?.applied?.sizes) {
    parsedFilters.sizes = [
      ...new Set(
        [
          ...(parsedFilters?.sizes || []),
          ...(filtersData?.applied?.sizes || []),
        ].map((s) => s),
      ),
    ];
  }
  if (filtersData?.applied?.search_text || parsedFilters?.search_text)
    parsedFilters.search =
      (filtersData?.applied?.search_text && [
        filtersData?.applied?.search_text,
      ]) ??
      (parsedFilters?.search_text && [parsedFilters?.search_text]) ??
      null;
  if (parsedFilters?.related_categories?.length) {
    parsedFilters.categories = Array.from(
      new Set([
        ...(parsedFilters.categories || []),
        ...parsedFilters.related_categories,
      ]),
    );
    delete parsedFilters.related_categories;
  }
  const combinedCategories = combineCategoriesWithRelated(
    filtersData?.categories || [],
    filtersData?.related_categories || [],
  );
  let filters = {
    categories: combinedCategories || [],
    brands: filtersData?.brands || [],
    colors: filtersData?.colors || [],
    prices: filtersData?.prices?.priceRanges || [],
    sizes: filtersData?.attributes?.[0]?.options || [],
    boutiques: filtersData?.boutiques || [],
    search_text: parsedFilters?.search_text?.[0] || null,
  };

  return (
    <Suspense fallback={<ListingSkeleton justFilters={true} />}>
      {
        <FilterList
          filters={filters}
          itemsLength={filtersData.products?.length}
          currency={currency}
          key={`filter-list-filters`}
          params={Params}
          parsedFilters={parsedFilters}
        />
      }
    </Suspense>
  );
}

export default FilterListContainer;
