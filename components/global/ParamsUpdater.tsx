"use client";

import { useEffect } from "react";

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
      window.history.pushState({}, "", cleanupUrl.toString());
    };
  }, [searchKey, searchValue]);

  return null;
}
