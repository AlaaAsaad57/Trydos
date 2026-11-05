import { redirect, unstable_rethrow } from "next/navigation";
import NotFoundRedirect from "components/global/NotFoundRedirect";
import { Suspense } from "react";
import "styles/listing-components.css";
import { fetchCurrency } from "serverRequests";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import { qaMode } from "utils/server/qaMode";
import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
import { LogServerError } from "utils/serverErrorReporter";
import { GetImageUrl, parseFiltersFromParams } from "utils/server/helpers";
import { translateFunction } from "utils/server";
import { dedupeRequest } from "serverRequests/requestDedup";
import FilterWidgetServer from "components/Server/FilterWidgetServer";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { getCookieServer } from "utils/cookies/server-cookie-manager";
import { getTitleAndTargetofListing } from "serverRequests/meta/StructuredData/utils";
import ListingBreadcrumbList from "serverRequests/meta/StructuredData/ListingBreadcrumbList";
import { normalizeListingProduct } from "utils/listing/normalizeListingProduct";
import ListingEmpty from "components/Listing/ListingEmpty";
import ListingPageSkeleton from "components/Listing/ListingPageSkeleton";
import AppListing, {
  type ListingKind,
} from "components/DemoApp1/screens/AppListing";
import type { DemoDictionary, DemoKey } from "components/DemoApp/demoKeys";
import type { ListingMark } from "components/DemoApp1/listingData";

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
        qaView: await qaMode(),
      });
      if (!boutiqueData?.banners) {
        // Reported, never thrown. A redirect() here was caught by this very
        // catch block, logged as "get boutique details error" and turned into an
        // empty "Search" listing — so the boutique-not-found redirect never
        // fired anywhere. The caller decides how to navigate.
        return {
          boutiqueNotFound: true,
          banners: null,
          name: "Search",
          time: 0,
        };
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
  } catch (error) {
    // The page goes on with no currency, but the failure is reported, as the
    // flash and featured pages did before they shared this read.
    LogServerError(
      { error, type: "get currency error", country, language },
      `/${country}-${language}/listing`,
    );
    return undefined;
  }
}

/**
 * The design keys the store page shows (Stage 7b). Here, not in the client
 * file: a server file that imports a value from a "use client" file gets a
 * reference, not the list.
 */
const LISTING_KEYS: DemoKey[] = [
  "Back",
  "Search",
  "Search...",
  "Close",
  "Sort",
  "Filter",
  "Share",
  "Colors",
  "Photo",
  "{n} of {m}",
  "Flash Deal",
  "{n}d",
  "{count} item {size} in your bag",
  "Add to cart",
  "Soon available",
  "Loading more products",
  "You have seen all products",
  "Shop {brand} collection now !",
];

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
  /** Which listing: `/filters` (the default), `/flashDeals` or `/featured`. */
  kind?: ListingKind;
}

/**
 * Every product listing (Stage 7b, A-32): `/filters/...` (boutiques,
 * categories, brands, filters, search results), its `@modal` copy,
 * `/flashDeals/...` and `/featured/...`. It reads the boutique, the currency
 * and the first page from Elasticsearch, and the store page design draws
 * them (AppListing). The old filter sheet stays (A-4, S7b-7).
 */
export default async function FiltersPageContent({
  params,
  sort,
  search,
  intercepted = false,
  kind = "filters",
}: FiltersPageContentProps) {
  const Params = params;
  try {
    let parsedFilters = parseFiltersFromParams(Params.filters || []);
    const [country, language] = Params.lang.split("-");
    const isFeatured = kind === "featured";
    const isFlashDeals = kind === "flashDeals";
    // Only the `/filters` listing shows a boutique (its banner and its logo).
    const boutiqueItem =
      kind === "filters" ? parsedFilters?.boutiques?.[0] || null : null;
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

    // Start the two reads that do not need the shopper before the cookie read.
    const currencyPromise = getCurrencyForListing(country, language);
    const boutiquePromise = getBoutique(boutiqueItem, country, language);

    // Resolved before any JSX is returned. The page holds this in <Suspense>, so
    // a missing boutique leaves through Next's meta tag, not a status code.
    const boutiqueResolved: any = await boutiquePromise;
    if (boutiqueResolved?.boutiqueNotFound) {
      const target = `/${country}-${language}?message=boutique_not_found`;
      if (intercepted) return <NotFoundRedirect href={target} />;
      redirect(target);
    }

    // The `/filters` listing reads with the shopper's id and a snapshot
    // (ADR-009), as before; the flash and featured listings did not.
    const userData =
      kind === "filters"
        ? await getCookieServer<{ id: string }>(COOKIE_NAMES.USER_DATA)
        : null;
    const parsedUserId = userData?.id ?? null;

    // Deduped per request: the `/filters` page renders twice in one request
    // (the page, and its `@modal` copy). Without this, both read
    // Elasticsearch, and each opens a snapshot (PIT).
    const filtersDataPromise = dedupeRequest(
      `listing:${kind}:${country}:${language}:${sort ?? ""}:${effectiveSearch}:${parsedUserId ?? ""}:${JSON.stringify(parsedFilters)}`,
      () =>
        getProductsAndFiltersFromElastic({
          country,
          language_code: language,
          filters: {
            ...parsedFilters,
            featured: isFeatured,
            flashdeal: isFlashDeals,
            search_text: effectiveSearch || undefined,
          },
          limit: 10,
          ...(kind === "filters" ? { userId: parsedUserId, usePit: true } : {}),
          // The listing's order (`?sort=`); none ⇒ relevance.
          sort,
        }),
    );

    return (
      <>
        {/* The old filter sheet: the filter mark opens it (A-4). */}
        <Suspense fallback={null} key={`FilterWidget ${Params.lang}`}>
          <FilterWidgetServer
            isFeatured={isFeatured}
            isFlashDeal={isFlashDeals}
            currencyPromise={currencyPromise}
            language={language}
            country={country}
            parsedFilters={{
              ...parsedFilters,
              featured: isFeatured,
              flashdeal: isFlashDeals,
            }}
            filtersPromise={filtersDataPromise}
            serverSearch={effectiveSearch}
          />
        </Suspense>
        <Suspense
          fallback={<ListingPageSkeleton />}
          key={`Listing ${Params.lang} ${sort ?? "relevance"} ${JSON.stringify(parsedFilters)}`}
        >
          <ListingBody
            kind={kind}
            lang={Params.lang}
            parsedFilters={parsedFilters}
            sort={sort}
            serverSearch={effectiveSearch}
            filtersDataPromise={filtersDataPromise}
            currencyPromise={currencyPromise}
            // A boutique that failed to load has no banners: no banner, no logo.
            boutique={boutiqueResolved?.banners ? boutiqueResolved : null}
          />
        </Suspense>
      </>
    );
  } catch (error) {
    // Let framework control-flow errors (the redirect above, notFound) through
    // untouched — otherwise a legitimate redirect is reported to Sentry as a
    // listing failure.
    unstable_rethrow(error);
    LogServerError(
      { error, filters: Params.filters },
      `/${Params.lang}/${kind}`,
    );
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * The page's title in the header, where there is no boutique logo (S7b-5):
 * the flash deals and featured pages say so; a search shows its words; else
 * the most exact name of the old title rule (category, then brand). With
 * none of those, the site's name.
 */
function listingTitle({
  kind,
  search,
  names,
  language,
}: {
  kind: ListingKind;
  search: string;
  names: unknown[];
  language: string;
}) {
  if (kind === "flashDeals") return translateFunction("Flash Deals", language);
  if (kind === "featured")
    return translateFunction("Featured Products", language);
  if (search) return search;
  const exact = names
    .slice(1)
    .filter((n): n is string => typeof n === "string" && n.length > 0)
    .pop();
  return exact ?? translateFunction("Trydos", language);
}

async function ListingBody({
  kind,
  lang,
  parsedFilters,
  sort,
  serverSearch,
  filtersDataPromise,
  currencyPromise,
  boutique,
}: {
  kind: ListingKind;
  lang: string;
  parsedFilters: any;
  sort?: string;
  serverSearch: string;
  filtersDataPromise: Promise<any>;
  currencyPromise: Promise<any>;
  boutique: any;
}) {
  const [filtersData, currency] = await Promise.all([
    filtersDataPromise,
    currencyPromise,
  ]);
  const language = lang.split("-")[1] || "en";
  const isFeatured = kind === "featured";
  const isFlashDeals = kind === "flashDeals";
  const raw: any[] = Array.isArray(filtersData?.products)
    ? filtersData.products
    : [];
  const products = raw.map(normalizeListingProduct);
  const { path, title } = getTitleAndTargetofListing({
    filters: parsedFilters,
    filtersData,
    language,
  });
  const boutiqueLogo: string = boutique?.icon
    ? (GetImageUrl(boutique.icon) ?? "")
    : "";
  const header: ListingMark = boutique
    ? {
        name: boutique?.name ?? "",
        logo: boutiqueLogo ? { src: boutiqueLogo } : undefined,
      }
    : {
        name: listingTitle({
          kind,
          search: serverSearch,
          names: title,
          language,
        }),
      };
  // The next pages keep the search: the analyzed name, else the words as
  // typed (one word skips the analysis), else the address's words.
  const pagingFilters = {
    ...parsedFilters,
    featured: isFeatured,
    flashdeal: isFlashDeals,
    search_text:
      filtersData?.isAnalyzed?.name ||
      serverSearch ||
      parsedFilters?.search_text?.[0],
  };
  const listName = isFeatured
    ? "Featured-Products"
    : isFlashDeals
      ? "FlashDeals-Products"
      : parsedFilters?.boutiques?.length === 1 && boutique?.name
        ? `${boutique.name}-Boutique-Page`
        : "Filters-Page";
  // English does not use the dictionary: the screen writes the keys in
  // Apple's capital rules itself (D-4).
  const dictionary: DemoDictionary =
    language === "en"
      ? {}
      : Object.fromEntries(
          LISTING_KEYS.map((key) => [key, translateFunction(key, language)]),
        );
  return (
    <>
      <ListingBreadcrumbList
        currency={currency}
        local={lang}
        products={products}
        target={path}
        title={title}
      />
      <AppListing
        lang={lang}
        kind={kind}
        title={header}
        banner={
          boutique
            ? {
                name: boutique?.name ?? "",
                logo: boutiqueLogo ? { src: boutiqueLogo, h: 20 } : undefined,
              }
            : null
        }
        categories={filtersData?.categories ?? []}
        seed={{
          products,
          offset: filtersData?.offset ?? [],
          pitId: filtersData?.pit_id ?? null,
          recommendedOffset: filtersData?.recommended_offset ?? null,
          analytics: raw.map((s) => ({
            item_id: s?.product_id,
            item_name: s?.name,
            category: s?.category?.name,
            brand: s?.brand?.name,
            category_id: s?.category?.id,
            brand_id: s?.brand?.id,
          })),
        }}
        currency={
          currency
            ? {
                exchange_rate: currency.exchange_rate,
                decimal_digits: currency.decimal_digits,
                symbol: currency.symbol,
              }
            : null
        }
        filters={pagingFilters}
        serverSort={sort ?? ""}
        serverSearch={serverSearch}
        sizes={parsedFilters?.sizes?.length > 0 ? parsedFilters.sizes : null}
        listName={listName}
        dictionary={dictionary}
        empty={
          <ListingEmpty
            parsedFilters={parsedFilters}
            lang={lang}
            isFeatured={isFeatured}
            isFlashDeals={isFlashDeals}
          />
        }
      />
    </>
  );
}
