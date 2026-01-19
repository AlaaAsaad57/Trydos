export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import NextLink from "components/global/NextLink";
import "styles/listing-components.css";
import ShareBoutiquePageButton from "components/filterPage/ShareBoutiquePageButton";
import FilterBoutiquePageButton from "components/filterPage/FilterBoutiquePageButton";
import { fetchCurrency } from "serverRequests";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
import { LogServerError } from "utils/serverErrorReporter";
import { parseFiltersFromParams } from "utils/server";
import { generateMetadataForListing } from "serverRequests/meta/listing";

import FilterWidgetServer from "components/Server/FilterWidgetServer";
import ListingSearchContainer from "components/Server/ListingSearchContainer";
import FilterListContainer from "components/Server/FilterListContainer";
import ProductListConainer from "components/Server/ProductListConainer";
export const dynamicParams = true;
export async function generateMetadata({ params }) {
  // Fetch your main product categories
  try {
    const metadata = await generateMetadataForListing({
      params,
    });

    return metadata;
  } catch (error) {
    console.log(error);
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
      let currency = { ...currencyData.data.currency };
      StoreCurrency(country, currency);
      return { ...currency, redis: false };
    }
  } catch (error) {}
}
export default async function Page({ params }) {
  let Params = await params;

  try {
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
      }),
      getCurrency(country, language),
    ];

    const isRtl = language === "ar" || language === "ku";

    return (
      <>
        {/*@ts-expect-error Async Server Component is valid in Next  */}
        <FilterWidgetServer
          currencyPromise={currency}
          language={language}
          isFeatured={false}
          isFlashDeal={true}
          country={country}
          parsedFilters={{ ...parsedFilters, featured: false, flashdeal: true }}
          filtersPromise={filtersData}
        />
        <div
          data-cy="filter_listing_bar"
          className={`filter-listing-bar z-[99999999] relative ${
            isRtl ? "flex-row-reverse flex" : "flex-row flex"
          } align-center w-full h-[50px] pl-[15px] pr-[20px] justify-between bg-white z-10`}
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
            {/* @ts-expect-error Async Server Component is valid in Next*/}
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
              <img src="/icons/sortIcon.svg" data-cy="closeSearchInput" />
            </div>
            <FilterBoutiquePageButton key={"filter-button"} />
            <ShareBoutiquePageButton />
          </div>
        </div>

        <div
          data-cy="boutique_header"
          className={`boutique-header ${"flex-col"} align-center`}
        >
          {/* @ts-expect-error Async Server Component is valid in Next  */}
          <FilterListContainer
            filtersPromis={filtersData}
            currencyPromise={currency}
            Params={Params}
            parsedFilters={parsedFilters}
          />
        </div>
        {/* @ts-expect-error Async Server Component is valid in Next  */}
        <ProductListConainer
          isFlashDeals={true}
          isFeatured={false}
          Params={Params}
          boutiquePromise={() => {}}
          currencyPromise={currency}
          filtersDataPromise={filtersData}
          parsedFilters={parsedFilters}
          language={language}
        />
      </>
    );
  } catch (error) {
    const filtersPath =
      Array.isArray(Params.filters) && Params.filters.length > 0
        ? `/${Params.filters.join("/")}`
        : "";
    LogServerError(error, `/${Params.lang}/filters/${filtersPath}`);
    throw error instanceof Error ? error : new Error(String(error));
  }
}
