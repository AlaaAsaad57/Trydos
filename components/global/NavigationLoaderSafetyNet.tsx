"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "store";

/**
 * Fallback clear for the in-flow navigation loader.
 *
 * The precise, data-ready clear is done by each destination on mount
 * (ProductInfiniteScroll, InfinteScroll, ProductBackButton, InitialNavigation,
 * compare.tsx, …). Because `.main-content` hides `children` while `isNavigating`
 * is set, a route with NO clearer would hang. This watches the pathname and, a
 * short beat after it changes, clears `isNavigating` if it is somehow still set —
 * so navigation can never hang. In the normal case the destination clears first
 * and this is a no-op.
 */
export default function NavigationLoaderSafetyNet() {
  const pathname = usePathname();
  const prev = useRef(pathname);

  useEffect(() => {
    if (prev.current === pathname) return;
    prev.current = pathname;

    const id = setTimeout(() => {
      if (useAppStore.getState().isNavigating) {
        useAppStore.getState().setIsNavigating(null);
      }
    }, 1500);

    return () => clearTimeout(id);
  }, [pathname]);

  return null;
}
