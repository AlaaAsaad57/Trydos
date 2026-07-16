"use client";

import { useEffect } from "react";
import { useAppStore } from "store";
import {
  beginSelfConsume,
  isBackClosing,
} from "utils/popupHistory";

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

    // Add or update the query param and push a synthetic history entry so a
    // browser-back can close the popup.
    url.searchParams.set(searchKey, searchValue);
    window.history.pushState({ isPopup: true }, "", url.toString());

    return () => {
      // Defer past React's commit so we don't run history ops mid-render and so
      // any in-flight navigation can settle first.
      setTimeout(() => {
        const { isNavigating } = useAppStore.getState();
        // Navigating away (e.g. opened login on home, then clicked /settings) —
        // leave the buried entry alone; touching history here is what used to
        // bounce the user back to home.
        if (isNavigating) return;

        // A real back-press already collapsed the popups; don't back() again.
        if (isBackClosing()) return;

        // Only consume the entry when OUR synthetic popup entry is still the
        // current one. If the top entry isn't a popup, the user has navigated
        // elsewhere and we must not touch history.
        if ((window.history.state as { isPopup?: boolean })?.isPopup !== true) {
          return;
        }

        // Pop our synthetic entry instead of pushing a new URL. This restores
        // the previous (pre-popup) entry — cleaning the back-stack and the
        // `?<key>=true` param in one step. Flag it so the global popstate
        // handler treats this back() as self-initiated and leaves any popup
        // underneath (e.g. the cart during checkout→login) open.
        beginSelfConsume();
        window.history.back();
      }, 0);
    };
  }, [searchKey, searchValue]);

  return null;
}
