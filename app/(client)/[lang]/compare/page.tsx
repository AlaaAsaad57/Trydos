import { lang as langParam } from "next/root-params";
import "styles/productDetails.css";
import ComparePage from "components/global/compare";
import { Suspense } from "react";
import CompareSkeleton from "components/skeleton/loaders/CompareSkeleton";
import { buildAlternates } from "serverRequests/meta/buildAlternates";
import { translateFunction } from "utils/server";

export const dynamic = "auto";

export async function generateMetadata() {
  const lang = await langParam();
  const [country, language] = lang?.split("-");
  const metadata = {
    title: translateFunction("Compare Products - TryDos", language),
    description: translateFunction(
      "Compare products side by side on TryDos - Make informed purchasing decisions.",
      language,
    ),
    alternates: buildAlternates(lang, "/compare"),
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
