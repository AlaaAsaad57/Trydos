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
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "initial";
    };
  }, []);
  return (
    <ModalRouteContext.Provider value={true}>
      <div className="fixed h-screen max-w-[1365px] z-[999999998] top-[100px] w-full min-h-dvh overflow-y-auto bg-white">
        {children}
      </div>
    </ModalRouteContext.Provider>
  );
}
