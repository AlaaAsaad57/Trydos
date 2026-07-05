import { Suspense } from "react";
import FilterBoutiquePageButton from "components/filterPage/FilterBoutiquePageButton";
import ListingSortControl from "components/Listing/ListingSortControl";
import ListingShareControl from "components/Listing/ListingShareControl";

/**
 * ListingBarActions — the sort / filter / share trio in the listing bar.
 *
 * These three controls only make sense when the listing has products: with an
 * empty result set there is nothing to sort, nothing to filter down, and no
 * result page worth sharing. So we gate them on the ES result and render
 * nothing when `products` is empty. The search input is intentionally NOT part
 * of this group — it stays visible so the user can change a query that
 * returned no matches.
 *
 * Awaiting the filters promise here (inside its own Suspense boundary, fallback
 * `null`) keeps the page shell streaming: the bar renders immediately and the
 * actions fill in once ES resolves — the same model the rest of the listing
 * uses. Shared by the boutique/search listing, `featured`, and `flashDeals`.
 */
async function ListingBarActionsInner({
  filtersPromise,
  language,
  isRtl,
}: {
  filtersPromise: Promise<{ products?: unknown[] }>;
  language: string;
  isRtl: boolean;
}) {
  const filtersData = await filtersPromise;
  const hasResults = (filtersData?.products?.length ?? 0) > 0;
  if (!hasResults) return null;

  return (
    <>
      <ListingSortControl language={language} isRtl={isRtl} />
      <FilterBoutiquePageButton key="filter-button" />
      <ListingShareControl language={language} isRtl={isRtl} />
    </>
  );
}

export default function ListingBarActions(props: {
  filtersPromise: Promise<{ products?: unknown[] }>;
  language: string;
  isRtl: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <ListingBarActionsInner {...props} />
    </Suspense>
  );
}
