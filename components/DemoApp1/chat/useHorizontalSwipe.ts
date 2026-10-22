"use client";

import { useDragControls } from "framer-motion";
import { useEffect, useRef } from "react";
import type React from "react";

/** How far a touch moves, in px, before the way it goes is read. */
export const SWIPE_SLOP = 6;

type Gesture = {
  x: number;
  y: number;
  /** The way the touch goes, once it has moved SWIPE_SLOP. */
  axis: "x" | "y" | null;
  /** Framer's drag was started for it. */
  started: boolean;
};

/**
 * Keeps a sideways swipe sideways on the iPhone.
 *
 * Safari reads the first pixels of a touch to decide whether it is a scroll.
 * `touch-action: pan-y` lets it take any touch it reads as up-down, and a
 * thumb's sideways swipe begins with a small up-down arc. Safari then scrolls
 * (or bounces) the page, the row gets `pointercancel`, and the screen moves
 * up and down while the row never swipes. Framer's `dragDirectionLock` reads
 * up-down first too (|y| > 10 px before |x| > 10 px), so it sides with Safari.
 *
 * Here the first SWIPE_SLOP px of a touch decide, and sideways wins a tie. A
 * sideways touch is ours: every `touchmove` after it is prevented, so Safari
 * never starts a scroll, and framer's drag is started by hand. An up-down
 * touch is the page's, and nothing here touches it again.
 *
 * Put `ref`, `controls` and `handlers` on the `motion` element, with
 * `drag="x"` and `dragListener={false}`. `enabled` false leaves every touch
 * to the page (a message that cannot be answered).
 */
export function useHorizontalSwipe(enabled = true) {
  const controls = useDragControls();
  const ref = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const on = useRef(enabled);
  on.current = enabled;

  const begin = (x: number, y: number) => {
    gesture.current = { x, y, axis: null, started: false };
  };
  const end = () => {
    gesture.current = null;
  };
  /** The way the touch goes; null while it has not moved SWIPE_SLOP yet. */
  const axisOf = (x: number, y: number) => {
    const g = gesture.current;
    if (!g) return null;
    if (g.axis === null) {
      const dx = Math.abs(x - g.x);
      const dy = Math.abs(y - g.y);
      if (Math.max(dx, dy) < SWIPE_SLOP) return null;
      g.axis = dx >= dy ? "x" : "y";
    }
    return g.axis;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const touchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) begin(t.clientX, t.clientY);
    };
    // `passive: false`: a passive listener cannot stop the scroll.
    const touchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!on.current || !t) return;
      if (axisOf(t.clientX, t.clientY) === "x" && e.cancelable) e.preventDefault();
    };
    el.addEventListener("touchstart", touchStart, { passive: true });
    el.addEventListener("touchmove", touchMove, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("touchstart", touchStart);
      el.removeEventListener("touchmove", touchMove);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, []);

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.isPrimary !== false && e.button === 0) begin(e.clientX, e.clientY);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const g = gesture.current;
      if (!g || !on.current) return;
      // A mouse moving with no button down is not a swipe.
      if (e.pointerType === "mouse" && e.buttons === 0) {
        end();
        return;
      }
      if (axisOf(e.clientX, e.clientY) === "x" && !g.started) {
        g.started = true;
        controls.start(e);
      }
    },
    onPointerUp: end,
    onPointerCancel: end,
  };

  return { ref, controls, handlers };
}
