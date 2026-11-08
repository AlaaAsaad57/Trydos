"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useIsPresent } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import type { DemoKey } from "../../DemoApp/demoKeys";
import { ringPhotoOf } from "../../DemoApp/demoProduct";
import type { DemoProduct, DemoStore } from "../../DemoApp/demoStores";
import { useDemoNav } from "../Demo1Shell";
import { useDemoCase } from "../demoCase";
import {
  C,
  COLUMN_W,
  SAFE_BOTTOM,
  SAFE_TOP,
  SCREEN_TRANSITION,
  UNDER_BAR,
  lineBox,
  textTop,
  top as designTop,
} from "../demo1Layout";
import { Sheet, Stroke, useCanvasEnd } from "../ui";
import { PlainBadge } from "./ListingColorSheet";
import {
  CardLogo,
  FOOTER_H,
  LabelTurns,
  PHOTO,
  PhotoGlow,
  PricePill,
  ProductName,
  Rich,
  SwatchPicker,
  type T,
} from "./ListingParts";
import { LikeHeart, useLike } from "./LikeHeart";

/**
 * How a product is bought: the bar under the product's page and the size sheet
 * that opens from it.
 *
 * The bar, `Listing page – 154` to `– 156` and `Home Page – 51`, `– 55`:
 *
 *  - Full: a white panel with round top corners, the price and a chip on the
 *    left, then Buy, the likes, the comments and the shares. The panel's top is
 *    57 px above where its content ends. `– 154` and `– 155` differ only in
 *    Safari's own bar: the small bar lets the window end lower, and this panel
 *    hangs on the window's end, so it moves down by itself.
 *  - Small (`– 156`): a scroll down leaves one grey pill, "Buy Now ! 160 USD".
 *    A scroll up brings the panel back.
 *  - With items in the bag (`– 55`): a green chip, and "Remove | Add More" in
 *    place of the marks.
 *
 * The sheet, `Home Page – 57`, `– 58`, `– 59`, `– 67` and `– 68`, lies under the
 * bar, over the page dimmed and blurred like the colour sheet. Over the dimmed
 * page are the product's card and the bag. A tap on a size picks it. A size that
 * is sold out offers "Notify Me" in place of the buy button.
 *
 * Every number is the file's, in design px. The grey shapes under the bar in the
 * file are Safari's own bar, so they are not drawn here. They do show where the
 * window ends for us: the file's content ends 12 px above them (4 px for the
 * pill), so that is the room we keep under it. Safari 26 on the iPhone already
 * ends the window about 16 px above its bar, and it cuts a fixed box at that
 * line, so there the content rests on the window's end (see useFloatingBar).
 *
 * Why anchors. Safari 26 reads the bottom edge of the window for a fixed box as
 * wide as the screen, and paints the room under its bar in that box's colour.
 * So each fixed thing here hangs on a fixed point with no size, like the tab
 * bar (see EDGE_ANCHOR in demo1Layout.ts). Safari's room under its bar shows
 * only the document, so `BarTail` keeps the file's white there.
 */

/** Design y: the panel's top, where its content ends, and where the file's Safari bar starts. */
const BAR_Y = 783;
const BAR_END = 840;
const BROWSER_Y = 852;

/** The panel's height from its top to the end of its content. */
const CONTENT_H = BAR_END - BAR_Y;

/** The room under the panel's content, and under the small pill, when the browser has no floating bar. */
const FULL_GAP = BROWSER_Y - BAR_END;
const PILL_GAP = 888 - 884;

/** The small pill (`– 156`): 32 tall, the file's width as its minimum. */
const PILL = { minW: 160, h: 32 } as const;

/** The sheet's top in the file: how far it is above the content's end. */
const SHEET_Y = 529;
const SHEET_ABOVE_END = BAR_END - SHEET_Y;

/** The card's distance above the sheet, and the highest its top may go (under the bag). */
const CARD_Y = 112;
const CARD_ABOVE_SHEET = SHEET_Y - (CARD_Y + PHOTO.h + FOOTER_H);

/** The label on the sheet's card (`– 57`). */
const BEST_LABEL = { kind: "best", days: 3 } as const;

/** The file's prices: this bar and this card show them for every product. */
const PRICE = { was: 200, now: 160 } as const;

/** Over the sheet's layer (Layer's z is 2147483000 + 30). */
const BAR_Z = 2147483040;

/** Over the demo's top strip, which has the top z-index and comes first on the page. */
const BAG_Z = 2147483647;

/** The file's sheet shadow, the same on the panel: 0, -3, blur 10, black at 10%. */
const SHADOW = "0 -3px 10px rgba(0, 0, 0, 0.102)";

/** The file's sizes, in order. The word is the one the bar's chip uses ("Medium"). */
const SIZES: readonly { code: string; number: number; word: DemoKey }[] = [
  { code: "XXS", number: 32, word: "XX Small" },
  { code: "XS", number: 34, word: "X Small" },
  { code: "S", number: 36, word: "Small" },
  { code: "M", number: 38, word: "Medium" },
  { code: "L", number: 40, word: "Large" },
  { code: "XL", number: 42, word: "X Large" },
  { code: "XXL", number: 44, word: "XX Large" },
];

/** The file's story: S is sold out (`– 67`), M is the size it recommends (`– 57`). */
const SOLD_OUT = 2;
const RECOMMENDED = 3;
/** "Last 2" in `– 57`. */
const STOCK = 2;
/** The bag's count in `– 59` is 4 with one new item. The tab bar has the same 3 (DemoBottomNav). */
const BAG_BEFORE = 3;

const LINE_11 = { fontSize: 11, lineHeight: `${lineBox(11)}px` } as const;
const LINE_13 = { fontSize: 13, lineHeight: `${lineBox(13)}px` } as const;
const LINE_15 = { fontSize: 15, lineHeight: `${lineBox(15)}px` } as const;

/** The motion of the panel and the pill, and of a block that changes inside them. */
const MOVE = { duration: 0.32, ease: [0.2, 0, 0, 1] as const };
const FADE = { duration: 0.18, ease: "easeOut" as const };
/** The sheet's own spring (Sheet in ui.tsx), for what comes with it. */
const WITH_SHEET = { type: "spring" as const, stiffness: 320, damping: 34, mass: 0.9 };

/** How far a scroll goes one way before the bar changes, and where the bar is always full. */
const COLLAPSE_AFTER = 24;
const EXPAND_AFTER = 12;
const ALWAYS_FULL_Y = 60;

/** True for Safari 26 or newer in an iPhone's tab, where the bar floats over the page. */
function useFloatingBar() {
  const [floating, setFloating] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    const version = ua.match(/Version\/(\d+)[^ ]* Mobile\/\S+ Safari/);
    setFloating(/iPhone|iPod/.test(ua) && !!version && Number(version[1]) >= 26);
  }, []);
  return floating;
}

/**
 * The bar goes small on a scroll down and comes back on a scroll up, and is
 * always full near the page's top. A short move the other way starts the count
 * again, so a finger's small shake does not make the bar jump.
 */
function useSmallBar(held: boolean) {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    if (held) {
      setSmall(false);
      return;
    }
    let last = window.scrollY;
    let run = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - last;
      last = y;
      if (y < ALWAYS_FULL_Y) {
        run = 0;
        setSmall(false);
        return;
      }
      run = Math.sign(dy) === Math.sign(run) ? run + dy : dy;
      if (run > COLLAPSE_AFTER) setSmall(true);
      else if (run < -EXPAND_AFTER) setSmall(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [held]);
  return small;
}

/**
 * The file's white under Safari's bar. Safari draws only the document there,
 * so this is in the document, at the window's end, and follows the scroll. It
 * stops at the document's end, or the document would grow each time it is
 * reached. Only on a touch device: with a mouse there is no such bar.
 */
function BarTail() {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const follow = () => {
      if (!box.current) return;
      const y = window.scrollY + window.innerHeight;
      box.current.style.top = `${y}px`;
      box.current.style.height = `${Math.max(0, Math.min(UNDER_BAR, document.documentElement.scrollHeight - y))}px`;
    };
    follow();
    window.addEventListener("scroll", follow, { passive: true });
    window.addEventListener("resize", follow);
    return () => {
      window.removeEventListener("scroll", follow);
      window.removeEventListener("resize", follow);
    };
  }, []);
  return (
    <div
      ref={box}
      aria-hidden="true"
      data-pw="demo-buy-tail"
      style={{ position: "absolute", left: 0, width: "100%", background: C.white, pointerEvents: "none", zIndex: BAR_Z - 1 }}
    />
  );
}

/** A small chip: 18 tall, round 6, the words 6 px in. The file's width is the minimum (see Pill in ProductScreen). */
function Chip({
  bg,
  line,
  minW,
  ink = C.ink,
  testId,
  children,
}: {
  bg: string;
  line?: string;
  minW: number;
  ink?: string;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-pw={testId}
      className="relative inline-flex items-start shrink-0 font-normal whitespace-nowrap"
      style={{
        height: 18,
        minWidth: minW,
        padding: "2px 2px 0 6px",
        borderRadius: 6,
        background: bg,
        color: ink,
        transition: "background-color 0.2s, color 0.2s",
        ...LINE_11,
      }}
    >
      {children}
      {line && <Stroke color={line} width={0.3} radius={6} />}
    </div>
  );
}

/** One mark of the bar and its number: the 25 px mark `iconAt`, the text at the file's x under it. */
function BarMark({
  iconLeft,
  textLeft,
  label,
  number,
  testId,
  pressed,
  onPress,
  children,
}: {
  iconLeft: string;
  textLeft: number;
  label: string;
  number: string;
  testId: string;
  pressed?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      data-pw={testId}
      onClick={onPress}
      className="absolute flex items-start cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
      style={{ left: iconLeft, top: 795 - BAR_Y, width: 25, height: 45 }}
    >
      {children}
      <span
        className="absolute font-light whitespace-nowrap"
        style={{ left: textLeft, top: textTop(837, 11) - 795, color: C.ink, ...LINE_11 }}
      >
        {number}
      </span>
    </button>
  );
}

/**
 * A mark's x: the file's on a 430 px screen. The first (Buy) keeps its x and the
 * last keeps its distance to the right edge, so on another width the marks
 * share the room between them.
 */
const markLeft = (x: number) => `calc(${x}px + (100% - 430px) * ${(x - 202) / (380 - 202)})`;

function HeartMark({ t }: { t: T }) {
  const like = useLike();
  return (
    <BarMark
      iconLeft={markLeft(261)}
      textLeft={263 - 261}
      label={t("Like")}
      number="110k"
      testId="demo-buy-like"
      pressed={like.liked}
      onPress={like.toggle}
    >
      <LikeHeart liked={like.liked} burst={like.burst} outline="buyHeart" filled="productHeartFilled" size={25} />
    </BarMark>
  );
}

/**
 * The dark button, (234, 795), 188 x 45, that comes out of the plus (`– 57`).
 * The file asks for top corners of 30, but XD stops a corner at half the
 * button's height, so they draw as 22.5.
 *
 * The opening clip ends 1 px outside the button. On the button's own edge it
 * would soften the corners a second time, and they would draw thinner than the
 * file's.
 */
const BUTTON_CLOSED = "inset(-1px 200px -1px -1px round 23.5px 23.5px 15px 15px)";
const BUTTON_OPEN = "inset(-1px -1px -1px -1px round 23.5px 23.5px 15px 15px)";

function DarkButton({ dim, children }: { dim: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      data-pw="demo-buy-button"
      className="absolute overflow-hidden flex items-stretch justify-center font-normal whitespace-nowrap"
      initial={{ clipPath: BUTTON_CLOSED, opacity: 0.4 }}
      animate={{ clipPath: BUTTON_OPEN, opacity: 1 }}
      exit={{ clipPath: BUTTON_CLOSED, opacity: 0 }}
      transition={MOVE}
      style={{
        left: 234,
        right: 8,
        top: 795 - BAR_Y,
        height: 45,
        borderRadius: "22.5px 22.5px 14px 14px",
        background: dim ? "#C3C3C3" : C.ink,
        color: C.white,
        transition: "background-color 0.2s",
        ...LINE_13,
      }}
    >
      {children}
    </motion.div>
  );
}

/** One side of the dark button: the whole height is the target, the words sit on the file's baseline 823. */
function ButtonSide({
  side,
  nudge = 0,
  disabled,
  color,
  testId,
  onPress,
  children,
}: {
  side: "start" | "end";
  /** Extra room before the words: the line moves right by half of it. */
  nudge?: number;
  disabled?: boolean;
  color?: string;
  testId: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      data-pw={testId}
      onClick={onPress}
      className="flex items-start shrink-0 font-normal enabled:cursor-pointer enabled:active:opacity-60 [-webkit-tap-highlight-color:transparent]"
      style={{
        paddingTop: textTop(823, 13) - 795,
        paddingLeft: side === "start" ? 12 + nudge : 0,
        paddingRight: side === "end" ? 12 : 0,
        color: color ?? C.white,
        ...LINE_13,
        height: 45,
      }}
    >
      {children}
    </button>
  );
}

/**
 * The line between the button's two sides. The file has two spaces each side
 * of it: 6.9 px in this font at 13 px. A phone narrower than the file's 430 px
 * gives that room to the words, down to 3 px at 375.
 */
function ButtonLine() {
  return (
    <span
      aria-hidden="true"
      className="shrink-0"
      style={{ paddingTop: textTop(823, 13) - 795, marginInline: "clamp(3px, calc(6.9px + (100vw - 430px) * 0.071), 6.9px)", ...LINE_13 }}
    >
      |
    </span>
  );
}

type BarMode =
  | { kind: "marks" }
  | { kind: "buy"; ready: boolean }
  | { kind: "added" }
  | { kind: "notify"; on: boolean };

function Bar({
  mode,
  small,
  gap,
  pillGap,
  sheetOpen,
  chip,
  currency,
  onOpen,
  onBuy,
  onAdd,
  onRemove,
  onAddMore,
  onNotify,
  t,
}: {
  mode: BarMode;
  small: boolean;
  gap: number;
  pillGap: number;
  sheetOpen: boolean;
  chip: React.ReactNode;
  currency: string;
  onOpen: () => void;
  onBuy: () => void;
  onAdd: () => void;
  onRemove: () => void;
  onAddMore: () => void;
  onNotify: () => void;
  t: T;
}) {
  const present = useIsPresent();
  const tail = mode.kind !== "marks";
  const fullH = CONTENT_H + gap;
  return (
    <motion.div
      data-pw="demo-buy-bar"
      className="font-quicksand"
      initial={{ y: fullH + 30 }}
      animate={{ y: present ? 0 : fullH + 30 }}
      transition={SCREEN_TRANSITION}
      style={{
        // The anchor with no size (see the note at the top of this file).
        position: "fixed",
        left: "50%",
        bottom: SAFE_BOTTOM,
        width: 0,
        height: 0,
        zIndex: BAR_Z,
        pointerEvents: present ? undefined : "none",
      }}
    >
      <motion.div
        data-pw="demo-buy-panel"
        initial={false}
        animate={
          small
            ? { y: fullH + 30, transitionEnd: { visibility: "hidden" } }
            : { y: 0, visibility: "visible" }
        }
        transition={MOVE}
        style={{
          position: "absolute",
          left: `calc(${COLUMN_W} / -2)`,
          width: COLUMN_W,
          top: -fullH,
          // On under Safari's bar, as the file draws it.
          height: fullH + UNDER_BAR,
          borderRadius: "30px 30px 0 0",
          background: "rgba(255, 255, 255, 0.9976)",
          boxShadow: SHADOW,
        }}
      >
        {/* The price, baseline 810, and its mark at (119, 798.5). */}
        <div
          data-pw="demo-buy-price"
          className="absolute flex items-start font-normal whitespace-pre"
          style={{ left: 25, top: textTop(810, 15) - BAR_Y, color: C.ink, ...LINE_15 }}
        >
          {/* One line, as the file has it: the space before the price is bold. The mark is at x 119. */}
          <span style={{ minWidth: 119 - 25 }}>
            <span style={{ color: C.grey }}>{PRICE.was}</span>
            <span className="font-bold">{` ${PRICE.now}`}</span>
            {` ${currency}`}
          </span>
          <XdIcon name="buyPriceHelp" className="shrink-0" style={{ marginTop: 798.5 - textTop(810, 15) }} />
        </div>
        <div className="absolute flex" style={{ left: 25, top: 822 - BAR_Y }}>
          {chip}
        </div>

        {/* The plus: a circle, or with its tail when the dark button is out. */}
        <button
          type="button"
          aria-label={t("Buy")}
          data-pw="demo-buy-plus"
          onClick={onOpen}
          className="absolute flex items-start cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
          style={{ left: 202, top: 795 - BAR_Y, width: 25, height: tail ? 25 : 45 }}
        >
          <XdIcon
            name="buyPlus"
            className="absolute"
            style={{ left: 0, top: 0, opacity: tail ? 0 : 1, transition: "opacity 0.18s" }}
          />
          <XdIcon
            name="buyPlusTail"
            className="absolute"
            // A wider picture than its button: the page's `img { max-width: 100% }` would squeeze it.
            style={{ left: 198 - 202, top: 791 - 795, maxWidth: "none", opacity: tail ? 1 : 0, transition: "opacity 0.18s" }}
          />
          {!tail && (
            <span
              className="absolute font-medium whitespace-nowrap"
              style={{ left: 205 - 202, top: textTop(837, 11) - 795, color: C.ink, ...LINE_11 }}
            >
              {t("Buy")}
            </span>
          )}
        </button>

        <AnimatePresence initial={false}>
          {!tail ? (
            <motion.div
              key="marks"
              className="absolute inset-0 pointer-events-none [&>*]:pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
            >
              <HeartMark t={t} />
              <BarMark iconLeft={markLeft(321)} textLeft={326 - 321} label={t("Comments")} number="11k" testId="demo-buy-comments">
                <XdIcon name="buyComment" />
              </BarMark>
              <BarMark iconLeft={markLeft(380)} textLeft={390 - 380} label={t("Share")} number="2" testId="demo-buy-share">
                <XdIcon name="buySend" />
              </BarMark>
            </motion.div>
          ) : (
            <DarkButton key="button" dim={mode.kind === "buy" && !mode.ready}>
              {mode.kind === "buy" && (
                <>
                  <ButtonSide side="start" disabled={!mode.ready} testId="demo-buy-now" onPress={onBuy}>
                    {t("Buy now")}
                  </ButtonSide>
                  <ButtonLine />
                  <ButtonSide side="end" disabled={!mode.ready} testId="demo-buy-add" onPress={onAdd}>
                    {t("Add to bag")}
                  </ButtonSide>
                </>
              )}
              {mode.kind === "added" && (
                <>
                  {/* The file starts these words at x 266, 0.3 px right of the middle. */}
                  <ButtonSide side="start" nudge={0.64} color="#FAA8A8" testId="demo-buy-remove" onPress={onRemove}>
                    {t("Remove")}
                  </ButtonSide>
                  <ButtonLine />
                  <ButtonSide side="end" testId="demo-buy-more" onPress={onAddMore}>
                    {t("Add More")}
                  </ButtonSide>
                </>
              )}
              {mode.kind === "notify" && (
                <button
                  type="button"
                  aria-pressed={mode.on}
                  data-pw="demo-buy-notify"
                  onClick={onNotify}
                  className="flex items-start justify-center w-full font-normal cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
                  style={{ paddingTop: textTop(823, 13) - 795, gap: 6, color: C.white, ...LINE_13 }}
                >
                  <span className="relative block shrink-0" style={{ width: 16, height: 16 }}>
                    <XdIcon
                      name="buyBell"
                      className="absolute"
                      style={{ left: 0, top: 810 - textTop(823, 13), opacity: mode.on ? 0 : 1, transition: "opacity 0.2s" }}
                    />
                    <XdIcon
                      name="buyBellOn"
                      className="absolute"
                      style={{ left: 0, top: 810 - textTop(823, 13), opacity: mode.on ? 1 : 0, transition: "opacity 0.2s" }}
                    />
                  </span>
                  <motion.span key={String(mode.on)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FADE}>
                    {t(mode.on ? "don’t Notify me" : "Notify me")}
                  </motion.span>
                </button>
              )}
            </DarkButton>
          )}
        </AnimatePresence>
      </motion.div>

      {/* The small bar (`– 156`). */}
      <motion.button
        type="button"
        data-pw="demo-buy-pill"
        onClick={onOpen}
        tabIndex={small ? 0 : -1}
        aria-hidden={!small}
        className="absolute flex items-start font-normal whitespace-nowrap cursor-pointer [-webkit-tap-highlight-color:transparent]"
        initial={false}
        animate={
          small && !sheetOpen
            ? { opacity: 1, scale: 1, y: 0, visibility: "visible" }
            : { opacity: 0, scale: 0.9, y: 12, transitionEnd: { visibility: "hidden" } }
        }
        whileTap={{ scale: 0.97 }}
        transition={MOVE}
        style={{
          left: 0,
          x: "-50%",
          top: -(PILL.h + pillGap),
          height: PILL.h,
          minWidth: PILL.minW,
          padding: `${textTop(873, 13) - 852}px 8px 0 ${172 - 135}px`,
          borderRadius: 15,
          background: "#EBEBEB",
          color: C.ink,
          ...LINE_13,
        }}
      >
        <XdIcon name="buyPlus" className="absolute" style={{ left: 141 - 135, top: 856 - 852 }} />
        <Rich text={t("<b>Buy</b> now !<b> {price}</b> {currency}")} values={{ price: PRICE.now, currency }} />
      </motion.button>
    </motion.div>
  );
}

/** A unit tab of the sheet: 22 tall, round 6, the picked one `#F4F4F4`, the words on baseline 594. */
function UnitTab({
  w,
  on,
  onPick,
  testId,
  children,
}: {
  w: number;
  on: boolean;
  onPick: () => void;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      data-pw={testId}
      onClick={onPick}
      className="relative flex items-start justify-center shrink-0 font-normal cursor-pointer [-webkit-tap-highlight-color:transparent]"
      style={{
        width: w,
        height: 22,
        paddingTop: textTop(594, 11) - 579,
        borderRadius: 6,
        background: on ? "#F4F4F4" : "#FCFCFC",
        color: C.ink,
        transition: "background-color 0.2s",
        ...LINE_11,
      }}
    >
      {children}
      <Stroke color={C.line} width={0.5} radius={6} />
    </button>
  );
}

type TileLook = "plain" | "suggested" | "line" | "picked" | "sold";

const TILE: Record<TileLook, { bg: string; line: string; ink: string }> = {
  plain: { bg: C.white, line: C.line, ink: C.ink },
  suggested: { bg: "#F8F8F8", line: C.purple, ink: C.ink },
  line: { bg: C.white, line: C.purple, ink: C.ink },
  picked: { bg: C.purple, line: C.purple, ink: C.white },
  sold: { bg: "#FFF8F8", line: "#FF0000", ink: C.ink },
};

function SizeTile({
  size,
  look,
  onPick,
  index,
}: {
  size: (typeof SIZES)[number];
  look: TileLook;
  onPick: () => void;
  index: number;
}) {
  const style = TILE[look];
  return (
    <motion.button
      type="button"
      aria-pressed={look === "picked" || look === "sold"}
      data-pw={`demo-buy-size-${index}`}
      data-look={look}
      onClick={onPick}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 420, damping: 26, mass: 0.8 }}
      className="relative flex flex-col items-center justify-start min-w-0 font-medium cursor-pointer [-webkit-tap-highlight-color:transparent]"
      style={{
        flex: "1 1 0",
        height: 54,
        paddingTop: textTop(638, 11) - 615,
        borderRadius: 6,
        background: style.bg,
        color: style.ink,
        transition: "background-color 0.2s, color 0.2s",
        ...LINE_11,
      }}
    >
      <span className="block">{size.code}</span>
      <span className="block" style={{ marginTop: textTop(654, 11) - (textTop(638, 11) + lineBox(11)) }}>
        {size.number}
      </span>
      <Stroke color={style.line} width={0.5} radius={6} />
    </motion.button>
  );
}

/** A message under the sizes: it comes in softly when it changes. */
function Message({ id, mt, nudge = 0, children }: { id: string; mt: number; nudge?: number; children: React.ReactNode }) {
  return (
    <motion.div
      key={id}
      className="flex justify-center shrink-0"
      // `nudge`: the file centres this line by eye, that many px right of the middle.
      style={{ marginTop: mt, paddingLeft: nudge * 2 }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MOVE}
    >
      {children}
    </motion.div>
  );
}

function SizeSheetBody({
  product,
  colorIndex,
  pick,
  inBag,
  onPick,
  onColor,
  t,
}: {
  product: DemoProduct;
  colorIndex: number;
  pick: number | null;
  inBag: (index: number) => boolean;
  onPick: (index: number) => void;
  onColor: (index: number) => void;
  t: T;
}) {
  const [unit, setUnit] = useState(0);
  const [chart, setChart] = useState(0);
  const sold = pick === SOLD_OUT;
  const size = SIZES[pick ?? RECOMMENDED];
  const added = pick !== null && inBag(pick);
  /** The mark lies under the picked size, or under the size the file recommends. */
  const markAt = pick === null || sold ? RECOMMENDED : pick;
  const values = { size: size.code, number: size.number, stock: STOCK };
  const others = product.colors
    .map((color, index) => ({ color, index }))
    .filter((c) => c.index !== colorIndex)
    .slice(0, 2);
  // The file always draws two circles: with one other colour, it shows that colour twice.
  const circles = others.length === 1 ? [others[0], others[0]] : others;

  const lookOf = (i: number): TileLook => {
    if (i === pick) return sold ? "sold" : "picked";
    if (inBag(i)) return "picked";
    if (i === RECOMMENDED && pick === null) return "suggested";
    if (i === RECOMMENDED && sold) return "line";
    return "plain";
  };

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label={t("Please Select the required size & Quantity")}
      data-pw="demo-buy-sizes"
      className="flex flex-col w-full shrink-0"
      style={{ height: BAR_Y - SHEET_Y }}
    >
      <h2
        className="text-center font-normal shrink-0"
        style={{ marginTop: textTop(556, 13) - SHEET_Y, color: C.ink, ...LINE_13 }}
      >
        {t("Please Select the required size & Quantity")}
      </h2>
      <div className="flex justify-between shrink-0" style={{ marginTop: 579 - (textTop(556, 13) + lineBox(13)), padding: "0 14px" }}>
        <div className="flex" style={{ gap: 2 }}>
          {(["CM", "INC"] as const).map((key, i) => (
            <UnitTab key={key} w={36} on={unit === i} onPick={() => setUnit(i)} testId={`demo-buy-unit-${i}`}>
              {t(key)}
            </UnitTab>
          ))}
        </div>
        <div className="flex" style={{ gap: 2 }}>
          {(["Standart", "EU", "IN", "US", "UK"] as const).map((key, i) => (
            <UnitTab key={key} w={i === 0 ? 56 : 36} on={chart === i} onPick={() => setChart(i)} testId={`demo-buy-chart-${i}`}>
              {t(key)}
            </UnitTab>
          ))}
        </div>
      </div>
      <div className="relative shrink-0" style={{ marginTop: 615 - 601, marginInline: 20 }}>
        <div className="flex" style={{ gap: 2 }}>
          {SIZES.map((item, i) => (
            <SizeTile key={item.code} size={item} index={i} look={lookOf(i)} onPick={() => onPick(i)} />
          ))}
        </div>
        {/* (208, 675) under the size, or on its bottom line at y 662 for a sold-out size (`– 67`). */}
        <span
          aria-hidden="true"
          data-pw="demo-buy-size-mark"
          className="absolute block pointer-events-none"
          style={{
            left: `calc((100% - 12px) / 7 * ${markAt + 0.5} + ${markAt * 2}px - 7px)`,
            top: (sold ? 662 : 675) - 615,
            width: 14,
            height: 14,
            transition: "left 0.28s cubic-bezier(0.2, 0, 0, 1), top 0.28s cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          <XdIcon name="buySizeMark" className="absolute" style={{ opacity: added ? 0 : 1, transition: "opacity 0.2s" }} />
          <XdIcon name="buySizeBagged" className="absolute" style={{ opacity: added ? 1 : 0, transition: "opacity 0.2s" }} />
        </span>
      </div>
      {sold ? (
        <>
          <Message id="sold" mt={695 - 669} nudge={0.5}>
            <Chip bg="#FFF8F8" line="#FF0000" minW={225} testId="demo-buy-chip-sold">
              <Rich text={t("<m>{size} | {number}</m> Not available now, stock is sold out")} values={values} />
            </Chip>
          </Message>
          <Message id="other" mt={721 - 713}>
            <button
              type="button"
              data-pw="demo-buy-other-color"
              onClick={() => others[0] && onColor(others[0].index)}
              className="flex items-start cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
            >
              <Chip bg="#F4F4F4" line={C.purple} minW={198}>
                <span>{t("look at other color Available")}</span>
                <span className="flex shrink-0 ml-auto" style={{ paddingLeft: 2, gap: 2, paddingRight: 4 }}>
                  {circles.map(({ color }, i) => (
                    <span key={i} className="relative block overflow-hidden rounded-full shrink-0" style={{ width: 14, height: 14 }}>
                      <img src={color.swatch} alt="" width={14} height={14} draggable={false} className="block w-full h-full object-cover select-none" />
                      <Stroke color={C.ink} width={0.3} radius={7} />
                    </span>
                  ))}
                </span>
              </Chip>
            </button>
          </Message>
          <Message id="soon" mt={textTop(760, 11) - 739} nudge={0.5}>
            <p className="font-normal whitespace-nowrap" style={{ color: C.ink, ...LINE_11 }}>
              {t("we can notify you when available soon !")}
            </p>
          </Message>
        </>
      ) : added ? (
        <Message id="added" mt={695 - 669}>
          <Chip bg={C.purple} line={C.purple} ink={C.white} minW={142} testId="demo-buy-chip-added">
            <Rich text={t("<m>{size} | {number}</m> Added to your bag")} values={values} />
          </Chip>
        </Message>
      ) : pick !== null ? (
        <Message id="picked" mt={695 - 669}>
          <Chip bg="#F8F8F8" line={C.purple} minW={122} testId="demo-buy-chip-picked">
            <Rich text={t("<m>{size} | {number}</m> Selected <m>last {stock}</m>")} values={values} />
          </Chip>
        </Message>
      ) : (
        <Message id="suggested" mt={695 - 669} nudge={0.5}>
          <Chip bg="#F8F8F8" minW={221} testId="demo-buy-chip-suggested">
            <Rich text={t("<m>{size} | {number}</m> Recommended size for you <m>last {stock}</m>")} values={values} />
          </Chip>
        </Message>
      )}
    </section>
  );
}

/** The file asks for corners of 28 (12 at the bottom right); XD stops a corner at half the box's short side. */
const NARROW_BAG_ROUND = "21px 21px 12px 21px";
const WIDE_BAG_ROUND = "25px 25px 12px 25px";

/**
 * The bag at the top right, over the dimmed page: (374, 50), 42 x 50, and with
 * an item in the bag it opens to 157 wide (`– 59`): the new item in a 34 px
 * ring, the three items before it in 26 px rings, and the bag with its count.
 * A tap opens the cart.
 */
function BagPill({ open, count, photo, t }: { open: boolean; count: number; photo: string; t: T }) {
  const { navigate } = useDemoNav();
  const full = count > 0;
  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: "fixed", top: SAFE_TOP, left: "50%", width: 0, height: 0, zIndex: BAG_Z }}>
          <div className="absolute" style={{ left: `calc(${COLUMN_W} / -2)`, width: COLUMN_W, top: 0, height: 0 }}>
            <motion.button
              key="bag"
              type="button"
              aria-label={t("Your bag")}
              data-pw="demo-buy-bag"
              data-full={full}
              onClick={() => navigate("cart")}
              className="absolute block cursor-pointer overflow-hidden font-quicksand [-webkit-tap-highlight-color:transparent]"
              initial={{ opacity: 0, y: -8, scale: 0.92, width: full ? 157 : 42, borderRadius: full ? WIDE_BAG_ROUND : NARROW_BAG_ROUND }}
              animate={{ opacity: 1, y: 0, scale: 1, width: full ? 157 : 42, borderRadius: full ? WIDE_BAG_ROUND : NARROW_BAG_ROUND }}
              exit={{ opacity: 0, y: -8, scale: 0.92 }}
              transition={MOVE}
              style={{
                right: 14,
                top: 0,
                height: 50,
                background: C.white,
                boxShadow: "0 3px 3px rgba(0, 0, 0, 0.161)",
                transformOrigin: "100% 50%",
              }}
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 block"
                initial={false}
                animate={{ opacity: full ? 1 : 0 }}
                transition={{ ...FADE, delay: full ? 0.12 : 0 }}
              >
                <Ring right={416 - 267 - 34} d={34} line={1} photoD={30} top={58 - 50} photo={photo} />
                {[340, 330, 317].map((x) => (
                  <Ring key={x} right={416 - x - 26} d={26} line={0.5} photoD={22.94} top={62 - 50} photo={photo} />
                ))}
                <Divider right={416 - 374} top={65.5 - 50} />
                <Divider right={416 - 309} top={65 - 50} />
              </motion.span>
              <span className="absolute block" style={{ right: 416 - 408, top: 62 - 50, width: 26, height: 26 }}>
                <XdIcon name="buyBag" />
                {full && (
                  <motion.span
                    key={count}
                    data-pw="demo-buy-bag-count"
                    className="absolute font-bold"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={MOVE}
                    style={{
                      left: 394 - 382 - (String(BAG_BEFORE + count).length - 1) * 3,
                      top: textTop(82, 11) - 62,
                      color: C.purple,
                      ...LINE_11,
                    }}
                  >
                    {BAG_BEFORE + count}
                  </motion.span>
                )}
              </span>
            </motion.button>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** A round photo with a purple line. The right side keeps its distance, so the rings do not move while the bag opens. */
function Ring({
  right,
  d,
  line,
  photoD,
  top,
  photo,
}: {
  right: number;
  d: number;
  line: number;
  photoD: number;
  top: number;
  photo: string;
}) {
  const inset = (d - photoD) / 2;
  return (
    <span className="absolute block rounded-full" style={{ right, top, width: d, height: d, background: C.white }}>
      <img
        src={photo}
        alt=""
        width={photoD}
        height={photoD}
        draggable={false}
        className="absolute block object-cover rounded-full select-none"
        style={{ left: inset, top: inset, width: photoD, height: photoD }}
      />
      <Stroke color={C.purple} width={line} radius={d / 2} />
    </span>
  );
}

/** A 0.5 px line. An SVG, as all the demo's lines: a box this thin would jump to a whole device pixel. */
function Divider({ right, top }: { right: number; top: number }) {
  return (
    <svg
      aria-hidden="true"
      className="absolute block"
      width={2}
      height={22}
      style={{ right: right - 1, top: Math.floor(top) }}
    >
      <line x1={1} x2={1} y1={top - Math.floor(top)} y2={top - Math.floor(top) + 20} stroke={C.line} strokeWidth={0.5} />
    </svg>
  );
}

/** The card's 0.3 px line, inside its box: round 30 on top and 15 under, as the file draws it. */
function CardLine({ w, h }: { w: number; h: number }) {
  const i = 0.15;
  const a = 30;
  const b = 15;
  return (
    <svg aria-hidden="true" className="absolute inset-0 pointer-events-none" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path
        d={`M${a},${i} H${w - a} A${a - i},${a - i} 0 0 1 ${w - i},${a} V${h - b} A${b - i},${b - i} 0 0 1 ${w - b},${h - i} H${b} A${b - i},${b - i} 0 0 1 ${i},${h - b} V${a} A${a - i},${a - i} 0 0 1 ${a},${i} Z`}
        fill="none"
        stroke={C.line}
        strokeWidth={0.3}
      />
    </svg>
  );
}

/** The card over the dimmed page, at (108, 112): the store page's card with round corners, 30 on top and 15 under. */
function BuyCard({
  product,
  store,
  colorIndex,
  onColor,
  y,
  t,
}: {
  product: DemoProduct;
  store: DemoStore;
  colorIndex: number;
  onColor: (index: number) => void;
  /** Design y of the sheet's top: the card rests above it. */
  y: number;
  t: T;
}) {
  const color = product.colors[colorIndex];
  const tall = PHOTO.h + FOOTER_H;
  // A short window has no room for the file's card: it gets smaller and stays above the sheet.
  const scale = Math.min(1, (y - CARD_ABOVE_SHEET - CARD_Y) / tall);
  const cardTop = y - CARD_ABOVE_SHEET - tall;
  return (
    <motion.article
      data-pw="demo-buy-card"
      className="absolute bg-white"
      initial={{ opacity: 0, y: 24, scale: scale * 0.96 }}
      animate={{ opacity: 1, y: 0, scale }}
      exit={{ opacity: 0, y: 24, scale: scale * 0.96 }}
      transition={WITH_SHEET}
      style={{
        left: "calc(50% - 107px)",
        top: designTop(cardTop),
        width: PHOTO.w,
        height: tall,
        borderRadius: "30px 30px 15px 15px",
        transformOrigin: "50% 100%",
      }}
    >
      <CardLine w={PHOTO.w} h={tall} />
      <div className="relative" style={{ width: PHOTO.w, height: PHOTO.h }}>
        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: "30px 30px 0 0" }}>
          <img
            src={color.images[0]}
            alt={`${store.name} ${[...product.name].map((word) => t(word)).join(" . ")}`}
            width={PHOTO.w}
            height={PHOTO.h}
            draggable={false}
            className="block w-full h-full object-cover select-none"
          />
          <PhotoGlow />
        </div>
        <SwatchPicker colors={product.colors} selected={colorIndex} onSelect={onColor} onOpen={() => {}} t={t} />
      </div>
      <div className="relative w-full" style={{ height: FOOTER_H }}>
        <CardLogo store={store} />
        <ProductName product={product} t={t} />
        <LabelTurns
          // The file draws this one label on this card, whatever the store page's card shows.
          badges={[BEST_LABEL]}
          top={textTop(365, 9) - PHOTO.h}
          height={lineBox(9)}
          testId="demo-buy-card-labels"
          render={(badge) => <PlainBadge badge={badge} t={t} />}
        />
        <PricePill product={{ ...product, price: PRICE.now }} t={t} />
      </div>
    </motion.article>
  );
}

export default function ProductBuy({
  product,
  store,
  colorIndex,
  onColor,
  open,
  onOpen,
}: {
  product: DemoProduct;
  store: DemoStore;
  colorIndex: number;
  onColor: (index: number) => void;
  open: boolean;
  onOpen: (open: boolean) => void;
}) {
  const { t } = useDemoCase();
  const { navigate } = useDemoNav();
  const present = useIsPresent();
  const floating = useFloatingBar();
  const small = useSmallBar(open);
  const end = useCanvasEnd(open);
  const [mounted, setMounted] = useState(false);
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    setMounted(true);
    setTouch(navigator.maxTouchPoints > 0);
  }, []);

  /** How many of each size are in the bag. */
  const [items, setItems] = useState<Readonly<Record<number, number>>>({});
  const [pick, setPick] = useState<number | null>(null);
  /** The size the bar's Remove and Add More work on. */
  const [lastAdded, setLastAdded] = useState<number | null>(null);
  const [notified, setNotified] = useState(false);

  const total = Object.values(items).reduce((sum, n) => sum + n, 0);
  const countOf = (index: number) => items[index] ?? 0;
  const change = (index: number, by: number) => {
    setItems((now) => ({ ...now, [index]: Math.max(0, (now[index] ?? 0) + by) }));
  };

  const close = () => {
    onOpen(false);
    // Nothing bought: the sheet opens as new. With an item, it opens on that item.
    if (pick !== null && !countOf(pick)) setPick(null);
  };
  const openSheet = () => {
    setPick((now) => now ?? lastAdded);
    onOpen(true);
  };

  const add = () => {
    if (pick === null) return;
    change(pick, 1);
    setLastAdded(pick);
  };
  /** Remove and Add More work on the size in view, or on the page on the last size added. */
  const target = open && pick !== null ? pick : lastAdded;
  const remove = () => {
    if (target === null) return;
    change(target, -1);
    if (countOf(target) <= 1) {
      // The last of this size: the next size with items is the one the bar now speaks of.
      const left = Object.entries(items).find(([key, n]) => Number(key) !== target && n > 0);
      setLastAdded(left ? Number(left[0]) : null);
    }
  };

  const buyNow = () => {
    add();
    onOpen(false);
    navigate("cart");
  };

  const sold = open && pick === SOLD_OUT;
  const showAdded = open ? pick !== null && countOf(pick) > 0 : total > 0;
  const mode: BarMode = sold
    ? { kind: "notify", on: notified }
    : showAdded
      ? { kind: "added" }
      : open
        ? { kind: "buy", ready: pick !== null }
        : { kind: "marks" };

  const pickedCount = pick === null ? 0 : countOf(pick);
  const chip = showAdded && !open ? (
    <Chip bg="#CDFEE4" line={C.ink} minW={143} testId="demo-buy-bar-chip-green">
      <motion.span key={total} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FADE}>
        {t(total === 1 ? "Added {count} item to your bag" : "Added {count} items to your bag").replace("{count}", String(total))}
      </motion.span>
    </Chip>
  ) : showAdded && pick !== null ? (
    <Chip bg="#F4F4F4" line={C.purple} minW={160} testId="demo-buy-bar-chip-added">
      <motion.span key={`${pick}-${pickedCount}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FADE}>
        <Rich
          text={t(pickedCount === 1 ? "Added <m>{count}</m> item {size} to bag" : "Added <m>{count}</m> items {size} to bag")}
          values={{ count: pickedCount, size: t(SIZES[pick].word) }}
        />
      </motion.span>
    </Chip>
  ) : (
    <Chip bg="#F4F4F4" line={C.purple} minW={163} testId="demo-buy-bar-chip">
      {t("All inclusive without additions")}
    </Chip>
  );

  const gap = floating ? 0 : FULL_GAP;
  const sheetY = end - SHEET_ABOVE_END - gap;

  return (
    <>
      <Sheet
        open={open}
        onClose={close}
        y={sheetY}
        fit
        glass
        noHandle
        shadow={SHADOW}
        testId="demo-buy-sheet"
        over={
          <BuyCard product={product} store={store} colorIndex={colorIndex} onColor={onColor} y={sheetY} t={t} />
        }
      >
        <SizeSheetBody
          product={product}
          colorIndex={colorIndex}
          pick={pick}
          inBag={(index) => countOf(index) > 0}
          onPick={(index) => {
            setPick(index);
            setNotified(false);
          }}
          onColor={(index) => {
            onColor(index);
            setPick(null);
          }}
          t={t}
        />
        {/* The part of the sheet under the bar and under Safari's bar: white, as the file draws it. */}
        <div aria-hidden="true" className="shrink-0" style={{ height: CONTENT_H + gap + UNDER_BAR }} />
      </Sheet>
      {mounted &&
        createPortal(
          <>
            {touch && present && !small && !open && <BarTail />}
            <Bar
              mode={mode}
              small={small}
              gap={gap}
              pillGap={floating ? 0 : PILL_GAP}
              sheetOpen={open}
              chip={chip}
              currency={t(product.currency)}
              onOpen={openSheet}
              onBuy={buyNow}
              onAdd={add}
              onRemove={remove}
              onAddMore={() => target !== null && change(target, 1)}
              onNotify={() => setNotified((on) => !on)}
              t={t}
            />
            <BagPill open={open} count={total} photo={ringPhotoOf(product.colors[colorIndex])} t={t} />
          </>,
          document.body,
        )}
    </>
  );
}
