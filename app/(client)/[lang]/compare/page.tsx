import "styles/productDetails.css";
import { ComparePagePropsType } from "models/componentType/compareTypes/comparePagePropsType";
import { notFound } from "next/navigation";
import ComparePage from "components/global/compare";
import { getCompareMetadata } from "../MetaData";
import { Suspense } from "react";

export const dynamic = "auto";
export async function generateMetadata({ params, searchParams }) {
  try {
    const metadata = await getCompareMetadata({ params, searchParams });
    return metadata;
  } catch (error) {
    console.log(error);
    return {
      title: "Compare Products - TryDos",
      description:
        "Compare products side by side on TryDos - Make informed purchasing decisions.",
    };
  }
}

interface Props {
  params: {
    lang: string;
  };
  searchParams: any;
}
async function Page({ params, searchParams }: ComparePagePropsType) {
  // Server component to render JSON-LD structured data
  async function StructuredDataScript({ params, searchParams }) {
    try {
      const metadataWithStructuredData = await getCompareMetadata({
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
      <ComparePage />
    </>
  );
}

export default Page;
