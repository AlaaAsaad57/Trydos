/**
 * Window-scroll coordination for intercepted-route navigations.
 *
 * An intercepted route ("/products", "/filters/boutiques/…") is shown in two
 * visual phases that BOTH live in the same document as the base page and share
 * the window scroll:
 *   1. the in-flow navigation loader (NavigationLoaderGate + InFlowPageLoader),
 *      shown while the destination is pending; and
 *   2. the overlay itself (ModalSlot + ModalOverlay), once the content is ready.
 *
 * Next.js does not reset scroll for parallel/intercepted slot changes, so both
 * phases were inheriting the base page's scroll offset — the skeleton and then
 * the page appeared "scrolled to the bottom". This module lands every phase at
 * the top and restores the base page's scroll when the user backs out, so they
 * return exactly where they were.
 *
 * State is module-level (a single shared scroll context for the whole app) so
 * the loader phase and the overlay phase don't fight over it or double-save.
 */

let baseScrollY = 0; // the base page's scroll, captured on entry, restored on back-out
let basePath: string | null = null; // the base page we entered from — restore only when we return to it
let active = false; // we're in overlay-land: base scroll saved and we've scrolled to top
let overlayShown = false; // a real overlay (not just a loader) was displayed — gate the restore

/**
 * The loader or the overlay just appeared. On the first entry of a navigation
 * (whichever phase fires first) it captures the base page's scroll and path —
 * this always runs while still on the page we'll return to, since the loader
 * shows before the navigation commits. Then it lands at the top. Idempotent
 * across the loader→overlay→nested transitions.
 */
export function enterOverlay(currentPath: string | null): void {
  if (typeof window === "undefined") return;
  if (!active) {
    baseScrollY = window.scrollY;
    basePath = currentPath;
    active = true;
  }
  window.scrollTo(0, 0);
}

/** A real intercepted overlay (not merely the loader) is on screen. */
export function markOverlayShown(): void {
  overlayShown = true;
}

/**
 * We're on a non-intercepted page again. Restore the base scroll only when an
 * overlay had actually been shown AND we've returned to the exact page we
 * entered from (a back-out). A forward navigation to a *different* full page
 * (e.g. boutique overlay → cart) keeps that new page at the top.
 */
export function leaveOverlay(currentPath: string | null): void {
  if (typeof window === "undefined") return;
  if (!active) return;
  if (overlayShown && currentPath === basePath) {
    window.scrollTo(0, baseScrollY);
  }
  active = false;
  overlayShown = false;
  basePath = null;
}
