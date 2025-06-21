import FilterList from "components/Server/FilterList";
import ProductListServer from "components/Server/ProductList";
import BackIcon from "public/svg/listing/backIcon.svg";
import SortIcon from "public/svg/listing/sortIcon.svg";
import ListingSkeleton from "components/skeleton/listing";

import { Suspense } from "react";

import NextLink from "components/global/NextLink";

import "styles/listing-components.css";
import Skeleton from "react-loading-skeleton";
// import { getBoutiqueMetadata } from "./Metadata";
import FilterWidgetContainer from "components/filterPage/FiltersWidget";
import ShareBoutiquePageButton from "components/filterPage/ShareBoutiquePageButton";
import FilterBoutiquePageButton from "components/filterPage/FilterBoutiquePageButton";
import SearchBoutiquePage from "components/filterPage/SearchBoutiquePage";
import { featuredPagePropsType } from "models/componentType/featuredTypes/featuredPagePropsType";

export const dynamicParams = true;

export const runtime = "nodejs";
export const preferredRegion = ["bom1", "sin1"];
export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export const dynamic = "auto";
export async function generateMetadata({ params, searchParams }) {
  // Fetch your main product categories
  //   try {
  //     const metadata = await getBoutiqueMetadata({ params, searchParams });

  //     return metadata;
  //   } catch (error) {
  //     console.log(error);
  //     return [];
  //   }
  return {
    title: "Featured Products",
    description: "Featured Products",
  };
}

interface ParamsType {
  lang: string;
}
export default async function Page({
  params,
  searchParams,
}: featuredPagePropsType) {
  let EditedSearchParams: any = {};

  if (searchParams?.search_text) {
    EditedSearchParams = {
      ...EditedSearchParams,
      search_text: searchParams.search_text,
    };
  }
  if (searchParams?.categories) {
    EditedSearchParams = {
      ...EditedSearchParams,
      categories: searchParams?.categories,
    };
  }
  if (searchParams?.brands) {
    EditedSearchParams = {
      ...EditedSearchParams,
      brands: searchParams?.brands,
    };
  }
  // @ts-ignore
  if (searchParams?.colors) {
    EditedSearchParams = {
      ...EditedSearchParams,
      // @ts-ignore
      colors: searchParams?.colors,
    };
  }
  if (searchParams?.prices) {
    EditedSearchParams = {
      ...EditedSearchParams,
      prices: searchParams?.prices,
    };
  }
  // @ts-ignore
  if (searchParams?.sizes) {
    EditedSearchParams = {
      ...EditedSearchParams,
      // @ts-ignore
      sizes: searchParams?.sizes,
    };
  }
  if (searchParams?.boutiques) {
    EditedSearchParams = {
      ...EditedSearchParams,
      boutiques: searchParams?.boutiques,
    };
  }

  const GetProductsData = async () => {
    let response;
    try {
      response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${
          params.lang
        }/featured?${new URLSearchParams({
          boutiqueId: null,
          noProducts: "false",
          forHome: "true",
          noFilters: "true",
          offset: "false",
          searchParams:
            Object.keys(EditedSearchParams).length > 0
              ? JSON.stringify(EditedSearchParams)
              : "{}",
        }).toString()}`,
        {
          method: "GET",
          next: {
            revalidate: parseInt(process.env.NEXT_PUBLIC_HOME_REVALIDATE),
            tags: ["featured-Products-Api"],
          },
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
      let data = await response.json();
      return data;
    } catch (error) {
      console.log(error, "getProductsData", response);
      return {};
    }
  };
  const GetCurrencyData = async () => {
    let response;
    try {
      response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${params.lang}/currency`,

        {
          method: "GET",
          next: {
            revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_CURRENCY),
            tags: ["currency-api"],
          },
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
      let data = await response.json();
      return data.data.currency;
    } catch (error) {
      console.log(error, "getCurrencyData", response);
      return {};
    }
  };

  const [filtersData, currency] = await Promise.all([
    GetProductsData(),
    GetCurrencyData(),
  ]);
  let filters = {
    categories: filtersData?.categories,
    brands: filtersData?.brands,
    colors: filtersData?.colors,
    prices: filtersData?.prices?.priceRanges,
    sizes: filtersData?.attributes?.[0]?.options,
    boutiques: filtersData?.boutiques,
    search_text: EditedSearchParams?.search_text || null,
  };

  return (
    <>
      <Suspense fallback={<></>}>
        <FilterWidgetContainer key={JSON.stringify(EditedSearchParams)} />
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
            EditedSearchParams?.search_text?.length > 0 && "w-full"
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
            search_text={EditedSearchParams?.search_text}
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
        key={`boutique-header-${JSON.stringify(EditedSearchParams)}`}
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
          searchParams={EditedSearchParams}
          isFeatured={true}
        />
      </div>
      <Suspense
        key={`Suspense-product-list-${JSON.stringify(EditedSearchParams)}`}
        fallback={<ListingSkeleton forProducts={true} />}
      >
        <ProductListServer
          colors={filtersData?.colors}
          products={filtersData.products ?? []}
          offset={filtersData.offset}
          currency={currency}
          key={`product-list-${JSON.stringify(EditedSearchParams)}`}
          searchParams={EditedSearchParams}
          params={params}
          isFeatured={true}
        />
      </Suspense>
    </>
  );
}
