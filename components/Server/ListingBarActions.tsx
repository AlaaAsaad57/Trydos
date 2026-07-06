import { Suspense } from "react";
import FilterBoutiquePageButton from "components/filterPage/FilterBoutiquePageButton";
import ListingSortControl from "components/Listing/ListingSortControl";
import ListingShareControl from "components/Listing/ListingShareControl";
import ListingBarActionsClient from "components/Listing/ListingBarActionsClient";

/**
 * ListingBarActions — the sort / filter / share trio in the listing bar.
 *
 * Split gate: sort + filter only make sense with more than one result (nothing
 * to reorder/narrow at ≤1), so they show only when the count is >1; share stays
 * useful on a single result, so it keeps the >0 gate. The server seeds both
 * verdicts from the ES result; `ListingBarActionsClient` then keeps them in sync
 * with client-side search (search-param refactor). The search input is
 * intentionally NOT part of this group — it stays visible so the user can change
 * a query that returned no matches.
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
  const count = filtersData?.products?.length ?? 0;
  const hasResults = count > 0; // share gate
  const hasMultipleResults = count > 1; // sort/filter gate

  return (
    <ListingBarActionsClient
      serverHasResults={hasResults}
      serverHasMultipleResults={hasMultipleResults}
      share={<ListingShareControl language={language} isRtl={isRtl} />}
    >
      <ListingSortControl language={language} isRtl={isRtl} />
      <FilterBoutiquePageButton key="filter-button" />
    </ListingBarActionsClient>
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
