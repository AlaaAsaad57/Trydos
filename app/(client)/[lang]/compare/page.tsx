import "styles/productDetails.css";
import ComparePage from "components/global/compare";
import { Suspense } from "react";
import CompareSkeleton from "components/skeleton/loaders/CompareSkeleton";

export const dynamic = "auto";

export async function generateMetadata({ params }) {
  let Params = await params;
  const metadata = {
    title: "Compare Products - TryDos",
    description:
      "Compare products side by side on TryDos - Make informed purchasing decisions.",
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_REMOTE_FRONT}/${Params.lang}/compare`,
    },
  };
  return metadata;
}

async function Page() {
  return (
    <Suspense fallback={<CompareSkeleton />}>
      <ComparePage showInstantLoading={false} />
    </Suspense>
  );
}

export default Page;
