"use client";
import { useEffect } from "react";
import { useAppStore } from "store";

/**
 * Fallback clear for the in-flow navigation loader.
 *
 * The precise, data-ready clear is done by each destination on mount
 * (ProductInfiniteScroll, InfinteScroll, ProductBackButton, InitialNavigation,
 * compare.tsx, …). Because `.main-content` hides `children` while `isNavigating`
 * is set, a navigation whose clearer never fires would leave the page hidden.
 *
 * This watches `isNavigating` itself: whenever it becomes truthy, arm a grace
 * timeout; if the destination has not cleared it by then, force-clear it so the
 * hidden page can never stay hidden. Watching the flag (rather than the pathname)
 * is deliberate — some navigations that set `isNavigating` change only the query
 * (home category `?mainCategory=`, listing `?sort=`), and with
 * `next.config` `staleTimes.dynamic` the destination RSC can be served from cache
 * with no remount, so its own clearer never runs and no pathname change occurs.
 * In the normal case the destination clears first and the timeout is cancelled.
 */
export default function NavigationLoaderSafetyNet() {
  const isNavigating = useAppStore((s) => s.isNavigating);

  useEffect(() => {
    if (!isNavigating) return;
    const id = setTimeout(() => {
      if (useAppStore.getState().isNavigating) {
        useAppStore.getState().setIsNavigating(null);
      }
    }, 2500);
    return () => clearTimeout(id);
  }, [isNavigating]);

  return null;
}
