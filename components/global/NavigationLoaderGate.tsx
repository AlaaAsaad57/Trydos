"use client";

import type { ReactNode } from "react";
import { useAppStore } from "store";
import InFlowPageLoader from "components/global/InFlowPageLoader";

/**
 * Hosts the in-flow navigation loader ABOVE both page slots — the `children`
 * (real page) slot and the `@modal` (intercepted-overlay) slot.
 *
 * Why here and not inside `MainContent`: an intercepted route viewed as an
 * overlay (a `/products` or `/filters` page opened over a different base page,
 * i.e. any soft navigation) sets `overlayActive`, which hides `.main-content`
 * entirely. A loader living inside `.main-content` is therefore invisible for
 * every onward navigation started from an overlay. Sitting above both slots,
 * this gate shows the loader regardless of whether the current page is a real
 * `children` page or an intercepted overlay.
 *
 * While `isNavigating` is set the loader renders in normal flow (never
 * fixed/absolute — that was the original float-over-search-bar bug) and both
 * slots are hidden with `display:none` but kept MOUNTED, so each destination's
 * own clearer (ProductsInfiniteScroll, InitialNavigation, ProductBackButton, …)
 * still fires and then the swap reveals the real page.
 */
export default function NavigationLoaderGate({
  children,
}: {
  children: ReactNode;
}) {
  const isNavigating = useAppStore((s) => s.isNavigating);
  // `is_filter` (a listing re-filter) is handled IN-PLACE by the listing itself:
  // FilterList dims the real filter chrome and SortableGrid shows in-grid product
  // skeletons while the refetch is pending, so the chrome stays on screen instead
  // of being replaced by a full-screen loader. Every other navigation type still
  // gets the full in-flow loader here.
  const showLoader = !!isNavigating && !isNavigating.is_filter;

  return (
    <>
      {showLoader && (
        <div className="w-full flex-col main-content max-w-[1365px]">
          <InFlowPageLoader nav={isNavigating} />
        </div>
      )}
      <div style={{ display: showLoader ? "none" : "contents" }}>
        {children}
      </div>
    </>
  );
}
