"use client";

import { useEffect } from "react";
import { ModalRouteContext } from "./ModalRouteContext";

interface ModalOverlayProps {
  children: React.ReactNode;
}

/**
 * Wraps intercepted route content so it looks identical to the full page.
 * Full-viewport layer so only the detail page is visible (list stays mounted underneath).
 * No backdrop or modal chrome - only provides ModalRouteContext for back behavior.
 */
export default function ModalOverlay({ children }: ModalOverlayProps) {
  useEffect(() => {
    // document.documentElement.style.overflow = "hidden";
    const mainContent = document.querySelector<HTMLDivElement>(".main-content");
    if (!mainContent) {
      return;
    }
    mainContent.style.display = "none";
    // setTimeout(() => {
    //   document.documentElement.style.overflow = "hidden";
    // }, 1000);

    return () => {
      mainContent.style.display = "flex";
      document.documentElement.style.overflow = "initial";
    };
  }, []);
  return (
    <ModalRouteContext.Provider value={true}>
      <div className="w-full max-w-full">{children}</div>
    </ModalRouteContext.Provider>
  );
}
