"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

import { restoreBaseScroll } from "./overlayScroll";

// A layout effect in the browser, an ordinary one on the server.
//
// The restore below has to happen before the browser paints, or the page shows
// for a frame at the top and then jumps — which is the thing being fixed. Only
// `useLayoutEffect` runs that early. It also warns on every server render,
// because there is no layout to read there, and this component is rendered on
// the server. Picking the hook once, per environment, is what keeps both facts
// true; the value never changes within a run, so the rule about calling hooks
// unconditionally still holds.
const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Single source of truth for whether an intercepted-route overlay is showing.
 *
 * The overlay (ModalOverlay) covers the page, so the underlying `.main-content`
 * must be hidden while it's up. Previously ModalOverlay hid `.main-content` by
 * mutating `style.display` imperatively on mount and restoring it on unmount.
 * That restore is not guaranteed to run 1:1 with when the overlay actually goes
 * away (e.g. backing out to an intercepted route that was the initial hard-load
 * page), which left `.main-content` stuck at `display:none` — a blank page body
 * with the navbar still visible.
 *
 * Driving the display from React state makes it a pure function of the current
 * overlay state, so it can never get stuck: no overlay ⇒ content visible.
 */
interface OverlayVisibilityValue {
  overlayActive: boolean;
  setOverlayActive: (active: boolean) => void;
}

const OverlayVisibilityContext = createContext<OverlayVisibilityValue>({
  overlayActive: false,
  setOverlayActive: () => {},
});

export function OverlayVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [overlayActive, setOverlayActive] = useState(false);
  return (
    <OverlayVisibilityContext.Provider value={{ overlayActive, setOverlayActive }}>
      {children}
    </OverlayVisibilityContext.Provider>
  );
}

export const useOverlayVisibility = () => useContext(OverlayVisibilityContext);

/**
 * Renders the page body (`children` slot). Hidden via React — not imperative DOM
 * mutation — whenever an intercepted-route overlay is showing (`overlayActive`).
 *
 * The in-flow navigation loader is NOT hosted here: it lives in
 * `NavigationLoaderGate`, one level up, so it can cover both this slot and the
 * `@modal` overlay slot. Hosting it here made it invisible for any navigation
 * started from an overlay (where `.main-content` is `display:none`).
 */
export function MainContent({ children }: { children: ReactNode }) {
  const { overlayActive } = useOverlayVisibility();

  // Put the base page back where it was, once it is back in the layout.
  //
  // This is the only place that can. An intercepted overlay hides this element,
  // which takes the page out of the layout and collapses the document to about
  // one screen — and the browser will not hold a scroll position past the bottom
  // of the document. So the scroll cannot be done where the back-out is noticed
  // (ModalSlot), because `overlayActive` is still true in that commit and the
  // page is still hidden: the scroll would land on 0. By the time this runs the
  // `display` above is already `flex` in the DOM, so the document is its full
  // height again. `restoreBaseScroll` does nothing unless a back-out is due.
  useBrowserLayoutEffect(() => {
    if (!overlayActive) restoreBaseScroll();
  }, [overlayActive]);

  return (
    <div
      className="w-full flex-col main-content max-w-[1365px]"
      style={{ display: overlayActive ? "none" : "flex" }}
    >
      {children}
    </div>
  );
}
