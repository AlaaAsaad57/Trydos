import Setting from "components/global/Setting";
// export const revalidate = parseInt(process.env.NEXT_PUBLIC_REVALIDATE);
import React from "react";
import { LogServerError } from "utils/serverErrorReporter";
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

async function page({ params }) {
  // Server component to render JSON-LD structured data
  let Params = await params;
  try {
    return (
      <>
        <Setting lang={Params.lang} />
      </>
    );
  } catch (error) {
    LogServerError(error, `/${Params.lang}/settings`);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export default page;
