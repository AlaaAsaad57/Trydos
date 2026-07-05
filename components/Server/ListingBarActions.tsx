import { Suspense } from "react";
import FilterBoutiquePageButton from "components/filterPage/FilterBoutiquePageButton";
import ListingSortControl from "components/Listing/ListingSortControl";
import ListingShareControl from "components/Listing/ListingShareControl";
import ListingBarActionsClient from "components/Listing/ListingBarActionsClient";

/**
 * ListingBarActions — the sort / filter / share trio in the listing bar.
 *
 * The trio only makes sense with a non-empty result set. The server seeds the
 * verdict from the ES result; `ListingBarActionsClient` then keeps it in sync
 * with client-side search (see Task 5 of the search-param refactor). The search
 * input is intentionally NOT part of this group — it stays visible so the user
 * can change a query that returned no matches.
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

  return (
    <ListingBarActionsClient serverHasResults={hasResults}>
      <ListingSortControl language={language} isRtl={isRtl} />
      <FilterBoutiquePageButton key="filter-button" />
      <ListingShareControl language={language} isRtl={isRtl} />
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
