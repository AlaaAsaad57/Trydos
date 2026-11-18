"use client";

import { useEffect, useRef } from "react";
import search from "services/search";

/**
 * How long a word must stay in the box after its results arrive before it goes
 * to the search log. The search itself answers much sooner, while the shopper is
 * still typing, and logging there stored every half word.
 */
export const SEARCH_LOG_WAIT_MS = 1500;

/** `logSearchTerm` skips anything shorter, so do not call the server for it. */
const SHORTEST_LOGGED_WORD = 3;

/**
 * Logs only the word the shopper settled on. A new word in the box drops the one
 * that was waiting. Leaving or closing the search sends a waiting word at once,
 * because a tap on a result is the most useful search to keep.
 * `onLogged` gets each word that is sent, so the history on screen shows it at once.
 */
export function useSearchLog(
  value: string,
  enabled: boolean,
  onLogged?: (term: string) => void,
) {
  const pending = useRef<{ term: string; productsCount: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordInBox = useRef(value);

  /** Forget the waiting word. Enter uses this: the listing page logs that word. */
  const cancelLog = () => {
    if (timer.current) clearTimeout(timer.current);
    pending.current = null;
  };

  const sendLog = () => {
    const waiting = pending.current;
    cancelLog();
    if (!waiting) return;
    search.logSearch(waiting.term, waiting.productsCount);
    onLogged?.(waiting.term);
  };

  /** Call when a word's results arrive. A late answer for an old word is ignored. */
  const scheduleLog = (term: string, productsCount: number) => {
    if (term !== wordInBox.current) return;
    cancelLog();
    if (term.trim().length < SHORTEST_LOGGED_WORD) return;
    pending.current = { term, productsCount };
    timer.current = setTimeout(sendLog, SEARCH_LOG_WAIT_MS);
  };

  useEffect(() => {
    wordInBox.current = value;
    cancelLog();
  }, [value]);

  useEffect(() => sendLog, [enabled]);

  return { scheduleLog, cancelLog };
}
