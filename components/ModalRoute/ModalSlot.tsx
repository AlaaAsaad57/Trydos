"use client";

import { useRef, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ModalOverlay from "./ModalOverlay";

interface ModalSlotProps {
  children: React.ReactNode | null;
}

/**
 * Only render intercepted content when we're on an intercepted route AND the user
 * arrived via client-side navigation (not on direct load/refresh).
 * On full page load or refresh of /filters/ or /products/, we show the actual page
 * (no overlay). When the user navigates to those routes from within the app, we show the overlay.
 */
export default function ModalSlot({ children }: ModalSlotProps) {
  const pathname = usePathname();
  const [hasNavigatedClientSide, setHasNavigatedClientSide] = useState(false);
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (previousPathnameRef.current !== null && previousPathnameRef.current !== pathname) {
      setHasNavigatedClientSide(true);
    }
    previousPathnameRef.current = pathname;
  }, [pathname]);

  const isInterceptedRoute =
    pathname?.includes("/filters/") || pathname?.includes("/products/");
  const shouldShowOverlay =
    children != null &&
    isInterceptedRoute &&
    hasNavigatedClientSide;

  if (!shouldShowOverlay) return null;
  return <ModalOverlay>{children}</ModalOverlay>;
}
