import ListingSkeleton from "components/skeleton/listing";
import { Suspense } from "react";
import FilterListReactive from "./FilterListReactive";
import ClientLogger from "components/global/ClientLogger";

async function FilterListContainer({
  filtersPromis,
  Params,
  parsedFilters,
  currencyPromise,
  serverSearch = "",
  isFeatured = false,
  isFlashDeals = false,
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
  // Do not merge related_categories into categories
  let filters = {
    categories: filtersData?.categories || [],
    brands: filtersData?.brands || [],
    colors: filtersData?.colors || [],
    prices: filtersData?.prices?.priceRanges || [],
    sizes: filtersData?.attributes?.[0]?.options || [],
    boutiques: filtersData?.boutiques || [],
    search_text: parsedFilters?.search_text?.[0] || null,
    related_categories: filtersData?.related_categories || [],
  };

  return (
    <Suspense fallback={<ListingSkeleton justFilters={true} />}>
      <ClientLogger
        value={{
          elasticMainQueryTime: filtersData.time,
          currencyTime: { time: currency.time, redis: currency.redis },
          source: "FilterList",
        }}
      />
      {
        <FilterListReactive
          serverFilters={filters}
          serverSearch={serverSearch}
          itemsLength={filtersData.products?.length ?? 0}
          currency={currency}
          key={`filter-list-filters`}
          params={Params}
          parsedFilters={parsedFilters}
          isFeatured={isFeatured}
          isFlashDeals={isFlashDeals}
        />
      }
    </Suspense>
  );
}

export default FilterListContainer;
