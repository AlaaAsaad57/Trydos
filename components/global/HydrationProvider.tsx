"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store";

interface HydrationProviderProps {
  children: React.ReactNode;
}

export function HydrationProvider({ children }: HydrationProviderProps) {
  const setHasHydrated = useAppStore((state) => state.setHasHydrated);

  useEffect(() => {
    // Mark as hydrated after component mounts (client-side only)
    // This happens silently without hiding content
    setHasHydrated(true);
  }, [setHasHydrated]);

  // Always render children immediately for SEO and crawlers
  return <>{children}</>;
}

// Hook to safely use store after hydration
export function useHydratedAppStore() {
  const hasHydrated = useAppStore((state) => state._hasHydrated);
  const store = useAppStore();

  // Return safe defaults during SSR/before hydration
  if (!hasHydrated) {
    return {
      ...store,
      storiesData: [],
      setStoryData: () => {},
      loading: false,
      // Add other safe defaults as needed
    };
  }

  return store;
}
