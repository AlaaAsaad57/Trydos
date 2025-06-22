import Settings from "components/settings";
import React, { Suspense } from "react";
import { getSettingsMetadata } from "../MetaData";
import { settingPagePropsType } from "models/componentType/settingTypes/settingPagePropsType";

export const dynamic = "auto";

export async function generateMetadata({ params, searchParams }: settingPagePropsType) {
  try {
    const metadata = await getSettingsMetadata({ params, searchParams });
    return metadata;
  } catch (error) {
    console.log(error);
    return {
      title: "Settings - TryDos",
      description: "Manage your TryDos account settings and preferences.",
    };
  }
}

async function page({ params, searchParams }) {
  // Server component to render JSON-LD structured data
  async function StructuredDataScript({ params, searchParams }) {
    try {
      const metadataWithStructuredData = await getSettingsMetadata({
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
      <Settings lang={params.lang} />
    </>
  );
}

export default page;
