import "styles/productDetails.css";
import { ComparePagePropsType } from "models/componentType/compareTypes/comparePagePropsType";
import { notFound } from "next/navigation";
import ComparePage from "components/global/compare";

import { Suspense } from "react";

export const dynamic = "auto";
export async function generateMetadata({ params }) {
  try {
    const metadata = {
      title: "Compare Products - TryDos",
      description:
        "Compare products side by side on TryDos - Make informed purchasing decisions.",
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${params.lang}/compare`,
      },
    };
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

  return (
    <>
      <ComparePage />
    </>
  );
}

export default Page;
