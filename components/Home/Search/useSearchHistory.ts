"use client";

import { useEffect, useState } from "react";
import search from "services/search";
import { useAppStore } from "store";
import { showErrorNotification } from "store/notifications/reducer";
import { translateFunction } from "utils/functions";

/**
 * The shopper's search history, read from the server when the search opens, so
 * every device shows the same words. A word leaves the screen at once. If the
 * server refuses, the shopper is told and the real list comes back.
 */
export function useSearchHistory(enabled: boolean) {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const userId = useAppStore((s) => s.userProfile?.id ?? s.user?.id);

  const loadHistory = async () => {
    const terms = await search.getSearchHistory();
    if (terms) setSearchHistory(terms);
  };

  // Wait for the user. On a first visit the guest does not exist yet, and a call
  // with no token would answer 401 and start the session recovery for nothing.
  // A new id also means a sign-in, and that user has other words.
  useEffect(() => {
    if (enabled && userId) loadHistory();
  }, [enabled, userId]);

  const sendRemoval = async (removal: { term: string } | { all: true }) => {
    if (await search.removeSearchHistory(removal)) return;
    showErrorNotification(translateFunction("Something went wrong"));
    await loadHistory();
  };

  const removeHistoryWord = (word: string) => {
    setSearchHistory((list) => list.filter((s) => s !== word));
    return sendRemoval({ term: word });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    return sendRemoval({ all: true });
  };

  return { searchHistory, removeHistoryWord, clearHistory };
}
