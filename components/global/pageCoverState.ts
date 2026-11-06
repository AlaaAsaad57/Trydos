import { useSyncExternalStore } from "react";
import { appScreenFromPath } from "components/DemoApp1/appScreenPaths";
import { isDemoPath, pageKindFor } from "components/skeleton/pageKinds";
import { useAppStore } from "store";

/**
 * The page a tap is going to, while its skeleton covers the screen.
 *
 * A tap calls `showPageCover` with the address. Links do it on their own
 * (PageCover listens for them). A `router.push` from a button has no link, so
 * it calls this first. The server is not touched: the page still answers with
 * its own status, redirect and HTML.
 */
let target: string | null = null;
const listeners = new Set<() => void>();

const set = (next: string | null) => {
  if (next === target) return;
  target = next;
  listeners.forEach((listener) => listener());
};

export function showPageCover(href: string) {
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return;
  // A change of query or hash stays on the page.
  if (url.pathname === window.location.pathname) return;
  if (isDemoPath(window.location.pathname)) return;
  if (!appScreenFromPath(url.pathname) && !pageKindFor(url.pathname)) return;
  // A new tap wins: the loader of a tap still on its way goes, or it would stay
  // over this page until its own page, which is not coming now, cleared it.
  const store = useAppStore.getState();
  if (store.isNavigating) store.setIsNavigating(null);
  set(url.pathname);
}

/** The path the cover is showing, or null. For code outside React. */
export const pageCoverTarget = () => target;

export const hidePageCover = () => set(null);

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** The path the cover is showing, or null. */
export const usePageCover = () =>
  useSyncExternalStore(
    subscribe,
    () => target,
    () => null,
  );
