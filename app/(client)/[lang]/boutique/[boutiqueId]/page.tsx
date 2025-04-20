import FilterList from "components/Server/FilterList";
import ProductListServer from "components/Server/ProductList";
import BackIcon from "public/svg/listing/backIcon.svg";
import SortIcon from "public/svg/listing/sortIcon.svg";
import ListingSkeleton from "components/skeleton/listing";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getBoutiques } from "store/homepage/cachedActions";
import {
  fetchWithRetry,
  getBoutiqueMeta,
  getConfiguredImage,
} from "utils/functions";
import NextLink from "components/global/NextLink";
import SearchBoutiquePage from "components/filterPage/SearchBoutiquePage";
import ShareBoutiquePageButton from "components/filterPage/ShareBoutiquePageButton";
import VerificationIcon from "public/svg/listing/VerificationIcon.svg";
import TopStarIcon from "public/svg/listing/TopStar.svg";
import Image from "next/image";
import BorderImage from "components/ListingPage/BorderImage";
import "styles/listing-components.css";
import Skeleton from "react-loading-skeleton";
import FilterBoutiquePageButton from "components/filterPage/FilterBoutiquePageButton";
import { CurrencyApi } from "models/Api";
export const dynamicParams = true;

export async function generateMetadata({ params, searchParams }: Props) {
  const boutiqueId = params.boutiqueId;
  try {
    const metaData =
      boutiqueId === "listing"
        ? { name: "listing" }
        : await getBoutiqueMeta({ boutiqueId, lang: params.lang });

    if (!metaData?.name) {
      notFound();
    }
    if (boutiqueId === "listing") {
      return {
        title: `Trydos - ${searchParams.searchText || "Search"} `,
        description: ``,
      };
    } else
      return {
        title: `Trydos - ${metaData?.name} `,
        // @ts-ignore
        description: `${metaData?.name} - ${metaData?.description} `,
      };
  } catch (error) {
    console.error(error);
    notFound();
  }
}

export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);

export async function generateStaticParams({ params }) {
  // Fetch your main product categories
  try {
    const boutiques_slugs = await getBoutiques({
      lang: params.lang ? params.lang.split("-")[1] : null,
      country: params.lang ? params.lang.split("-")[0] : null,
      str: "",
    });

    return boutiques_slugs.map((category) => ({
      boutiqueId: category,
      lang: params.lang,
    }));
  } catch (error) {
    console.log(error);
    return [];
  }
}
interface Props {
  params: {
    lang: string;
    boutiqueId: string;
  };
  searchParams: {
    categories: string;
    prices: string;
    searchText: string;
    brands: string;
    colors: string;
  };
}
interface ParamsType {
  lang: string;
  boutiqueId: string;
}
export default function Page({
  params,
  searchParams,
}: {
  params: ParamsType;
  searchParams: any;
}) {
  return (
    <>
      <div className="filter-listing-bar relative flex-row align-center">
        <NextLink
          href={`/${params.lang}`}
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
            fallback={
              <div className="filter-option">
                <Skeleton width={30} height={30} borderRadius={10} />
              </div>
            }
          >
            <FilterBoutiquePageButton />
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

      <Suspense
        key={JSON.stringify(searchParams)}
        fallback={
          <ListingSkeleton
            forProducts={true}
            withBanners={params.boutiqueId !== "listing"}
          />
        }
      >
        <div
          className={`boutique-header ${"flex-col"} align-center`}
          data-cy="boutiqueOpen"
        >
          <Suspense
            key={JSON.stringify(params)}
            fallback={<ListingSkeleton forProducts={false} />}
          >
            <BoutiqueHeader
              boutiqueId={params.boutiqueId}
              lang={params.lang}
            ></BoutiqueHeader>
          </Suspense>
          <Suspense
            key={JSON.stringify(searchParams)}
            fallback={<ListingSkeleton forProducts={false} />}
          >
            <FilterList params={params} searchParams={searchParams} />
          </Suspense>
        </div>
        <Suspense
          key={JSON.stringify(searchParams)}
          fallback={<ListingSkeleton forProducts={true} />}
        >
          <ProductListServer searchParams={searchParams} params={params} />
        </Suspense>
      </Suspense>
    </>
  );
}
async function BoutiqueHeader({ boutiqueId, lang }) {
  const boutique =
    boutiqueId === "listing"
      ? { name: "Search", banners: null, icon: null }
      : await getBoutiqueMeta({ boutiqueId, lang });
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
      <div className="offer-slider-container">
        {banners &&
          banners?.map((banner, index) => (
            <div className="offer-slide-item" style={{ width: "100%" }}>
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
