export const dynamic = "auto";
export const runtime = "nodejs";
export const preferredRegion = process.env.PREFERRED_REGION || "bom1";
import Settings from "components/settings";
import React from "react";

import { settingPagePropsType } from "models/componentType/settingTypes/settingPagePropsType";

export async function generateMetadata({ params }: settingPagePropsType) {
  try {
    const metadata = {
      title: "Settings - TryDos",
      description: "Manage your TryDos account settings and preferences.",
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/setting`,
      },
    };
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
  let order_id = searchParams?.id;
  let tab = searchParams?.tab;
  return (
    <>
      <Settings order_id={order_id} tab={tab} lang={params.lang} />
    </>
  );
}

export default page;
