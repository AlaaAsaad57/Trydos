"use client";

import React, { useSyncExternalStore } from "react";

/**
 * The debug colour pickers for /demo, next to the "i" button.
 *
 * Top bar colour: sets the colour of Safari's top area (the clock and the
 * battery) while a chat message's menu is open, so the client can pick the
 * colour that looks right over the grey wash on their own phone. The reset
 * button gives the design's grey back (MENU_DIM_TINT in
 * DemoApp1/chat/MessageMenu.tsx). Safari's top area takes a colour from the
 * page on the iPhone and the iPad only, so the picked colour shows only there.
 *
 * Tab bar colour (on the bag only): fills the tab bar's glass with a solid
 * colour. The glass is clear, so on a white page a cut at its edge never
 * shows; a solid fill shows where Safari (or anything else) cuts the bar.
 * The fill stays on every screen until reset, so the bar can be compared
 * between screens.
 *
 * Top strip: holds the demo's white top strip (topTint.ts) on a page that has
 * no head. Pages with a head show that strip while the head is shown, and
 * Safari paints their fixed tab bar in full; the profile has no head and no
 * strip, and Safari cuts its tab bar at the window's end. One question: does
 * a fixed box at the top change how Safari draws the bottom?
 *
 * Taller page: makes every page at least 120 px taller than the window, so
 * the page always runs under Safari's bar. For one question: does Safari cut
 * a fixed box at the window's end only when the page itself ends there?
 *
 * The state lives in this module, so it stays the same while the tester moves
 * between screens.
 */

/** The design's grey (MENU_DIM_TINT, rgb 179 179 179): what the top picker opens on. */
const DESIGN_TOP_TINT = "#b3b3b3";

/** A strong red: what the tab bar picker opens on, so a cut edge is easy to see. */
const START_TAB_BAR_FILL = "#ff0000";

type DebugState = {
  /** The picked colour as `#rrggbb`, or null for the design's grey. */
  topTint: string | null;
  /** The tab bar's solid fill as `#rrggbb`, or null for the design's clear glass. */
  tabBarFill: string | null;
  /** Every page is at least 120 px taller than the window (see TALL_PAGE_ROOM). */
  tallPage: boolean;
  /** A page with no head holds the white top strip. */
  topStrip: boolean;
};

/** How far past the window's end a page runs while "Taller page" is on. */
export const TALL_PAGE_ROOM = 120;

const OFF: DebugState = { topTint: null, tabBarFill: null, tallPage: false, topStrip: false };
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

/** Puts every picker back on the design. For tests. */
export function resetDemoDebug() {
  set(OFF);
}

/** `#rrggbb` as `rgb(r, g, b)`, the form the top strip takes (followTopTint). */
export function rgbOf(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

type DebugKey =
  | "Top bar colour"
  | "Reset top bar colour"
  | "Tab bar colour"
  | "Reset tab bar colour"
  | "Taller page"
  | "Top strip";

const ROUND =
  "relative w-7 h-7 rounded-full shadow border border-gray-200 cursor-pointer flex items-center justify-center overflow-hidden";

/** One round colour button, and its reset button once a colour is picked. */
function ColourPicker({
  value,
  start,
  onChange,
  label,
  resetLabel,
  testId,
}: {
  value: string | null;
  /** The colour the phone's picker opens on while nothing is picked. */
  start: string;
  onChange: (color: string | null) => void;
  label: string;
  resetLabel: string;
  testId: string;
}) {
  return (
    <>
      {/* The input is see-through and covers the round button, so a tap opens
          the phone's own colour picker. */}
      <label
        className={ROUND}
        // No colour picked yet: a colour wheel says what the button does.
        style={{
          background: value ?? "conic-gradient(#FF3B30, #FFCC00, #34C759, #007AFF, #AF52DE, #FF3B30)",
        }}
      >
        <input
          type="color"
          data-pw={testId}
          aria-label={label}
          value={value ?? start}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </label>
      {value && (
        <button
          type="button"
          data-pw={`${testId}-reset`}
          aria-label={resetLabel}
          onClick={() => onChange(null)}
          className={`${ROUND} bg-white/90 text-[#402CDD] text-sm font-bold`}
        >
          ×
        </button>
      )}
    </>
  );
}

/**
 * The pickers, drawn under the "i" button. The tab bar picker shows on the
 * bag only (`tabBar`); its reset button stays while a fill is picked, so the
 * fill can be taken off from any screen.
 */
export function DebugButtons({ t, tabBar }: { t: (key: DebugKey) => string; tabBar: boolean }) {
  const { topTint, tabBarFill, tallPage, topStrip } = useDemoDebug();
  return (
    <>
      <label className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 shadow border border-gray-200 text-gray-800 flex items-center gap-1.5 backdrop-blur-sm cursor-pointer">
        <input
          type="checkbox"
          data-pw="demo-debug-tall-page"
          checked={tallPage}
          onChange={(e) => setDebugTallPage(e.target.checked)}
          className="accent-[#402CDD] cursor-pointer"
        />
        <span>{t("Taller page")}</span>
      </label>
      <label className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 shadow border border-gray-200 text-gray-800 flex items-center gap-1.5 backdrop-blur-sm cursor-pointer">
        <input
          type="checkbox"
          data-pw="demo-debug-top-strip"
          checked={topStrip}
          onChange={(e) => setDebugTopStrip(e.target.checked)}
          className="accent-[#402CDD] cursor-pointer"
        />
        <span>{t("Top strip")}</span>
      </label>
      <ColourPicker
        value={topTint}
        start={DESIGN_TOP_TINT}
        onChange={setDebugTopTint}
        label={t("Top bar colour")}
        resetLabel={t("Reset top bar colour")}
        testId="demo-debug-top-tint"
      />
      {(tabBar || tabBarFill) && (
        <ColourPicker
          value={tabBarFill}
          start={START_TAB_BAR_FILL}
          onChange={setDebugTabBarFill}
          label={t("Tab bar colour")}
          resetLabel={t("Reset tab bar colour")}
          testId="demo-debug-tab-bar"
        />
      )}
    </>
  );
}
