"use client";

import { useEffect } from "react";
import { useAppStore } from "store";

/**
 * ListingBarActionsClient — the reactive gate for the sort/filter/share trio.
 *
 * Seeded by the server's has-results verdict (`serverHasResults`) on each real
 * server render (path-filter change / fresh load / shared link). A client-side
 * search then updates `store.searchHasResults` (via ProductsInfiniteScroll), so
 * a search that returns nothing hides the trio and one that returns results
 * shows it — without a full page re-render. The search input itself is NOT part
 * of this group (it stays visible so the user can fix a zero-result query).
 */
export default function ListingBarActionsClient({
  serverHasResults,
  children,
}: {
  serverHasResults: boolean;
  children: React.ReactNode;
}) {
  const hasResults = useAppStore((s) => s.searchHasResults);
  const setSearchHasResults = useAppStore((s) => s.setSearchHasResults);

  // Re-seed the store whenever the server re-renders with a new verdict.
  useEffect(() => {
    setSearchHasResults(serverHasResults);
  }, [serverHasResults, setSearchHasResults]);

  if (!hasResults) return null;
  return <>{children}</>;
}
