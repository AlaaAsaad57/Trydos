export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import NextLink from "components/global/NextLink";
import ListingSkeleton from "components/skeleton/listing";
import "styles/listing-components.css";
import ListingBarActions from "components/Server/ListingBarActions";
import { fetchCurrency } from "serverRequests";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import { LogServerError } from "utils/serverErrorReporter";
import { parseFiltersFromParams } from "utils/server";
import { generateMetadataForListing } from "serverRequests/meta/listing";
import { permanentRedirect } from "next/navigation";
import { buildSearchRedirectTarget } from "utils/listing/searchPathRedirect";
import FilterWidgetServer from "components/Server/FilterWidgetServer";
import ListingSearchContainer from "components/Server/ListingSearchContainer";
import FilterListContainer from "components/Server/FilterListContainer";
import ProductListConainer from "components/Server/ProductListConainer";
import ListingBarOptions from "components/Listing/ListingBarOptions";
export const dynamicParams = true;
export async function generateMetadata({ params }) {
  let Params = await params;
  // Fetch your main product categories
  try {
    const metadata = await generateMetadataForListing({
      params,
      routeBase: "featured",
    });

    return metadata;
  } catch (error) {
    LogServerError(error, `/${Params.lang}/featured`);
    return [];
  }
}

async function getCurrency(country, language) {
  try {
    let cachedCurrency = await getCurrencyFromCache(country);

    if (typeof cachedCurrency === "string") {
      return { ...JSON.parse(cachedCurrency), redis: true };
    }
    if (cachedCurrency?.exchange_rate) {
      return { ...cachedCurrency, redis: true };
    } else {
      let currencyData = await fetchCurrency(language, country);
      let currency = { ...currencyData.data };
      StoreCurrency(country, currency);
      return { ...currency, redis: false };
    }
  } catch (error) {
    LogServerError(
      { error, type: "get currency error", country, language },
      `/${country}-${language}/featured`,
    );
  }
}
export default async function Page({ params, searchParams }) {
  let Params = await params;
  const sp = (await searchParams) ?? {};

  const legacy = buildSearchRedirectTarget(
    Params.lang,
    "featured",
    Params.filters,
    sp,
  );
  if (legacy) permanentRedirect(legacy);

  try {
    const sort = typeof sp.sort === "string" ? sp.sort : undefined;
    const search = typeof sp.search === "string" ? sp.search : undefined;
    let parsedFilters = parseFiltersFromParams(Params.filters || []);
    const [country, language] = Params.lang.split("-");
    let boutiqueItem = parsedFilters?.boutiques?.[0] || null;
    const effectiveSearch =
      (search && search.length > 0
        ? search
        : parsedFilters.search_text?.[0]) ?? "";

    if (parsedFilters.prices) {
      parsedFilters = {
        ...parsedFilters,
        prices: parsedFilters.prices?.map((s) =>
          s.split("-").map((d) => Number(d)),
        )?.[0],
      };
    }

    let [filtersData, currency] = [
      getProductsAndFiltersFromElastic({
        country,
        language_code: language,
        filters: {
          ...parsedFilters,
          // priceRange:parsedFilters.prices?.map((s)=>s.split('-').map((d)=>Number(d))),
          featured: true,
          flashdeal: false,
          search_text: effectiveSearch || undefined,
        },
        limit: 10,
        sort,
      }),
      getCurrency(country, language),
    ];

    const isRtl = language === "ar" || language === "ku";

    return (
      <>
        <Suspense fallback={<></>} key={`FilterWidget ${Params.lang}`}>
          <FilterWidgetServer
            isFeatured={true}
            isFlashDeal={false}
            currencyPromise={currency}
            language={language}
            country={country}
            parsedFilters={{
              ...parsedFilters,
              featured: true,
              flashdeal: false,
            }}
            filtersPromise={filtersData}
          />
        </Suspense>
        <div
          data-cy="filter_listing_bar"
          className={`filter-listing-bar z-99999999 relative ${
            isRtl ? "flex-row-reverse flex" : "flex-row flex"
          } align-center w-full h-[50px] pl-[15px] left-0 right-0 mx-auto pr-[20px] max-w-[1365px] justify-between bg-white z-10`}
        >
          <NextLink
            data-cy="BackIcon_boutique"
            ignoreConditionCase={true}
            data={{
              is_full_home: true,
            }}
            href={`/${Params.lang}`}
            ariaLabel={`TryDos Home ${Params.lang}`}
            className="back-icon"
          >
            <img
              src="/icons/backIcon.svg"
              data-cy="back_icon_boutique_page"
              className={`${isRtl && "rotate-180"}`}
            />
          </NextLink>
          <ListingBarOptions serverSearch={effectiveSearch} isRtl={isRtl}>
            <Suspense fallback={<></>}>
              <ListingSearchContainer
                country={country}
                language={language}
                featured={true}
                filtersPromise={filtersData}
                parsedFilters={parsedFilters}
                serverSearch={effectiveSearch}
              />
            </Suspense>
            <ListingBarActions
              filtersPromise={filtersData}
              language={language}
              isRtl={isRtl}
            />
          </ListingBarOptions>
        </div>

        <div
          data-cy="boutique_header"
          className={`boutique-header ${"flex-col"} align-center`}
        >
          <Suspense
            fallback={<ListingSkeleton justFilters />}
            key={`FilterList ${Params.lang}`}
          >
            <FilterListContainer
              filtersPromis={filtersData}
              currencyPromise={currency}
              Params={Params}
              parsedFilters={parsedFilters}
            />
          </Suspense>
        </div>
        <Suspense
          fallback={<ListingSkeleton forProducts={true} />}
          key={`ProductList ${Params.lang} ${sort ?? "relevance"}`}
        >
          <ProductListConainer
            isFlashDeals={false}
            isFeatured={true}
            Params={Params}
            boutiquePromise={() => {}}
            currencyPromise={currency}
            filtersDataPromise={filtersData}
            parsedFilters={parsedFilters}
            language={language}
            sort={sort}
            serverSearch={effectiveSearch}
          />
        </Suspense>
      </>
    );
  } catch (error) {
    LogServerError(
      { error, filters: Params.filters },
      `/${Params.lang}/featured`,
    );
    throw error instanceof Error ? error : new Error(String(error));
  }
}
