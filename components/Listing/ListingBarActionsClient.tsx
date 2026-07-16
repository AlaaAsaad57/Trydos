"use client";

import { useEffect } from "react";
import { useAppStore } from "store";

/**
 * ListingBarActionsClient — the reactive SPLIT gate for the listing actions.
 *
 * Sort + filter (`children`) show only when there is MORE THAN ONE result
 * (`store.searchHasMultipleResults`) — reordering or narrowing a single result
 * is pointless. Share (the `share` slot) keeps the >0 gate, so it stays
 * available on a single-result page (useful to share one product). Both verdicts
 * are seeded by the server on each real render (path-filter change / fresh load
 * / shared link) and then kept in sync by client-side search (via
 * ProductsInfiniteScroll / SortableGrid) without a full page re-render. The
 * search input is NOT part of this group — it stays visible so the user can fix
 * a zero-result query.
 */
export default function ListingBarActionsClient({
  serverHasResults,
  serverHasMultipleResults,
  share,
  children,
}: {
  serverHasResults: boolean;
  serverHasMultipleResults: boolean;
  share: React.ReactNode;
  children: React.ReactNode;
}) {
  const hasResults = useAppStore((s) => s.searchHasResults);
  const hasMultipleResults = useAppStore((s) => s.searchHasMultipleResults);
  const setSearchHasResults = useAppStore((s) => s.setSearchHasResults);
  const setSearchHasMultipleResults = useAppStore(
    (s) => s.setSearchHasMultipleResults,
  );

  // Re-seed both verdicts whenever the server re-renders with a new count.
  useEffect(() => {
    setSearchHasResults(serverHasResults);
    setSearchHasMultipleResults(serverHasMultipleResults);
  }, [
    serverHasResults,
    serverHasMultipleResults,
    setSearchHasResults,
    setSearchHasMultipleResults,
  ]);

  return (
    <>
      {hasMultipleResults && children}
      {hasResults && share}
    </>
  );
}
