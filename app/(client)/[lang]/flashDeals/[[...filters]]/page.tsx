export const runtime = "nodejs";
// export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export const dynamic = "force-dynamic";
import FilterList from "components/Server/FilterList";
import ProductListServer from "components/Server/ProductList";
import BackIcon from "public/svg/listing/backIcon";
import SortIcon from "public/svg/listing/sortIcon";
import ListingSkeleton from "components/skeleton/listing";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import NextLink from "components/global/NextLink";
import VerificationIcon from "public/svg/listing/VerificationIcon";
import TopStarIcon from "public/svg/listing/TopStar";
import Image from "next/image";
import "styles/listing-components.css";

import FilterWidgetContainer from "components/filterPage/FiltersWidget";
import ShareBoutiquePageButton from "components/filterPage/ShareBoutiquePageButton";
import FilterBoutiquePageButton from "components/filterPage/FilterBoutiquePageButton";
import SearchBoutiquePage from "components/filterPage/SearchBoutiquePage";
import CarouselContainer from "components/filterPage/CarouselContainer";
import { GetImageUrl, parseFiltersFromParams } from "utils/tinyUtils";
import { fetchCurrency } from "serverRequests";
import { getProductsAndFiltersFromElastic } from "services/elastic/elasticSearch";
import { getCurrencyFromCache, StoreCurrency } from "serverRequests/radis";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";
import {
  getBoutiqueMetadata,
  GetStructuredData,
} from "../../filters/[[...filters]]/Metadata";
import DataSourceLogger from "components/global/DataSourceLogger";
import { getCookieServer } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";

export const dynamicParams = true;

export async function generateMetadata({ params }) {
  // Fetch your main product categories
  let Params = await params;
  try {
    const metadata = await getBoutiqueMetadata({
      params: Params,
      options: { is_fearured: false, is_flashDeals: true },
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
async function GetBoutique(boutique, country, language) {
  try {
    if (boutique) {
      let reader = new ElasticsearchReader();
      let boutiqueData = await reader.getBoutiqueInfo({
        country,
        language: language,
        slug: boutique,
      });
      if (!boutiqueData?.banners) {
        redirect(`/${country}-${language}?message=boutique_not_found`);
      }
      return boutiqueData;
    } else {
      return {
        banners: null,
        name: "Search",
      };
    }
  } catch (error) {
    return {
      banners: null,
      name: "Search",
    };
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
      let currency = currencyData.data.currency;

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
          s.split("-").map((d) => Number(d))
        )?.[0],
      };
    }
    let start = process.hrtime.bigint();

    let [filtersData, currency, boutique] = await Promise.all([
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
      }),
      getCurrency(country, language),
      GetBoutique(boutiqueItem, country, language),
    ]);
    let end = process.hrtime.bigint();

    let filters = {
      categories: filtersData?.categories || [],
      brands: filtersData?.brands || [],
      colors: filtersData?.colors || [],
      // prices: [],
      prices: filtersData?.prices?.priceRanges || [],
      sizes: filtersData?.attributes?.[0]?.options || [],
      boutiques: filtersData?.boutiques || [],
      search_text: parsedFilters?.search_text?.[0] || null,
    };
    const isRtl = language === "ar" || language === "ku";
    const redeemed_ids = (await getCookieServer<any[]>("redemed_ids")) ?? [];
    let productsData = filtersData.products.map((product) => {
      if (product?.is_redeem) {
        return {
          name: product?.name,
          slug: product?.slug,
          label_names: product?.label_names,
          category_tree: product?.category_tree,
          flash_deal_price: product.flash_deal_price,
          videos: product.videos,
          colors: product?.colors,
          sync_color_images: product?.sync_color_images,
          ...(!product?.sync_color_images ||
          product?.sync_color_images?.length === 0
            ? { images: product.images }
            : {}),
          price: product.price,
          offer_price: product.offer_price,
          redeem_price: product.redeem_price,
          categories: product?.categories?.map((s) => ({
            name: s.name,
            id: s.id,
          })),
          brand: { id: product?.brand?.id, icon: product?.brand?.icon },
          flash_deal_end_date: product.flash_deal_end_date,
          product_id: product.product_id,
          is_redeem: !redeemed_ids.find((s) => s.id === product.product_id),
        };
      } else
        return {
          name: product?.name,
          slug: product?.slug,
          label_names: product?.label_names,
          category_tree: product?.category_tree,
          videos: product.videos,
          colors: product?.colors,
          sync_color_images: product?.sync_color_images,
          ...(!product?.sync_color_images ||
          product?.sync_color_images?.length === 0
            ? { images: product.images }
            : {}),
          price: product.price,
          offer_price: product.offer_price,
          redeem_price: product.redeem_price,
          categories: product?.categories?.map((s) => ({
            name: s.name,
            id: s.id,
          })),
          brand: { id: product?.brand?.id, icon: product?.brand?.icon },
          flash_deal_end_date: product.flash_deal_end_date,
          is_redeem: !redeemed_ids.find((s) => s.id === product.product_id),
          product_id: product.product_id,
        };
    });
    return (
      <>
        <Suspense fallback={<></>}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <GetStructuredData
            is_fearured={false}
            response={filtersData}
            is_flashDeals={true}
            params={Params}
          />
        </Suspense>
        <Suspense fallback={<></>}>
          <FilterWidgetContainer key={JSON.stringify(parsedFilters)} />
        </Suspense>
        <div
          data-cy="filter_listing_bar"
          className={`filter-listing-bar z-[99999999] relative ${
            isRtl ? "flex-row-reverse flex" : "flex-row flex"
          } align-center w-full h-[50px] pl-[15px] pr-[20px] justify-between bg-white z-10`}
        >
          <DataSourceLogger
            dataSourceString={`Listing flashdeals DataSource : products and filters from elastic , currency from ${
              currency?.redis ? "redis" : "laravel api"
            } in ${Number(end - start) / 1_000_000} ms`}
          />

          <NextLink
            data-cy="BackIcon_boutique"
            ignoreConditionCase={true}
            data={{
              is_full_home: true,
              href: `/${Params.lang}`,
            }}
            href={`/${Params.lang}`}
            ariaLabel={`TryDos Home ${Params.lang}`}
            className="back-icon"
          >
            <BackIcon
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
            <SearchBoutiquePage search_text={parsedFilters?.search_text?.[0]} />

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
        >
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <BoutiqueHeader
            boutique={boutique}
            key={Params.filters?.join("/") || "no-filters"}
          ></BoutiqueHeader>

          <Suspense fallback={<ListingSkeleton justFilters={true} />}>
            {
              <FilterList
                filters={filters}
                itemsLength={productsData?.length}
                currency={currency}
                key={`filter-list-filters`}
                params={Params}
                parsedFilters={parsedFilters}
                isFeatured={false}
                isFlashDeals={true}
              />
            }
          </Suspense>
        </div>
        <Suspense
          key={`Suspense-product-list-${JSON.stringify(parsedFilters)}`}
          fallback={<ListingSkeleton forProducts={true} />}
        >
          <ProductListServer
            isFeatured={false}
            isFlashDeals={true}
            boutique={boutique?.banners ? boutique : null}
            colors={filtersData?.colors}
            products={productsData ?? []}
            offset={filtersData?.offset}
            currency={currency}
            key={`product-list-${JSON.stringify(parsedFilters)}`}
            parsedFilters={parsedFilters}
            params={Params}
          />
        </Suspense>
      </>
    );
  } catch (error) {
    const filtersPath =
      Array.isArray(Params.filters) && Params.filters.length > 0
        ? `/${Params.filters.join("/")}`
        : "";
    LogServerError(error, `/${Params.lang}/flashDeals/${filtersPath}`);
    throw error instanceof Error ? error : new Error(String(error));
  }
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
