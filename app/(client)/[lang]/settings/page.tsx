import Setting from "components/global/Setting";
import React from "react";
export async function generateMetadata({ params, searchParams }) {
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

async function page({ params }) {
  // Server component to render JSON-LD structured data
  let Params = await params;
  return (
    <>
      <Setting lang={Params.lang} />
    </>
  );
}

export default page;
