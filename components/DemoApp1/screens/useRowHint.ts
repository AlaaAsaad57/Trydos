"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motionValue, type AnimationPlaybackControls } from "framer-motion";

/**
 * The slider hint: what is in a slider moves to the side and comes back
 * once, so the next item shows for a moment. Home's sliders (useSlider in
 * HomeSections) and the product page's rows (useRowHint) use these numbers.
 *
 *  - HINT_WAIT_MS: the slider must stay in view for 500 ms first, so the
 *    hint does not run while the page is still scrolling past it.
 *  - out in 550 ms (Material 3 "long3") and back in 600 ms ("long4"). Both
 *    use the soft in-out curve (EASE_SOFT): the move starts slowly, speeds
 *    up and stops softly, like a finger pulling the slide.
 *    "Emphasized decelerate" was tried first. It is made for things that
 *    enter the screen, so it starts at full speed: measured in Chromium,
 *    the content moved 58 px in the first frame (45 % of the move).
 *  - a 350 ms rest ("medium3"), so the eye can read the next slide.
 *  - HINT_SHARE: the slider moves 25 % of its width (about 108 px on a
 *    430 px phone).
 *  - HINT_IN_VIEW: the hint starts when half of the slider is in view.
 */
export const HINT_WAIT_MS = 500;
export const HINT_SHARE = 0.25;
export const HINT_OUT = 0.55;
export const HINT_REST = 0.35;
export const HINT_BACK = 0.6;
export const HINT_IN_VIEW = 0.5;
/** Material 2's "standard" curve: slow start, slow stop. */
export const EASE_SOFT = [0.4, 0, 0.2, 1] as const;
/** Material 3's "standard" curve, for the quick put-back when a touch ends the hint. */
export const EASE_STANDARD = [0.2, 0, 0, 1] as const;

/**
 * The CSS variable a row's hint writes. A row puts `ROW_HINT_CLASS` on itself,
 * so each of its children moves by the variable (the CSS `translate`
 * property). The row itself does not move, so its clip edges stay put, and
 * the native scroll position is never touched.
 */
const HINT_VAR = "--row-hint";
export const ROW_HINT_CLASS = "[&>*]:[translate:var(--row-hint,0px)_0px]";

/** A hint under this many px (a row that only just overflows) is not worth a move. */
const MIN_MOVE = 8;

/** The pause between two rows' hints, so each one reads on its own. */
const TURN_GAP_MS = 150;

/** How long the first hint waits for the other rows that came into view with it. */
const GATHER_MS = 50;

/**
 * The product page has up to eight rows that scroll sideways, and five of
 * them are in the first view. Five hints at once would look like the page
 * shakes. So the rows wait for their turn: one hint at a time, from the top
 * of the page down (the order the eye reads them), not in the order the
 * browser reports them in view.
 */
type Turn = { start: () => void; top: number };
const turns: Turn[] = [];
let turnBusy = false;

function nextTurn() {
  const start = turns.shift()?.start;
  if (!start) {
    turnBusy = false;
    return;
  }
  turnBusy = true;
  start();
}

/**
 * Asks for a turn for the row at page y `top`. `start` runs when the turn
 * comes; the result gives the turn up.
 */
function waitTurn(start: () => void, top: number): () => void {
  const turn = { start, top };
  const at = turns.findIndex((t) => t.top > top);
  turns.splice(at < 0 ? turns.length : at, 0, turn);
  // The first turn starts GATHER_MS later. So the caller holds the give-up
  // function before `start` runs, and rows that come into view together
  // (the first view) are all in the list, in page order, before one starts.
  if (!turnBusy) {
    turnBusy = true;
    setTimeout(nextTurn, GATHER_MS);
  }
  return () => {
    const i = turns.indexOf(turn);
    if (i >= 0) turns.splice(i, 1);
  };
}

function endTurn() {
  setTimeout(nextTurn, TURN_GAP_MS);
}

/**
 * The one-time hint of a native sideways row (a list with
 * `overflow-x: auto`), the same move as Home's sliders.
 *
 *  - The hint runs once, when half of the row is in view for HINT_WAIT_MS,
 *    and only when the row has more to show in the way it scrolls.
 *  - The move is HINT_SHARE of the row's width, but never more than what is
 *    left to show, so the row never shows an empty gap.
 *  - A touch, a sideways wheel or a scroll of the row first: no hint, because the
 *    person already knows it scrolls. A touch during the hint puts the items
 *    back at once.
 *  - In a right-to-left row the items move to the right.
 *  - The hook only runs in effects, so the server's HTML and the first
 *    render in the browser are the same (no hydration problem).
 *
 * `topMargin` is the part of the window that the sticky header covers.
 * Returns the ref for the row. The ref is a callback, so a row that React
 * builds again (the gallery, for a new colour) is watched again. The hint
 * still runs only once for the hook: a new colour does not shake the
 * gallery again.
 */
export function useRowHint<E extends HTMLElement>(topMargin = 60) {
  const [row, setRow] = useState<E | null>(null);
  const shown = useRef(false);
  useEffect(() => {
    if (!row) return;
    const nudge = motionValue(0);
    const stopWrite = nudge.on("change", (x) => row.style.setProperty(HINT_VAR, `${x}px`));
    let wait: ReturnType<typeof setTimeout> | undefined;
    let giveUp: (() => void) | null = null;
    let run: AnimationPlaybackControls | null = null;

    /** Ends a waiting or running hint, and puts the items back. */
    const cancel = () => {
      clearTimeout(wait);
      wait = undefined;
      giveUp?.();
      giveUp = null;
      if (!run) return;
      run.stop();
      run = null;
      animate(nudge, 0, { duration: 0.2, ease: EASE_STANDARD });
      endTurn();
    };

    const runHint = () => {
      giveUp = null;
      const rtl = getComputedStyle(row).direction === "rtl";
      // Chrome and Safari give a negative scrollLeft in a right-to-left row.
      const left = row.scrollWidth - row.clientWidth - Math.abs(row.scrollLeft);
      const move = Math.min(Math.round(row.clientWidth * HINT_SHARE), Math.floor(left));
      if (shown.current || move < MIN_MOVE) {
        shown.current = true;
        endTurn();
        return;
      }
      const far = rtl ? move : -move;
      const total = HINT_OUT + HINT_REST + HINT_BACK;
      const hint = animate(nudge, [0, far, far, 0], {
        duration: total,
        times: [0, HINT_OUT / total, (HINT_OUT + HINT_REST) / total, 1],
        ease: [EASE_SOFT, "linear", EASE_SOFT],
      });
      run = hint;
      hint.then(() => {
        // Only a hint that ran to its end counts (cancel() clears `run`).
        if (run !== hint) return;
        run = null;
        shown.current = true;
        endTurn();
      });
    };

    const onGrab = () => {
      shown.current = true;
      cancel();
    };
    // A wheel counts only when it moves the row sideways: a mouse that
    // scrolls the page down over the row is not a grab.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) onGrab();
    };
    row.addEventListener("pointerdown", onGrab, { passive: true });
    row.addEventListener("wheel", onWheel, { passive: true });
    row.addEventListener("scroll", onGrab, { passive: true });

    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < HINT_IN_VIEW) {
          cancel();
          return;
        }
        if (shown.current || wait || giveUp || run) return;
        wait = setTimeout(() => {
          wait = undefined;
          giveUp = waitTurn(runHint, row.getBoundingClientRect().top + window.scrollY);
        }, HINT_WAIT_MS);
      },
      { rootMargin: `-${topMargin}px 0px 0px 0px`, threshold: [0, HINT_IN_VIEW, 1] },
    );
    watch.observe(row);

    return () => {
      watch.disconnect();
      row.removeEventListener("pointerdown", onGrab);
      row.removeEventListener("wheel", onWheel);
      row.removeEventListener("scroll", onGrab);
      clearTimeout(wait);
      giveUp?.();
      if (run) {
        run.stop();
        endTurn();
      }
      stopWrite();
      row.style.removeProperty(HINT_VAR);
    };
  }, [row, topMargin]);
  return setRow;
}
