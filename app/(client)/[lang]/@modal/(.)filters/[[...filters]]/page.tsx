import { Suspense } from "react";
import FiltersPageContent from "components/Listing/FiltersPageContent";
import ListingPageSkeleton from "components/Listing/ListingPageSkeleton";

// Instant navigation (Next 16.3). A tap inside the app lands on this copy of the
// page, so its shell is prefetched and the skeleton shows with no server wait.
// `instant = false` is needed with it: the root layout's client parts read the
// URL outside <Suspense>, and the prefetch still carries this page's skeleton.
export const prefetch = "partial";
export const instant = false;

async function Listing({ params, searchParams }) {
  const Params = await params;
  const sp = (await searchParams) ?? {};
  const sort = typeof sp.sort === "string" ? sp.sort : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  // `intercepted`: this is the @modal slot, where a server redirect() cannot
  // navigate the browser — a missing boutique is sent away client-side instead.
  return (
    // @ts-ignore
    <FiltersPageContent
      params={Params}
      sort={sort}
      search={search}
      intercepted
    />
  );
}

export default function InterceptedFiltersPage({ params, searchParams }) {
  return (
    <Suspense fallback={<ListingPageSkeleton />}>
      <Listing params={params} searchParams={searchParams} />
    </Suspense>
  );
}
