"use client";

import React, { useSyncExternalStore } from "react";

/**
 * The debug switches for /demo, next to the "i" button. They exist to find
 * out, on a real iPhone, why Safari 26 cuts the fixed tab bar at the
 * window's end on some screens (2026-11-11).
 *
 * Tab bar colour: fills the tab bar's glass with a solid colour. The glass
 * is clear, so on a white page a cut at its edge never shows; a solid fill
 * shows where Safari (or anything else) cuts the bar.
 *
 * Taller page: makes every page at least 120 px taller than the window, so
 * the page always runs under Safari's bar. Confirmed on the iPhone: Safari
 * paints a fixed box below the window's end only when the page itself runs
 * below it (the bag and the search ended at the window's end and were cut).
 *
 * Top strip: holds the demo's white top strip (topTint.ts) on a page that has
 * no head. Pages with a head show that strip while the head is shown, and
 * Safari paints their fixed tab bar in full; the profile has no head and no
 * strip, and Safari cuts its tab bar at the window's end. One question: does
 * a fixed box at the top change how Safari draws the bottom?
 *
 * The state lives in this module, so it stays the same while the tester moves
 * between screens.
 */

/** A strong red: what the tab bar picker opens on, so a cut edge is easy to see. */
const START_TAB_BAR_FILL = "#ff0000";

type DebugState = {
  /** The tab bar's solid fill as `#rrggbb`, or null for the design's clear glass. */
  tabBarFill: string | null;
  /** Every page is at least 120 px taller than the window (see TALL_PAGE_ROOM). */
  tallPage: boolean;
  /** A page with no head holds the white top strip. */
  topStrip: boolean;
};

/** How far past the window's end a page runs while "Taller page" is on. */
export const TALL_PAGE_ROOM = 120;

const OFF: DebugState = { tabBarFill: null, tallPage: false, topStrip: false };
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

/** Turns the taller page on or off. */
export function setDebugTallPage(on: boolean) {
  set({ ...state, tallPage: on });
}

/** Turns the top strip on headless pages on or off. */
export function setDebugTopStrip(on: boolean) {
  set({ ...state, topStrip: on });
}

type DebugKey = "Tab bar colour" | "Reset tab bar colour" | "Taller page" | "Top strip";

const ROUND =
  "relative w-7 h-7 rounded-full shadow border border-gray-200 cursor-pointer flex items-center justify-center overflow-hidden";

const PILL =
  "px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 shadow border border-gray-200 text-gray-800 flex items-center gap-1.5 backdrop-blur-sm cursor-pointer";

/** One on/off switch. */
function Switch({
  on,
  onChange,
  label,
  testId,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  label: string;
  testId: string;
}) {
  return (
    <label className={PILL}>
      <input
        type="checkbox"
        data-pw={testId}
        checked={on}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[#402CDD] cursor-pointer"
      />
      <span>{label}</span>
    </label>
  );
}

/** The switches and the colour picker, drawn under the "i" button, on every screen. */
export function DebugButtons({ t }: { t: (key: DebugKey) => string }) {
  const { tabBarFill, tallPage, topStrip } = useDemoDebug();
  return (
    <>
      <Switch on={tallPage} onChange={setDebugTallPage} label={t("Taller page")} testId="demo-debug-tall-page" />
      <Switch on={topStrip} onChange={setDebugTopStrip} label={t("Top strip")} testId="demo-debug-top-strip" />
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
