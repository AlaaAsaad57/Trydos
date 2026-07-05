export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import NextLink from "components/global/NextLink";
import ListingSkeleton from "components/skeleton/listing";
import "styles/listing-components.css";
import { fetchCurrency } from "serverRequests";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import { LogServerError } from "utils/serverErrorReporter";
import { parseFiltersFromParams } from "utils/server";
import { generateMetadataForListing } from "serverRequests/meta/listing";

import FilterWidgetServer from "components/Server/FilterWidgetServer";
import ListingSearchContainer from "components/Server/ListingSearchContainer";
import FilterListContainer from "components/Server/FilterListContainer";
import ProductListConainer from "components/Server/ProductListConainer";
import ListingBarActions from "components/Server/ListingBarActions";
export const dynamicParams = true;
export async function generateMetadata({ params }) {
  let Params = await params;

  // Fetch your main product categories
  try {
    const metadata = await generateMetadataForListing({
      params,
      routeBase: "flashDeals",
    });

    return metadata;
  } catch (error) {
    LogServerError(
      { error, type: "get page meta error" },
      `/${Params.lang}/flashDeals`,
    );

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
      `/${country}-${language}/flashDeals`,
    );
  }
}
export default async function Page({ params, searchParams }) {
  let Params = await params;

  try {
    const sp = (await searchParams) ?? {};
    const sort = typeof sp.sort === "string" ? sp.sort : undefined;
    let parsedFilters = parseFiltersFromParams(Params.filters || []);
    const [country, language] = Params.lang.split("-");
    let boutiqueItem = parsedFilters?.boutiques?.[0] || null;

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
          featured: false,
          flashdeal: true,
          search_text: parsedFilters.search_text?.[0],
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
            currencyPromise={currency}
            language={language}
            isFeatured={false}
            isFlashDeal={true}
            country={country}
            parsedFilters={{
              ...parsedFilters,
              featured: false,
              flashdeal: true,
            }}
            filtersPromise={filtersData}
          />
        </Suspense>
        <div
          data-cy="filter_listing_bar"
          className={`filter-listing-bar z-99999999 relative ${
            isRtl ? "flex-row-reverse flex" : "flex-row flex"
          } align-center w-full left-0 right-0 mx-auto h-[50px] pl-[15px] pr-[20px] max-w-[1365px] justify-between bg-white z-10`}
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
          {/** TODO: classname edit when serach active w-full */}
          <div
            data-cy="filter_bar_options"
            className={`filter-bar-options w-[170px] justify-between ${
              isRtl ? "flex-row-reverse flex" : "flex-row flex"
            }  align-center ${
              parsedFilters?.search_text?.length > 0 && "w-full"
            }`}
          >
            <Suspense fallback={<></>}>
              <ListingSearchContainer
                country={country}
                language={language}
                flashdeal={true}
                filtersPromise={filtersData}
                parsedFilters={parsedFilters}
              />
            </Suspense>
            <ListingBarActions
              filtersPromise={filtersData}
              language={language}
              isRtl={isRtl}
            />
          </div>
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
            isFlashDeals={true}
            isFeatured={false}
            Params={Params}
            boutiquePromise={() => {}}
            currencyPromise={currency}
            filtersDataPromise={filtersData}
            parsedFilters={parsedFilters}
            language={language}
            sort={sort}
          />
        </Suspense>
      </>
    );
  } catch (error) {
    LogServerError(
      { error, filters: Params.filters },
      `/${Params.lang}/flashDeals`,
    );
    throw error instanceof Error ? error : new Error(String(error));
  }
}
