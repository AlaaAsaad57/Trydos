"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { PRESS, TRAVEL, useBarPulse } from "components/NavigationDemo/BottomNav";
import XdIcon from "./XdIcon";
import { TAB_BAR, SCREEN_TRANSITION, bottom } from "./demoLayout";
import type { DemoTab } from "./demoRoutes";
import type { XdIconName } from "./xdIcons";
import type { DemoKey } from "./demoKeys";

/**
 * The tab bar of the new design (`Home Page` artboard), with the motion of the
 * bottom bar built for /navigation (components/NavigationDemo/BottomNav.tsx):
 *
 *   - the bar follows the scroll position of the screen: at the top it is at
 *     rest, 15 px above the screen edge (`Home Page`); scrolled 35 px or more
 *     it is 35 px lower, 20 px of it below the edge, as the file's scrolled
 *     page (`Home Page – 9`) draws it — including at the end of that page,
 *     which scrolls only 197 px. In between it moves with the finger. It keeps
 *     its full size: the file draws the scrolled bar at 386 x 58. The scroll is
 *     heard on the document, from whatever screen box scrolls, because the
 *     scaled canvas never scrolls the page itself;
 *   - a press pulses the whole bar once and shrinks the icon under the finger;
 *   - press and slide without lifting, and the press follows the finger; lift
 *     to pick;
 *   - the icon that becomes active pops in.
 *
 * What it does NOT copy: the grey pill behind the active item. The design has
 * no pill, and no blue "active" icon either: the `Home Page` artboard (home
 * tab active) draws the try mark with the same dark dotted ring as `– 1`
 * (search active). Only two tabs change when active — search grows into its
 * 43 px #4A31E7 ring, and the profile tab becomes the 42 px photo.
 *
 * The shape: 386 x 58 at (22, 859), corners 10 on top and 40 below. The
 * material is the file's "background blur": blur 30, brightness +15%, and a
 * fill opacity of 0 — so the bar has NO fill of its own; what you see is the
 * page behind it, blurred and lightened. On the empty pages that is white. The
 * file's drop shadow and inner shadow on the bar are both switched off.
 *
 * The glass is its own layer under the icons, not the element that moves.
 * Safari on iPhone clips a backdrop filter wrongly when the same element also
 * carries a transform: the blurred, brightened patch shows past the rounded
 * corners while the bar moves with the scroll or pulses on a press. A child
 * with the radius and the filter, and no transform of its own, is drawn right.
 */

type Slot = {
  id: DemoTab;
  label: DemoKey;
  icon: XdIconName;
  /** Design x, y of the icon box. */
  x: number;
  y: number;
  /** The icon and box the file draws when the tab is active. Only search has one. */
  active?: { icon: XdIconName; x: number; y: number };
};

/** Icon boxes straight from the artboard. Slots are 76 apart, centred on 63 .. 367. */
const SLOTS: Slot[] = [
  { id: "home", label: "Home", icon: "navTry", x: 45.5, y: 870.5 },
  {
    id: "search",
    label: "Search",
    icon: "navSearch",
    x: 121.5,
    y: 870.5,
    active: { icon: "navSearchActive", x: 113.5, y: 866.5 },
  },
  { id: "cart", label: "Cart", icon: "navCart", x: 197.5, y: 870.5 },
  { id: "chat", label: "Chat", icon: "navChat", x: 274, y: 871 },
];

const SLOT_W = 76;
const slotCentre = (index: number) => 63 + index * SLOT_W - TAB_BAR.x;

/** The profile tab: a 34 box (`#EFEFEF`, 0.3 `#1D1D1D`) that becomes a 42 photo when active. */
const PROFILE = {
  idle: { x: 350, y: 871, size: 34 },
  active: { x: 346, y: 865, size: 42 },
  radius: 12,
};

export default function DemoBottomNav({
  active,
  visible,
  photo,
  resetKey,
  onSelect,
  t,
}: {
  active: DemoTab | null;
  visible: boolean;
  /** The shopper's photo, for the profile tab. */
  photo: string | null;
  /** The screen on show. A new screen starts at its top, so the bar goes back up. */
  resetKey: string;
  onSelect: (tab: DemoTab) => void;
  t: (key: DemoKey) => string;
}) {
  // How far the screen on show is scrolled down. Only boxes that scroll up
  // and down count: a sideways row of chips does not move the bar.
  const scrolled = useMotionValue(0);
  useEffect(() => {
    scrolled.set(0);
    const onScroll = (event: Event) => {
      const box = event.target;
      if (!(box instanceof Element) || box.scrollHeight <= box.clientHeight)
        return;
      scrolled.set(box.scrollTop);
    };
    document.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });
    return () =>
      document.removeEventListener("scroll", onScroll, { capture: true });
  }, [resetKey, scrolled]);
  const drop = useTransform(scrolled, (y) =>
    Math.min(Math.max(y, 0), TAB_BAR.drop),
  );
  // The press pulse scales the bar from its full size.
  const fullSize = useMotionValue(1);
  const { scale, firePulse } = useBarPulse(fullSize);

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

  // Press and slide, the way the bar in /navigation does it: the press
  // follows the finger, and lifting picks what is under it.
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

  const iconAt = (
    x: number,
    y: number,
    index: number,
  ): React.CSSProperties => ({
    position: "absolute",
    left: x - TAB_BAR.x - (slotCentre(index) - SLOT_W / 2),
    top: y - TAB_BAR.y,
  });

  return (
    <motion.nav
      aria-label={t("Main")}
      data-pw="demo-tab-bar"
      className="absolute z-20"
      initial={false}
      // Off the bottom and gone while an inner screen is up — the inner
      // artboards have no tab bar at all.
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
        left: TAB_BAR.x,
        bottom: bottom(TAB_BAR.y, TAB_BAR.height),
        width: TAB_BAR.width,
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
              // No onClick: the bar picks on pointer up, like /navigation.
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  firePulse();
                  onSelect(id);
                }
              }}
              className="absolute top-0 h-full cursor-pointer"
              style={{ left: slotCentre(index) - SLOT_W / 2, width: SLOT_W }}
            >
              <motion.span
                // Remounting on a new active tab replays the pop.
                key={on ? `${id}-on` : id}
                className="absolute inset-0 block"
                initial={on ? { scale: 0.82 } : false}
                animate={{ scale: pressed === id ? 0.88 : 1 }}
                transition={pressed === id ? PRESS : TRAVEL}
              >
                {slot ? (
                  <XdIcon
                    name={on && slot.active ? slot.active.icon : slot.icon}
                    style={iconAt(
                      on && slot.active ? slot.active.x : slot.x,
                      on && slot.active ? slot.active.y : slot.y,
                      index,
                    )}
                  />
                ) : (
                  <ProfileTab
                    on={on}
                    photo={photo}
                    style={iconAt(
                      on ? PROFILE.active.x : PROFILE.idle.x,
                      on ? PROFILE.active.y : PROFILE.idle.y,
                      index,
                    )}
                  />
                )}
              </motion.span>
            </button>
          );
        })}
      </motion.div>
    </motion.nav>
  );
}

/**
 * The profile tab. Idle: the 34 grey box with the user glyph. Active: the 42
 * photo with XD's inner shadow (0 4 3, white at 50%). With no photo yet, the
 * active box keeps the grey fill and the glyph, drawn at the active size.
 */
function ProfileTab({
  on,
  photo,
  style,
}: {
  on: boolean;
  photo: string | null;
  style: React.CSSProperties;
}) {
  const size = on ? PROFILE.active.size : PROFILE.idle.size;
  return (
    <span
      className="block overflow-hidden"
      style={{
        ...style,
        width: size,
        height: size,
        borderRadius: PROFILE.radius,
        background: "#EFEFEF",
      }}
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <XdIcon
          name="navUser"
          size={(17.9 * size) / PROFILE.idle.size}
          style={{
            position: "absolute",
            left: (8.05 * size) / PROFILE.idle.size,
            top: (6.06 * size) / PROFILE.idle.size,
          }}
        />
      )}
      {/* Over the photo, so the inner shadow is not hidden under it. */}
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          borderRadius: PROFILE.radius,
          boxShadow: on
            ? "inset 0 4px 3px rgba(255,255,255,0.5)"
            : "inset 0 0 0 0.3px #1D1D1D",
        }}
      />
    </span>
  );
}
