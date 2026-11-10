"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useIsPresent } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import type { XdIconName } from "../../DemoApp/xdIcons";
import { bagCount, bagTotal, bagWas, type DemoBagItem } from "../../DemoApp/demoBag";
import { useDemoNav } from "../Demo1Shell";
import {
  C,
  COLUMN_W,
  HEADER,
  SAFE_BOTTOM,
  SCREEN_TRANSITION,
  TAB_BAR,
  UNDER_BAR,
  lineBox,
  textTop,
} from "../demo1Layout";
import { Stroke } from "../ui";
import { FlipTurns, Rich, type T } from "./ListingParts";

/**
 * The parts the bag (`Home Page – 50`) and the checkout (`– 56`) share: the
 * header, the bottom panel with the sum and the wide button, and the small
 * chips. All numbers are design px from the file.
 */

export const LINE_11 = { fontSize: 11, lineHeight: `${lineBox(11)}px` } as const;
export const LINE_13 = { fontSize: 13, lineHeight: `${lineBox(13)}px` } as const;
export const LINE_14 = { fontSize: 14, lineHeight: `${lineBox(14)}px` } as const;
export const LINE_15 = { fontSize: 15, lineHeight: `${lineBox(15)}px` } as const;

/** The file's shadow under the header (0, 0, blur 3, black at 10%). */
const HEADER_SHADOW = "0 0 3px rgba(0, 0, 0, 0.1)";

/** The file's shadow on the panel's top edge (0, -3, blur 10, black at 10%), as on the buy bar. */
const PANEL_SHADOW = "0 -3px 10px rgba(0, 0, 0, 0.102)";

/** Over the sheets' layer, as the buy bar is (Layer's z is 2147483000 + 30). */
const PANEL_Z = 2147483040;

/** The panel's top: the file's y 790 on the bag, 818 on the checkout. Its content ends 57 below it. */
const PANEL_CONTENT_H = 847 - 790;

/**
 * The room under the content: 12 on the bag (over the tab bar, y 847 to 859);
 * on the checkout the panel starts 28 lower (y 818) and runs to the screen's
 * end (its content ends at 875).
 */
const PANEL_ROOM = { tabBar: 859 - 847, screen: 932 - 875 } as const;

/** How the panel grows and shrinks when the price details open. */
const MOVE = { duration: 0.32, ease: [0.2, 0, 0, 1] as const };

/** How the button's words change when the panel goes from one screen to the other. */
const WORDS_OUT = { duration: 0.18 };
const WORDS_IN = { duration: 0.2, delay: 0.14 };

/** Where a panel's bottom is, above the window's end (less the safe area): on the tab bar, or under Safari's bar. */
const bottomOf = (tabBar: boolean) => (tabBar ? TAB_BAR.height + (932 - 917) : -UNDER_BAR);

/** A panel's height, with the price details shut or open. */
const heightOf = (tabBar: boolean, details: boolean) =>
  (details ? DETAILS_END : PANEL_CONTENT_H) + (tabBar ? PANEL_ROOM.tabBar : PANEL_ROOM.screen + UNDER_BAR);

/** What the panel on show looks like, so the next screen's panel can start from it. */
type PanelLook = {
  tabBar: boolean;
  details: boolean;
  button: { label: string; fill: string };
  /** When the first of these panels came (performance.now()), so the chip's turns go on from where they were. */
  since: number;
};

/**
 * The panel on show, or null. The bag and the checkout each draw their own
 * panel. When one screen opens the other, the new panel starts where the old
 * one is and moves to its own place, so the panel seems to stay and change.
 */
let livePanel: PanelLook | null = null;

/**
 * The header of both screens: "Shopping bag" at x 12, the 34 px bag in the
 * middle, and the count with the sum ending 12 px from the right, all on
 * baseline 80. The file draws no back arrow on either screen.
 */
export function BagHeader({ bag, t }: { bag: readonly DemoBagItem[]; t: T }) {
  return (
    <header
      data-pw="demo-bag-header"
      className="relative flex items-start w-full font-quicksand shrink-0"
      style={{ height: HEADER.height, background: C.white, boxShadow: HEADER_SHADOW }}
    >
      <h1
        className="font-normal whitespace-nowrap"
        style={{ marginLeft: 12, marginTop: textTop(80, 14) - HEADER.y, color: C.ink, ...LINE_14 }}
      >
        {t("Shopping bag")}
      </h1>
      <XdIcon
        name="cartBag"
        className="absolute"
        style={{ left: "50%", marginLeft: -17, top: 58 - HEADER.y }}
      />
      <p
        data-pw="demo-bag-header-sum"
        className="ml-auto font-normal whitespace-nowrap"
        style={{ marginRight: 12, marginTop: textTop(80, 14) - HEADER.y, color: C.ink, ...LINE_14 }}
      >
        <BagSum bag={bag} t={t} />
      </p>
    </header>
  );
}

/** "2 item . 320 usd": the count and the sum in Medium, the rest Regular. */
export function BagSum({ bag, t }: { bag: readonly DemoBagItem[]; t: T }) {
  return (
    <Rich
      text={t("<m>{count}</m> item . <m>{price}</m> {currency}")}
      values={{ count: bagCount(bag), price: bagTotal(bag), currency: t("USD") }}
    />
  );
}

/**
 * A small chip, 18 tall, round 6: its words 6 px in, or at x 26 after a 14 px
 * mark. The file's width is the minimum (see Pill in ProductScreen).
 */
export function SmallChip({
  icon,
  bg,
  line,
  minW,
  ink = C.ink,
  mt,
  testId,
  children,
}: {
  icon?: XdIconName;
  bg: string;
  line?: string;
  minW: number;
  ink?: string;
  mt?: number;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-pw={testId}
      className="relative inline-flex items-start shrink-0 self-start font-normal whitespace-nowrap"
      style={{
        marginTop: mt,
        height: 18,
        minWidth: minW,
        padding: `2px 3px 0 ${icon ? 26 : 6}px`,
        borderRadius: 6,
        background: bg,
        color: ink,
        ...LINE_11,
      }}
    >
      {icon && <XdIcon name={icon} className="absolute" style={{ left: 6, top: 2 }} />}
      {children}
      {line && <Stroke color={line} width={0.3} radius={6} />}
    </div>
  );
}

/** The price details the file lists under the sum (`– 50`, y 856 to 974): the chip's top under the panel's top, its width, its fill and its mark. */
const DETAILS: readonly {
  top: number;
  minW: number;
  bg: string;
  icon?: XdIconName;
}[] = [
  { top: 856 - 790, minW: 43, bg: "#F4F4F4" },
  { top: 879 - 790, minW: 101, bg: "#F4F4F4", icon: "productFastGreen" },
  { top: 903 - 790, minW: 92, bg: "#F4F4F4", icon: "productFastRed" },
  { top: 926 - 790, minW: 165, bg: "#F8F8F8", icon: "productShop" },
  { top: 950 - 790, minW: 130, bg: "#F4F4F4", icon: "productRefundGreen" },
  { top: 974 - 790, minW: 123, bg: "#F4F4F4", icon: "productRefundOrange" },
];

/** The last detail chip's bottom, under the panel's top. */
const DETAILS_END = DETAILS[DETAILS.length - 1].top + 18;

/** True once the page runs in the browser, so a portal has a <body> to go to. */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * The white panel at the bottom of both screens: round 30 at the top, the
 * file's shadow on its top edge; the sum ("400 320 usd") with its help mark
 * at (25, 817), the "All inclusive" chip under it at y 829, and the wide
 * button (188 x 45, round 30 at the top and 15 at the bottom) 8 px from the
 * right. On the bag it rests on the tab bar (69 tall); on the checkout it
 * runs to the screen's end (113 tall).
 *
 * The old price is struck through, as in the file. The "All inclusive" chip
 * takes turns with the six price details (FlipTurns, as the store page's
 * labels). The help mark opens the same details as a list: the six chips the
 * file lists under the sum on `– 50` (its board draws them running on under
 * the tab bar). The panel grows to hold them and shrinks back on a second tap.
 *
 * Between the bag and the checkout the panel does not slide away: the new
 * screen's panel starts where the old one is (its top, its bottom, its
 * button's colour and words) and moves to its own place with the screen's
 * timing, so the panel seems to stay and change (see livePanel).
 *
 * It is a real fixed box, as wide as the page column, on <body>, for the
 * reasons given at the buy bar's panel (ProductBuy.tsx): Safari 26 then
 * paints white under its own bar by itself on the checkout, where the panel
 * meets the window's end. It slides in and out with the screen (the screen's
 * own timing), because a fixed box inside the sliding screen would move with
 * the page, not with the window.
 */
export function BagPanel({
  bag,
  tabBar,
  button,
  testId,
  t,
}: {
  bag: readonly DemoBagItem[];
  /** The panel sits on the tab bar (the bag); otherwise it runs to the screen's end (the checkout). */
  tabBar: boolean;
  button: { label: string; onClick?: () => void; fill: string; disabled?: boolean; testId?: string };
  testId: string;
  t: T;
}) {
  const mounted = useMounted();
  const present = useIsPresent();
  const { shown } = useDemoNav();
  // The other screen's panel is on show: start from it (see livePanel).
  const [from] = useState(() => (livePanel && livePanel.tabBar !== tabBar ? livePanel : null));
  const [since] = useState(() => from?.since ?? performance.now());
  const [elapsed] = useState(() => (performance.now() - since) / 1000);
  const [details, setDetails] = useState(from?.details ?? false);
  /** The help mark was tapped: the height moves with the details' own timing from then on. */
  const [toggled, setToggled] = useState(false);
  const height = heightOf(tabBar, details);
  /** How far down the panel waits, out of the window. */
  const away = height + 30;
  // The other screen's panel took over: this one goes at once, under it.
  const handedOff = !present && (shown === "cart" || shown === "cart/checkout") && bag.length > 0;

  useEffect(() => {
    if (!present) return;
    const look: PanelLook = { tabBar, details, button: { label: button.label, fill: button.fill }, since };
    livePanel = look;
    return () => {
      if (livePanel === look) livePanel = null;
    };
  }, [present, tabBar, details, button.label, button.fill, since]);

  if (!mounted) return null;
  return createPortal(
    <motion.div
      data-pw={testId}
      className="font-quicksand"
      initial={
        from
          ? { y: bottomOf(tabBar) - bottomOf(from.tabBar), height: heightOf(from.tabBar, from.details) }
          : { y: away }
      }
      animate={{ y: present || handedOff ? 0 : away, height, opacity: handedOff ? 0 : 1 }}
      transition={{
        ...SCREEN_TRANSITION,
        height: toggled ? MOVE : SCREEN_TRANSITION,
        // The new panel lies over this one from its first frame; a moment later this one goes, so the two shadows never add up.
        opacity: { duration: 0, delay: 0.05 },
      }}
      style={{
        position: "fixed",
        left: `calc(50% - ${COLUMN_W} / 2)`,
        width: COLUMN_W,
        bottom: tabBar
          ? `calc(${TAB_BAR.height + (932 - 917)}px + ${SAFE_BOTTOM})`
          : `calc(${SAFE_BOTTOM} - ${UNDER_BAR}px)`,
        zIndex: PANEL_Z,
        pointerEvents: present ? undefined : "none",
        borderRadius: "30px 30px 0 0",
        // Not fully opaque, for Chromium (see BuyCard in ProductBuy.tsx). Safari reads it as plain white.
        background: "rgba(255, 255, 255, 0.9976)",
        boxShadow: PANEL_SHADOW,
        overflow: "hidden",
      }}
    >
      {/* The sum, baseline 817, with its mark at (121, 805.5): "400" grey, "320" Bold, the currency Regular. */}
      <div
        data-pw="demo-bag-sum"
        className="absolute flex items-start font-normal whitespace-pre"
        style={{ left: 25, top: textTop(817, 15) - 790, color: C.ink, ...LINE_15 }}
      >
        <span style={{ minWidth: 121 - 25 }}>
          {/* The old price is struck through, in its own grey. */}
          <s style={{ color: C.grey, textDecorationLine: "line-through" }}>{bagWas(bag)}</s>
          <span className="font-bold">{` ${bagTotal(bag)}`}</span>
          {` ${t("USD")}`}
        </span>
        <button
          type="button"
          aria-label={t("Price details")}
          aria-expanded={details}
          data-pw="demo-bag-details"
          onClick={() => {
            setToggled(true);
            setDetails((on) => !on);
          }}
          className="shrink-0 cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
          style={{ marginTop: 805.5 - textTop(817, 15) - 6, padding: 6, marginLeft: -6, marginRight: -6 }}
        >
          <XdIcon name="buyPriceHelp" />
        </button>
      </div>
      {/* "All inclusive" takes turns with the six price details, as the store page's labels do. */}
      <FlipTurns
        testId="demo-bag-chips"
        className="absolute"
        style={{ left: 25, top: 829 - 790, width: 234 - 8 - 25, height: 18 }}
        elapsed={elapsed}
        // Each chip in a row of its own: an inline chip would sit on a line of text, 3 px low.
        items={[
          <div key="all" className="flex">
            <SmallChip bg="#F4F4F4" line={C.purple} minW={163} testId="demo-bag-chip">
              {t("All inclusive without additions")}
            </SmallChip>
          </div>,
          ...DETAILS.map((chip, i) => (
            <div key={chip.top} className="flex">
              <SmallChip bg={chip.bg} line={C.purple} minW={chip.minW} icon={chip.icon}>
                <DetailWords index={i} bag={bag} t={t} />
              </SmallChip>
            </div>
          )),
        ]}
      />
      {DETAILS.map((chip, i) => (
        <motion.div
          key={chip.top}
          className="absolute flex"
          initial={false}
          animate={{ opacity: details ? 1 : 0 }}
          transition={{ duration: 0.18, delay: details ? 0.04 * i : 0 }}
          style={{ left: 25, top: chip.top, pointerEvents: details ? undefined : "none" }}
          aria-hidden={!details}
        >
          <SmallChip bg={chip.bg} line={C.purple} minW={chip.minW} icon={chip.icon} testId={`demo-bag-detail-${i}`}>
            <DetailWords index={i} bag={bag} t={t} />
          </SmallChip>
        </motion.div>
      ))}
      <motion.button
        type="button"
        data-pw={button.testId}
        aria-disabled={button.disabled || undefined}
        onClick={button.disabled ? undefined : button.onClick}
        className={`absolute flex items-center justify-center font-normal whitespace-nowrap [-webkit-tap-highlight-color:transparent] ${button.disabled ? "cursor-default" : "cursor-pointer active:opacity-80"}`}
        // Coming from the other screen: the old colour turns into this one, and the old words fade out as the new ones fade in.
        initial={{ backgroundColor: from?.button.fill ?? button.fill }}
        animate={{ backgroundColor: button.fill }}
        transition={SCREEN_TRANSITION}
        style={{
          right: 430 - (234 + 188),
          top: 802 - 790,
          width: 188,
          height: 45,
          borderRadius: "30px 30px 15px 15px",
          color: C.white,
          ...LINE_13,
        }}
      >
        {from && from.button.label !== button.label && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={WORDS_OUT}
          >
            {from.button.label}
          </motion.span>
        )}
        <motion.span initial={{ opacity: from ? 0 : 1 }} animate={{ opacity: 1 }} transition={WORDS_IN}>
          {button.label}
        </motion.span>
      </motion.button>
    </motion.div>,
    document.body,
  );
}

/** The words of detail chip `index`, in the file's order. */
function DetailWords({ index, bag, t }: { index: number; bag: readonly DemoBagItem[]; t: T }) {
  switch (index) {
    case 0:
      return <Rich text={t("<b>{count}</b> item")} values={{ count: bagCount(bag) }} />;
    case 1:
      return <>{t("Free Shipping")}</>;
    case 2:
      return <>{t("Free Return")}</>;
    case 3:
      return <Rich text={t("<m>just {days} days</m> In your hands")} values={{ days: 3 }} />;
    case 4:
      return <>{t("Delivery guarantee")}</>;
    default:
      return <>{t("Return guarantee")}</>;
  }
}

/**
 * A hairline across the page, 12 px in from both edges, drawn as XD draws it:
 * an SVG line 0.5 px wide, centred on its y. (A 0.5 px box lands on whole
 * device pixels and comes out darker than the file's line.) The box is 1 px
 * tall with the line in its middle, so `mt` is the room above the line's
 * centre less 0.5; the block after it starts 0.5 under the centre.
 */
export function Rule({ color, mt = 0 }: { color: string; mt?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="block shrink-0"
      style={{ marginTop: mt - 0.5, marginLeft: 12, marginRight: 12, width: "calc(100% - 24px)", height: 1 }}
    >
      <line x1="0" x2="100%" y1="0.5" y2="0.5" stroke={color} strokeWidth={0.5} />
    </svg>
  );
}
