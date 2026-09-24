"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "store";

/**
 * Shared back-navigation behaviour for the seller-dashboard detail routes
 * (product / boutique — edit and create).
 *
 * Returns an `onBackIntercept` for {@link BackBar}:
 *  - If the seller arrived from the dashboard list (any in-app nav whose
 *    previous path is this dashboard), back rewinds browser history so the exact
 *    list + `?tab=` they were on is restored, showing a dashboard-shaped
 *    placeholder during the transition.
 *  - On a direct landing / refresh (no dashboard origin) it returns `false`, so
 *    BackBar performs its default (`preivous_page` → dashboard home).
 *
 * It also clears `isNavigating` once the detail route mounts, so the forward
 * in-flow loader (set on the originating card click) is dismissed — mirroring
 * how ProductBackButton clears it on the product page.
 *
 * THE TWO PAYLOAD KEYS, AND WHY THEY ARE SEPARATE
 *  - `is_seller_dashboard` picks the loader shape (InFlowPageLoader). It belongs
 *    to the BACK journey only: the forward click is heading for an editor, and
 *    drawing the dashboard there would show the shape of the page being left.
 *  - `no_overlay_scroll` tells NavigationLoaderGate not to run the overlay
 *    scroll handling. The dashboard is an ordinary page, so scrolling it to the
 *    top on the way back is wrong; the forward click is left alone, because
 *    landing at the top of a fresh editor is right.
 *
 * A bare `true` here used to mean both: the generic 5x-scaled spinner in a
 * half-screen box, plus a scroll-to-top. That is what collapsed the page.
 */
export function useDashboardDetailBack(sellerId: string) {
  const router = useRouter();
  const { setIsNavigating, lastPathname } = useAppStore();

  useEffect(() => {
    setIsNavigating(null);
  }, [setIsNavigating]);

  const onBackIntercept = () => {
    if (lastPathname && lastPathname.includes(`/sellerDashboard/${sellerId}`)) {
      setIsNavigating({ is_seller_dashboard: true, no_overlay_scroll: true });
      router.back();
      return true;
    }
    return false;
  };

  return onBackIntercept;
}
