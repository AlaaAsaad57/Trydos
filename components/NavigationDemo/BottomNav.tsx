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
      icon spacing is 66 at rest and 56 while the page moves. 56 / 66 = 0.85,
      which is where MIN_SCALE comes from.
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

const BAR_BG = "rgba(246,246,246,0.84)";
const PILL_BG = "rgba(0,0,0,0.115)";

/**
 * How wide the bar may get on a desktop screen. A phone draws it at 355, so
 * anything much wider stops looking like the thing being copied.
 */
const BAR_MAX_W = 380;

/* ---------------------------- the motion --------------------------------- */

/** Full size. The bar is never drawn bigger than this. */
const MAX_SCALE = 1;

/** The smallest the bar ever gets. Measured: 56 / 66. */
const MIN_SCALE = 0.85;

/** How much downward scroll takes the bar from MAX_SCALE to MIN_SCALE. */
const RANGE = 120;

/**
 * The most one scroll event may move the bar.
 *
 * This is the cap on the spring's TARGET, not on what you see. The spring is
 * what stops the bar jumping, so the cap only has to keep one event from
 * commanding more than about three quarters of the range. Set it too low (it
 * was 50) and the target creeps along just ahead of the bar: the spring never
 * carries any speed, so it eases to a dead stop at each end with no beat at
 * all. At 100 one firm scroll commands most of the travel, the spring covers
 * it with real speed, and the swing past the end comes out of the physics.
 */
const MAX_STEP = 100;

/** Going back up is a little quicker than going down. */
const REVEAL_BOOST = 1.6;

/**
 * The one timing function behind the whole scale — the glide AND the beat it
 * lands on. There is no second animation stacked on top.
 *
 * A spring is critically damped when damping = 2 * sqrt(stiffness * mass),
 * which here is 2 * sqrt(220 * 0.9) = 28.1. At that value it eases to a stop
 * and never passes the target. Below it the spring carries momentum past the
 * end and comes back once, and that single swing IS the landing beat. damping
 * 15 puts the ratio at 15 / 28.1 = 0.53.
 *
 * The beat cannot fight the glide, because it is the same motion: shrink, one
 * small swing past the end, settle. It also grades itself by how hard you
 * scrolled, which no separate animation can do. Measured swing past the end:
 *
 *     a flick          1.09px
 *     a brisk scroll   0.88px
 *     a slow scroll    0.38px
 *
 * Raise damping to 28 and the bar stops dead at each end with no beat at all.
 */
const GLIDE = { stiffness: 220, damping: 15, mass: 0.9 } as const;

/*
  ON prefers-reduced-motion
  This component ignores it, on purpose. It is a design demo whose whole
  subject is the motion, and on a machine with the setting turned on there
  would be nothing left to look at. Before this bar goes into the real app,
  decide there what a reduced-motion visitor should get — most likely the
  scroll scale and the indicator move stay, and the pulse goes.
*/

/** Moves the indicator. */
const TRAVEL = { type: "spring", stiffness: 420, damping: 34, mass: 0.9 } as const;

/** Reacts to a finger going down. */
const PRESS = { type: "spring", stiffness: 700, damping: 38, mass: 0.6 } as const;

/**
 * The indicator holds still for a moment before it sets off. Without it the
 * pill leaves under your finger and the tap feels unanswered; with it the
 * press reads first and the pill follows.
 */
const INDICATOR_DELAY = 0.06;

/**
 * One breath of the whole capsule, for a press — finger or mouse. This is the
 * only pulse that is its own animation, because a press is its own event. The
 * beat you see when the scroll scale lands is not this: it comes from the
 * scale spring itself, see GLIDE above.
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
 * `travelled` is how far into the shrink we are: 0 at full size, 1 at the
 * small size, clamped at both ends. A spring sits between the scroll and the
 * screen, so what the browser draws is always a smooth curve even when the
 * scroll arrives in lumps.
 */
function useScrollScale() {
  const travelled = useMotionValue(0);
  const eased = useSpring(travelled, GLIDE);
  // clamp: false is what lets the beat through. useTransform clamps its output
  // to the range by default, so the spring's swing past each end was being
  // measured, computed and then thrown away one step before the screen.
  // `travelled` itself is still clamped 0..1, so the only values that ever
  // land outside the range are the swing.
  const scale = useTransform(eased, [0, 1], [MAX_SCALE, MIN_SCALE], {
    clamp: false,
  });

  useEffect(() => {
    let last = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const dy = clamp(y - last, -MAX_STEP, MAX_STEP);
      last = y;
      if (dy === 0) return;

      // At the very top the bar is always full size.
      if (y <= 8) {
        travelled.set(0);
        return;
      }

      const step = dy / RANGE;
      travelled.set(
        clamp(travelled.get() + (dy > 0 ? step : step * REVEAL_BOOST), 0, 1)
      );
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [travelled]);

  return scale;
}

export default function BottomNav() {
  const [active, setActive] = useState<TabId>("home");
  const [pressed, setPressed] = useState<TabId | null>(null);
  const [dragging, setDragging] = useState(false);
  // Bumped every time the saved item changes, so the new icon can pop.
  const [pop, setPop] = useState(0);
  // How many slots the indicator is about to cross. Drives the squash.
  const [hop, setHop] = useState(0);

  const travelSpring = { ...TRAVEL, delay: INDICATOR_DELAY };
  const pressSpring = PRESS;

  const scrollScale = useScrollScale();

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
          background: BAR_BG,
          backdropFilter: "blur(15px) saturate(180%)",
          WebkitBackdropFilter: "blur(15px) saturate(180%)",
          boxShadow:
            "0 4px 18px rgba(0,0,0,0.18), inset 0 0 0 0.5px rgba(255,255,255,0.6), inset 0 -0.5px 0 rgba(255,255,255,0.9)",
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
                      style={{ background: PILL_BG, borderRadius: PILL_H / 2 }}
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
                  className="relative flex h-full w-full items-center justify-center text-[#0a0a0a]"
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
