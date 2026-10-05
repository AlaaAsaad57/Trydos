"use client";

import React, { useSyncExternalStore } from "react";

/**
 * Three debug switches for /demo, next to the "i" button.
 *
 *  - The page colour: each tap paints the screen's page, and an open sheet,
 *    in the next colour of DEBUG_COLORS, and the tap after the last one gives
 *    the design's colour back. So the tester sees how Safari's glass bars and
 *    the keyboard's glass look over each colour.
 *  - The test pictures: a list of photos under the wallet's transactions, so
 *    the tester can scroll busy pictures under the bars.
 *  - The keyboard's theme: off, the demo's keyboard follows the phone's theme
 *    (the app theme); on, it is dark on a light phone too. So the tester can
 *    compare the two looks.
 *
 * The state lives in this module, so it stays the same
 * while the tester moves between screens.
 */

/** The colours the page goes through, one per tap. */
export const DEBUG_COLORS = [
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#007AFF",
  "#AF52DE",
  "#1D1D1D",
] as const;

type DebugState = {
  /** The page colour, or null for the design's own colour. */
  color: string | null;
  pictures: boolean;
  /** The demo's keyboard is dark whatever the phone's theme is. */
  darkKeyboard: boolean;
};

let state: DebugState = { color: null, pictures: false, darkKeyboard: false };
const listeners = new Set<() => void>();

function set(next: DebugState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const OFF: DebugState = { color: null, pictures: false, darkKeyboard: false };

/** The debug switches as they are now. On the server all are off. */
export function useDemoDebug(): DebugState {
  return useSyncExternalStore(subscribe, () => state, () => OFF);
}

/** Moves the page to the next colour; after the last one, back to the design's. */
export function nextDebugColor() {
  const at = state.color
    ? DEBUG_COLORS.indexOf(state.color as (typeof DEBUG_COLORS)[number])
    : -1;
  set({ ...state, color: DEBUG_COLORS[at + 1] ?? null });
}

export function toggleDebugPictures() {
  set({ ...state, pictures: !state.pictures });
}

export function toggleDebugKeyboardTheme() {
  set({ ...state, darkKeyboard: !state.darkKeyboard });
}

/** Puts every switch off again. For tests. */
export function resetDemoDebug() {
  set(OFF);
}

/** Fixed seeds, so the same photos come back on every load. */
const PICTURES = Array.from({ length: 8 }, (_, i) => i + 1);

/** The test photos, one under the other, 24 px from the screen's edges. */
export function DebugPictures() {
  const { pictures } = useDemoDebug();
  if (!pictures) return null;
  return (
    <div
      data-pw="demo-debug-pictures"
      className="flex flex-col shrink-0 gap-2"
      style={{ margin: "24px 24px 120px" }}
    >
      {PICTURES.map((n) => (
        // A plain <img>: these come from a public photo service that is not
        // in next.config's image hosts, and this list is for debugging only.
        <img
          key={n}
          src={`https://picsum.photos/seed/trydos-demo-${n}/860/640`}
          alt=""
          loading="lazy"
          className="w-full rounded-xl object-cover"
          style={{ aspectRatio: "860 / 640", background: "#E5E5E5" }}
        />
      ))}
    </div>
  );
}

/** The debug buttons, drawn under the "i" button. */
export function DebugButtons({
  t,
}: {
  t: (
    key: "Change page colour" | "Show test pictures" | "Dark keyboard",
  ) => string;
}) {
  const { color, pictures, darkKeyboard } = useDemoDebug();
  const round =
    "w-7 h-7 rounded-full shadow border border-gray-200 cursor-pointer flex items-center justify-center";
  return (
    <>
      <button
        type="button"
        data-pw="demo-debug-color"
        aria-label={t("Change page colour")}
        onClick={nextDebugColor}
        className={round}
        // No colour chosen yet: a colour wheel says what the button does.
        style={{
          background:
            color ??
            "conic-gradient(#FF3B30, #FFCC00, #34C759, #007AFF, #AF52DE, #FF3B30)",
        }}
      />
      <button
        type="button"
        data-pw="demo-debug-pictures-toggle"
        aria-label={t("Show test pictures")}
        aria-pressed={pictures}
        onClick={toggleDebugPictures}
        className={`${round} ${pictures ? "bg-[#402CDD] text-white" : "bg-white/90 text-[#402CDD]"}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 16H5V5h14v14Zm-5.04-6.71-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71Z"
          />
        </svg>
      </button>
      <button
        type="button"
        data-pw="demo-debug-keyboard-theme"
        aria-label={t("Dark keyboard")}
        aria-pressed={darkKeyboard}
        onClick={toggleDebugKeyboardTheme}
        className={`${round} ${darkKeyboard ? "bg-[#1D1D1D] text-white" : "bg-white/90 text-[#402CDD]"}`}
      >
        {/* A keyboard: off is the app theme, on is the dark keyboard. */}
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 12H4V7h16v10ZM6 9h2v2H6V9Zm3 0h2v2H9V9Zm3 0h2v2h-2V9Zm3 0h3v2h-3V9ZM6 12h3v2H6v-2Zm4 0h2v2h-2v-2Zm3 0h2v2h-2v-2Zm3 0h2v2h-2v-2Zm-8 3h8v1H8v-1Z"
          />
        </svg>
      </button>
    </>
  );
}
