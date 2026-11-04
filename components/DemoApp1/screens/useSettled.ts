"use client";

import { startTransition, useEffect, useState, useSyncExternalStore } from "react";
import { STORE_GROW } from "../demo1Layout";

/** When the rest of a page comes in after a tap: just after the grow ends. */
const SETTLE_MS = STORE_GROW.duration * 1000 + 100;

const subscribeToNothing = () => () => {};

/**
 * True when the page is built in the browser after a tap, false when it
 * is built from the server's HTML (on the server, and while React hydrates
 * that HTML). React reads the third function in the second case.
 */
const useBuiltOnTap = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

/**
 * Whether to draw the whole page, or only what the first view shows.
 *
 * React builds a new screen in one block of work in the tap's event, and
 * the grow (Demo1Shell) can only start after it. The trace of a tap on a
 * store card (iPhone 13 profile, CPU 4x slower) showed that block at 1.4 s
 * with 12 cards; most of it was the cards under the screen's edge. So on a
 * tap a page draws its first view only, and the rest after the grow, as a
 * low-priority update. From the server, all of it is in the HTML, for
 * search engines, and React hydrates the same HTML (the server's answer here
 * is `true` on both sides).
 */
export function useSettled() {
  const builtOnTap = useBuiltOnTap();
  const [settled, setSettled] = useState(!builtOnTap);
  useEffect(() => {
    if (settled) return;
    const wait = setTimeout(() => startTransition(() => setSettled(true)), SETTLE_MS);
    return () => clearTimeout(wait);
  }, [settled]);
  return settled;
}
