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
import { getFeaturedMetadata } from "../../MetaData";
import { fetchCurrency, fetchFilteredProducts } from "Server Requests";

export const dynamicParams = true;

export const runtime = "nodejs";
export const preferredRegion = ["bom1", "sin1"];
export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export const dynamic = "auto";
export async function generateMetadata({ params, searchParams }) {
  try {
    const metadata = await getFeaturedMetadata({ params, searchParams });
    return metadata;
  } catch (error) {
    console.log(error);
    return {
      title: "Featured Products - TryDos",
      description:
        "Discover premium featured products on TryDos - curated collection of the best products.",
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
  const GetProductsData = async () => {
    try {
      const result = await fetchFilteredProducts(
        language,
        country,
        params.filters,
        "false",
        "true",
        null,
        null,
        true,
        false
      );
      return (
        result?.data || {
          products: [],
          categories: [],
          brands: [],
          colors: [],
          prices: { priceRanges: [] },
          attributes: [{ options: [] }],
          boutiques: [],
          offset: 0,
        }
      );
    } catch (error) {
      console.log(error, "getProductsData");
      return {
        products: [],
        categories: [],
        brands: [],
        colors: [],
        prices: { priceRanges: [] },
        attributes: [{ options: [] }],
        boutiques: [],
        offset: 0,
      };
    }
  };
  const GetCurrencyData = async () => {
    try {
      const data = await fetchCurrency(language, country);
      return (
        data.data.currency || { name: "USD", exchange_rate: 1, symbol: "$" }
      );
    } catch (error) {
      console.log(error, "getCurrencyData");
      return { name: "USD", exchange_rate: 1, symbol: "$" };
    }
  };

  const [filtersData, currency] = await Promise.all([
    GetProductsData(),
    GetCurrencyData(),
  ]);
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
  async function StructuredDataScript({ params, searchParams }) {
    try {
      const metadataWithStructuredData = await getFeaturedMetadata({
        params,
        searchParams,
      });
      const structuredData = metadataWithStructuredData.structuredData;

      if (!structuredData) return null;

      return (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      );
    } catch (error) {
      console.error("Error generating structured data:", error);
      return null;
    }
  }

  return (
    <>
      <Suspense fallback={null}>
        <StructuredDataScript params={params} searchParams={searchParams} />
      </Suspense>

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
          <SearchBoutiquePage
            boutique={{
              id: 0,
              icon: "",
              name: "",
              description: "",
              banners: []
            }}
            search_text={parsedFilters?.search_text?.[0]}
          />

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
            banners: []
          }}
          currency={currency}
          key={`filter-list`}
          params={params}
          parsedFilters={parsedFilters}
          isFeatured={true}
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
          isFeatured={true}
        />
      </Suspense>
    </>
  );
}
