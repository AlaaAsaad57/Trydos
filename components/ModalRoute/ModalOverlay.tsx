"use client";

import { ModalRouteContext } from "./ModalRouteContext";

interface ModalOverlayProps {
  children: React.ReactNode;
}

/**
 * Wraps intercepted route content so it looks identical to the full page.
 * Full-viewport layer so only the detail page is visible (list stays mounted underneath).
 * No backdrop or modal chrome - only provides ModalRouteContext for back behavior.
 *
 * The underlying `.main-content` is hidden by MainContent via React state (see
 * OverlayVisibility), driven by ModalSlot — not mutated imperatively here — so
 * it can never get stuck hidden when this overlay unmounts.
 */
export default function ModalOverlay({ children }: ModalOverlayProps) {
  return (
    <ModalRouteContext.Provider value={true}>
      <div className="w-full max-w-full">{children}</div>
    </ModalRouteContext.Provider>
  );
}
