"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  type MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

/*
  The motion of the bottom bar, and the springs the screens share with it.

  These came from the old /navigation demo (components/NavigationDemo/BottomNav.tsx,
  measured off BOTTOMNAVIGATION.mp4). That demo is gone; the numbers and the
  rules below are the same, moved here unchanged.

  THE SCROLL
    icon spacing is 66 at rest and 56 under scroll. 56 / 66 = 0.85, which is
    the floor the video shows. The video only shows the two ends, so it cannot
    say what the rule between them is. That rule is a design decision, and it
    is written down in useScrollScale below: scroll down and the bar scales
    down, scroll up and it scales back up, by an amount that follows BOTH how
    far you scrolled and how fast.
*/

/**
 * How the bar answers the scroll.
 *
 *   minScale     the smallest the bar is allowed to get. The video reads
 *                56 / 66 = 0.85; this is 0.72, a deeper dip than the video
 *                takes, because that is what was asked for.
 *   distance     pixels of unhurried scrolling that cover the whole change,
 *                top to floor.
 *   speedEffect  how much scroll SPEED counts on top of scroll distance.
 *                0 turns it off.
 */
export const BAR_SCROLL = {
  minScale: 0.72,
  distance: 320,
  speedEffect: 1,
} as const;

/** Full size. The bar is never drawn bigger than this. */
const MAX_SCALE = 1;

/**
 * How the bar reads the scroll.
 *
 * Two things decide how much the bar moves, and both of them matter:
 *
 *   the VALUE  how far you scrolled. `distance` px of unhurried scrolling
 *              covers the whole way from full size down to the floor. This is
 *              what makes the bar answer a slow, deliberate drag at all.
 *   the SPEED  how fast you scrolled. A flick counts for more per pixel than
 *              a crawl, up to MAX_GAIN times more.
 *
 * They multiply. One pixel of scroll is worth (1 / distance) * gain of the
 * way, where gain comes from the speed. Scrolling down adds, scrolling up
 * subtracts, by the same rule in both directions — up is not a special case.
 */

/** The scroll speed, in px/s, that adds one whole extra unit of gain. */
const SPEED_REF = 1200;

/**
 * What one pixel of scroll may be worth, against the plain 1.0.
 *
 * The floor is below 1 so that a very slow drag moves the bar slowly rather
 * than at the same rate as a normal scroll — that is the whole point of the
 * speed term. The ceiling stops a trackpad flick, which can report several
 * thousand px/s, from crossing the entire range inside two frames.
 */
const MIN_GAIN = 0.6;
const MAX_GAIN = 2.2;

/**
 * Smoothing on the SPEED reading only — never on the position.
 *
 * Browsers deliver scroll in lumps, so raw px/s swings wildly from frame to
 * frame inside a single gesture. Averaging it over 80ms takes that judder out
 * of the gain. The distance term is left exact: scroll 140px and you have
 * spent 140px, however the browser chopped it up.
 */
const SPEED_TAU = 0.08;

/** Frames with no scroll at all before the loop stops asking. */
const IDLE_FRAMES = 12;

/** Within this many pixels of the top the bar is always full size. */
const TOP_HOLD = 8;

/**
 * The spring between the scroll and the screen. It has one job: reach the
 * value the scroll asked for, quickly, without wobbling around it.
 *
 * A spring is critically damped at damping = 2 * sqrt(stiffness * mass), which
 * here is 2 * sqrt(300 * 0.85) = 31.9. Damping 30 puts the ratio at 0.94, just
 * under that: it settles in about 170ms with an overshoot too small to see.
 */
const GLIDE = { stiffness: 300, damping: 30, mass: 0.85 } as const;

/*
  ON prefers-reduced-motion
  The bar ignores it today, as the old demo did. What a reduced-motion visitor
  gets in the real app is an open decision (UI-MIGRATION-PLAN.md).
*/

/**
 * Moves the indicator. It sets off the moment your finger lands.
 *
 * Higher stiffness with the damping ratio kept just under 1 is what makes the
 * move both quicker and smoother at the same time:
 * 38 / (2 * sqrt(560 * 0.85)) = 0.87, so it covers the distance fast and
 * settles with an overshoot of 0.4% — too small to see as a wobble.
 */
export const TRAVEL = { type: "spring", stiffness: 560, damping: 38, mass: 0.85 } as const;

/** Reacts to a finger going down. */
export const PRESS = { type: "spring", stiffness: 700, damping: 38, mass: 0.6 } as const;

/**
 * One breath of the whole capsule, for a press — finger or mouse. It is the
 * only animation on the bar that is not the scroll.
 *
 * There is deliberately no pulse on hover. A phone has no hover, and on a
 * desktop it fired every time the pointer crossed the bar on its way somewhere
 * else.
 */
const PULSE_PEAK = 1.035;
const PULSE_MS = 0.4;
const PULSE_EASE = [0.22, 1, 0.36, 1] as const;

/** Two pulses closer together than this are one pulse. */
const PULSE_GAP_MS = 260;

const clamp = (n: number, min: number, max: number) =>
  n < min ? min : n > max ? max : n;

/**
 * The scale of the bar, driven by the scroll.
 *
 * `travelled` is how far into the change we are: 0 at full size, 1 at the
 * floor, and it is held inside 0..1 at all times. Scrolling down pushes it
 * towards 1, scrolling up pulls it back towards 0, and it stays where it is
 * left when the page stops. A spring sits between it and the screen, so what
 * the browser draws is a smooth curve even where the scroll arrives in lumps.
 *
 * Where the scroll comes from
 * ---------------------------
 * `scope: "window"` (the default) reads the page scroll. `scope: "any"`
 * listens in the capture phase on the document, so it hears every element
 * that scrolls up and down. A box that cannot scroll up and down (a sideways
 * row of chips) is not counted, so swiping it does not move the bar.
 *
 * `resetKey` puts the bar back to full size when it changes. The app passes
 * the screen it shows, because a new screen starts at its top.
 */
export function useScrollScale(
  minScale: number,
  distance: number,
  speedEffect: number,
  { scope = "window", resetKey }: { scope?: "window" | "any"; resetKey?: unknown } = {}
) {
  const travelled = useMotionValue(0);
  const eased = useSpring(travelled, GLIDE);

  useEffect(() => {
    travelled.set(0);
  }, [resetKey, travelled]);

  // The floor is a live motion value, not a plain number, so a new floor
  // redraws the bar at once instead of waiting for the next scroll.
  const floor = useMotionValue(minScale);
  useEffect(() => {
    floor.set(minScale);
  }, [minScale, floor]);

  // The two ends are hard limits, so the result is clamped to them. The spring
  // is set just under critical damping and would only pass the end by a
  // fraction of a percent, but "would only" is not the same as "cannot", and
  // the bar must never draw smaller than the floor or bigger than full size.
  const scale = useTransform([eased, floor], ([t, m]: number[]) =>
    clamp(MAX_SCALE + t * (m - MAX_SCALE), m, MAX_SCALE)
  );

  // Read through a ref so a new tuning does not tear down the listener.
  const tuning = useRef({ distance, speedEffect });
  tuning.current = { distance, speedEffect };

  useEffect(() => {
    let frame = 0;
    let running = false;
    let lastY = window.scrollY;
    let lastT = 0;
    // Signed pixels scrolled since the last frame looked. The scroll handler
    // adds to it and the frame empties it, so nothing is counted twice and
    // nothing is lost between two events landing in the same frame. Signed,
    // so a scroll down and a scroll up inside one frame cancel out — which is
    // what actually happened.
    let pending = 0;
    let speed = 0;
    let idle = 0;

    const tick = (now: number) => {
      // Clamped so a background tab coming back does not divide by a huge gap.
      const dt = Math.min(Math.max((now - lastT) / 1000, 0.001), 0.1);
      lastT = now;

      const dy = pending;
      pending = 0;

      // Smooth the speed, leave the distance exact. See SPEED_TAU.
      const raw = Math.abs(dy) / dt;
      speed += (raw - speed) * (1 - Math.exp(-dt / SPEED_TAU));

      if (dy === 0) {
        idle += 1;
        if (idle > IDLE_FRAMES) {
          // Nothing is moving. Park the loop and leave the bar at its size —
          // this scale follows the scroll, so it does not spring back on its
          // own. The next scroll event starts the loop again.
          running = false;
          speed = 0;
          return;
        }
      } else {
        idle = 0;
        const gain = clamp(
          MIN_GAIN + tuning.current.speedEffect * (speed / SPEED_REF),
          MIN_GAIN,
          MAX_GAIN
        );
        // Down (dy > 0) adds and shrinks; up (dy < 0) subtracts and grows.
        // Same rule both ways.
        travelled.set(
          clamp(travelled.get() + (dy / tuning.current.distance) * gain, 0, 1)
        );
      }

      // The top of the page always shows the bar at full size, whatever the
      // sums above worked out.
      if (lastY <= TOP_HOLD) travelled.set(0);

      frame = requestAnimationFrame(tick);
    };

    // The box the last scroll came from. When another box starts scrolling,
    // its first reading is the new starting point, not a jump.
    let source: EventTarget | null = null;

    const onScroll = (event: Event) => {
      const box =
        scope === "any" && event.target instanceof Element ? event.target : null;
      // A sideways scroller has nothing to say about up and down.
      if (box && box.scrollHeight <= box.clientHeight) return;
      const y = box ? box.scrollTop : window.scrollY;
      const from = box ?? window;
      if (from !== source) {
        source = from;
        lastY = y;
      }
      pending += y - lastY;
      lastY = y;
      if (running) return;
      running = true;
      idle = 0;
      lastT = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const target: Window | Document = scope === "any" ? document : window;
    target.addEventListener("scroll", onScroll, { passive: true, capture: scope === "any" });
    return () => {
      target.removeEventListener("scroll", onScroll, { capture: scope === "any" });
      cancelAnimationFrame(frame);
    };
  }, [travelled, scope]);

  return scale;
}

/**
 * The press pulse on top of the scroll scale — see PULSE_PEAK.
 *
 * The pulse multiplies the scroll scale rather than replacing it, so a touch
 * during a scroll does not snap the bar back to full size.
 */
export function useBarPulse(scrollScale: MotionValue<number>) {
  const pulse = useMotionValue(1);
  const scale = useTransform(
    [scrollScale, pulse],
    ([s, p]: number[]) => s * p
  );

  const lastPulse = useRef(0);
  const firePulse = () => {
    const now = performance.now();
    if (now - lastPulse.current < PULSE_GAP_MS) return;
    lastPulse.current = now;
    animate(pulse, [1, PULSE_PEAK, 1], {
      duration: PULSE_MS,
      times: [0, 0.32, 1],
      ease: PULSE_EASE,
    });
  };

  return { scale, firePulse };
}
