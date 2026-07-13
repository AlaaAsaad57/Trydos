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
 *    list + `?tab=` they were on is restored, showing the app's in-flow
 *    navigation loader (a spinner — never a skeleton) during the transition.
 *  - On a direct landing / refresh (no dashboard origin) it returns `false`, so
 *    BackBar performs its default (`preivous_page` → dashboard home).
 *
 * It also clears `isNavigating` once the detail route mounts, so the forward
 * in-flow loader (set on the originating card click) is dismissed — mirroring
 * how ProductBackButton clears it on the product page.
 */
export function useDashboardDetailBack(sellerId: string) {
  const router = useRouter();
  const { setIsNavigating, lastPathname } = useAppStore();

  useEffect(() => {
    setIsNavigating(null);
  }, [setIsNavigating]);

  const onBackIntercept = () => {
    if (lastPathname && lastPathname.includes(`/sellerDashboard/${sellerId}`)) {
      setIsNavigating(true);
      router.back();
      return true;
    }
    return false;
  };

  return onBackIntercept;
}
