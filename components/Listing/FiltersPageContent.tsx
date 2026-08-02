import { redirect, unstable_rethrow } from "next/navigation";
import NotFoundRedirect from "components/global/NotFoundRedirect";
import { Suspense } from "react";
import "styles/listing-components.css";
import { fetchCurrency } from "serverRequests";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
import { LogServerError } from "utils/serverErrorReporter";
import { parseFiltersFromParams } from "utils/server/helpers";
import { dedupeRequest } from "serverRequests/requestDedup";
import ListingBoutiqueSlider from "components/Server/ListingBoutiqueSlider";
import FilterWidgetServer from "components/Server/FilterWidgetServer";
import ListingSearchContainer from "components/Server/ListingSearchContainer";
import FilterListContainer from "components/Server/FilterListContainer";
import ProductListConainer from "components/Server/ProductListConainer";
import { COOKIE_NAMES, getCookieServer } from "utils/cookies/cookie-manager";
import FilterListingBackButton from "components/Listing/FilterListingBackButton";
import ListingBarActions from "components/Server/ListingBarActions";
import ListingHeaderCollapse from "components/Listing/ListingHeaderCollapse";
import BoutiqueMiniLogo from "components/Listing/BoutiqueMiniLogo";
import ListingBarOptions from "components/Listing/ListingBarOptions";
import BoutiqueLogoCollapse from "components/Listing/BoutiqueLogoCollapse";
import ListingSkeleton from "components/skeleton/listing";
import BoutiqueSlidersSkeleton from "components/skeleton/loaders/BoutiqueSlidersSkeleton";

async function getBoutique(
  boutique: string | null,
  country: string,
  language: string,
) {
  const start = process.hrtime.bigint();
  try {
    if (boutique) {
      const reader = new ElasticsearchReader();
      const boutiqueData = await reader.getBoutiqueInfo({
        country,
        language,
        slug: boutique,
      });
      if (!boutiqueData?.banners) {
        // Reported, never thrown. A redirect() here was caught by this very
        // catch block, logged as "get boutique details error" and turned into an
        // empty "Search" listing — so the boutique-not-found redirect never
        // fired anywhere. The caller decides how to navigate.
        return { boutiqueNotFound: true, banners: null, name: "Search", time: 0 };
      }
      const end = process.hrtime.bigint();
      return { ...boutiqueData, time: Number(end - start) / 1_000_000 };
    }
    return { banners: null, name: "Search", time: 0 };
  } catch (error) {
    LogServerError(
      {
        error,
        type: "get boutique details error",
        country,
        language,
        boutique,
      },
      `/${country}-${language}/featured`,
    );
    return { banners: null, name: "Search" };
  }
}

async function getCurrencyForListing(country: string, language: string) {
  const start = process.hrtime.bigint();
  try {
    const cachedCurrency = await getCurrencyFromCache(country);

    if (typeof cachedCurrency === "string") {
      let end = process.hrtime.bigint();
      return {
        ...JSON.parse(cachedCurrency),
        redis: true,
        time: Number(end - start) / 1_000_000,
      };
    }
    if (cachedCurrency?.exchange_rate) {
      let end = process.hrtime.bigint();
      return {
        ...cachedCurrency,
        redis: true,
        time: Number(end - start) / 1_000_000,
      };
    }
    const currencyData = await fetchCurrency(language, country);
    const currency = { ...currencyData.data };
    StoreCurrency(country, currency);
    let end = process.hrtime.bigint();
    return {
      ...currency,
      redis: false,
      time: Number(end - start) / 1_000_000,
    };
  } catch {
    return undefined;
  }
}

interface FiltersPageContentProps {
  params: { lang: string; filters?: string[] };
  sort?: string;
  search?: string;
  /**
   * True when rendered from the `@modal/(.)filters` slot. Next isolates errors
   * thrown inside a parallel route slot, so `redirect()` there is serialized
   * into the RSC stream and never moves the browser — the slot has to navigate
   * from the client instead. See NotFoundRedirect.
   */
  intercepted?: boolean;
}

export default async function FiltersPageContent({
  params,
  sort,
  search,
  intercepted = false,
}: FiltersPageContentProps) {
  const Params = params;
  try {
    let parsedFilters = parseFiltersFromParams(Params.filters || []);
    const [country, language] = Params.lang.split("-");
    const boutiqueItem = parsedFilters?.boutiques?.[0] || null;
    const effectiveSearch =
      (typeof search === "string" && search.length > 0
        ? search
        : parsedFilters?.search_text?.[0]) ?? "";

    if (parsedFilters.prices) {
      parsedFilters = {
        ...parsedFilters,
        // Price cards encode the range as one dash token ("min-max"), but once a
        // numeric [min,max] array round-trips through buildParamsFromFilters (any
        // other filter click) it re-encodes comma-joined ("min,max") and re-parses
        // into two elements. Accept BOTH delimiters and keep every bound so the
        // range never collapses to [min,min] → empty results.
        prices: parsedFilters.prices
          .flatMap((s) => String(s).split("-"))
          .map((d) => Number(d))
          .filter((d) => !isNaN(d)),
      };
    }

    // Kick off the two fetches that don't depend on userId before awaiting the
    // cookie, so they overlap the cookie read instead of waiting behind it.
    const currencyPromise = getCurrencyForListing(country, language);
    const boutiquePromise = getBoutique(boutiqueItem, country, language);

    // Resolved before any JSX is returned. The promise is otherwise handed
    // un-awaited to the streamed children below, so a redirect raised once
    // those Suspense boundaries have flushed would never reach the browser.
    // Costs nothing on non-boutique (search) listings: getBoutique returns
    // immediately when there is no boutique slug.
    const boutiqueResolved: any = await boutiquePromise;
    if (boutiqueResolved?.boutiqueNotFound) {
      const target = `/${country}-${language}?message=boutique_not_found`;
      if (intercepted) return <NotFoundRedirect href={target} />;
      redirect(target);
    }

    const userData = await getCookieServer<{ id: string }>(
      COOKIE_NAMES.USER_DATA,
    );
    const parsedUserId = userData?.id ?? null;

    // Kick off the main ES query and hand un-awaited promises straight to the
    // Suspense-wrapped containers below (mirrors featured/[[...filters]]/page.tsx)
    // so the HTML shell can stream immediately instead of blocking on ES.
    //
    // Deduped per request: this page renders twice in one request (real page in
    // the `children` slot + the `(.)filters` copy in the `@modal` slot). Without
    // this, both fire the ES query and each opens a PIT — and on a hard load the
    // discarded modal copy leaks its unused PIT. The key covers everything that
    // makes the query unique so the two identical renders share one execution.
    const filtersDataPromise = dedupeRequest(
      `listing:${country}:${language}:${sort ?? ""}:${effectiveSearch}:${parsedUserId ?? ""}:${JSON.stringify(parsedFilters)}`,
      () =>
        getProductsAndFiltersFromElastic({
          country,
          language_code: language,
          filters: {
            ...parsedFilters,
            featured: false,
            flashdeal: false,
            search_text: effectiveSearch || undefined,
          },
          limit: 10,
          userId: parsedUserId,
          // User-facing listing sort (`?sort=`); undefined ⇒ relevance default.
          sort,
          // Open a PIT snapshot for this filter session (ADR-009); the returned
          // pit_id rides inside filtersData and is threaded to the infinite
          // scroll so every "load more" reads the same immutable snapshot.
          usePit: true,
        }),
    );

    const isRtl = language === "ar" || language === "ku";

    return (
      <>
        <Suspense fallback={<></>} key={`FilterWidget ${Params.lang}`}>
          <FilterWidgetServer
            isFeatured={false}
            isFlashDeal={false}
            currencyPromise={currencyPromise}
            language={language}
            country={country}
            parsedFilters={parsedFilters}
            filtersPromise={filtersDataPromise}
            serverSearch={effectiveSearch}
          />
        </Suspense>
        <ListingHeaderCollapse
          isRtl={isRtl}
          filterBar={
            <div
              data-cy="filter_listing_bar"
              className={`filter-listing-bar z-99999999 ${
                isRtl ? "flex-row-reverse flex" : "flex-row flex"
              } align-center left-0 right-0 mx-auto w-full h-[50px] pl-[15px] max-w-[1365px] pr-[20px] justify-between bg-white z-10`}
            >
              <div
                className={`align-center ${
                  isRtl ? "flex-row-reverse flex" : "flex-row flex"
                } items-center gap-[8px]`}
              >
                <FilterListingBackButton lang={Params.lang} isRtl={isRtl} />
                <BoutiqueLogoCollapse>
                  <Suspense fallback={<></>}>
                    <BoutiqueMiniLogo boutiquePromise={boutiquePromise} />
                  </Suspense>
                </BoutiqueLogoCollapse>
              </div>
              <ListingBarOptions serverSearch={effectiveSearch} isRtl={isRtl}>
                <Suspense fallback={<></>}>
                  <ListingSearchContainer
                    country={country}
                    language={language}
                    filtersPromise={filtersDataPromise}
                    parsedFilters={parsedFilters}
                    serverSearch={effectiveSearch}
                  />
                </Suspense>
                <ListingBarActions
                  filtersPromise={filtersDataPromise}
                  language={language}
                  isRtl={isRtl}
                />
              </ListingBarOptions>
            </div>
          }
          banner={
            parsedFilters?.boutiques?.[0] ? (
              <Suspense
                fallback={<BoutiqueSlidersSkeleton />}
                key={boutiqueItem || "noFilters"}
              >
                <ListingBoutiqueSlider
                  boutiquePromise={boutiquePromise}
                  key={boutiqueItem || "noFilters"}
                />
              </Suspense>
            ) : null
          }
          categoryFilters={
            <Suspense
              fallback={<ListingSkeleton justFilters />}
              key={`FilterList ${Params.lang}`}
            >
              <FilterListContainer
                filtersPromis={filtersDataPromise}
                currencyPromise={currencyPromise}
                Params={Params}
                parsedFilters={parsedFilters}
                serverSearch={effectiveSearch}
              />
            </Suspense>
          }
          productList={
            <Suspense
              fallback={<ListingSkeleton forProducts={true} />}
              key={`ProductList ${Params.lang} ${sort ?? "relevance"}`}
            >
              <ProductListConainer
                isFlashDeals={false}
                isFeatured={false}
                Params={Params}
                boutiquePromise={boutiquePromise}
                currencyPromise={currencyPromise}
                filtersDataPromise={filtersDataPromise}
                parsedFilters={parsedFilters}
                language={language}
                sort={sort}
                serverSearch={effectiveSearch}
              />
            </Suspense>
          }
        />
      </>
    );
  } catch (error) {
    // Let framework control-flow errors (the redirect above, notFound) through
    // untouched — otherwise a legitimate redirect is reported to Sentry as a
    // listing failure.
    unstable_rethrow(error);
    LogServerError(
      { error, filters: Params.filters },
      `/${Params.lang}/filters`,
    );
    throw error instanceof Error ? error : new Error(String(error));
  }
}
