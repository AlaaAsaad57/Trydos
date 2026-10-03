"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useTransform } from "framer-motion";
import {
  DEFAULT_NAV_THEME,
  PRESS,
  TRAVEL,
  useBarPulse,
  useScrollScale,
} from "components/NavigationDemo/BottomNav";
import XdIcon from "../DemoApp/XdIcon";
import {
  GrowBox,
  PROFILE,
  ProfileTab,
  SLOTS,
  SLOT_W,
  SWAP,
  TabCount,
} from "../DemoApp/DemoBottomNav";
import type { DemoTab } from "../DemoApp/demoRoutes";
import type { DemoKey } from "../DemoApp/demoKeys";
import {
  PAGE_MAX,
  SAFE_BOTTOM,
  SCREEN_TRANSITION,
  TAB_BAR,
} from "./demo1Layout";

/**
 * The tab bar of the fluid demo: the /demo bar (DemoBottomNav) — the same
 * icons, the same grow, press and scroll motion — in a fluid frame.
 *
 *  - It is `fixed` to the bottom of the window, on <body>: the document
 *    scrolls under it. It reads the document's scroll for its shrink and drop.
 *  - It keeps the file's 22 px to both edges of the screen (386 wide on a 430
 *    phone) and 15 px above the bottom.
 *  - Its five slots share the bar's width, 3 px in from each end, as the
 *    file's 76 px slots do on the 386 px bar. Each icon keeps the file's
 *    distance from its slot's centre.
 *
 * It has no fill and no full-width box of its own, so Safari 26 does not take
 * it for a bottom edge to paint its bar with.
 */

/** The file's centre of slot `index`, on the 430 artboard. */
const fileCentre = (index: number) => 63 + index * SLOT_W;

/** The gap between the bar's ends and its first and last slot (41 - 38). */
const SLOT_INSET = fileCentre(0) - TAB_BAR.x - SLOT_W / 2;

/** The bar keeps 22 px to the screen's edges, inside the centred page column. */
const SIDE = `max(${TAB_BAR.x}px, calc(50% - ${PAGE_MAX / 2 - TAB_BAR.x}px))`;

export default function Demo1BottomNav({
  active,
  visible,
  photo,
  verified,
  resetKey,
  onSelect,
  t,
}: {
  active: DemoTab | null;
  visible: boolean;
  photo: string | null;
  verified: boolean;
  /** The screen on show. A new screen starts at its top, so the bar goes back to full size. */
  resetKey: string;
  onSelect: (tab: DemoTab) => void;
  t: (key: DemoKey) => string;
}) {
  const scrollScale = useScrollScale(
    DEFAULT_NAV_THEME.minScale,
    DEFAULT_NAV_THEME.distance,
    DEFAULT_NAV_THEME.speedEffect,
    { scope: "window", resetKey },
  );
  const drop = useTransform(
    scrollScale,
    (s) => ((1 - s) / (1 - DEFAULT_NAV_THEME.minScale)) * TAB_BAR.drop,
  );
  const { scale, firePulse } = useBarPulse(scrollScale);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [pressed, setPressed] = useState<DemoTab | null>(null);
  const [dragging, setDragging] = useState(false);
  const pressedRef = useRef<DemoTab | null>(null);
  const slots = useRef<Partial<Record<DemoTab, HTMLButtonElement | null>>>({});
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const all: DemoTab[] = ["home", "search", "cart", "chat", "settings"];

  /** Which tab is under this x on screen. */
  const nearest = (clientX: number): DemoTab => {
    let best: DemoTab = active ?? "home";
    let bestDistance = Infinity;
    for (const id of all) {
      const el = slots.current[id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const d = Math.abs(clientX - (r.left + r.width / 2));
      if (d < bestDistance) {
        bestDistance = d;
        best = id;
      }
    }
    return best;
  };

  // Press and slide: the press follows the finger, and lifting picks.
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const next = nearest(e.clientX);
      if (next !== pressedRef.current) {
        pressedRef.current = next;
        setPressed(next);
      }
    };
    const onUp = () => {
      if (pressedRef.current) onSelectRef.current(pressedRef.current);
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

  /** An icon's place in its slot: the file's distance from the slot's centre. */
  const iconAt = (
    x: number,
    y: number,
    index: number,
  ): React.CSSProperties => ({
    position: "absolute",
    left: `calc(50% + ${x - fileCentre(index)}px)`,
    top: y - TAB_BAR.y,
  });

  const bar = (
    <motion.nav
      aria-label={t("Main")}
      data-pw="demo-tab-bar"
      className="fixed z-[2147482000]"
      initial={false}
      animate={
        visible
          ? { y: 0, opacity: 1, visibility: "visible" }
          : {
              y: TAB_BAR.height + 40,
              opacity: 0,
              transitionEnd: { visibility: "hidden" },
            }
      }
      transition={SCREEN_TRANSITION}
      style={{
        left: SIDE,
        right: SIDE,
        bottom: `calc(${15}px + ${SAFE_BOTTOM})`,
        height: TAB_BAR.height,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{
          transformOrigin: "center center",
          y: drop,
          scale,
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          firePulse();
          const id = nearest(e.clientX);
          pressedRef.current = id;
          setPressed(id);
          setDragging(true);
        }}
      >
        <span
          aria-hidden="true"
          data-pw="demo-tab-glass"
          className="absolute inset-0 block pointer-events-none"
          style={{
            borderRadius: TAB_BAR.radius,
            backgroundColor: "transparent",
            backdropFilter: TAB_BAR.glass,
            WebkitBackdropFilter: TAB_BAR.glass,
          }}
        />
        {all.map((id, index) => {
          const on = id === active;
          const slot = SLOTS[index];
          const label: DemoKey = slot ? slot.label : "Profile";
          return (
            <button
              key={id}
              ref={(el) => {
                slots.current[id] = el;
              }}
              type="button"
              aria-label={t(label)}
              aria-current={on ? "page" : undefined}
              data-pw={`demo-tab-${id}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  firePulse();
                  onSelect(id);
                }
              }}
              className="absolute top-0 h-full cursor-pointer"
              style={{
                left: `calc(${SLOT_INSET}px + (100% - ${2 * SLOT_INSET}px) * ${index / all.length})`,
                width: `calc((100% - ${2 * SLOT_INSET}px) / ${all.length})`,
              }}
            >
              <motion.span
                className="absolute inset-0 block"
                animate={{ scale: pressed === id ? 0.88 : 1 }}
                transition={pressed === id ? PRESS : TRAVEL}
              >
                {slot ? (
                  <GrowBox
                    tab={id}
                    on={on}
                    idle={slot.idle}
                    active={slot.active}
                    at={iconAt(slot.active.x, slot.active.y, index)}
                  >
                    <XdIcon
                      name={slot.icon}
                      size={slot.active.size}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        opacity: on ? 0 : 1,
                        transition: SWAP,
                      }}
                    />
                    <XdIcon
                      name={slot.activeIcon}
                      size={slot.active.size}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        opacity: on ? 1 : 0,
                        transition: SWAP,
                      }}
                    />
                    {slot.count && (
                      <TabCount
                        tab={id}
                        on={on}
                        count={slot.count}
                        size={slot.active.size}
                      />
                    )}
                  </GrowBox>
                ) : (
                  <GrowBox
                    tab={id}
                    on={on}
                    idle={PROFILE.idle}
                    active={PROFILE.active}
                    at={iconAt(PROFILE.active.x, PROFILE.active.y, index)}
                  >
                    <ProfileTab on={on} photo={photo} verified={verified} />
                  </GrowBox>
                )}
              </motion.span>
            </button>
          );
        })}
      </motion.div>
    </motion.nav>
  );

  return mounted ? createPortal(bar, document.body) : null;
}
