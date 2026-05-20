export const revalidate = 60;
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
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";

import { BoutiquesListWrapper } from "components/ServerWrapper/BoutiquesListWrapper";
import { FlashProductWrapper } from "components/ServerWrapper/FlashDealsProduct";
import { FeaturedProductWrapper } from "components/ServerWrapper/FeaturedProduct";
import { GetHomeMetaData } from "serverRequests/meta/home";
import { translateFunction } from "utils/server";

export async function generateMetadata({ params, searchParams }) {
  let [Params, query] = await Promise.all([params, searchParams]);
  let mainCategory = query?.mainCategory || null;
  try {
    const metadata = await GetHomeMetaData({
      local: Params.lang,
      category: mainCategory,
    });

    return { ...metadata };
  } catch (error) {
    LogServerError({ error, type: "meta" }, `/${Params.lang}`);
    const [country, language] = Params.lang.split("-");
    const baseUrl = General_Site_Data.url;
    const path = mainCategory ? `?mainCategory=${mainCategory}` : "";
    const fullUrl = `${baseUrl}/${Params.lang}${path}`;
    const ogImageUrl = baseUrl + General_Site_Data.og;
    const title = translateFunction(
      "TryDos - Premium Shopping Experience",
      language,
    );
    const description = translateFunction(
      "Discover premium products on TryDos - Your ultimate shopping destination with featured products, flash deals, and boutique collections.",
      language,
    );

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: fullUrl,
        siteName: "Trydos",
        type: "website",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };
  }
}

async function HomePage({ params, searchParams }) {
  let [Params, query] = await Promise.all([params, searchParams]);
  let lang = Params.lang;
  let mainCategory = query?.mainCategory || null;
  const [country, language] = lang.split("-");
  let currency = getCurrency(country, language);
  const isRtl = language === "ar" || language === "ku";
  try {
    return (
      <>
        {/* <StructuredDataScript lang={lang} /> */}
      
        <Suspense fallback={<StoriesSkeleton />} key={`Stories ${lang}`}>
          {/*@ts-expect-error Async Server Component is valid in Next  */}
          <StoriesBarServer
            language={lang.split("-")[1]}
            country={lang.split("-")[0]}
          />
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
