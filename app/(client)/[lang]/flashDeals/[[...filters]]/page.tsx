export const dynamicParams = true;
export const runtime = "nodejs";
export const preferredRegion = process.env.PREFERRED_REGION || "bom1";
export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export const dynamic = "auto";
import FilterList from "components/Server/FilterList";
import ProductListServer from "components/Server/ProductList";
import BackIcon from "public/svg/listing/backIcon.svg";
import SortIcon from "public/svg/listing/sortIcon.svg";
import ListingSkeleton from "components/skeleton/listing";
import { Suspense } from "react";
import NextLink from "components/global/NextLink";
import "styles/listing-components.css";
import FilterWidgetContainer from "components/filterPage/FiltersWidget";
import ShareBoutiquePageButton from "components/filterPage/ShareBoutiquePageButton";
import FilterBoutiquePageButton from "components/filterPage/FilterBoutiquePageButton";
import SearchBoutiquePage from "components/filterPage/SearchBoutiquePage";
import { parseFiltersFromParams } from "utils/tinyUtils";
import { GetFiltersData } from "utils/pagesDataRequests/FiltersPageData";
import { getBoutiqueMetadata } from "../../filters/[[...filters]]/Metadata";

export async function generateMetadata({ params }) {
  try {
    const metadata = await getBoutiqueMetadata({
      params,
      options: { is_fearured: false, is_flashDeals: true },
    });
    return metadata;
  } catch (error) {
    console.log(error);
    return {
      title: "Flash Deals - TryDos",
      description:
        "Exclusive flash deals on TryDos - Limited time offers with special discounts.",
    };
  }
}

interface ParamsType {
  lang: string;
  filters?: string[];
}
export default async function Page({
  params,
  searchParams,
}: {
  params: ParamsType;
  searchParams: any;
}) {
  // Parse filters from URL path parameters
  const parsedFilters = parseFiltersFromParams(params.filters || []);
  const [country, language] = params.lang.split("-");

  let { products: filtersData, currency } = await GetFiltersData(
    { lang: params.lang, filters: params.filters },
    null,
    false,
    true,
    false
  );
  let filters = {
    categories: filtersData?.categories || [],
    brands: filtersData?.brands || [],
    colors: filtersData?.colors || [],
    prices: filtersData?.prices?.priceRanges || [],
    sizes: filtersData?.attributes?.[0]?.options || [],
    boutiques: filtersData?.boutiques || [],
    search_text: parsedFilters?.search_text?.[0] || null,
  };

  // Server component to render JSON-LD structured data

  return (
    <>
      <Suspense fallback={<></>}>
        <FilterWidgetContainer key={JSON.stringify(parsedFilters)} />
      </Suspense>
      <div className="filter-listing-bar relative flex-row align-center">
        <NextLink
          data={{
            is_full_home: true,
            href: `/${params.lang}`,
          }}
          href={`/${params.lang}`}
          ariaLabel={`TryDos Home ${params.lang}`}
          className="back-icon"
          data-cy="BackIcon_boutique"
        >
          <BackIcon data-cy="back_icon_boutique_page" />
        </NextLink>
        {/** TODO: classname edit when serach active w-full */}
        <div
          className={`filter-bar-options flex-row align-center ${
            parsedFilters?.search_text?.length > 0 && "w-full"
          }`}
        >
          <SearchBoutiquePage search_text={parsedFilters?.search_text?.[0]} />

          <div className="filter-option">
            <SortIcon data-cy="closeSearchInput" />
          </div>

          <FilterBoutiquePageButton key={"filter-button"} />

          <ShareBoutiquePageButton />
        </div>
      </div>

      <div
        className={`boutique-header ${"flex-col"} align-center`}
        data-cy="boutiqueOpen"
        key={`boutique-header-${JSON.stringify(parsedFilters)}`}
      >
        <FilterList
          filters={filters}
          boutique={{
            id: 0,
            icon: "",
            name: "",
            description: "",
            banners: [],
          }}
          currency={currency}
          key={`filter-list`}
          params={params}
          parsedFilters={parsedFilters}
          isFlashDeals={true}
        />
      </div>
      <Suspense
        key={`Suspense-product-list-${JSON.stringify(parsedFilters)}`}
        fallback={<ListingSkeleton forProducts={true} />}
      >
        <ProductListServer
          colors={filtersData?.colors}
          products={filtersData.products ?? []}
          offset={filtersData.offset}
          currency={currency}
          key={`product-list-${JSON.stringify(parsedFilters)}`}
          parsedFilters={parsedFilters}
          params={params}
          isFeatured={false}
          isFlashDeals={true}
        />
      </Suspense>
    </>
  );
}
