import FilterList from "components/Server/FilterList";
import Nextdynamic from "next/dynamic";
import ProductListServer from "components/Server/ProductList";
import BackIcon from "public/svg/listing/backIcon.svg";
import SortIcon from "public/svg/listing/sortIcon.svg";
import ListingSkeleton from "components/skeleton/listing";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getConfiguredImage } from "utils/functions";
import NextLink from "components/global/NextLink";
import VerificationIcon from "public/svg/listing/VerificationIcon.svg";
import TopStarIcon from "public/svg/listing/TopStar.svg";
import Image from "next/image";
import BorderImage from "components/ListingPage/BorderImage";
import "styles/listing-components.css";
import Skeleton from "react-loading-skeleton";
import { getBoutiqueMetadata } from "./Metadata";

const SearchBoutiquePage = Nextdynamic(
  () => import("components/filterPage/SearchBoutiquePage"),
  {
    ssr: false,
  }
);
const FilterBoutiquePageButton = Nextdynamic(
  () => import("components/filterPage/FilterBoutiquePageButton"),
  {
    ssr: false,
  }
);
const ShareBoutiquePageButton = Nextdynamic(
  () => import("components/filterPage/ShareBoutiquePageButton"),
  {
    ssr: false,
  }
);

export const dynamicParams = true;

export const runtime = "nodejs";
export const preferredRegion = ["bom1", "sin1"];
export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export const dynamic = "force-dynamic";
export async function generateMetadata({ params, searchParams }) {
  // Fetch your main product categories
  try {
    const metadata = await getBoutiqueMetadata({ params, searchParams });

    return metadata;
  } catch (error) {
    console.log(error);
    return [];
  }
}

interface ParamsType {
  lang: string;
  boutiqueId: string;
}
export default async function Page({
  params,
  searchParams,
}: {
  params: ParamsType;
  searchParams: any;
}) {
  let EditedSearchParams: any = {};
  if (searchParams?.search_text) {
    EditedSearchParams = {
      ...EditedSearchParams,
      search_text: searchParams?.search_text,
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
  if (searchParams?.colors) {
    EditedSearchParams = {
      ...EditedSearchParams,
      colors: searchParams?.colors,
    };
  }
  if (searchParams?.prices) {
    EditedSearchParams = {
      ...EditedSearchParams,
      prices: searchParams?.prices,
    };
  }
  if (searchParams?.sizes) {
    EditedSearchParams = {
      ...EditedSearchParams,
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
        }/search?${new URLSearchParams({
          boutiqueId:
            params.boutiqueId === "listing" ? null : params.boutiqueId,
          noProducts: "false",
          noFilters: "false",
          offset: "false",
          searchParams:
            Object.keys(EditedSearchParams).length > 0
              ? JSON.stringify(EditedSearchParams)
              : "{}",
        }).toString()}`,
        {
          method: "GET",
          next: {
            revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
          },
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
      let data = await response.json();
      return data.data;
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
  const GetBoutiqueData = async () => {
    let response;
    try {
      if (params.boutiqueId === "listing") {
        return {
          name: "Search",
          banners: null,
          icon: null,
        };
      }
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/${params.lang}/boutiques/${params.boutiqueId}`,
        {
          method: "GET",
          next: {
            revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_LISTING),
          },
        }
      );
      let data = await response.json();
      if (data.code === 404) {
        return "NOT_FOUND";
      }
      return data.data;
    } catch (error) {
      console.log(error, "getBoutiqueData", response);
      return "NOT_FOUND";
    }
  };
  const [filtersData, currency, boutique] = await Promise.all([
    GetProductsData(),
    GetCurrencyData(),
    GetBoutiqueData(),
  ]);
  let filters = {
    categories: filtersData?.categories,
    brands: filtersData?.brands,
    colors: filtersData?.colors,
    prices: filtersData?.prices?.priceRanges,
    sizes: filtersData?.attributes?.[0]?.options,
    boutiques: params.boutiqueId !== "listing" ? null : filtersData?.boutiques,
    search_text: EditedSearchParams?.search_text || null,
  };
  if (boutique === "NOT_FOUND") {
    redirect(`/${params.lang}?message=boutique_not_found`);
  }
  return (
    <>
      <div
        className="filter-listing-bar relative flex-row align-center"
        key={`${params.boutiqueId}-${JSON.stringify(EditedSearchParams)}`}
      >
        <NextLink
          data={{
            is_full_home: true,
            href: `/${params.lang}`,
          }}
          href={`/${params.lang}`}
          ariaLabel={`TryDos Home ${params.lang}`}
          className="back-icon"
          data-cy="backIcon_pageAfterClickSearchTotal"
        >
          <BackIcon data-cy="back_icon_boutique_page" />
        </NextLink>
        {/** TODO: classname edit when serach active w-full */}
        <div
          className={`filter-bar-options flex-row align-center ${
            EditedSearchParams?.search_text?.length > 0 && "w-full"
          }`}
        >
          <Suspense
            fallback={
              <div className="filter-option">
                <Skeleton width={30} height={30} borderRadius={10} />
              </div>
            }
          >
            <SearchBoutiquePage
              boutique={boutique}
              search_text={EditedSearchParams?.search_text}
            />
          </Suspense>
          <div className="filter-option">
            <SortIcon data-cy="closeSearchInput" />
          </div>
          <Suspense
            key={"filter-button"}
            fallback={
              <div className="filter-option">
                <Skeleton width={30} height={30} borderRadius={10} />
              </div>
            }
          >
            <FilterBoutiquePageButton key={"filter-button"} />
          </Suspense>
          <Suspense
            fallback={
              <div className="filter-option">
                <Skeleton width={30} height={30} borderRadius={10} />
              </div>
            }
          >
            <ShareBoutiquePageButton />
          </Suspense>
        </div>
      </div>

      <div
        className={`boutique-header ${"flex-col"} align-center`}
        data-cy="boutiqueOpen"
        key={`boutique-header-${params.boutiqueId}-${JSON.stringify(
          EditedSearchParams
        )}`}
      >
        <Suspense key={params.boutiqueId} fallback={<BoutiqueHeaderSkeleton />}>
          <BoutiqueHeader
            boutique={boutique}
            key={params.boutiqueId}
          ></BoutiqueHeader>
        </Suspense>

        <FilterList
          filters={filters}
          boutique={boutique}
          currency={currency}
          key={`filter-list-${params.boutiqueId}`}
          params={params}
          searchParams={EditedSearchParams}
        />
      </div>
      <Suspense
        key={`Suspense-product-list-${JSON.stringify(EditedSearchParams)}`}
        fallback={<ListingSkeleton forProducts={true} />}
      >
        <ProductListServer
          products={filtersData.products ?? []}
          offset={filtersData.offset}
          currency={currency}
          key={`product-list-${JSON.stringify(EditedSearchParams)}`}
          searchParams={EditedSearchParams}
          params={params}
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
          className="boutique-top-info flex-col items-center"
          data-cy="boutique_top_info"
        >
          <div className="boutique-logo-container flex-row align-center">
            <img width={130} height={20} src={boutique?.icon} />
            <VerificationIcon />
            <TopStarIcon />
          </div>
          <div className="boutique-text">{boutique.name}</div>
        </div>
      )}
      {boutique?.banners && <BouqiuePhotoSlider banners={boutique.banners} />}
    </>
  );
}
const BouqiuePhotoSlider = ({ banners }) => {
  return (
    <div className="boutique-photo-holder ">
      <div
        className={`${
          banners?.length > 1 && "justify-start"
        } offer-slider-container`}
      >
        {banners &&
          banners?.map((banner, index) => (
            <div
              className="offer-slide-item"
              style={{ width: "100%" }}
              key={index}
            >
              <div className="image-offer">
                <div
                  className="image-inner-shadow"
                  style={{ height: "100%" }}
                />

                <Image
                  loading={"eager"}
                  fetchPriority={"high"}
                  style={{ borderRadius: "15px" }}
                  className="OfferImage object-cover"
                  src={getConfiguredImage({
                    src: banner.file_path,
                    height: 342,
                    width: 900,
                  })}
                  width={380}
                  unoptimized
                  height={135}
                  alt="offer"
                />

                <BorderImage />
              </div>
            </div>
          ))}
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
const FiltersSkeleton = () => {
  return (
    <div className={`w-full flex-row items-center pl-[15px] mt-[20px]`}>
      {Array.from({ length: 20 }).map((_, index) => (
        <div key={index} className="filter-option w-[70px] h-[70px]">
          <Skeleton
            width={70}
            height={70}
            borderRadius={"50%"}
            className="ml-2"
          />
        </div>
      ))}
    </div>
  );
};
