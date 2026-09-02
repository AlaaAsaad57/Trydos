"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { TabIcon } from "./icons";

/*
  ---------------------------------------------------------------------------
  MEASURED OFF BOTTOMNAVIGATION.mp4
  ---------------------------------------------------------------------------
  The video is 384 x 848. Every number below is a sub-pixel reading taken from
  the frames, not an estimate by eye. The method: find the level half way
  between the bar and what is behind it, then read where the brightness crosses
  that level. The clearest at-rest frames are t=13.0, 15.5 and 16.0, where the
  content behind the bar is nearly black.

    THE CAPSULE
      side inset      17.4 left, 18.2 right      -> 17.5
      width           348.5
      height          53.2                       -> 53
      bottom gap      15.4                       -> 15
      corner          the left edge follows a circle of r = height / 2 to
                      within 0.3px at every row, so it is a true pill, not a
                      squircle. radius = 26.5

    THE ACTIVE PILL
      box             22.14 .. 96.62  x  784.6 .. 827.3
      size            74.5 x 42.7                -> 74 x 43
      corner          again r = height / 2       -> 21.5
      centre          59.38, and the icon centre is 59.5, so it is centred on
                      the icon, not on the slot

    PADDING
      vertical        (53.2 - 42.7) / 2 = 5.25   -> 5
      horizontal      9.2, solved from the icon centres below

    THE FIVE ITEMS
      icon centres    59.5  126  192.5  257  322.5
      spacing         66.5  66.5  64.5  65.5     -> 66
      glyph width     19.4 (the home icon)
      The pill is 74.5 wide but the items sit 66 apart, so the pill is WIDER
      than one slot and overhangs its neighbours by about 4px on each side.
      That is why it is drawn at a fixed width instead of filling the slot.

    THE MATERIAL
      Fitted over 76 frames, bar brightness against the content behind it, for
      backdrops from 11 to 250:  alpha 0.84 - 0.88, overlay 230 - 236.
      rgba(246,246,246,0.84) reproduces both ends: it predicts 214 where the
      video reads 212 (dark backdrop) and 246 where the video reads 250 (white
      backdrop). Pure white at the same alpha is 7 too bright on the dark end.

      active pill     bar 212, pill 188  ->  1 - 188/212 = 0.113
                      measured again on a light frame: 219 / 249 = 0.120
                      so the pill is black at about 11.5%, NOT a lighter tint.

    THE SCROLL
      icon spacing is 66 at rest and 56 under scroll. 56 / 66 = 0.85, which is
      the floor. The video only shows the two ends, so it cannot say what the
      rule between them is. That rule is a design decision, and it is written
      down in useScrollScale below: scroll down and the bar scales down, scroll
      up and it scales back up, by an amount that follows BOTH how far you
      scrolled and how fast.
  ---------------------------------------------------------------------------
*/

type TabId = "home" | "live" | "search" | "cart" | "profile";

const TABS: { id: TabId; label: string; dot?: boolean }[] = [
  { id: "home", label: "Home" },
  { id: "live", label: "Live" },
  { id: "search", label: "Search" },
  { id: "cart", label: "Cart", dot: true },
  { id: "profile", label: "Profile", dot: true },
];

/* ---------------------------- the shape ---------------------------------- */

const SIDE_INSET = 17.5; // clear space left and right of the capsule
const BOTTOM_GAP = 15; // clear space under the capsule
const BAR_H = 53;
const BAR_R = BAR_H / 2; // a true pill, confirmed against the frames
const PAD_X = 9;
const PAD_Y = 5;
const PILL_W = 74;
const PILL_H = BAR_H - PAD_Y * 2; // 43
const GLYPH = 29; // the home path spans 16 of 24 viewBox units, so it draws
//                   16/24 * 29 = 19.3px — the 19.4 measured in the video

/* --------------------------- the material -------------------------------- */

export type NavTheme = {
  /** backdrop-filter blur, in px */
  blur: number;
  /** backdrop-filter saturate, in % */
  saturation: number;
  /** the bar colour, as #rgb or #rrggbb */
  color: string;
  /** how solid that colour is, 0..1 */
  opacity: number;
  /** the smallest the bar is allowed to get */
  minScale: number;
  /** pixels of unhurried scrolling that cover the whole change, top to floor */
  distance: number;
  /** how much scroll SPEED counts on top of scroll distance. 0 turns it off */
  speedEffect: number;
};

/**
 * The look opens on the values the bar already used: colour + opacity together
 * are the rgba(246,246,246,0.84) fitted over the 76 frames above, and blur and
 * saturate are the ones already on the element.
 *
 * The floor is the one number set past its measured value. The video reads
 * 56 / 66 = 0.85; this opens at 0.72, a deeper dip than the video takes,
 * because that is what was asked for. Every one of these is a slider — read a
 * value you like off the panel and put it here to keep it.
 */
export const DEFAULT_NAV_THEME: NavTheme = {
  blur: 15,
  saturation: 180,
  color: "#f6f6f6",
  opacity: 0.84,
  minScale: 0.72,
  distance: 320,
  speedEffect: 1,
};

/** Splits #rgb or #rrggbb into its three channels. Bad input stays default. */
function channels(hex: string): [number, number, number] {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = Number.parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(n)) return [246, 246, 246];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Everything the picked colour decides.
 *
 * The measured pill is black at 11.5%. That is right on a light bar and
 * invisible on a dark one, and the same goes for the black icons and the white
 * inner highlight. So the ink flips with the bar: work out how bright the
 * chosen colour is, and draw white on a dark bar. Without this the colour
 * picker only works for one half of the colour wheel.
 */
export function buildSkin(theme: NavTheme) {
  const [r, g, b] = channels(theme.color);
  // Rec. 709 luma — the usual weighting for "how bright does this look".
  const dark = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
  return {
    filter: `blur(${theme.blur}px) saturate(${theme.saturation}%)`,
    bar: `rgba(${r},${g},${b},${theme.opacity})`,
    pill: dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.115)",
    ink: dark ? "#fafafa" : "#0a0a0a",
    shadow: dark
      ? "0 4px 18px rgba(0,0,0,0.38), inset 0 0 0 0.5px rgba(255,255,255,0.16), inset 0 -0.5px 0 rgba(255,255,255,0.22)"
      : "0 4px 18px rgba(0,0,0,0.18), inset 0 0 0 0.5px rgba(255,255,255,0.6), inset 0 -0.5px 0 rgba(255,255,255,0.9)",
  };
}

/**
 * How wide the bar may get on a desktop screen. A phone draws it at 355, so
 * anything much wider stops looking like the thing being copied.
 */
const BAR_MAX_W = 380;

/* ---------------------------- the motion --------------------------------- */

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
 *
 * The alternative, speed on its own, is what this used to be and it was wrong:
 * it made the bar shrink whichever way you moved and spring back the moment
 * you stopped, so the bar never held a size and scrolling up did nothing.
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
 * of the gain. The distance term is left exact, because that is the half the
 * bar has to be honest about: scroll 140px and you have spent 140px, however
 * the browser chopped it up.
 */
const SPEED_TAU = 0.08;

/** Frames with no scroll at all before the loop stops asking. */
const IDLE_FRAMES = 12;

/** Within this many pixels of the top the bar is always full size. */
const TOP_HOLD = 8;

/**
 * The spring between the scroll and the screen. It is the only thing that
 * makes the motion smooth, so it has one job: reach the value the scroll asked
 * for, quickly, without wobbling around it.
 *
 * A spring is critically damped at damping = 2 * sqrt(stiffness * mass), which
 * here is 2 * sqrt(300 * 0.85) = 31.9. Damping 30 puts the ratio at 0.94, just
 * under that: it settles in about 170ms with an overshoot too small to see.
 *
 * This used to sit at 0.53, far below critical, so the bar swung past the end
 * and came back — a deliberate "beat" borrowed from the video. That works when
 * the target only ever jumps to one end or the other. It does not work here.
 * Now the target tracks your finger the whole way, and a spring that loose
 * lags behind it and reads as rubbery rather than smooth.
 */
const GLIDE = { stiffness: 300, damping: 30, mass: 0.85 } as const;

/*
  ON prefers-reduced-motion
  This component ignores it, on purpose. It is a design demo whose whole
  subject is the motion, and on a machine with the setting turned on there
  would be nothing left to look at. Before this bar goes into the real app,
  decide there what a reduced-motion visitor should get — most likely the
  scroll scale and the indicator move stay, and the pulse goes.
*/

/**
 * Moves the indicator. It sets off the moment your finger lands.
 *
 * Higher stiffness with the damping ratio kept just under 1 is what makes the
 * move both quicker and smoother at the same time:
 * 38 / (2 * sqrt(560 * 0.85)) = 0.87, so it covers the distance fast and
 * settles with an overshoot of 0.4% — too small to see as a wobble.
 */
const TRAVEL = { type: "spring", stiffness: 560, damping: 38, mass: 0.85 } as const;

/** Reacts to a finger going down. */
const PRESS = { type: "spring", stiffness: 700, damping: 38, mass: 0.6 } as const;

/*
  There is no delay in front of the indicator any more.

  It used to wait 60ms so the press would read first. What that actually bought
  was a pause where the capsule looked stuck under your finger. The press is
  already answered without it — the icon shrinks and the whole bar pulses, both
  on the same frame as the pointer down — so the capsule is free to leave at
  once.
*/

/**
 * One breath of the whole capsule, for a press — finger or mouse. It is now
 * the only animation on the bar that is not the scroll: the scroll scale used
 * to swing past its end and come back, and that swing is gone since GLIDE was
 * brought up near critical damping, so a press is the one thing left that
 * moves the bar on its own.
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
 */
function useScrollScale(
  minScale: number,
  distance: number,
  speedEffect: number
) {
  const travelled = useMotionValue(0);
  const eased = useSpring(travelled, GLIDE);

  // The floor is a live motion value, not a plain number, so dragging the
  // slider redraws the bar at once instead of waiting for the next scroll.
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

  // Read through a ref so moving a slider does not tear down the listener.
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

    const onScroll = () => {
      const y = window.scrollY;
      pending += y - lastY;
      lastY = y;
      if (running) return;
      running = true;
      idle = 0;
      lastT = performance.now();
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [travelled]);

  return scale;
}

export default function BottomNav({
  theme = DEFAULT_NAV_THEME,
}: {
  /** Every value the control panel can change. Omit it for the measured look. */
  theme?: NavTheme;
}) {
  const skin = buildSkin(theme);
  const [active, setActive] = useState<TabId>("home");
  const [pressed, setPressed] = useState<TabId | null>(null);
  const [dragging, setDragging] = useState(false);
  // Bumped every time the saved item changes, so the new icon can pop.
  const [pop, setPop] = useState(0);
  // How many slots the indicator is about to cross. Drives the squash.
  const [hop, setHop] = useState(0);

  const travelSpring = TRAVEL;
  const pressSpring = PRESS;

  const scrollScale = useScrollScale(
    theme.minScale,
    theme.distance,
    theme.speedEffect
  );

  // The pulse multiplies the scroll scale rather than replacing it, so a touch
  // during a scroll does not snap the bar back to full size.
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

  const slots = useRef<Partial<Record<TabId, HTMLLIElement | null>>>({});
  const pressedRef = useRef<TabId | null>(null);
  const activeRef = useRef<TabId>(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  /** Which item is under this x position on screen. */
  const nearest = (clientX: number): TabId => {
    let best: TabId = active;
    let bestDistance = Infinity;
    for (const t of TABS) {
      const el = slots.current[t.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const d = Math.abs(clientX - (r.left + r.width / 2));
      if (d < bestDistance) {
        bestDistance = d;
        best = t.id;
      }
    }
    return best;
  };

  /**
   * Records how many slots the indicator is about to cross. It has to run in
   * the same event as the move, before React draws the pill in its new home —
   * the pill starts squashed by this amount and settles to round.
   */
  const bump = (next: TabId) => {
    const current = pressedRef.current ?? activeRef.current;
    const from = TABS.findIndex((t) => t.id === current);
    const to = TABS.findIndex((t) => t.id === next);
    setHop(Math.abs(to - from));
  };

  /** Saves the pick. */
  const commit = (next: TabId) => {
    if (next === activeRef.current) return;
    setActive(next);
    setPop((n) => n + 1);
  };

  // Press and drag, the way the phone does it. Put a finger down and the pill
  // moves under it. Slide without lifting and it follows. Lift to pick.
  // The listeners live on the window so sliding off the bar and back keeps working.
  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => {
      const next = nearest(e.clientX);
      if (next !== pressedRef.current) {
        bump(next);
        pressedRef.current = next;
        setPressed(next);
      }
    };
    const onUp = () => {
      if (pressedRef.current) commit(pressedRef.current);
      pressedRef.current = null;
      setPressed(null);
      setDragging(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging]);

  // While a finger is down the bar shows what is under it, not what is saved.
  const shown = pressed ?? active;

  // A pill that crosses four slots squashes more than one that crosses one.
  const jump = Math.min(hop, 4);
  const squashX = 1 + jump * 0.055;
  const squashY = 1 - jump * 0.03;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 z-[70] flex justify-center"
      style={{
        bottom: BOTTOM_GAP,
        paddingLeft: SIDE_INSET,
        paddingRight: SIDE_INSET,
      }}
    >
      <motion.div
        className="relative w-full overflow-hidden"
        style={{
          maxWidth: BAR_MAX_W,
          height: BAR_H,
          borderRadius: BAR_R,
          background: skin.bar,
          backdropFilter: skin.filter,
          WebkitBackdropFilter: skin.filter,
          boxShadow: skin.shadow,
          // The scroll and the pulse both drive this, and nothing else touches
          // the transform, so the bar scales about its own centre and that
          // centre does not shift by a pixel.
          transformOrigin: "center center",
          scale,
        }}
      >
        <ul
          className="flex h-full items-stretch"
          style={{
            paddingLeft: PAD_X,
            paddingRight: PAD_X,
            paddingTop: PAD_Y,
            paddingBottom: PAD_Y,
            touchAction: "none",
          }}
          onPointerDown={(e) => {
            firePulse();
            const id = nearest(e.clientX);
            bump(id);
            pressedRef.current = id;
            setPressed(id);
            setDragging(true);
          }}
        >
          {TABS.map((t) => {
            const on = t.id === shown;
            const isActive = t.id === active;
            return (
              <li
                key={t.id}
                ref={(el) => {
                  slots.current[t.id] = el;
                }}
                className="relative flex-1"
              >
                {/* The indicator. The outer span carries the layoutId, so React
                    slides it from the old item to the new one. It is a fixed
                    74px wide and centred with a margin — not with a transform —
                    because a layout animation and a transform must not sit on
                    the same element. The inner span starts squashed along the
                    way it is travelling and settles round when it lands. */}
                {on && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-y-0"
                    style={{ left: "50%", width: PILL_W, marginLeft: -PILL_W / 2 }}
                    transition={travelSpring}
                  >
                    <motion.span
                      data-pill
                      className="block h-full w-full"
                      style={{ background: skin.pill, borderRadius: PILL_H / 2 }}
                      initial={{ scaleX: squashX, scaleY: squashY }}
                      animate={{ scaleX: 1, scaleY: 1 }}
                      transition={travelSpring}
                    />
                  </motion.span>
                )}

                <button
                  type="button"
                  aria-label={t.label}
                  aria-current={isActive ? "page" : undefined}
                  // No onClick: the row already commits on pointer up. A click
                  // handler here would undo a drag that ended on another item.
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      firePulse();
                      bump(t.id);
                      commit(t.id);
                    }
                  }}
                  className="relative flex h-full w-full items-center justify-center"
                  style={{ color: skin.ink }}
                >
                  <motion.span
                    // Remounting on `pop` replays the little scale-in, so the
                    // icon that just became active answers the tap.
                    key={isActive ? `${t.id}-${pop}` : t.id}
                    className="relative block"
                    initial={isActive && pop > 0 ? { scale: 0.82 } : false}
                    animate={{ scale: pressed === t.id ? 0.88 : 1 }}
                    transition={pressed === t.id ? pressSpring : travelSpring}
                  >
                    <TabIcon id={t.id} filled={isActive} size={GLYPH} />
                    {t.dot && (
                      <span
                        className="absolute rounded-full"
                        style={{
                          right: -1,
                          bottom: 2,
                          width: 7,
                          height: 7,
                          background: "#ff3040",
                        }}
                      />
                    )}
                  </motion.span>
                </button>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </nav>
  );
}
