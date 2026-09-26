"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useTransform } from "framer-motion";
import {
  DEFAULT_NAV_THEME,
  PRESS,
  TRAVEL,
  useBarPulse,
  useScrollScale,
} from "components/NavigationDemo/BottomNav";
import XdIcon from "./XdIcon";
import { TAB_BAR, SCREEN_TRANSITION, bottom } from "./demoLayout";
import type { DemoTab } from "./demoRoutes";
import type { XdIconName } from "./xdIcons";
import type { DemoKey } from "./demoKeys";

/**
 * The tab bar of the new design (`Home Page` artboard), with the motion of the
 * bottom bar built for /navigation (components/NavigationDemo/BottomNav.tsx):
 *
 *   - scroll down and the bar scales down into its own centre, scroll up and it
 *     scales back — the same `useScrollScale`, listening to whatever screen
 *     box scrolls, because the scaled canvas never scrolls the page itself.
 *     The same scroll also moves the bar DOWN, by up to TAB_BAR.drop (35): the
 *     file's scrolled page (`Home Page – 9`) draws the bar 20 px below the
 *     screen edge, and the rest page (`Home Page`) 15 px above it. The scale
 *     is the demo's own motion (the file draws the scrolled bar at full size);
 *     the drop is the file's;
 *   - a press pulses the whole bar once and shrinks the icon under the finger;
 *   - press and slide without lifting, and the press follows the finger; lift
 *     to pick;
 *   - the icon that becomes active grows, and the one it replaces shrinks
 *     back, on one spring (GROW_SPRING).
 *
 * What it does NOT copy: the grey pill behind the active item. The design has
 * no pill, and no blue "active" icon either: the `Home Page` artboard (home
 * tab active) draws the try mark with the same dark dotted ring as `– 1`
 * (search active). The file shows the active size on two tabs: search grows
 * from 35 into its 43 px #4A31E7 ring (`– 1`), and the profile box grows from
 * 34 into the 42 px photo. Home, cart and chat grow by the same ratio
 * (43 / 35) about their own centre, keeping their own icon.
 *
 * Each icon is drawn at its ACTIVE size and scaled down while idle. The icons
 * are <img> SVGs: a browser can draw a shrunk image sharp, but an image grown
 * past its layout size can come out soft.
 *
 * The shape: 386 x 58 at (22, 859), corners 10 on top and 40 below. The
 * material is the file's "background blur": blur 30, brightness +15%, and a
 * fill opacity of 0 — so the bar has NO fill of its own; what you see is the
 * page behind it, blurred and lightened. On the empty pages that is white. The
 * file's drop shadow and inner shadow on the bar are both switched off.
 *
 * The glass is its own layer under the icons, not the element that scales.
 * Safari on iPhone clips a backdrop filter wrongly when the same element also
 * carries a transform: the blurred, brightened patch shows past the rounded
 * corners while the bar scales with the scroll. A child with the radius and
 * the filter, and no transform of its own, is drawn right.
 */

/** An icon box on the artboard: top-left corner and width. */
type Box = { x: number; y: number; size: number };

type Slot = {
  id: DemoTab;
  label: DemoKey;
  icon: XdIconName;
  idle: Box;
  active: Box;
  /** The icon the file draws when the tab is active. Only search has one. */
  activeIcon?: XdIconName;
};

/** How much search grows in the file: the 34.99 icon becomes the 42.98 ring. */
const GROW = 42.98 / 34.99;

/** A box grown by GROW about its own centre. */
const grown = (b: Box): Box => {
  const size = b.size * GROW;
  const shift = (size - b.size) / 2;
  return { x: b.x - shift, y: b.y - shift, size };
};

/** Icon boxes straight from the artboard. Slots are 76 apart, centred on 63 .. 367. */
const HOME: Box = { x: 45.5, y: 870.5, size: 35 };
const CART: Box = { x: 197.5, y: 870.5, size: 35 };
const CHAT: Box = { x: 274, y: 871, size: 34 };
const SLOTS: Slot[] = [
  { id: "home", label: "Home", icon: "navTry", idle: HOME, active: grown(HOME) },
  {
    id: "search",
    label: "Search",
    icon: "navSearch",
    idle: { x: 121.5, y: 870.5, size: 34.99 },
    active: { x: 113.5, y: 866.5, size: 42.98 },
    activeIcon: "navSearchActive",
  },
  { id: "cart", label: "Cart", icon: "navCart", idle: CART, active: grown(CART) },
  { id: "chat", label: "Chat", icon: "navChat", idle: CHAT, active: grown(CHAT) },
];

const SLOT_W = 76;
const slotCentre = (index: number) => 63 + index * SLOT_W - TAB_BAR.x;

/** The profile tab: a 34 box (`#EFEFEF`, 0.3 `#1D1D1D`) that becomes a 42 photo when active. */
const PROFILE = {
  idle: { x: 350, y: 871, size: 34 },
  active: { x: 346, y: 865, size: 42 },
  radius: 12,
};

/**
 * The grow and shrink of the active icon. A little under critical damping
 * (26 against 2 * sqrt(420 * 0.8) = 36.7), so the new icon passes its size by
 * a few percent and settles — the "answer" to the tap — in about 0.4 s.
 */
const GROW_SPRING = {
  type: "spring",
  stiffness: 420,
  damping: 26,
  mass: 0.8,
} as const;

/** The swap from the grey search icon to the blue ring, while it grows. */
const SWAP = "opacity 180ms ease-out";

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
  /** The screen on show. A new screen starts at its top, so the bar goes back to full size. */
  resetKey: string;
  onSelect: (tab: DemoTab) => void;
  t: (key: DemoKey) => string;
}) {
  const scrollScale = useScrollScale(
    DEFAULT_NAV_THEME.minScale,
    DEFAULT_NAV_THEME.distance,
    DEFAULT_NAV_THEME.speedEffect,
    { scope: "any", resetKey },
  );
  // Full size = rest, the floor = the scroll cap. The drop follows the same
  // reading, so the bar is 35 down exactly when it is smallest.
  const drop = useTransform(
    scrollScale,
    (s) => ((1 - s) / (1 - DEFAULT_NAV_THEME.minScale)) * TAB_BAR.drop,
  );
  const { scale, firePulse } = useBarPulse(scrollScale);

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
                        opacity: on && slot.activeIcon ? 0 : 1,
                        transition: SWAP,
                      }}
                    />
                    {slot.activeIcon && (
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
                    <ProfileTab on={on} photo={photo} />
                  </GrowBox>
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
 * One tab icon, laid out at its ACTIVE box and scaled down to its idle box
 * while the tab is not active. The transform origin is the top-left corner,
 * so moving to the idle corner and scaling there lands on the idle box
 * exactly; the spring runs the move and the scale together.
 */
function GrowBox({
  tab,
  on,
  idle,
  active,
  at,
  children,
}: {
  tab: DemoTab;
  on: boolean;
  idle: Box;
  active: Box;
  /** Where the active box sits inside the slot. */
  at: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <motion.span
      data-pw={`demo-tab-${tab}-icon`}
      className="block"
      initial={false}
      animate={
        on
          ? { x: 0, y: 0, scale: 1 }
          : {
              x: idle.x - active.x,
              y: idle.y - active.y,
              scale: idle.size / active.size,
            }
      }
      transition={GROW_SPRING}
      style={{
        ...at,
        width: active.size,
        height: active.size,
        transformOrigin: "0 0",
      }}
    >
      {children}
    </motion.span>
  );
}

/** Idle, the profile box is drawn at 34 / 42 of its size, so its corner and line are drawn this much bigger to land on the file's. */
const PROFILE_UNSCALE = PROFILE.active.size / PROFILE.idle.size;
const PROFILE_FADE = { duration: 0.25, ease: "easeOut" } as const;

/**
 * The profile tab, drawn at the active 42 and scaled by its GrowBox. Idle: the
 * 34 grey box with the user glyph and the 0.3 `#1D1D1D` line. Active: the 42
 * photo with XD's inner shadow (0 4 3, white at 50%). With no photo yet, the
 * active box keeps the grey fill and the glyph.
 *
 * The corner (12) and the idle line (0.3) are the file's numbers at the size
 * on screen, so while idle they are set PROFILE_UNSCALE bigger to cancel the
 * scale. Both shadows use the same parts (inset, x, y, blur, spread, colour)
 * so framer-motion can blend one into the other.
 */
function ProfileTab({ on, photo }: { on: boolean; photo: string | null }) {
  const radius = on ? PROFILE.radius : PROFILE.radius * PROFILE_UNSCALE;
  return (
    <motion.span
      className="absolute inset-0 block overflow-hidden"
      initial={false}
      animate={{ borderRadius: radius }}
      transition={PROFILE_FADE}
      style={{ background: "#EFEFEF" }}
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
          size={17.9 * PROFILE_UNSCALE}
          style={{
            position: "absolute",
            left: 8.05 * PROFILE_UNSCALE,
            top: 6.06 * PROFILE_UNSCALE,
          }}
        />
      )}
      {/* Over the photo, so the inner shadow is not hidden under it. */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0"
        initial={false}
        animate={{
          borderRadius: radius,
          boxShadow: on
            ? "inset 0px 4px 3px 0px rgba(255, 255, 255, 0.5)"
            : `inset 0px 0px 0px ${0.3 * PROFILE_UNSCALE}px rgba(29, 29, 29, 1)`,
        }}
        transition={PROFILE_FADE}
      />
    </motion.span>
  );
}
