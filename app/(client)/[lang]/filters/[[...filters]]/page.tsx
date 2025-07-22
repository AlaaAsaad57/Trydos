export const runtime = "nodejs";
export const preferredRegion = process.env.PREFERRED_REGION || "bom1";
export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export const dynamic = "auto";
import FilterList from "components/Server/FilterList";
import ProductListServer from "components/Server/ProductList";
import BackIcon from "public/svg/listing/backIcon.svg";
import SortIcon from "public/svg/listing/sortIcon.svg";
import ListingSkeleton from "components/skeleton/listing";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import NextLink from "components/global/NextLink";
import VerificationIcon from "public/svg/listing/VerificationIcon.svg";
import TopStarIcon from "public/svg/listing/TopStar.svg";
import Image from "next/image";
import "styles/listing-components.css";
import Skeleton from "react-loading-skeleton";
import { getBoutiqueMetadata, GetStructuredData } from "./Metadata";
import FilterWidgetContainer from "components/filterPage/FiltersWidget";
import ShareBoutiquePageButton from "components/filterPage/ShareBoutiquePageButton";
import FilterBoutiquePageButton from "components/filterPage/FilterBoutiquePageButton";
import SearchBoutiquePage from "components/filterPage/SearchBoutiquePage";
import CarouselContainer from "components/filterPage/CarouselContainer";
import { GetImageUrl, parseFiltersFromParams } from "utils/tinyUtils";

import {
  fetchBoutiqueDetails,
  fetchCurrency,
  fetchFilteredProducts,
} from "Server Requests";

export const dynamicParams = true;

export async function generateMetadata({ params }) {
  // Fetch your main product categories
  try {
    const metadata = await getBoutiqueMetadata({
      params,
      options: { is_fearured: false, is_flashDeals: false },
    });

    return metadata;
  } catch (error) {
    console.log(error);
    return [];
  }
}

interface ParamsType {
  lang: string;
  filters?: string[];
}
export default async function Page({ params }: { params: ParamsType }) {
  // Parse filters from URL path parameters
  const parsedFilters = parseFiltersFromParams(params.filters || []);

  let boutiqueItem = parsedFilters?.boutiques?.[0] || null;
  // let {
  //   products: filtersData,
  //   currency,
  //   boutique: boutique,
  // } = await GetFiltersData(
  //   { lang: params.lang, filters: params.filters },
  //   boutiqueItem,
  //   false,
  //   false,
  //   true
  // );

  // let filters = {
  //   categories: filtersData?.categories || [],
  //   brands: filtersData?.brands || [],
  //   colors: filtersData?.colors || [],
  //   prices: filtersData?.prices?.priceRanges || [],
  //   sizes: filtersData?.attributes?.[0]?.options || [],
  //   boutiques: filtersData?.boutiques || [],
  //   search_text: parsedFilters?.search_text?.[0] || null,
  // };

  return (
    <>
      <Suspense fallback={<></>}>
        <GetStructuredData
          is_fearured={false}
          is_flashDeals={false}
          params={params}
        />
      </Suspense>
      <Suspense>
        <FilterWidgetContainer key={JSON.stringify(parsedFilters)} />
      </Suspense>
      <div
        data-cy="filter_listing_bar"
        className="filter-listing-bar relative flex-row align-center"
      >
        <NextLink
          data-cy="BackIcon_boutique"
          data={{
            is_full_home: true,
            href: `/${params.lang}`,
          }}
          href={`/${params.lang}`}
          ariaLabel={`TryDos Home ${params.lang}`}
          className="back-icon"
        >
          <BackIcon data-cy="back_icon_boutique_page" />
        </NextLink>
        {/** TODO: classname edit when serach active w-full */}
        <div
          data-cy="filter_bar_options"
          className={`filter-bar-options flex-row align-center ${
            parsedFilters?.search_text?.length > 0 && "w-full"
          }`}
        >
          <SearchBoutiquePage
            key={`search-boutique-page-${JSON.stringify(parsedFilters)}`}
            search_text={parsedFilters?.search_text?.[0]}
          />

          <div
            data-cy="filter_option_loseSearchInput"
            className="filter-option"
          >
            <SortIcon data-cy="closeSearchInput" />
          </div>

          <FilterBoutiquePageButton key={"filter-button"} />

          <ShareBoutiquePageButton />
        </div>
      </div>

      <div
        data-cy="boutique_header"
        className={`boutique-header ${"flex-col"} align-center`}
        key={`boutique-header-filters-${JSON.stringify(parsedFilters)}`}
      >
        <Suspense
          key={params.filters?.join("/") || "no-filters"}
          fallback={<BoutiqueHeaderSkeleton />}
        >
          <BoutiqueWrapper params={params} />
        </Suspense>

        <Suspense fallback={<ListingSkeleton justFilters={true} />}>
          <FiltersWrapper
            params={params}
            is_fearured={false}
            is_flashDeals={false}
          />
        </Suspense>
      </div>
      <Suspense
        key={`Suspense-product-list-${JSON.stringify(parsedFilters)}`}
        fallback={<ListingSkeleton forProducts={true} />}
      >
        <ProductListWrapper
          params={params}
          is_fearured={false}
          is_flashDeals={false}
        />
      </Suspense>
    </>
  );
}
async function BoutiqueHeader({ boutique }) {
  return (
    <>
      {boutique?.banners && (
        <div
          data-cy="boutique_top_icons"
          className="boutique-top-info flex-col items-center"
        >
          <div className="boutique-logo-container flex-row align-center">
            <Image
              alt={boutique?.name}
              width={130}
              height={20}
              src={GetImageUrl(boutique?.icon)}
            />
            <VerificationIcon />
            <TopStarIcon />
          </div>
        </div>
      )}
      {boutique?.banners && <BouqiuePhotoSlider banners={boutique.banners} />}
    </>
  );
}
const BouqiuePhotoSlider = ({ banners }) => {
  return (
    <div data-cy="boutique_photo_holder" className="boutique-photo-holder">
      <div
        data-cy="banners_length-1"
        className={`${
          banners?.length > 1 && "justify-start"
        } offer-slider-container`}
      >
        <CarouselContainer banners={banners}></CarouselContainer>
      </div>
    </div>
  );
};
const BoutiqueHeaderSkeleton = () => {
  return (
    <>
      <div className="boutique-top-info flex-col">
        <div className="boutique-logo-container flex-row align-center">
          <Skeleton
            className="w-fu"
            width={130}
            height={20}
            borderRadius={"30"}
          />
        </div>
        <div className="boutique-text">
          <Skeleton width={200} height={10} />
        </div>
      </div>
      <div className="boutique-photo-holder">
        <div className="offer-slider-container">
          <div className="offer-slide-item" style={{ width: "100%" }}>
            <div className="image-offer">
              <div className="image-inner-shadow" style={{ height: "100%" }} />

              <Skeleton
                className="w-full h-full"
                width={380}
                height={135}
                borderRadius={"30"}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
async function BoutiqueWrapper({ params }) {
  const parsedFilters = parseFiltersFromParams(params.filters || []);
  const [country, language] = params.lang.split("-");
  let boutiqueItem = parsedFilters?.boutiques?.[0] || null;
  let boutique = boutiqueItem
    ? await fetchBoutiqueDetails(boutiqueItem, language, country)
    : {
        banners: null,
        name: "Search",
      };
  if (boutique?.name === "NOT_FOUND") {
    redirect(`/${params.lang}?message=boutique_not_found`);
  }
  if (boutique?.banners)
    return (
      <BoutiqueHeader
        boutique={boutique}
        key={params.filters?.join("/") || "no-filters"}
      ></BoutiqueHeader>
    );
  else return <></>;
}
async function FiltersWrapper({ params, is_fearured, is_flashDeals }) {
  const [country, language] = params.lang.split("-");
  const [filtersData, currency] = await Promise.all([
    fetchFilteredProducts(
      language,
      country,
      params.filters,
      "false",
      "false",
      null,
      null,
      is_fearured,
      is_flashDeals
    ),
    fetchCurrency(language, country),
  ]);
  const parsedFilters = parseFiltersFromParams(params.filters || []);
  let filters = {
    categories: filtersData?.data?.categories || [],
    brands: filtersData?.data?.brands || [],
    colors: filtersData?.data?.colors || [],
    prices: filtersData?.data?.prices?.priceRanges || [],
    sizes: filtersData?.data?.attributes?.[0]?.options || [],
    boutiques: filtersData?.data?.boutiques || [],
    search_text: parsedFilters?.search_text?.[0] || null,
  };

  return (
    <FilterList
      filters={filters}
      currency={currency?.data?.currency}
      key={`filter-list-filters`}
      params={params}
      parsedFilters={parsedFilters}
    />
  );
}

async function ProductListWrapper({ params, is_fearured, is_flashDeals }) {
  const [country, language] = params.lang.split("-");
  const parsedFilters = parseFiltersFromParams(params.filters || []);
  const [filters, currency] = await Promise.all([
    fetchFilteredProducts(
      language,
      country,
      params.filters,
      "false",
      "false",
      null,
      null,
      is_fearured,
      is_flashDeals
    ),
    fetchCurrency(language, country),
  ]);
  return (
    <ProductListServer
      colors={filters?.data?.colors}
      products={filters?.data?.products ?? []}
      offset={filters?.data?.offset}
      currency={currency?.data?.currency}
      key={`product-list-${JSON.stringify(parsedFilters)}`}
      parsedFilters={parsedFilters}
      params={params}
    />
  );
}
