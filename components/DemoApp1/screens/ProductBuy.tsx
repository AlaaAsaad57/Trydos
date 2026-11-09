"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useIsPresent, type Transition, type Variants } from "framer-motion";
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
  STATUS_BAR,
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
import {
  arrivalMs,
  blockTransition,
  buyMotion,
  registerBuyActions,
  sheetCss,
  sheetTransition,
  useBuyMotion,
  type BuyMotion,
} from "./buyMotion";
import { flyToBag } from "./flyToBag";

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
 * The file has no motion, so the motion is the demo's own. On opening, the card
 * lifts out of the gallery (or rises from behind the sheet), and the sheet's
 * blocks come in one after another. On Add to bag, the photo flies to an empty
 * ring in the bag (flyToBag.ts), and the count moves when it lands. The card's
 * way in ends in a hit on the glass (see Slam), and it gives a small push when
 * the item lands. The debug menu in buyMotion.tsx changes the timing.
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
 * So the bag and the small pill hang on a fixed point with no size, like the tab
 * bar (see EDGE_ANCHOR in demo1Layout.ts): Safari must not find them.
 *
 * The panel is a real fixed box. The file draws white under Safari's bar, and
 * only Safari can paint there in step with a scroll and with its own bar: it
 * cuts a fixed box at the window's end, and a box of the document that a script
 * moves is always some frames late, so the page showed under the panel during a
 * scroll. So the panel is the one box Safari is meant to find: white, as wide as
 * the column. Safari then paints white under its bar by itself. It lets go when
 * the panel is hidden (the small pill) or gone, and the page shows there again.
 * (WebKit: LocalFrameView::fixedContainerEdges, Page::updateFixedContainerEdges.)
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

/** The highest z-index: over the demo's top strip, which is one under it (topTint.ts). */
const BAG_Z = 2147483647;

/** How long the bag stays on the page after a landing, with no sheet open. */
const BAG_LINGER_MS = 1200;

/** How long the debug menu's play buttons wait for the sheet to close, or to open. */
const REPLAY_WAIT_MS = 900;

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
const LINE_11 = { fontSize: 11, lineHeight: `${lineBox(11)}px` } as const;
const LINE_13 = { fontSize: 13, lineHeight: `${lineBox(13)}px` } as const;
const LINE_15 = { fontSize: 15, lineHeight: `${lineBox(15)}px` } as const;

/** The motion of the panel and the pill, and of a block that changes inside them. */
const MOVE = { duration: 0.32, ease: [0.2, 0, 0, 1] as const };
const FADE = { duration: 0.18, ease: "easeOut" as const };
/** The words of the dark button when they change. The sheet's own timing is in buyMotion.tsx. */
const ROLL = { duration: 0.36, ease: [0.32, 0.72, 0, 1] as const };

/**
 * The sheet's blocks come in one after another, top to bottom, and the sizes
 * from left to right. They have no way out: they leave with the sheet. A message
 * that comes later (a tap on a size) uses SHEET_ROW with no wait.
 *
 * Each `show` is a function, so it reads the timing when the sheet opens: the
 * debug menu can change it (buyMotion.tsx).
 */
const SHEET_BLOCKS: Variants = {
  hidden: {},
  show: () => ({ transition: { delayChildren: 0.02, staggerChildren: buyMotion().gap } }),
};
const SHEET_ROW: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: () => ({ opacity: 1, y: 0, transition: blockTransition(buyMotion()) }),
};
/** The sizes come closer together than the blocks. */
const SIZE_GAP = 0.45;
const SIZE_ROW: Variants = {
  hidden: {},
  show: () => ({ transition: { staggerChildren: buyMotion().gap * SIZE_GAP } }),
};
const SIZE_TILE: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.9 },
  show: () => ({ opacity: 1, y: 0, scale: 1, transition: blockTransition(buyMotion()) }),
};
/** The mark under the size comes last, after the tiles it points at. */
const SIZE_MARK: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.4 },
  show: () => ({ opacity: 1, y: 0, scale: 1, transition: { ...blockTransition(buyMotion()), delay: 0.3 } }),
};

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
      <LikeHeart liked={like.liked} burst={like.burst} outline="buyHeart" filled="buyHeartFilled" size={25} />
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

function DarkButton({
  dim,
  box,
  words,
  children,
}: {
  dim: boolean;
  box: React.RefObject<HTMLDivElement | null>;
  /** Which words are on show: new words roll up over the old ones. */
  words: string;
  children: React.ReactNode;
}) {
  const timing = useBuyMotion();
  return (
    <motion.div
      ref={box}
      data-pw="demo-buy-button"
      className="absolute overflow-hidden flex items-stretch justify-center font-normal whitespace-nowrap"
      initial={{ clipPath: BUTTON_CLOSED, opacity: 0.4 }}
      animate={{ clipPath: BUTTON_OPEN, opacity: 1 }}
      exit={{ clipPath: BUTTON_CLOSED, opacity: 0 }}
      transition={sheetTransition(timing)}
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
      <AnimatePresence>
        <motion.div
          key={words}
          className="absolute inset-0 flex items-stretch justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={ROLL}
        >
          {children}
        </motion.div>
      </AnimatePresence>
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
  buttonBox,
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
  buttonBox: React.RefObject<HTMLDivElement | null>;
  onOpen: () => void;
  onBuy: () => void;
  onAdd: () => void;
  onRemove: () => void;
  onAddMore: () => void;
  onNotify: () => void;
  t: T;
}) {
  const present = useIsPresent();
  const timing = useBuyMotion();
  const tail = mode.kind !== "marks";
  const fullH = CONTENT_H + gap;
  /** How far down the panel waits, out of the window. */
  const away = fullH + 30;
  /** The panel comes in with the screen, at the screen's pace. After that, a scroll hides and shows it. */
  const [entered, setEntered] = useState(false);
  /** The small pill has taken the panel's place. */
  const hidden = present && small;
  return (
    <>
      <motion.div
        data-pw="demo-buy-panel"
        className="font-quicksand"
        initial={{ y: away }}
        // Hidden once it is down, and not only moved away: Safari keeps the white
        // under its bar for as long as the last box it found there is visible.
        animate={{ y: !present || small ? away : 0, visibility: hidden ? "hidden" : "visible" }}
        transition={{
          ...(present && entered ? MOVE : SCREEN_TRANSITION),
          visibility: { duration: 0, delay: hidden ? MOVE.duration : 0 },
        }}
        onAnimationComplete={() => setEntered(true)}
        style={{
          // A real fixed box, as wide as the page column: the one box of this bar
          // that Safari must find (see "The panel is a real fixed box" at the top
          // of this file). It moves by its own transform, so Safari reads the
          // window's end again on every frame of a slide.
          position: "fixed",
          left: `calc(50% - ${COLUMN_W} / 2)`,
          width: COLUMN_W,
          // On under the window's end, as the file draws it.
          bottom: `calc(${SAFE_BOTTOM} - ${UNDER_BAR}px)`,
          height: fullH + UNDER_BAR,
          zIndex: BAR_Z,
          pointerEvents: present ? undefined : "none",
          borderRadius: "30px 30px 0 0",
          // Not fully opaque, for Chromium (see BuyCard). Safari reads it as plain white.
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
            // The plus turns a quarter on its way to the plus with a tail.
            style={{
              left: 0,
              top: 0,
              opacity: tail ? 0 : 1,
              transform: tail ? "rotate(90deg)" : "rotate(0deg)",
              transition: `opacity 0.18s, transform ${sheetCss(timing)}`,
            }}
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
            <DarkButton key="button" box={buttonBox} words={mode.kind} dim={mode.kind === "buy" && !mode.ready}>
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

      {/* The small bar (`– 156`), on an anchor with no size: Safari must not find it. */}
      <motion.div
        data-pw="demo-buy-bar"
        className="font-quicksand"
        initial={{ y: away }}
        animate={{ y: present ? 0 : away }}
        transition={SCREEN_TRANSITION}
        style={{
          position: "fixed",
          left: "50%",
          bottom: SAFE_BOTTOM,
          width: 0,
          height: 0,
          zIndex: BAR_Z,
          pointerEvents: present ? undefined : "none",
        }}
      >
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
    </>
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
      variants={SIZE_TILE}
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
      variants={SHEET_ROW}
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
    <motion.section
      role="dialog"
      aria-modal="true"
      aria-label={t("Please Select the required size & Quantity")}
      data-pw="demo-buy-sizes"
      className="flex flex-col w-full shrink-0"
      style={{ height: BAR_Y - SHEET_Y }}
      variants={SHEET_BLOCKS}
      initial="hidden"
      animate="show"
    >
      <motion.h2
        variants={SHEET_ROW}
        className="text-center font-normal shrink-0"
        style={{ marginTop: textTop(556, 13) - SHEET_Y, color: C.ink, ...LINE_13 }}
      >
        {t("Please Select the required size & Quantity")}
      </motion.h2>
      <motion.div
        variants={SHEET_ROW}
        className="flex justify-between shrink-0"
        style={{ marginTop: 579 - (textTop(556, 13) + lineBox(13)), padding: "0 14px" }}
      >
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
      </motion.div>
      <div className="relative shrink-0" style={{ marginTop: 615 - 601, marginInline: 20 }}>
        <motion.div variants={SIZE_ROW} className="flex" style={{ gap: 2 }}>
          {SIZES.map((item, i) => (
            <SizeTile key={item.code} size={item} index={i} look={lookOf(i)} onPick={() => onPick(i)} />
          ))}
        </motion.div>
        {/* (208, 675) under the size, or on its bottom line at y 662 for a sold-out size (`– 67`). */}
        <motion.span
          aria-hidden="true"
          data-pw="demo-buy-size-mark"
          variants={SIZE_MARK}
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
        </motion.span>
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
    </motion.section>
  );
}

/** The file asks for corners of 28 (12 at the bottom right); XD stops a corner at half the box's short side. */
const NARROW_BAG_ROUND = "21px 21px 12px 21px";
const WIDE_BAG_ROUND = "25px 25px 12px 25px";

/** The bag opening and closing. */
const OPENING = { duration: 0.42, ease: [0.2, 0, 0, 1] as const };

/** One item in the bag. `landed` is false while its photo is on the way. */
type BagItem = { id: number; size: number; photo: string; landed: boolean };

/** All rings are drawn at the new item's size, 34 px, and scaled, so a ring can change size smoothly. */
const RING_D = 34;
const RING_TOP = 58 - 50;
/** An older item's ring, 26 px in the file. Its line is 0.5 px after the scale. */
const OLDER_D = 26;
const OLDER_SCALE = OLDER_D / RING_D;
/** While its item flies, the ring waits a little small. It takes the item by growing. */
const WAITING_SCALE = 0.86;
const RING_POP = { type: "spring" as const, stiffness: 520, damping: 17, mass: 0.7 };

/** The right edges of the older rings in `– 59`, from the bag's right edge. */
const OLDER_RIGHT = [416 - 340 - OLDER_D, 416 - 330 - OLDER_D, 416 - 317 - OLDER_D] as const;
/** The line beside the bag, and the room each side of a line. */
const BAG_LINE = 416 - 374;
const LINE_ROOM = 8;

/**
 * Where the rings go for this many items. The newest item has the big ring. The
 * older items lie in small rings between it and the bag, at most three. Four
 * items give the file's own `– 59`: 157 wide, the rings at x 267, 317, 330, 340.
 */
function bagLayout(total: number) {
  const older = Math.max(0, Math.min(total - 1, OLDER_RIGHT.length));
  const olderEnd = older > 0 ? OLDER_RIGHT[older - 1] + OLDER_D : 0;
  const line = older > 0 ? olderEnd + LINE_ROOM : null;
  const newest = line === null ? BAG_LINE + LINE_ROOM : line + LINE_ROOM;
  return { older, line, newest, width: total === 0 ? 42 : newest + RING_D + LINE_ROOM };
}

/** The card photo's corners, and how long a tap on Add to bag presses the card. */
const CARD_ROUND = [30, 30, 0, 0] as const;
const CARD_PRESS_MS = 420;
/** The disc that grows out of the bar's button when there is no card to fly from. */
const DISC = 46;

/**
 * The bag at the top right, over the dimmed page: (374, 50), 42 x 50. With items
 * in it, it opens: the newest item in a 34 px ring, the items before it in 26 px
 * rings, and the bag with its count (`– 59` draws four items). A new item takes
 * the big ring beside the others, and they move over to make room for it.
 * A tap opens the cart.
 */
function BagPill({
  open,
  items,
  flying,
  slot,
  t,
}: {
  open: boolean;
  /** What is in the bag, oldest first. A new item is here from the tap, so the bag makes room before it lands. */
  items: readonly BagItem[];
  /** An item is on its way. */
  flying: boolean;
  /** The bag's right edge and the rings' top, for the flight. Always on the page, even with no bag on show. */
  slot: React.RefObject<HTMLSpanElement | null>;
  t: T;
}) {
  const { navigate } = useDemoNav();
  const timing = useBuyMotion();
  // The bag waits for the item to leave the card, so it is open just before the item comes.
  const opening = { ...OPENING, delay: flying ? 0.2 : 0 };
  const full = items.length > 0;
  const layout = bagLayout(items.length);
  // The count moves on each landing, not on the tap.
  const count = items.filter((item) => item.landed).length;
  const [seen, setSeen] = useState({ count, up: true });
  if (seen.count !== count) setSeen({ count, up: count > seen.count });
  const roll = seen.up ? 7 : -7;
  return (
    <div style={{ position: "fixed", top: SAFE_TOP, left: "50%", width: 0, height: 0, zIndex: BAG_Z }}>
      <div className="absolute" style={{ left: `calc(${COLUMN_W} / -2)`, width: COLUMN_W, top: 0, height: 0 }}>
        <span
          ref={slot}
          aria-hidden="true"
          className="absolute block pointer-events-none"
          style={{ right: 14, top: RING_TOP, width: 0, height: 0, visibility: "hidden" }}
        />
        <AnimatePresence>
          {open && (
            <motion.button
              key="bag"
              type="button"
              aria-label={t("Your bag")}
              data-pw="demo-buy-bag"
              data-full={full}
              onClick={() => navigate("cart")}
              className="absolute block cursor-pointer overflow-hidden font-quicksand [-webkit-tap-highlight-color:transparent]"
              initial={{ opacity: 0, y: -14, scale: 0.8, width: layout.width, borderRadius: full ? WIDE_BAG_ROUND : NARROW_BAG_ROUND }}
              animate={{ opacity: 1, y: 0, scale: 1, width: layout.width, borderRadius: full ? WIDE_BAG_ROUND : NARROW_BAG_ROUND }}
              exit={{ opacity: 0, y: -8, scale: 0.92, transition: FADE }}
              transition={{
                ...sheetTransition(timing),
                delay: 0.06,
                opacity: { duration: 0.16, delay: 0.06 },
                width: opening,
                borderRadius: opening,
              }}
              style={{
                right: 14,
                top: 0,
                height: 50,
                background: C.white,
                boxShadow: "0 3px 3px rgba(0, 0, 0, 0.161)",
                transformOrigin: "100% 50%",
              }}
            >
              <span aria-hidden="true" className="absolute inset-0 block">
                <AnimatePresence initial={false}>
                  {/* Oldest first, so a newer ring lies over an older one, as in the file. */}
                  {items.slice(-1 - layout.older).map((item, index, shown) => {
                    const fromNewest = shown.length - 1 - index;
                    return (
                      <BagRing
                        key={item.id}
                        item={item}
                        // A scaled ring keeps its middle, so its box stands out by half the difference.
                        right={fromNewest === 0 ? layout.newest : OLDER_RIGHT[layout.older - fromNewest] - (RING_D - OLDER_D) / 2}
                        small={fromNewest > 0}
                        move={opening}
                      />
                    );
                  })}
                </AnimatePresence>
                <Divider right={BAG_LINE} top={65.5 - 50} on={full} move={opening} />
                <Divider right={layout.line ?? BAG_LINE} top={65 - 50} on={layout.line !== null} move={opening} />
              </span>
              <span data-pw="demo-buy-bag-icon" className="absolute block" style={{ right: 416 - 408, top: 62 - 50, width: 26, height: 26 }}>
                <XdIcon name="buyBag" />
                <AnimatePresence initial={false}>
                  {count > 0 && (
                    <motion.span
                      key={count}
                      data-pw="demo-buy-bag-count"
                      className="absolute font-bold"
                      initial={{ y: roll, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -roll, opacity: 0 }}
                      transition={ROLL}
                      style={{
                        left: 394 - 382 - (String(count).length - 1) * 3,
                        top: textTop(82, 11) - 62,
                        color: C.purple,
                        ...LINE_11,
                      }}
                    >
                      {count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * One item in the bag: a round photo with a purple line. The right side keeps its
 * distance, so the ring does not move while the bag opens. An empty ring waits
 * for its item, and on landing it takes the photo and grows a little past its size.
 */
function BagRing({
  item,
  right,
  small,
  move,
}: {
  item: BagItem;
  right: number;
  small: boolean;
  move: { duration: number; delay: number };
}) {
  const scale = (small ? OLDER_SCALE : 1) * (item.landed ? 1 : WAITING_SCALE);
  const photoD = 30;
  const inset = (RING_D - photoD) / 2;
  return (
    <motion.span
      data-pw="demo-buy-bag-ring"
      data-landed={item.landed}
      className="absolute block rounded-full"
      initial={{ opacity: 0, scale: 0.3, right }}
      animate={{ opacity: 1, scale, right }}
      exit={{ opacity: 0, scale: 0.3, transition: FADE }}
      transition={{ right: move, opacity: { ...FADE, delay: move.delay }, scale: RING_POP }}
      style={{ top: RING_TOP, width: RING_D, height: RING_D, background: C.white }}
    >
      <img
        src={item.photo}
        alt=""
        width={photoD}
        height={photoD}
        draggable={false}
        className="absolute block object-cover rounded-full select-none"
        style={{ left: inset, top: inset, width: photoD, height: photoD, opacity: item.landed ? 1 : 0 }}
      />
      <Stroke color={C.purple} width={small ? 0.5 / OLDER_SCALE : 1} radius={RING_D / 2} />
    </motion.span>
  );
}

/** A 0.5 px line. An SVG, as all the demo's lines: a box this thin would jump to a whole device pixel. */
function Divider({
  right,
  top,
  on,
  move,
}: {
  right: number;
  top: number;
  on: boolean;
  move: { duration: number; delay: number };
}) {
  return (
    <motion.svg
      aria-hidden="true"
      className="absolute block"
      width={2}
      height={22}
      initial={false}
      animate={{ right: right - 1, opacity: on ? 1 : 0 }}
      transition={{ right: move, opacity: { ...FADE, delay: on ? move.delay : 0 } }}
      style={{ top: Math.floor(top) }}
    >
      <line x1={1} x2={1} y1={top - Math.floor(top)} y2={top - Math.floor(top) + 20} stroke={C.line} strokeWidth={0.5} />
    </motion.svg>
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

/**
 * The card over the dimmed page, at (108, 112): the store page's card with round
 * corners, 30 on top and 15 under.
 *
 * The photo fills the top, so only the footer has a background, and that white is
 * a little transparent, as the file's panels are (0.999 rounds up to opaque and
 * does not help). In a short window the card is
 * scaled, and if opaque parts cover its whole box, Chromium treats the box as
 * opaque and draws dark square corners around the round ones.
 */
/**
 * The card's way in is one move with three parts, and it ends in a hit:
 *
 *  1. Pull back. The card flies from the gallery to its place. On the way it gets
 *     smaller than its rest size and leans back, like a hand drawn back.
 *  2. Strike. From there it comes at the viewer faster and faster, with no slowing
 *     down, and flattens.
 *  3. Hit. It stops dead at the glass, a little over its size. A thin ring (two of
 *     them) spreads out from under the card, the bag's mark rattles, and the card
 *     is thrown back a little and settles.
 *
 * There is no rest between the parts, so the hit is the card's arrival, and not a
 * pulse after it. The hit comes just after the eye takes the sheet as landed.
 *
 * Parts 2 and 3 run on the card's inner box as one Web Animation, so the browser
 * can keep them smooth while the sheet renders. The outer box (framer) only flies
 * the card to its place, in the time of part 1.
 */
type Slam = {
  /** How strong, from the debug menu: 1 is the design's. */
  power: number;
  /** When the card is pulled back and in place, and when it hits the glass, in ms. */
  pulled: number;
  contact: number;
};

/** The hit comes this much after the sheet has landed, and never sooner than SLAM_SOONEST ms. */
const SLAM_AFTER_SHEET = 1.25;
const SLAM_SOONEST = 220;
/** The part of the time before the hit that goes to the pull back. */
const SLAM_PULL = 0.58;
/** From the hit to rest, in ms. */
const SLAM_SETTLE = 400;
/** At full power: how small the card gets, how far it leans back in degrees, and how far it passes its size. */
const SLAM_FAR = 0.1;
const SLAM_LEAN = 7;
const SLAM_OVER = 0.045;
/** The card's flight to its place: fast, and slow only at its very end. */
const SLAM_FLIGHT = [0.2, 0.7, 0.2, 1] as const;

/** The plan for this opening, or null when the debug menu has the hit off. */
function slamOf(m: BuyMotion): Slam | null {
  if (m.hit <= 0) return null;
  const contact = Math.max(SLAM_SOONEST, arrivalMs(m) * SLAM_AFTER_SHEET);
  return { power: m.hit, pulled: contact * SLAM_PULL, contact };
}

/** The inner box's pose: its size, and how far its top leans away. */
const pose = (size: number, lean: number) => `perspective(900px) rotateX(${lean}deg) scale(${size})`;

function slamCard(box: HTMLElement | null, { power, pulled, contact }: Slam) {
  const total = contact + SLAM_SETTLE;
  const at = (ms: number) => ms / total;
  // The easing is on each step, so each part has its own speed.
  return box?.animate(
    [
      // The flight's own curve (SLAM_FLIGHT), so the pull back stays in step with it.
      { transform: pose(1, 0), easing: `cubic-bezier(${SLAM_FLIGHT.join(", ")})` },
      // Faster and faster into the glass: the speed is highest at the contact.
      { transform: pose(1 - SLAM_FAR * power, SLAM_LEAN * power), offset: at(pulled), easing: "cubic-bezier(0.5, 0, 0.9, 0.4)" },
      // The hard stop: the way back starts at full speed.
      { transform: pose(1 + SLAM_OVER * power, 0), offset: at(contact), easing: "cubic-bezier(0.1, 0.8, 0.2, 1)" },
      { transform: pose(1 - 0.016 * power, 0), offset: at(contact + 120), easing: "ease-in-out" },
      { transform: pose(1 + 0.006 * power, 0), offset: at(contact + 240), easing: "ease-in-out" },
      { transform: pose(1, 0) },
    ],
    { duration: total, easing: "linear" },
  );
}

/** A ring in the card's shape that spreads from under the card at the hit and fades. */
function shockRing(ring: HTMLElement | null, delay: number, strength: number, reach: number, duration: number) {
  return ring?.animate(
    [
      { transform: "scale(1)", opacity: Math.min(0.75, strength) },
      { transform: `scale(${reach})`, opacity: 0 },
    ],
    { duration, delay, easing: "cubic-bezier(0.1, 0.6, 0.2, 1)" },
  );
}

/** The bag's mark rattles from the hit. */
function rattle(mark: Element | null, delay: number, power: number) {
  return mark?.animate(
    [
      { transform: "translateY(0px) rotate(0deg)" },
      { transform: `translateY(${-2.5 * power}px) rotate(${-8 * power}deg)`, offset: 0.28 },
      { transform: `translateY(0px) rotate(${4 * power}deg)`, offset: 0.6 },
      { transform: "translateY(0px) rotate(0deg)" },
    ],
    { duration: 380, delay, easing: "ease-out" },
  );
}

/** The card's small answer when an item lands in the bag: a short push out and back. */
const LANDING_HIT = 0.6;
function answerLanding(box: HTMLElement | null) {
  const strength = buyMotion().hit * LANDING_HIT;
  if (strength <= 0) return undefined;
  const scale = (amount: number) => `scale(${1 + amount * strength})`;
  return box?.animate(
    [
      { transform: scale(0), easing: "cubic-bezier(0.55, 0, 1, 0.45)" },
      { transform: scale(0.05), offset: 0.2, easing: "cubic-bezier(0, 0.75, 0.25, 1)" },
      { transform: scale(-0.016), offset: 0.5, easing: "ease-in-out" },
      { transform: scale(0.005), offset: 0.76, easing: "ease-in-out" },
      { transform: scale(0) },
    ],
    { duration: 560, easing: "linear" },
  );
}

/** The rings' shape: the card's, drawn in white. */
const RING_STYLE = {
  borderRadius: "30px 30px 15px 15px",
  border: "1.5px solid rgba(255, 255, 255, 0.95)",
  opacity: 0,
} as const;

/**
 * Where the card starts. With the gallery on screen, the card lifts out of it:
 * it starts exactly over the gallery's photo, which has the same shape, while
 * the page behind it goes out of focus. With the gallery scrolled away, it
 * rises from behind the sheet.
 */
function cardStart(cardTop: number, tall: number, scale: number) {
  const rise = { opacity: 0, x: 0, y: 64, scale: scale * 0.9, rotateX: 10 };
  let from: DOMRect | null = null;
  let most = 0.5;
  for (const img of document.querySelectorAll('[data-pw="demo-product-gallery"] img')) {
    const r = img.getBoundingClientRect();
    const seenW = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0);
    const seenH = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
    const share = (Math.max(0, seenW) * Math.max(0, seenH)) / (r.width * r.height);
    if (share > most) {
      from = r;
      most = share;
    }
  }
  if (!from) return rise;
  const s = from.width / PHOTO.w;
  // The card turns about the middle of its bottom edge.
  const originY = cardTop - STATUS_BAR + tall;
  const photoMiddle = -(tall - PHOTO.h / 2);
  return {
    opacity: 0,
    x: from.left + from.width / 2 - window.innerWidth / 2,
    y: from.top + from.height / 2 - (originY + s * photoMiddle),
    scale: s,
    rotateX: 0,
  };
}

function BuyCard({
  product,
  store,
  colorIndex,
  onColor,
  y,
  box,
  photo,
  t,
}: {
  product: DemoProduct;
  store: DemoStore;
  colorIndex: number;
  onColor: (index: number) => void;
  /** Design y of the sheet's top: the card rests above it. */
  y: number;
  /** The card's parts, for the tap on Add to bag. */
  box: React.RefObject<HTMLDivElement | null>;
  photo: React.RefObject<HTMLDivElement | null>;
  t: T;
}) {
  const timing = useBuyMotion();
  const color = product.colors[colorIndex];
  const tall = PHOTO.h + FOOTER_H;
  // A short window has no room for the file's card: it gets smaller and stays above the sheet.
  const scale = Math.min(1, (y - CARD_ABOVE_SHEET - CARD_Y) / tall);
  const cardTop = y - CARD_ABOVE_SHEET - tall;
  // Read once, when the card comes: the page does not move while it is on show.
  const [start] = useState(() => cardStart(cardTop, tall, scale));
  // Planned once, when the card comes: a change in the debug menu works on the next opening.
  const [slam] = useState(() => slamOf(buyMotion()));
  const ringNear = useRef<HTMLSpanElement>(null);
  const ringFar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!slam) return;
    const { power, contact } = slam;
    const running = [
      slamCard(box.current, slam),
      shockRing(ringNear.current, contact, 0.55 * power, 1 + 0.2 * power, 520),
      shockRing(ringFar.current, contact + 70, 0.3 * power, 1 + 0.36 * power, 660),
      rattle(document.querySelector('[data-pw="demo-buy-bag-icon"]'), contact + 30, power),
    ];
    return () => running.forEach((animation) => animation?.cancel());
  }, [box, slam]);
  // With the hit, the card is in its place when the strike starts. Without it, it comes with the sheet.
  const flight: Transition = slam ? { duration: slam.pulled / 1000, ease: [...SLAM_FLIGHT] } : sheetTransition(timing);
  return (
    <motion.article
      data-pw="demo-buy-card"
      className="absolute"
      initial={start}
      animate={{ opacity: 1, x: 0, y: 0, scale, rotateX: 0 }}
      exit={{ ...start, transition: { ...sheetTransition(timing), opacity: { duration: 0.2, delay: 0.06 } } }}
      transition={{ ...flight, opacity: { duration: 0.14 } }}
      style={{
        transformPerspective: 900,
        left: "calc(50% - 107px)",
        top: designTop(cardTop),
        width: PHOTO.w,
        height: tall,
        borderRadius: "30px 30px 15px 15px",
        transformOrigin: "50% 100%",
      }}
    >
      {/* Under the card: they show only as they spread past its edge. */}
      <span ref={ringNear} aria-hidden="true" data-pw="demo-buy-card-ring" className="absolute inset-0 pointer-events-none" style={RING_STYLE} />
      <span ref={ringFar} aria-hidden="true" className="absolute inset-0 pointer-events-none" style={RING_STYLE} />
      <div ref={box} className="relative" style={{ width: PHOTO.w, height: tall }}>
        <CardLine w={PHOTO.w} h={tall} />
        <div ref={photo} className="relative" style={{ width: PHOTO.w, height: PHOTO.h }}>
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
        <motion.div
          className="relative w-full"
          // Over the gallery's photo only the photo shows: the card's end comes in after it.
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.14 }}
          style={{ height: FOOTER_H, borderRadius: "0 0 15px 15px", background: "rgba(255, 255, 255, 0.9976)" }}
        >
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
        </motion.div>
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
  const timing = useBuyMotion();
  const floating = useFloatingBar();
  const small = useSmallBar(open);
  const end = useCanvasEnd(open);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  /** What is in the bag, oldest first. */
  const [bag, setBag] = useState<readonly BagItem[]>([]);
  const nextItem = useRef(0);
  const [pick, setPick] = useState<number | null>(null);
  /** The size the bar's Remove and Add More work on. */
  const [lastAdded, setLastAdded] = useState<number | null>(null);
  const [notified, setNotified] = useState(false);
  /** An item is on its way to the bag. */
  const flying = bag.some((item) => !item.landed);
  /** The bag stays a moment after a landing on the page, where no sheet keeps it on show. */
  const [lingers, setLingers] = useState(false);
  useEffect(() => {
    if (flying) {
      setLingers(true);
      return;
    }
    const wait = setTimeout(() => setLingers(false), BAG_LINGER_MS);
    return () => clearTimeout(wait);
  }, [flying]);

  const cardBox = useRef<HTMLDivElement>(null);
  const cardPhoto = useRef<HTMLDivElement>(null);
  const buttonBox = useRef<HTMLDivElement>(null);
  const bagSlot = useRef<HTMLSpanElement>(null);
  const latestPlay = useRef<{
    openSheet: () => void;
    addToBag: (index: number) => void;
    playOpening: () => void;
    playAdd: () => void;
  } | null>(null);

  const total = bag.length;
  const countOf = (index: number) => bag.filter((item) => item.size === index).length;
  const putInBag = (size: number, landed: boolean) => {
    const id = nextItem.current++;
    setBag((now) => [...now, { id, size, photo: ringPhotoOf(product.colors[colorIndex]), landed }]);
    return id;
  };
  const land = (id: number) => {
    setBag((now) => now.map((item) => (item.id === id ? { ...item, landed: true } : item)));
  };
  /** The newest item of this size leaves the bag. */
  const takeOut = (size: number) => {
    setBag((now) => {
      const at = now.map((item) => item.size).lastIndexOf(size);
      return at < 0 ? now : now.filter((_, i) => i !== at);
    });
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

  /**
   * One item goes to the bag: from the card's photo with the sheet open, or as a
   * small disc out of the dark button on the page. It flies to the big ring, at
   * the place that ring has once the bag has made room for this item.
   */
  const launch = (id: number) => {
    const edge = bagSlot.current?.getBoundingClientRect();
    const to = edge && new DOMRect(edge.right - bagLayout(total + 1).newest - RING_D, edge.top, RING_D, RING_D);
    const photoBox = open ? cardPhoto.current?.getBoundingClientRect() : null;
    const button = buttonBox.current?.getBoundingClientRect();
    const from =
      photoBox ??
      (button
        ? new DOMRect(button.right - button.width / 4 - DISC / 2, button.top + button.height / 2 - DISC / 2, DISC, DISC)
        : null);
    if (!to || !from) {
      land(id);
      return;
    }
    const fit = photoBox ? photoBox.width / PHOTO.w : 1;
    flyToBag({
      photo: product.colors[colorIndex].images[0],
      from,
      round: photoBox ? [CARD_ROUND[0] * fit, CARD_ROUND[1] * fit, 0, 0] : [DISC / 2, DISC / 2, DISC / 2, DISC / 2],
      to,
      startScale: photoBox ? 1 : 0.3,
      duration: buyMotion().flight * 1000,
      ease: buyMotion().flightEase,
      bag: () => document.querySelector<HTMLElement>('[data-pw="demo-buy-bag"]'),
      bagIcon: () => document.querySelector<HTMLElement>('[data-pw="demo-buy-bag-icon"]'),
      onLand: () => {
        land(id);
        // The card answers the landing with a small push.
        answerLanding(cardBox.current);
      },
    });
    if (photoBox) {
      // The card gives a little as the item leaves it. Its photo stays faint while
      // the item is away, so the item reads as lifted off the card.
      cardBox.current?.animate(
        [{ transform: "scale(1)" }, { transform: "scale(0.972)", offset: 0.32 }, { transform: "scale(1)" }],
        { duration: CARD_PRESS_MS, easing: "cubic-bezier(0.2, 0, 0, 1)" },
      );
      cardPhoto.current?.firstElementChild?.animate(
        [
          { opacity: 1 },
          { opacity: 0.45, offset: 0.26 },
          { opacity: 0.45, offset: 0.7 },
          { opacity: 1 },
        ],
        { duration: buyMotion().flight * 1000, easing: "ease-in-out" },
      );
    }
  };

  const addToBag = (index: number) => {
    setLastAdded(index);
    launch(putInBag(index, false));
  };

  /** What the debug menu's play buttons do. */
  const playOpening = () => {
    if (!open) {
      openSheet();
      return;
    }
    close();
    setTimeout(() => latestPlay.current?.openSheet(), REPLAY_WAIT_MS);
  };
  const playAdd = () => {
    const index = pick === null || pick === SOLD_OUT ? RECOMMENDED : pick;
    setPick(index);
    if (open) {
      addToBag(index);
      return;
    }
    onOpen(true);
    setTimeout(() => latestPlay.current?.addToBag(index), REPLAY_WAIT_MS);
  };
  useEffect(() => {
    latestPlay.current = { openSheet, addToBag, playOpening, playAdd };
  });
  useEffect(
    () =>
      registerBuyActions({
        playOpening: () => latestPlay.current?.playOpening(),
        playAdd: () => latestPlay.current?.playAdd(),
      }),
    [],
  );
  const add = () => {
    if (pick === null) return;
    addToBag(pick);
  };
  /** Remove and Add More work on the size in view, or on the page on the last size added. */
  const target = open && pick !== null ? pick : lastAdded;
  const remove = () => {
    if (target === null) return;
    takeOut(target);
    if (countOf(target) <= 1) {
      // The last of this size: the next size with items is the one the bar now speaks of.
      const left = bag.find((item) => item.size !== target);
      setLastAdded(left ? left.size : null);
    }
  };

  // No flight here: the cart opens at once.
  const buyNow = () => {
    if (pick !== null) {
      putInBag(pick, true);
      setLastAdded(pick);
    }
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
        timing={sheetTransition(timing)}
        testId="demo-buy-sheet"
        over={
          <BuyCard
            product={product}
            store={store}
            colorIndex={colorIndex}
            onColor={onColor}
            y={sheetY}
            box={cardBox}
            photo={cardPhoto}
            t={t}
          />
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
            <Bar
              mode={mode}
              small={small}
              gap={gap}
              pillGap={floating ? 0 : PILL_GAP}
              sheetOpen={open}
              chip={chip}
              currency={t(product.currency)}
              buttonBox={buttonBox}
              onOpen={openSheet}
              onBuy={buyNow}
              onAdd={add}
              onRemove={remove}
              onAddMore={() => target !== null && addToBag(target)}
              onNotify={() => setNotified((on) => !on)}
              t={t}
            />
            <BagPill
              open={present && (open || lingers)}
              items={bag}
              flying={flying}
              slot={bagSlot}
              t={t}
            />
          </>,
          document.body,
        )}
    </>
  );
}
