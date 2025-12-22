export const dynamic = "force-dynamic";
import StoriesBarServer from "components/Server/StoriesBarServer";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import OfferListSkeleton from "components/skeleton/OfferList";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import { Suspense } from "react";
import Home from "components/Home";
import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";
import { getCurrency } from "serverRequests";
import MainCategoriesNavbar from "components/Server/MainCategories";
import { LogServerError } from "utils/serverErrorReporter";
import SearchIcon from "components/Home/Search/SearchIcon";

import { BoutiquesListWrapper } from "components/ServerWrapper/BoutiquesListWrapper";
import { FlashProductWrapper } from "components/ServerWrapper/FlashDealsProduct";
import { FeaturedProductWrapper } from "components/ServerWrapper/FeaturedProduct";
import { GetHomeMetaData } from "serverRequests/meta/home";

export async function generateMetadata({ params }) {
  try {
    let Params = await params;
    let [country, language] = Params.lang.split("-");
    const metadata = await GetHomeMetaData({ language, country });

    return { ...metadata };
  } catch (error) {
    return {
      title: "TryDos - Premium Shopping Experience",
      description:
        "Discover premium products on TryDos - Your ultimate shopping destination with featured products, flash deals, and boutique collections.",
    };
  }
}

async function HomePage({ params }) {
  let { lang } = await params;
  const [country, language] = lang.split("-");
  let currency = await getCurrency(country, language);
  const isRtl = language === "ar" || language === "ku";
  try {
    return (
      <>
        {/* <StructuredDataScript lang={lang} /> */}

        <div
          className={`${
            isRtl ? "flex-row-reverse pr-[10px]" : "flex-row pl-[10px]"
          }  bg-white w-full pl-[10px] shadow-[0px_0px_6px_rgb(0,0,0,0.1)] z-[999999995]`}
        >
          <SearchIcon />
          <Suspense
            fallback={<MobileNavigationSkeleton />}
            key={`Navbar ${lang}`}
          >
            {/*@ts-expect-error Async Server Component is valid in Next  */}
            <MainCategoriesNavbar lang={lang} mainCategory={null} />
          </Suspense>
        </div>

        <Suspense fallback={<StoriesSkeleton />} key={`Stories ${lang}`}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <StoriesBarServer
            language={lang.split("-")[1]}
            country={lang.split("-")[0]}
          />
        </Suspense>

        <Suspense fallback={<FeaturedProductsSkeleton />}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <FeaturedProductWrapper currency={currency} lang={lang} />
        </Suspense>
        <Suspense fallback={<FeaturedProductsSkeleton />}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}

          <FlashProductWrapper currency={currency} lang={lang} />
        </Suspense>
        <Home key={`Home ${lang}`} />
        <Suspense fallback={<OfferListSkeleton />} key={`OfferList ${lang}`}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <BoutiquesListWrapper currency={currency} params={{ lang: lang }} />
        </Suspense>
      </>
    );
  } catch (error) {
    LogServerError(error, `/${lang}`);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export default HomePage;
// Main Categories Bar

// Featured Products

// FlasDeals Products
