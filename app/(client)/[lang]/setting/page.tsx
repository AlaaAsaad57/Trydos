export const dynamic = "auto";
export const runtime = "nodejs";
// export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
// export const preferredRegion = process.env.PREFERRED_REGION || "bom1";
import Settings from "components/settings";
import React from "react";
export async function generateMetadata({ params }) {
  let Params = await params;
  try {
    const metadata = {
      title: "Settings - TryDos",
      description: "Manage your TryDos account settings and preferences.",
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${Params.lang}/setting`,
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
  let Params = await params;
  let SearchParams = await searchParams;
  // Server component to render JSON-LD structured data
  let order_id = SearchParams?.id;
  let tab = SearchParams?.tab;

  return (
    <>
      <Settings order_id={order_id} tab={tab} lang={Params.lang} />
    </>
  );
}

export default page;
