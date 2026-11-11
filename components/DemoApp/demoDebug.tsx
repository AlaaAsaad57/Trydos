"use client";

import React, { useSyncExternalStore } from "react";

/**
 * The debug menu for /demo, next to the "i" button, on every screen.
 *
 * Tab bar colour: fills the tab bar's glass with a solid colour. The glass
 * is clear, so on a white page a cut at its edge never shows; a solid fill
 * shows where Safari (or anything else) cuts the bar. It found the two
 * causes of the cut bar on the iPhone (2026-11-11): a page that ends at the
 * window's end (see TAB_PAGE_MIN_HEIGHT in demo1Layout.ts), and a tab
 * screen with no head and so no blended white strip at the top (see
 * ScreenPage in ui.tsx).
 *
 * The state lives in this module, so it stays the same while the tester moves
 * between screens.
 */

/** A strong red: what the tab bar picker opens on, so a cut edge is easy to see. */
const START_TAB_BAR_FILL = "#ff0000";

type DebugState = {
  /** The tab bar's solid fill as `#rrggbb`, or null for the design's clear glass. */
  tabBarFill: string | null;
};

const OFF: DebugState = { tabBarFill: null };
let state: DebugState = OFF;
const listeners = new Set<() => void>();

function set(next: DebugState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The debug state as it is now. On the server nothing is picked. */
export function useDemoDebug(): DebugState {
  return useSyncExternalStore(subscribe, () => state, () => OFF);
}

/** Sets the tab bar's solid fill; null gives the design's clear glass back. */
export function setDebugTabBarFill(color: string | null) {
  set({ ...state, tabBarFill: color });
}

type DebugKey = "Tab bar colour" | "Reset tab bar colour";

const ROUND =
  "relative w-7 h-7 rounded-full shadow border border-gray-200 cursor-pointer flex items-center justify-center overflow-hidden";

/** The colour picker, drawn under the "i" button, on every screen. */
export function DebugButtons({ t }: { t: (key: DebugKey) => string }) {
  const { tabBarFill } = useDemoDebug();
  return (
    <>
      {/* The input is see-through and covers the round button, so a tap opens
          the phone's own colour picker. */}
      <label
        className={ROUND}
        // No colour picked yet: a colour wheel says what the button does.
        style={{
          background: tabBarFill ?? "conic-gradient(#FF3B30, #FFCC00, #34C759, #007AFF, #AF52DE, #FF3B30)",
        }}
      >
        <input
          type="color"
          data-pw="demo-debug-tab-bar"
          aria-label={t("Tab bar colour")}
          value={tabBarFill ?? START_TAB_BAR_FILL}
          onChange={(e) => setDebugTabBarFill(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </label>
      {tabBarFill && (
        <button
          type="button"
          data-pw="demo-debug-tab-bar-reset"
          aria-label={t("Reset tab bar colour")}
          onClick={() => setDebugTabBarFill(null)}
          className={`${ROUND} bg-white/90 text-[#402CDD] text-sm font-bold`}
        >
          ×
        </button>
      )}
    </>
  );
}
