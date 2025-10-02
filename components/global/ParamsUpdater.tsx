"use client";

import { useEffect } from "react";
import { useAppStore } from "store";

interface SearchParamUpdaterProps {
  searchKey: string;
  searchValue: string;
}

export default function SearchParamUpdater({
  searchKey,
  searchValue,
}: SearchParamUpdaterProps) {
  useEffect(() => {
    if (!searchKey) return;

    const url = new URL(window.location.href);

    // Add or update the query param
    url.searchParams.set(searchKey, searchValue);
    window.history.pushState({ isPopup: true }, "", url.toString());

    return () => {
      const cleanupUrl = new URL(window.location.href);

      // Remove the query param
      cleanupUrl.searchParams.delete(searchKey);
      const { isNavigating } = useAppStore.getState();
      setTimeout(() => {
        if (!isNavigating)
          window.history.pushState({}, "", cleanupUrl.toString());
      }, 600);
    };
  }, [searchKey, searchValue]);

  return null;
}
