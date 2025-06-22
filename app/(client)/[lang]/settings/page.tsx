import Setting from "components/global/Setting";
import React, { Suspense } from "react";
import { getSettingsMetadata } from "../MetaData";
import { settingsPagePropsType } from "models/componentType/settingsType/settingsPagePropsType";
export async function generateMetadata({ params, searchParams }) {
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

async function page({ params, searchParams }: settingsPagePropsType) {
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
      <Setting lang={params.lang} />
    </>
  );
}

export default page;
