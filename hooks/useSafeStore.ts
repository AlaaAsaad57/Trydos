import { useEffect, useState } from "react";
import { useAppStore } from "@/store";

/**
 * Safe hook for using store values that prevents hydration mismatches
 * Returns default values during SSR and actual values after hydration
 */
export function useSafeStoreValue<T>(
  selector: (state: any) => T,
  defaultValue: T
): T {
  const [isClient, setIsClient] = useState(false);
  const value = useAppStore(selector);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Return default value during SSR, actual value after hydration
  return isClient ? value : defaultValue;
}

/**
 * Safe hook specifically for stories data
 */
export function useSafeStoriesData() {
  return useSafeStoreValue(
    (state) => state.storiesData,
    [] // Safe default for SSR
  );
}

/**
 * Safe hook for store actions that prevents undefined errors
 */
export function useSafeStoreActions() {
  const [isClient, setIsClient] = useState(false);
  const store = useAppStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Return no-op functions during SSR, actual functions after hydration
  if (!isClient) {
    return {
      setStoryData: () => {},
      setSelectedStory: () => {},
      watchStory: () => {},
      nextStory: () => {},
      prevStory: () => {},
      addStory: () => {},
      setLoginOpen: () => {},
      setAppLanguage: () => {},
      setAppCountry: () => {},
      // Add other actions as needed
    };
  }

  return {
    setStoryData: store.setStoryData,
    setSelectedStory: store.setSelectedStory,
    watchStory: store.watchStory,
    nextStory: store.nextStory,
    prevStory: store.prevStory,
    addStory: store.addStory,
    setLoginOpen: store.setLoginOpen,
    setAppLanguage: store.setAppLanguage,
    setAppCountry: store.setAppCountry,
  };
}

/**
 * Combined safe hook for both values and actions
 * Uses hydration state from store rather than local client state
 */
export function useSafeAppStore() {
  const store = useAppStore();
  const hasHydrated = store._hasHydrated;

  // If not hydrated, return safe defaults to prevent hydration errors
  if (!hasHydrated) {
    return {
      // Safe default values that match SSR
      storiesData: [],
      loading: false,
      selectedStory: null,
      loginOpen: false,
      language: "en",
      country: "",
      _hasHydrated: false,

      // No-op functions to prevent errors
      setStoryData: () => {},
      setSelectedStory: () => {},
      watchStory: () => {},
      nextStory: () => {},
      prevStory: () => {},
      addStory: () => {},
      setLoginOpen: () => {},
      setAppLanguage: () => {},
      setAppCountry: () => {},
      setHasHydrated: () => {},
    };
  }

  return store;
}

/**
 * Hook to check if we're on the client side (hydrated)
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
