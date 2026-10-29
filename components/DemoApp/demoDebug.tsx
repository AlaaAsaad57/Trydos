"use client";

import React, { useSyncExternalStore } from "react";

/**
 * The debug colour picker for /demo, next to the "i" button.
 *
 * It sets the colour of Safari's top area (the clock and the battery) while a
 * chat message's menu is open, so the client can pick the colour that looks
 * right over the grey wash on their own phone. The reset button gives the
 * design's grey back (MENU_DIM_TINT in DemoApp1/chat/MessageMenu.tsx).
 * Safari's top area takes a colour from the page on the iPhone and the iPad
 * only, so the picked colour shows only there.
 *
 * The state lives in this module, so it stays the same while the tester moves
 * between screens.
 */

/** The design's grey (MENU_DIM_TINT, rgb 179 179 179): what the picker opens on. */
const DESIGN_TOP_TINT = "#b3b3b3";

type DebugState = {
  /** The picked colour as `#rrggbb`, or null for the design's grey. */
  topTint: string | null;
};

const OFF: DebugState = { topTint: null };
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

/** Sets the top area's colour; null gives the design's grey back. */
export function setDebugTopTint(color: string | null) {
  set({ ...state, topTint: color });
}

/** Puts the picker back on the design's grey. For tests. */
export function resetDemoDebug() {
  set(OFF);
}

/** `#rrggbb` as `rgb(r, g, b)`, the form the top strip takes (followTopTint). */
export function rgbOf(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

/** The colour picker, drawn under the "i" button, and its reset button once a colour is picked. */
export function DebugButtons({
  t,
}: {
  t: (key: "Top bar colour" | "Reset top bar colour") => string;
}) {
  const { topTint } = useDemoDebug();
  const round =
    "relative w-7 h-7 rounded-full shadow border border-gray-200 cursor-pointer flex items-center justify-center overflow-hidden";
  return (
    <>
      {/* The input is see-through and covers the round button, so a tap opens
          the phone's own colour picker. */}
      <label
        className={round}
        // No colour picked yet: a colour wheel says what the button does.
        style={{
          background:
            topTint ??
            "conic-gradient(#FF3B30, #FFCC00, #34C759, #007AFF, #AF52DE, #FF3B30)",
        }}
      >
        <input
          type="color"
          data-pw="demo-debug-top-tint"
          aria-label={t("Top bar colour")}
          value={topTint ?? DESIGN_TOP_TINT}
          onChange={(e) => setDebugTopTint(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </label>
      {topTint && (
        <button
          type="button"
          data-pw="demo-debug-top-tint-reset"
          aria-label={t("Reset top bar colour")}
          onClick={() => setDebugTopTint(null)}
          className={`${round} bg-white/90 text-[#402CDD] text-sm font-bold`}
        >
          ×
        </button>
      )}
    </>
  );
}
