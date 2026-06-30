import { redirect } from "next/navigation";
import "styles/listing-components.css";
import ShareBoutiquePageButton from "components/filterPage/ShareBoutiquePageButton";
import FilterBoutiquePageButton from "components/filterPage/FilterBoutiquePageButton";
import { fetchCurrency } from "serverRequests";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
import { LogServerError } from "utils/serverErrorReporter";
import { parseFiltersFromParams } from "utils/server";
import ListingBoutiqueSlider from "components/Server/ListingBoutiqueSlider";
import FilterWidgetServer from "components/Server/FilterWidgetServer";
import ListingSearchContainer from "components/Server/ListingSearchContainer";
import FilterListContainer from "components/Server/FilterListContainer";
import ProductListConainer from "components/Server/ProductListConainer";
import { COOKIE_NAMES, getCookieServer } from "utils/cookies/cookie-manager";
import FilterListingBackButton from "components/Listing/FilterListingBackButton";

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
        redirect(`/${country}-${language}?message=boutique_not_found`);
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
}

export default async function FiltersPageContent({
  params,
}: FiltersPageContentProps) {
  const Params = params;
  try {
    let parsedFilters = parseFiltersFromParams(Params.filters || []);
    const [country, language] = Params.lang.split("-");
    const boutiqueItem = parsedFilters?.boutiques?.[0] || null;

    if (parsedFilters.prices) {
      parsedFilters = {
        ...parsedFilters,
        prices: parsedFilters.prices?.map((s) =>
          s.split("-").map((d) => Number(d)),
        )?.[0],
      };
    }

    // Kick off the two fetches that don't depend on userId before awaiting the
    // cookie, so they overlap the cookie read instead of waiting behind it.
    const currencyPromise = getCurrencyForListing(country, language);
    const boutiquePromise = getBoutique(boutiqueItem, country, language);

    const userData = await getCookieServer<{ id: string }>(
      COOKIE_NAMES.USER_DATA,
    );
    const parsedUserId = userData?.id ?? null;

    const [filtersData, currency, boutique] = await Promise.all([
      getProductsAndFiltersFromElastic({
        country,
        language_code: language,
        filters: {
          ...parsedFilters,
          featured: false,
          flashdeal: false,
          search_text: parsedFilters.search_text?.[0],
        },
        limit: 10,
        userId: parsedUserId,
        // Open a PIT snapshot for this filter session (ADR-009); the returned
        // pit_id rides inside filtersData and is threaded to the infinite
        // scroll so every "load more" reads the same immutable snapshot.
        usePit: true,
      }),
      currencyPromise,
      boutiquePromise,
    ]);

    const isRtl = language === "ar" || language === "ku";

    return (
      <>
        <FilterWidgetServer
          isFeatured={false}
          isFlashDeal={false}
          currencyPromise={currency}
          language={language}
          country={country}
          parsedFilters={parsedFilters}
          filtersPromise={filtersData}
        />
        <div
          data-cy="filter_listing_bar"
          className={`filter-listing-bar z-99999999 relative ${
            isRtl ? "flex-row-reverse flex" : "flex-row flex"
          } align-center left-0 right-0 mx-auto w-full h-[50px] pl-[15px] max-w-[1365px] pr-[20px] justify-between bg-white z-10`}
        >
          <FilterListingBackButton lang={Params.lang} isRtl={isRtl} />
          <div
            data-cy="filter_bar_options"
            className={`filter-bar-options w-[170px] justify-between ${
              isRtl ? "flex-row-reverse flex" : "flex-row flex"
            }  align-center ${
              parsedFilters?.search_text?.length > 0 ? "w-full" : ""
            }`}
          >
            <ListingSearchContainer
              country={country}
              language={language}
              filtersPromise={filtersData}
              parsedFilters={parsedFilters}
            />
            <div
              data-cy="filter_option_loseSearchInput"
              className="filter-option"
            >
              <img
                src="/icons/sortIcon.svg"
                data-cy="closeSearchInput"
                alt=""
              />
            </div>
            <FilterBoutiquePageButton key="filter-button" />
            <ShareBoutiquePageButton />
          </div>
        </div>

        <div
          data-cy="boutique_header"
          className="boutique-header flex-col align-center"
        >
          {parsedFilters?.boutiques?.[0] && (
            <ListingBoutiqueSlider
              boutiquePromise={boutique}
              key={boutiqueItem || "noFilters"}
            />
          )}

          <FilterListContainer
            filtersPromis={filtersData}
            currencyPromise={currency}
            Params={Params}
            parsedFilters={parsedFilters}
          />
        </div>
        <ProductListConainer
          isFlashDeals={false}
          isFeatured={false}
          Params={Params}
          boutiquePromise={boutique}
          currencyPromise={currency}
          filtersDataPromise={filtersData}
          parsedFilters={parsedFilters}
          language={language}
        />
      </>
    );
  } catch (error) {
    LogServerError(
      { error, filters: Params.filters },
      `/${Params.lang}/filters`,
    );
    throw error instanceof Error ? error : new Error(String(error));
  }
}
