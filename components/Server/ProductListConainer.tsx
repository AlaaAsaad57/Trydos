import ListingSkeleton from "components/skeleton/listing";
import { Suspense } from "react";
import ProductListServer from "./ProductList";
import { getCookieServer } from "utils/cookies/server-cookie-manager";
import { getTitleAndTargetofListing } from "serverRequests/meta/StructuredData/utils";
import ListingBreadcrumbList from "serverRequests/meta/StructuredData/ListingBreadcrumbList";
import ClientLogger from "components/global/ClientLogger";
import { normalizeListingProduct } from "utils/listing/normalizeListingProduct";

async function ProductListConainer({
  currencyPromise,
  filtersDataPromise,
  boutiquePromise,
  parsedFilters,
  Params,
  isFlashDeals = false,
  isFeatured = false,
  language,
  sort = undefined,
  serverSearch = "",
}) {
  let [filtersData, currency, boutique] = await Promise.all([
    filtersDataPromise,
    currencyPromise,
    boutiquePromise,
  ]);
  const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
  let productsData = filtersData.products.map((product) =>
    normalizeListingProduct(product, redeemed_ids),
  );
  let parsedFiltersVar = {
    ...parsedFilters,
    // search_text drives client pagination (GetProducts page 2+) and sort/search
    // refetches. Prefer the analyzed name so multi-word queries stay consistent
    // across pages; fall back to the raw ?search= (serverSearch) so SINGLE-word
    // queries — which skip LLM analysis — and analysis failures still keep the
    // search on later pages instead of paging the whole category unscoped. Path
    // search_text is the last resort (empty since search moved to ?search=).
    search_text:
      filtersData?.isAnalyzed?.name ||
      serverSearch ||
      parsedFilters?.search_text?.[0],
  };
  let { path, title } = getTitleAndTargetofListing({
    filters: parsedFilters,
    filtersData: filtersData,
    language: language,
  });

  return (
    <Suspense
      key={`Suspense-product-list-${JSON.stringify(parsedFilters)}-${sort ?? "relevance"}`}
      fallback={<ListingSkeleton forProducts={true} />}
    >
      <ClientLogger
        value={{
          elasticMainQueryTime: filtersData.time,
          currencyTime: { time: currency.time, redis: currency.redis },
          source: "ProductListContainer",
        }}
      />
      <ListingBreadcrumbList
        currency={currency}
        local={Params.lang}
        products={productsData}
        target={path}
        title={title}
      />
      <ProductListServer
        recomended_offset={filtersData?.recommended_offset}
        boutique={boutique?.name}
        products={productsData ?? []}
        offset={filtersData?.offset}
        pit_id={filtersData?.pit_id ?? null}
        currency={currency}
        key={`product-list-${JSON.stringify(parsedFilters)}-${sort ?? "relevance"}`}
        parsedFilters={parsedFiltersVar}
        params={Params}
        isFeatured={isFeatured}
        isFlashDeals={isFlashDeals}
        sort={sort}
        serverSearch={serverSearch}
        target={path}
        title={title}
      />
    </Suspense>
  );
}

export default ProductListConainer;
