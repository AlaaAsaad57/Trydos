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
 *
 * ---------------------------------------------------------------------------
 * Three things fought this, and all three had to be dealt with
 *
 * Both phases hide the base page with `display:none`, which takes it out of the
 * layout — so while an overlay is up the document is about one screen tall
 * instead of the twelve thousand pixels it was. The browser will not hold a
 * scroll position below the bottom of the document, so the moment the page is
 * hidden it drags the position up to the new bottom. Measured in Chromium on a
 * home page parked at 11625px: the document fell from 12525px to 902px and the
 * position became 2px.
 *
 * That single rule breaks a save and a restore done at the wrong time, and a
 * third party — the browser itself — was overwriting the result anyway:
 *
 *   1. **Saving.** Reading `window.scrollY` in an effect is too late. The click
 *      handler sets `isNavigating`, React hides the page in that same commit,
 *      and the effect runs after — by which point the real position is gone. So
 *      the position is taken at the click, by `rememberBaseScroll`, and
 *      `enterOverlay` uses that.
 *   2. **Restoring.** Scrolling while the page is still hidden lands on 0,
 *      because the document is still one screen tall. `leaveOverlay` therefore
 *      only records that a restore is due; `restoreBaseScroll` does it, and is
 *      called by MainContent once the page body is back in the layout.
 *   3. **The browser's own history scroll restoration.** Going back is a history
 *      traversal, and with `history.scrollRestoration` at its default of
 *      "auto" the browser puts the window back where *it* thinks that entry
 *      was — which is the 0 it recorded, because the page was already hidden
 *      when the address changed. It does this after our restore and without
 *      calling any scroll API, so it is invisible in a trace: measured, the
 *      window was at 11625px when `restoreBaseScroll` returned and at 0px on
 *      the very next animation frame, with the document at its full height the
 *      whole time.
 *
 * ---------------------------------------------------------------------------
 * Where the takeover has to happen, and why it is that exact spot
 *
 * `history.scrollRestoration` is **per history entry**, not one switch for the
 * page. Measured in Chromium: set it to "manual" on entry A, push entry B, set
 * it back to "auto" on B, then go back — A is still "manual" and the browser
 * does not restore it. A new entry inherits the value at the moment it is
 * pushed.
 *
 * Two things follow, and both are load-bearing:
 *
 *   * It is taken over **at the click** (`rememberBaseScroll`), which is the
 *     last moment the base page's own entry is the current one. Doing it once
 *     the overlay is on screen sets it on the *overlay's* entry instead, and the
 *     base page is restored by the browser exactly as before — measured, and it
 *     looks identical to no fix at all.
 *   * It is handed back in `restoreBaseScroll`, which runs when that same base
 *     entry is current again. Handing it back anywhere else leaves the base
 *     entry switched over for good.
 *
 * And it is only taken over when the address being opened is an intercepted one.
 * An ordinary navigation keeps the browser's own behaviour, which is right for
 * it — this app has no scroll restoration of its own anywhere else, so switching
 * the browser's off would lose the position on every ordinary Back.
 */

/** Does this address open as an overlay?
 *
 *  Only the top-level intercepted routes do: `/{lang}/products/…` and
 *  `/{lang}/filters/…`, whose interceptors sit directly under `[lang]`. A deeper
 *  route that merely contains a `products` segment — the seller dashboard's own
 *  `/{lang}/sellerProfile/sellerDashboard/{id}/products/{id}` edit page, say —
 *  is an ordinary page and must not be treated as an intercept.
 *
 *  Written once, here, and used by ModalSlot too: the decision to take the
 *  browser's scroll restoration over and the decision to draw an overlay have to
 *  agree, and two copies of a regular expression do not stay in step. */
export const isInterceptedPath = (path: string | null): boolean =>
  !!path && /^\/[^/]+\/(products|filters)(\/|$)/.test(path.split("?")[0]);

let baseScrollY = 0; // the base page's scroll, captured on entry, restored on back-out
let basePath: string | null = null; // the base page we entered from — restore only when we return to it
let active = false; // we're in overlay-land: base scroll saved and we've scrolled to top
let overlayShown = false; // a real overlay (not just a loader) was displayed — gate the restore

/** The position taken at the click, before anything was hidden, and the page it
 *  was taken on. The path is what stops a click that never navigated being used
 *  as the base position for some later page's overlay. */
let remembered: { path: string; y: number } | null = null;

/** Where the base page has to go once it is visible again. `null` means there is
 *  nothing to put back. */
let restoreTo: number | null = null;

/** Whether we, rather than the browser, are currently answering for the scroll
 *  position of a history traversal. Tracked so the setting is never left
 *  switched over, and never switched back when it was not ours to switch. */
let ownsScrollRestoration = false;

/** Answer for the scroll position ourselves until further notice.
 *
 *  Guarded rather than assigned blindly: an old browser may not offer
 *  `scrollRestoration` at all, and its own behaviour then stands. */
function takeOverScrollRestoration(): void {
  if (ownsScrollRestoration) return;
  try {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
      ownsScrollRestoration = true;
    }
  } catch {
    /* not offered — the browser keeps the job */
  }
}

/** Give the job back to the browser, once the traversal we took it over for is
 *  finished.
 *
 *  Not immediate, and that is the point: handing it back inside the same
 *  popstate we are answering for would let the browser apply its own, wrong
 *  position after all. A frame plus a task puts it past the traversal, and no
 *  ordinary Back can happen in between — that needs a person. */
function giveBackScrollRestoration(): void {
  if (!ownsScrollRestoration) return;
  ownsScrollRestoration = false;
  requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        history.scrollRestoration = "auto";
      } catch {
        /* nothing to give back */
      }
    }, 0);
  });
}

/**
 * The click that starts a navigation. Two things are done here and nowhere else,
 * because this is the last moment the base page is still the current page:
 *
 *   * its scroll position is taken, while it is still the real one — reading it
 *     in an effect gets the browser's clamped value instead; and
 *   * when `destination` opens as an overlay, the browser's history scroll
 *     restoration is taken over **for this page's own history entry**.
 *
 * See the two notes at the top of this file for what goes wrong at any other
 * moment.
 */
export function rememberBaseScroll(destination: string | null): void {
  if (typeof window === "undefined") return;
  remembered = { path: window.location.pathname, y: window.scrollY };
  if (isInterceptedPath(destination)) takeOverScrollRestoration();
}

/**
 * The loader or the overlay just appeared. On the first entry of a navigation
 * (whichever phase fires first) it captures the base page's scroll and path —
 * this always runs while still on the page we'll return to, since the loader
 * shows before the navigation commits. Then it lands at the top. Idempotent
 * across the loader→overlay→nested transitions.
 *
 * The position comes from `rememberBaseScroll` when that was taken on this same
 * page. `window.scrollY` is the fallback for an overlay that no click of ours
 * started — a browser Forward, say — where nothing has been hidden yet and the
 * live value is still the right one.
 */
export function enterOverlay(currentPath: string | null): void {
  if (typeof window === "undefined") return;
  if (!active) {
    baseScrollY =
      remembered && remembered.path === currentPath
        ? remembered.y
        : window.scrollY;
    basePath = currentPath;
    active = true;
  }
  remembered = null;
  window.scrollTo(0, 0);
}

/** A real intercepted overlay (not merely the loader) is on screen. */
export function markOverlayShown(): void {
  overlayShown = true;
}

/**
 * We're on a non-intercepted page again. A restore is due only when an overlay
 * had actually been shown AND we've returned to the exact page we entered from
 * (a back-out). A forward navigation to a *different* full page (e.g. boutique
 * overlay → cart) keeps that new page at the top.
 *
 * This only records the decision. The page body is still `display:none` when
 * this runs, so scrolling here would land on 0 — `restoreBaseScroll` does the
 * scrolling, one commit later.
 */
export function leaveOverlay(currentPath: string | null): void {
  if (typeof window === "undefined") return;
  remembered = null;
  if (!active) return;
  if (overlayShown && currentPath === basePath) {
    restoreTo = baseScrollY;
  }
  active = false;
  overlayShown = false;
  basePath = null;
}

/**
 * Put the base page back where it was left.
 *
 * Called by MainContent (components/ModalRoute/OverlayVisibility.tsx) in a
 * layout effect, which is the first moment the page body is in the layout again
 * and the last one before the browser paints — so the position is right in the
 * frame the page reappears in, with no jump to the top on the way.
 *
 * Does nothing unless `leaveOverlay` decided a restore was due, so the ordinary
 * case — any page shown with no overlay behind it — is untouched.
 */
export function restoreBaseScroll(): void {
  if (typeof window === "undefined") return;
  if (restoreTo !== null) {
    const target = restoreTo;
    restoreTo = null;
    window.scrollTo(0, target);
  }
  // This page has no overlay over it, so if the browser's job is still ours it
  // goes back now.
  //
  // One journey it does not fully undo, stated rather than hidden: home →
  // overlay → on to a *different* page. The hand-back then lands on that other
  // page's history entry, and the home entry keeps "manual" — so a later Back to
  // home is not restored by the browser. Nothing here restores it either, which
  // is what that journey already did before any of this, so it is a gap and not
  // a change. Closing it needs the hand-back to happen while the home entry is
  // current, and no code runs at that moment.
  giveBackScrollRestoration();
}
