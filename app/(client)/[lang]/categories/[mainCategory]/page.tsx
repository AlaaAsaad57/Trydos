import Home from "components/Home";
import NavbarServer from "components/Server/Navbar";
import OfferListServer from "components/Server/OfferListServer";
import StoriesBarServer from "components/Server/StoriesBarServer";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import OfferListSkeleton from "components/skeleton/OfferList";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import { Suspense } from "react";
import { getCategoriesMetadata } from "../../MetaData";

export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
export const runtime = "nodejs";
export const preferredRegion = ["bom1", "sin1"];

export async function generateMetadata({ params, searchParams }) {
  try {
    const metadata = await getCategoriesMetadata({ params, searchParams });
    return metadata;
  } catch (error) {
    console.log(error);
    return {
      title: `Categories - TryDos`,
      description:
        "Browse product categories on TryDos - Find exactly what you're looking for.",
    };
  }
}

interface Props {
  params: {
    lang: string;
    mainCategory: string;
  };
  searchParams?: any;
}
function page({ params, searchParams }: Props) {
  // Server component to render JSON-LD structured data
  async function StructuredDataScript({ params, searchParams }) {
    try {
      const metadataWithStructuredData = await getCategoriesMetadata({
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

      <Suspense fallback={<MobileNavigationSkeleton />}>
        <NavbarServer lang={params.lang} mainCategory={params?.mainCategory} />
      </Suspense>
      <Suspense fallback={<StoriesSkeleton />}>
        <StoriesBarServer
          language={params.lang.split("-")[1]}
          country={params.lang.split("-")[0]}
        />
      </Suspense>
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            Loading...
          </div>
        }
      >
        <Home />
      </Suspense>
      <Suspense fallback={<OfferListSkeleton />}>
        <OfferListServer params={params} />
      </Suspense>
    </>
  );
}

export default page;
