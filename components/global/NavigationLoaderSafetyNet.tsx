"use client";
import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAppStore } from "store";

/**
 * Fallback clear for the in-flow navigation loader.
 *
 * The precise, data-ready clear is done by each destination on mount
 * (ProductInfiniteScroll, InfinteScroll, ProductBackButton, InitialNavigation,
 * compare.tsx, …). Because `.main-content` hides `children` while `isNavigating`
 * is set, a navigation whose clearer never fires would leave the page hidden.
 *
 * It arms a short grace timeout **when the URL actually changes** (pathname OR
 * search params) — i.e. once the destination route has committed — and
 * force-clears `isNavigating` if the destination's own clearer did not.
 *
 * Watching the URL (rather than `isNavigating` on a fixed timer from nav-start)
 * is what makes it safe for SLOW navigations: the URL only changes once the
 * route commits, so the fallback can never fire mid-navigation and reveal the
 * origin page (the settings→home flash). Watching `searchParams` (not just
 * `pathname`) covers query-only navs (home `?mainCategory=`, listing `?sort=`)
 * whose RSC can be served from the Router Cache with no remount, so their own
 * clearer never runs.
 */
/**
 * A tap on a store or a product now changes the URL at once (Instant Navigation),
 * long before the page is ready. Its loader shows the tapped photo, and the real
 * page clears it, so the short grace time would pull the photo away. The longer
 * one only guards against a page that never arrives. It is for the page the tap
 * went to: after a quick "back" no page is on its way, and the short time holds.
 */
const TAP_GRACE_MS = 20000;
const GRACE_MS = 800;

function SafetyNetInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const url = `${pathname}?${searchParams.toString()}`;
  const prev = useRef(url);

  useEffect(() => {
    if (prev.current === url) return;
    prev.current = url;
    const nav = useAppStore.getState().isNavigating;
    const tapPage =
      (nav?.is_product && pathname.includes("/products/")) ||
      (nav?.is_boutique && pathname.includes("/filters"));
    const grace = tapPage ? TAP_GRACE_MS : GRACE_MS;
    const id = setTimeout(() => {
      if (useAppStore.getState().isNavigating) {
        useAppStore.getState().setIsNavigating(null);
      }
    }, grace);
    return () => clearTimeout(id);
  }, [url]);

  return null;
}

export default function NavigationLoaderSafetyNet() {
  // useSearchParams() must sit inside a Suspense boundary (Next static-render
  // rule); the fallback is null since this component renders nothing.
  return (
    <Suspense fallback={null}>
      <SafetyNetInner />
    </Suspense>
  );
}
