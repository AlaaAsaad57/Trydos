import ListingSkeleton from "components/skeleton/listing";
import React, { Suspense } from "react";
import ProductListServer from "./ProductList";
import { getCookieServer } from "utils/cookies/cookie-manager";
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
    search_text:
      filtersData?.isAnalyzed?.name ?? parsedFilters?.search_text?.[0],
  };
  let { path, title } = getTitleAndTargetofListing({
    filters: parsedFilters,
    filtersData: filtersData,
    language: language,
  });

  return (
    <Suspense
      key={`Suspense-product-list-${JSON.stringify(parsedFilters)}`}
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
        key={`product-list-${JSON.stringify(parsedFilters)}`}
        parsedFilters={parsedFiltersVar}
        params={Params}
        isFeatured={isFeatured}
        isFlashDeals={isFlashDeals}
        target={path}
        title={title}
      />
    </Suspense>
  );
}

export default ProductListConainer;
