"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useAppStore } from "store";
import InFlowPageLoader from "components/global/InFlowPageLoader";

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
 * Renders the page body (`children` slot). Two React-driven hide reasons, never
 * imperative DOM mutation:
 *  - an intercepted-route overlay is showing (`overlayActive`) → whole slot hidden;
 *  - a route navigation is in progress (`isNavigating`) → the in-flow loader shows
 *    and `children` are hidden but STILL MOUNTED, so the destination's own clearer
 *    fires and then the swap reveals the real page.
 */
export function MainContent({ children }: { children: ReactNode }) {
  const { overlayActive } = useOverlayVisibility();
  const isNavigating = useAppStore((s) => s.isNavigating);
  const showLoader = !!isNavigating && !overlayActive;

  return (
    <div
      className="w-full flex-col main-content max-w-[1365px]"
      style={{ display: overlayActive ? "none" : "flex" }}
    >
      {showLoader && <InFlowPageLoader nav={isNavigating} />}
      <div style={{ display: showLoader ? "none" : "contents" }}>{children}</div>
    </div>
  );
}
