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
import { Stroke } from "./ui";
import {
  TAB_BAR,
  SCREEN_TRANSITION,
  bottom,
  lineBox,
  textTop,
} from "./demoLayout";
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
 * no pill.
 *
 * The active icons are the set the file keeps on the pasteboard under the
 * `Home Page` artboard: the purple try mark in its purple dotted ring (42),
 * the purple search ring, the purple bag with the yellow handle, the purple
 * chat bubbles, and the purple profile box. The idle icon fades out and the
 * active one fades in while the tab grows. The sizes: home grows from 35 into
 * the 42 try mark, search from 35 into its 43 ring (`– 1`), the profile box
 * from 34 into 42, and cart and chat by the same ratio (43 / 35) about their
 * own centre.
 *
 * Cart and chat show the file's counts, 3 and 11. The demo has no cart and no
 * chat, so the counts are fixed: they show the badge design, not real data.
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

/**
 * A count the file draws on a tab: Quicksand Bold 12, its left edge and its
 * baseline in the tab's 34 px box. The active count sits 1 px lower.
 */
type Count = {
  text: string;
  x: number;
  idle: { baseline: number; color: string };
  active: { baseline: number; color: string };
};

type Slot = {
  id: DemoTab;
  label: DemoKey;
  icon: XdIconName;
  idle: Box;
  active: Box;
  /** The icon the file draws when the tab is active. */
  activeIcon: XdIconName;
  count?: Count;
};

/** The box the file draws the counts in. */
const COUNT_BOX = 34;
const COUNT_SIZE = 12;
const PURPLE = "#4A31E7";

/** How much search grows in the file: the 34.99 icon becomes the 42.98 ring. */
const GROW = 42.98 / 34.99;

/** A box grown by GROW about its own centre. */
const grown = (b: Box): Box => {
  const size = b.size * GROW;
  const shift = (size - b.size) / 2;
  return { x: b.x - shift, y: b.y - shift, size };
};

/**
 * Icon boxes straight from the artboard. Slots are 76 apart, centred on 63 .. 367.
 * The cart box is the 34 px box of the cart with a count, centred where the
 * artboard's 35 px cart is.
 */
const CART: Box = { x: 198, y: 871, size: 34 };
const CHAT: Box = { x: 274, y: 871, size: 34 };
const SLOTS: Slot[] = [
  {
    id: "home",
    label: "Home",
    icon: "navTry",
    idle: { x: 45.5, y: 870.5, size: 35 },
    // The 42 try mark, on the same centre (63, 888).
    active: { x: 42, y: 867, size: 42 },
    activeIcon: "navTryActive",
  },
  {
    id: "search",
    label: "Search",
    icon: "navSearch",
    idle: { x: 121.5, y: 870.5, size: 34.99 },
    active: { x: 113.5, y: 866.5, size: 42.98 },
    activeIcon: "navSearchActive",
  },
  {
    id: "cart",
    label: "Cart",
    icon: "navCartCount",
    idle: CART,
    active: grown(CART),
    activeIcon: "navCartActiveCount",
    count: {
      text: "3",
      x: 17,
      idle: { baseline: 26, color: PURPLE },
      active: { baseline: 27, color: PURPLE },
    },
  },
  {
    id: "chat",
    label: "Chat",
    icon: "navChatCount",
    idle: CHAT,
    active: grown(CHAT),
    activeIcon: "navChatActiveCount",
    count: {
      text: "11",
      x: 20,
      idle: { baseline: 26, color: PURPLE },
      active: { baseline: 27, color: "#FFFFFF" },
    },
  },
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

/** The swap from the idle icon to the active one, while it grows. */
const SWAP = "opacity 180ms ease-out";

export default function DemoBottomNav({
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
  /** The shopper's photo, for the profile tab. */
  photo: string | null;
  /** False while the shopper still has to verify: the idle photo gets the orange line. */
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

/**
 * A tab's count, in the file's 34 px box. The box is scaled up to the active
 * icon's size, so the count grows with the icon and lands on the file's 12 px
 * while the tab is idle. The idle and the active count fade into each other
 * with the icons: the active one is 1 px lower, and white on the chat bubble.
 */
function TabCount({
  tab,
  on,
  count,
  size,
}: {
  tab: DemoTab;
  on: boolean;
  count: Count;
  /** The active icon's size, the box this count is drawn in. */
  size: number;
}) {
  return (
    <span
      aria-hidden="true"
      className="absolute left-0 top-0 block"
      style={{
        width: COUNT_BOX,
        height: COUNT_BOX,
        transform: `scale(${size / COUNT_BOX})`,
        transformOrigin: "0 0",
      }}
    >
      {(["idle", "active"] as const).map((state) => {
        const { baseline, color } = count[state];
        return (
          <span
            key={state}
            data-pw={`demo-tab-${tab}-count`}
            className="absolute block font-bold whitespace-nowrap"
            style={{
              left: count.x,
              top: textTop(baseline, COUNT_SIZE),
              fontSize: COUNT_SIZE,
              lineHeight: `${lineBox(COUNT_SIZE)}px`,
              color,
              opacity: (state === "active") === on ? 1 : 0,
              transition: SWAP,
            }}
          >
            {count.text}
          </span>
        );
      })}
    </span>
  );
}

/** Idle, the profile box is drawn at 34 / 42 of its size, so its corner and line are drawn this much bigger to land on the file's. */
const PROFILE_UNSCALE = PROFILE.active.size / PROFILE.idle.size;
const PROFILE_FADE = { duration: 0.25, ease: "easeOut" } as const;

/**
 * The line round the profile box, from the pasteboard set under `Home Page`:
 * the 0.3 `#1D1D1D` line on the box with no photo, active or not; on a photo,
 * 1 px purple when active and 1 px orange while the shopper still has to
 * verify; no line on the idle photo of a verified shopper. Null = no line.
 */
const profileLine = (
  on: boolean,
  photo: boolean,
  verified: boolean,
): { color: string; width: number } | null => {
  if (!photo) return { color: "#1D1D1D", width: 0.3 };
  if (on) return { color: PURPLE, width: 1 };
  return verified ? null : { color: "#F5A03C", width: 1 };
};

/**
 * The profile tab, drawn at the active 42 and scaled by its GrowBox.
 *
 * With no photo: idle, the 34 grey (`#EFEFEF`) box with the grey user glyph;
 * active, the purple (`#D4D4FC`) box with the purple (`#8888E5`) glyph. The
 * glyphs fade into each other, like the other tabs' icons.
 *
 * With a photo: the photo, with XD's inner shadow (0 4 3, white at 50%) in
 * every state, and the line `profileLine` picks.
 *
 * The corner (12) and the lines are the file's numbers at the size on screen,
 * so while idle they are set PROFILE_UNSCALE bigger to cancel the scale.
 */
function ProfileTab({
  on,
  photo,
  verified,
}: {
  on: boolean;
  photo: string | null;
  verified: boolean;
}) {
  const radius = on ? PROFILE.radius : PROFILE.radius * PROFILE_UNSCALE;
  const line = profileLine(on, photo !== null, verified);
  const unscale = on ? 1 : PROFILE_UNSCALE;
  const glyph = (
    name: XdIconName,
    size: number,
    x: number,
    y: number,
    shown: boolean,
  ) => (
    <XdIcon
      name={name}
      size={size * PROFILE_UNSCALE}
      style={{
        position: "absolute",
        left: x * PROFILE_UNSCALE,
        top: y * PROFILE_UNSCALE,
        opacity: shown ? 1 : 0,
        transition: SWAP,
      }}
    />
  );
  return (
    <motion.span
      className="absolute inset-0 block overflow-hidden"
      initial={false}
      animate={{ borderRadius: radius }}
      transition={PROFILE_FADE}
      style={{
        background: !photo && on ? "#D4D4FC" : "#EFEFEF",
        transition: "background-color 180ms ease-out",
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
        <>
          {glyph("navUser", 17.9, 8.05, 6.06, !on)}
          {glyph("navUserActive", 16.91, 8.5, 6.6, on)}
        </>
      )}
      {/* Over the photo, so the inner shadow is not hidden under it. */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0"
        initial={false}
        animate={{
          borderRadius: radius,
          boxShadow: photo
            ? "inset 0px 4px 3px 0px rgba(255, 255, 255, 0.5)"
            : "inset 0px 4px 3px 0px rgba(255, 255, 255, 0)",
        }}
        transition={PROFILE_FADE}
      >
        {/* The line, as SVG: Safari draws a thin inset shadow thick on its straight edges. */}
        <Stroke
          color={line?.color ?? PURPLE}
          width={(line?.width ?? 1) * unscale}
          radius={radius}
          visible={line !== null}
        />
      </motion.span>
    </motion.span>
  );
}
