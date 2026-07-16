"use client";

import { useEffect } from "react";
import { useAppStore } from "store";

/**
 * Clears the full-screen page loader (`isNavigating`) on mount.
 *
 * Listing navigations show the loader and rely on the destination's
 * `ProductsInfiniteScroll` mount to clear it. The empty ("no products found")
 * state renders no infinite scroll, so without this the loader set by the
 * originating link (e.g. a filter link that happened to land on zero results)
 * would hang. Render it inside the empty state.
 */
export default function PageLoaderReset() {
  useEffect(() => {
    useAppStore.getState().setIsNavigating(null);
  }, []);
  return null;
}
