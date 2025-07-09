import Setting from "components/global/Setting";
import React from "react";
import { settingsPagePropsType } from "models/componentType/settingsType/settingsPagePropsType";
export async function generateMetadata({ params, searchParams }) {
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

async function page({ params }: settingsPagePropsType) {
  // Server component to render JSON-LD structured data

  return (
    <>
      <Setting lang={params.lang} />
    </>
  );
}

export default page;
