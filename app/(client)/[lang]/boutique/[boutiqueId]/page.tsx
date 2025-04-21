import FilterList from "components/Server/FilterList";
import Nextdynamic from "next/dynamic";
import ProductListServer from "components/Server/ProductList";
import BackIcon from "public/svg/listing/backIcon.svg";
import SortIcon from "public/svg/listing/sortIcon.svg";
import ListingSkeleton from "components/skeleton/listing";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getBoutiques } from "store/homepage/cachedActions";
import { getConfiguredImage } from "utils/functions";
import NextLink from "components/global/NextLink";
import VerificationIcon from "public/svg/listing/VerificationIcon.svg";
import TopStarIcon from "public/svg/listing/TopStar.svg";
import Image from "next/image";
import BorderImage from "components/ListingPage/BorderImage";
import "styles/listing-components.css";
import Skeleton from "react-loading-skeleton";

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
// export async function generateMetadata({ params, searchParams }: Props) {
//   const boutiqueId = params.boutiqueId;
//   try {
//     const metaData =
//       boutiqueId === "listing"
//         ? { name: "listing" }
//         : await getBoutiqueMeta({ boutiqueId, lang: params.lang });

//     if (!metaData?.name) {
//       notFound();
//     }
//     if (boutiqueId === "listing") {
//       return {
//         title: `Trydos - ${searchParams.searchText || "Search"} `,
//         description: ``,
//       };
//     } else
//       return {
//         title: `Trydos - ${metaData?.name} `,
//         // @ts-ignore
//         description: `${metaData?.name} - ${metaData?.description} `,
//       };
//   } catch (error) {
//     console.error(error);
//     notFound();
//   }
// }
export const runtime = "nodejs";
export const preferredRegion = ["bom1", "sin1"];
export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export const dynamic = "force-dynamic";
export function generateMetadata() {
  return {
    title: "Trydos - Boutique",
    description: "Trydos - Boutique",
    headers: {
      "Cache-Control": "public, s-maxage=864000, stale-while-revalidate=864000",
    },
  };
}
// export async function generateStaticParams({ params }) {
//   // Fetch your main product categories
//   try {
//     const boutiques_slugs = await getBoutiques({
//       lang: params.lang ? params.lang.split("-")[1] : null,
//       country: params.lang ? params.lang.split("-")[0] : null,
//       str: "",
//     });

//     return [...boutiques_slugs].map((category) => ({
//       boutiqueId: category,
//       lang: params.lang,
//     }));
//   } catch (error) {
//     console.log(error);
//     return [];
//   }
// }

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
  const GetProductsData = async () => {
    try {
      let response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL
        }/api/search?${new URLSearchParams({
          boutiqueId:
            params.boutiqueId === "listing" ? null : params.boutiqueId,
          lang: params.lang.split("-")[1],
          country: params.lang.split("-")[0],
          noProducts: "false",
          noFilters: "false",
          offset: "false",
          searchParams: JSON.stringify(searchParams),
        }).toString()}`,
        {
          method: "GET",
          next: {
            revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
          },
        }
      );
      let data = await response.json();
      return data.data;
    } catch (error) {
      console.log(error);
      return {};
    }
  };
  const GetCurrencyData = async () => {
    try {
      let response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL
        }/api/currency?${new URLSearchParams({
          country: params.lang.split("-")[0],
          lang: params.lang.split("-")[1],
        }).toString()}`,
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
      console.log(error);
      return {};
    }
  };
  const GetBoutiqueData = async () => {
    try {
      if (params.boutiqueId === "listing") {
        return {
          name: "Search",
          banners: null,
          icon: null,
        };
      }
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boutiques/${params.boutiqueId}`,
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
      console.log(error);
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
    sizes: filtersData?.attributes[0]?.options,
    boutiques: params.boutiqueId !== "listing" ? null : filtersData?.boutiques,
    search_text: searchParams?.searchText || null,
  };
  if (boutique === "NOT_FOUND") {
    notFound();
  }
  return (
    <>
      <div
        className="filter-listing-bar relative flex-row align-center"
        key={`${params.boutiqueId}-${JSON.stringify(searchParams)}`}
      >
        <NextLink
          data={{
            is_full_home: true,
          }}
          href={`/${params.lang}`}
          ariaLabel={`TryDos Home ${params.lang}`}
          className="back-icon"
          data-cy="backIcon_pageAfterClickSearchTotal"
        >
          <BackIcon data-cy="back_icon_boutique_page" />
        </NextLink>
        {/** TODO: classname edit when serach active w-full */}
        <div className={`filter-bar-options flex-row align-center`}>
          <Suspense
            fallback={
              <div className="filter-option">
                <Skeleton width={30} height={30} borderRadius={10} />
              </div>
            }
          >
            <SearchBoutiquePage />
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
          searchParams
        )}`}
      >
        <Suspense key={params.boutiqueId} fallback={<BoutiqueHeaderSkeleton />}>
          <BoutiqueHeader
            boutique={boutique}
            key={params.boutiqueId}
          ></BoutiqueHeader>
        </Suspense>
        <Suspense
          key={`Suspense-filter-list-${params.boutiqueId}`}
          fallback={<FiltersSkeleton />}
        >
          <FilterList
            filters={filters}
            boutique={boutique}
            currency={currency}
            key={`filter-list-${params.boutiqueId}`}
            params={params}
            searchParams={searchParams}
          />
        </Suspense>
      </div>
      <Suspense
        key={`Suspense-product-list-${JSON.stringify(searchParams)}`}
        fallback={<ListingSkeleton forProducts={true} />}
      >
        <ProductListServer
          products={filtersData.products}
          offset={filtersData.offset}
          currency={currency}
          key={`product-list-${JSON.stringify(searchParams)}`}
          searchParams={searchParams}
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
