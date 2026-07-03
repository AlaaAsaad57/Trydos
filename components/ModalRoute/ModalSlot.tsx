"use client";

import { useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import ModalOverlay from "./ModalOverlay";
import { useOverlayVisibility } from "./OverlayVisibility";

interface ModalSlotProps {
  children: React.ReactNode | null;
}

const isInterceptable = (path: string | null): boolean =>
  !!path && (/\/filters(\/|$)/.test(path) || /\/products(\/|$)/.test(path));

/**
 * Decides whether an intercepted route (`/filters`, `/products`) renders as an
 * overlay over the current page, or whether we just let the real page render in
 * the `children` slot.
 *
 * The overlay is only correct when the intercepted route is being viewed *over a
 * different base page* (e.g. a product opened from a listing). When the user is
 * ON the base page itself — a direct load/refresh, or pressing back to the page
 * they landed on — its real content already lives in the `children` slot, so the
 * overlay must NOT show (the intercept copy can be empty/stale, which blanked the
 * page). We track the base path (the last non-intercepted route, seeded from the
 * initial load) and only overlay when the current intercepted path differs.
 */
export default function ModalSlot({ children }: ModalSlotProps) {
  const pathname = usePathname();
  const { setOverlayActive } = useOverlayVisibility();

  // The route sitting in the `children` slot: the initial (hard-loaded) route,
  // then updated to any non-intercepted route we navigate to. Intercepted routes
  // render over this base, so they never change it.
  const basePathRef = useRef<string | null>(null);
  if (basePathRef.current === null && pathname) {
    basePathRef.current = pathname;
  }

  const onInterceptedRoute = isInterceptable(pathname);

  useEffect(() => {
    if (pathname && !isInterceptable(pathname)) {
      basePathRef.current = pathname;
    }
  }, [pathname]);

  const shouldShowOverlay =
    children != null &&
    onInterceptedRoute &&
    pathname !== basePathRef.current;

  // Hide the page body iff an overlay is actually showing. Driving this from
  // state (instead of ModalOverlay mutating `.main-content` on mount/unmount)
  // means the body can never get stuck hidden when the overlay goes away.
  useEffect(() => {
    setOverlayActive(shouldShowOverlay);
    return () => setOverlayActive(false);
  }, [shouldShowOverlay, setOverlayActive]);

  if (!shouldShowOverlay) return null;
  return <ModalOverlay>{children}</ModalOverlay>;
}
