"use client";

import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { motion, useReducedMotion, type MotionValue } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { XD_ICON_SIZE } from "../../DemoApp/xdIcons";
import { CloseIcon } from "../chat/chatIcons";
import type {
  CardLabel,
  ListingMark,
  ListingTile,
  StoreCard,
} from "../listingData";
import { C, lineBox, textTop } from "../demo1Layout";
import { usePageDir } from "../rtl";
import { Icon, ScreenPage, Stroke } from "../ui";
import { BrandCard, useSlider } from "./HomeSections";
import ListingColorSheet, { COLOR_GLASS } from "./ListingColorSheet";
import {
  AddButton,
  BADGE,
  CardLogo,
  ColorPhotos,
  FOOTER_H,
  GAP,
  LabelTurns,
  LabelWords,
  PHOTO,
  PhotoGlow,
  PricePill,
  ProductName,
  StoreMark,
  SwatchPicker,
  type T,
} from "./ListingParts";

/**
 * A store's page — XD `Home Page – 47` (430 x 1779). On /demo it opens from
 * a brand or store card on Home at /[lang]/demo/store/<slug> (ListingScreen
 * gives it the mock store). On the real app every product listing draws it
 * (Stage 7b, A-32): `AppListing` gives it real data. `StorePage` draws only
 * the data it is given, and this file must not import the mock files (A-16).
 *
 * Top to bottom, in design px (y on the artboard):
 *
 *  - The header, y 50 – 100: white, no line under it. The back mark at
 *    (15, 65), the store's logo at (36, 68), 15 tall, and four 20 x 20 marks
 *    at x 250, 300, 350 and 400 (search, sort, filter, share), y 65.
 *  - The banner, y 100 – 240: the same card as a brand store on Home (the
 *    awning, the logo, "Shop Zara Collection Now !"), full width.
 *  - The categories, y 242 – 382: 100 x 140 photos, 2 apart, in a slider
 *    that works like the sliders on Home (useSlider: swipe or mouse drag, a
 *    one-time hint, and an auto slide), but a swipe scrolls freely. A dark fade covers the bottom 70 px,
 *    and the name sits on it, 13 Regular white, baseline 131 under the
 *    tile's top.
 *  - The products, from y 384: two columns of 214 x 397 cards, 2 apart. Each
 *    card is the photo (214 x 311) with its colour dots on its bottom edge,
 *    and an 86 px footer: the logo, the name, a badge, the price and the add
 *    button.
 *  - Colours. The dots are a swiper (SwatchPicker): a swipe along them shows
 *    the next colour, and the photo changes to it. A colour can have more
 *    than one photo; a swipe on the photo shows the next one (ColorPhotos).
 *    A tap on the dots opens the colour sheet, `Home Page – 54`
 *    (ListingColorSheet).
 *  - More pages: when the end of the list comes near, the page shows two
 *    rows of grey cards while the next page loads. After the last page, one
 *    line says that there are no more products.
 *
 * Widths follow the screen: the banner and the grid fill it, a card is half
 * of it less the gap, and the photo keeps the file's shape (214 : 311). So on
 * a 430 px phone every box is the file's own number. The heights of the text
 * rows keep the file's numbers on every phone.
 *
 * Every x is from the start edge, so the page mirrors on an Arabic or
 * Kurdish page (A-13); the back mark points the other way there (A-14).
 *
 * For search engines the page is real HTML from the server: the logo (or the
 * page's title) is the page's <h1>, every product is an <article> with an
 * <h2> name and a price, and the photos carry the product's name.
 */

/** Design y where the header ends and the page begins. */
const HEADER_BOTTOM = 100;

/** The 50 x 50 target round a 20 x 20 header mark (the padding is taken back with a negative margin, so the icons stay 30 px apart as in the file). */
export const MARK_CLASS =
  "relative shrink-0 cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent] motion-reduce:transition-none";
export const MARK_BOX: React.CSSProperties = {
  width: 50,
  height: 50,
  padding: 15,
  margin: -15,
};

/** What a header mark slot gets: the design's mark, its label and its look. */
export type MarkSlot = {
  icon: React.ReactNode;
  label: string;
  testId: string;
  className: string;
  style: React.CSSProperties;
};

/**
 * One header mark: the 20 x 20 icon at the file's place, in a 50 x 50 target
 * round it.
 */
function HeaderMark({
  icon,
  label,
  testId,
  onClick,
  buttonRef,
  style,
  expanded,
}: {
  icon: "listSearch" | "listSort" | "listFilter" | "listSend";
  label: string;
  testId: string;
  onClick?: () => void;
  buttonRef?: React.Ref<HTMLButtonElement>;
  /** How the mark leaves while the search field is open (SEARCH_* below). */
  style?: React.CSSProperties;
  expanded?: boolean;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      data-pw={testId}
      onClick={onClick}
      className={MARK_CLASS}
      style={{ ...MARK_BOX, ...style }}
    >
      <XdIcon name={icon} />
    </button>
  );
}

/**
 * The store's search field, as shop apps do it (Zara, H&M, ASOS): a tap on
 * the search mark grows a field out of the mark until it fills the whole
 * top bar, SEARCH_EDGE px from each edge. Everything else in the bar steps
 * aside.
 *
 *  - Open, in 400 ms: the field grows from the search mark's 20 x 20 circle
 *    to the full bar (a clip-path, so no layout runs per frame), with
 *    Material 3's "emphasized decelerate" curve: fast at first, soft at the
 *    end. The back mark and the logo fade and move 8 px to the start side;
 *    sort, filter and share fade and move 8 px to the end side, one after
 *    the other, 30 ms apart. The glass, the words and the close mark come in
 *    after the grow has started (SEARCH_INSIDE_DELAY_S), so they never show
 *    squeezed.
 *  - Close, in about 400 ms: the inside fades out first. Then the field
 *    shrinks back into the search mark's circle with the "standard" curve,
 *    the circle fades into the mark, and the other parts come back.
 *  - The field closes on the close mark and on Escape; both clear the
 *    words (on the real pages they clear the search too, S7b-9). With no
 *    words, a scroll of the page closes it too (SEARCH_CLOSE_PX). With words,
 *    a scroll does not close it: it leaves and comes back with the header
 *    (S7b-9).
 *  - The field takes the focus in the tap itself. iOS opens the keyboard
 *    only for a focus inside the tap's event, so the field is on the page
 *    (but hidden) before the tap, and React draws it open at once
 *    (flushSync) before the focus.
 *  - "Reduce motion": no moves, the field is just there.
 */
/** The field's distance from each edge of the screen: it fills the top bar. */
const SEARCH_EDGE = 10;

/** The search mark's box, as distances from the field's end edge (the marks end 10 px from the screen's edge). */
const SEARCH_MARK_END = 3 * 20 + 3 * 30;
const SEARCH_MARK_START = SEARCH_MARK_END + 20;

/** The field's shape when closed (the search mark's box, round) and when open. The end side is the right side on a left-to-right page. */
const searchClipShut = (rtl: boolean) =>
  rtl
    ? `inset(9px calc(100% - ${SEARCH_MARK_START}px) 9px ${SEARCH_MARK_END}px round 10px)`
    : `inset(9px ${SEARCH_MARK_END}px 9px calc(100% - ${SEARCH_MARK_START}px) round 10px)`;
const SEARCH_CLIP_OPEN = "inset(0px 0px 0px 0px round 12px)";

/** Material 3 "emphasized decelerate" (open) and "standard" (close). */
const SEARCH_OPEN_EASE = "cubic-bezier(0.05, 0.7, 0.1, 1)";
const SEARCH_SHUT_EASE = "cubic-bezier(0.2, 0, 0, 1)";

/** How long the grow and the shrink take, in seconds. */
const SEARCH_OPEN_S = 0.4;
const SEARCH_SHUT_S = 0.3;

/** When the field's inside comes in after the grow starts, and how long it fades out before the shrink. */
const SEARCH_INSIDE_DELAY_S = 0.12;
const SEARCH_INSIDE_OUT_S = 0.1;

/** How far the page must scroll to close the field. Smaller moves are a shaky finger. */
const SEARCH_CLOSE_PX = 24;

/**
 * How long after the open a scroll does not close the field. The keyboard
 * comes up then, and iOS may move the page to show the field; that is not
 * the shopper's scroll.
 */
const SEARCH_SETTLE_MS = 450;

/**
 * The style of a part of the bar that steps aside while the field is open.
 * `side` is the way it moves (-1 to the start side, 1 to the end side).
 * `order` is how far it is from the search mark: the near ones leave first
 * and come back last.
 */
function asideStyle(
  open: boolean,
  side: -1 | 1,
  order: number,
  rtl: boolean,
): React.CSSProperties {
  const leave = order * 0.03;
  const back = SEARCH_INSIDE_OUT_S + SEARCH_SHUT_S * 0.5 + (2 - order) * 0.03;
  const x = side * 8 * (rtl ? -1 : 1);
  return {
    opacity: open ? 0 : 1,
    transform: open ? `translateX(${x}px)` : "translateX(0)",
    pointerEvents: open ? "none" : undefined,
    transition: open
      ? `opacity 0.15s ease-out ${leave}s, transform 0.25s ${SEARCH_OPEN_EASE} ${leave}s`
      : `opacity 0.2s ease-in ${back}s, transform 0.3s ${SEARCH_OPEN_EASE} ${back}s`,
  };
}

/**
 * The words in the store's search field, and what they do. On /demo the
 * field only takes text (there is no results design). On the real pages the
 * words search the listing (`?search=`, useListingSearch).
 */
export type StoreSearch = {
  value: string;
  onChange: (value: string) => void;
  /** Keys in the field (the real pages: Enter searches at once). */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** The close mark and Escape: the words go (the real pages: the search goes, S7b-9). */
  onClear: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** The inline completion: the rest of a likely word, grey after the words (S7b-14). */
  ghost?: string;
};

/**
 * Whether the store's search field is open, and the ways to open and close
 * it. With no words, the field closes when the page scrolls more than
 * SEARCH_CLOSE_PX, counted from where the page was when the keyboard
 * settled. With words it stays open (S7b-9), and it opens with the page
 * when the page has words already (a shared link).
 */
function useStoreSearch(search: StoreSearch) {
  const [open, setOpen] = useState(() => search.value.length > 0);
  const field = useRef<HTMLInputElement>(null);
  const mark = useRef<HTMLButtonElement>(null);
  const hasWords = search.value.length > 0;

  const show = () => {
    flushSync(() => setOpen(true));
    field.current?.focus({ preventScroll: true });
  };
  const hide = (refocus: boolean) => {
    field.current?.blur();
    setOpen(false);
    search.onClear();
    // From the keys or the close mark, the focus goes back to the search
    // mark. Not after a scroll: the shopper's eyes are on the list.
    if (refocus) mark.current?.focus({ preventScroll: true });
  };

  // The words came from the address (a shared link, a back step): show them.
  useEffect(() => {
    if (hasWords) setOpen(true);
  }, [hasWords]);

  useEffect(() => {
    if (!open || hasWords) return;
    let from = window.scrollY;
    let settled = false;
    const wait = setTimeout(() => {
      settled = true;
      from = window.scrollY;
    }, SEARCH_SETTLE_MS);
    const onScroll = () => {
      if (!settled) {
        from = window.scrollY;
        return;
      }
      if (Math.abs(window.scrollY - from) > SEARCH_CLOSE_PX) {
        field.current?.blur();
        setOpen(false);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(wait);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open, hasWords]);

  return { open, field, mark, show, hide };
}

function StoreSearchField({
  state,
  search,
  rtl,
  t,
}: {
  state: ReturnType<typeof useStoreSearch>;
  search: StoreSearch;
  rtl: boolean;
  t: T;
}) {
  const { open, field, hide } = state;
  return (
    <form
      role="search"
      data-pw="demo-listing-search-field"
      data-open={open || undefined}
      aria-hidden={!open}
      inert={!open}
      onSubmit={(e) => {
        e.preventDefault();
        // The search key puts the keyboard down.
        field.current?.blur();
      }}
      className="absolute motion-reduce:transition-none"
      style={{
        insetInlineStart: SEARCH_EDGE,
        insetInlineEnd: SEARCH_EDGE,
        top: 6,
        height: 38,
        borderRadius: 12,
        background: C.field,
        clipPath: open ? SEARCH_CLIP_OPEN : searchClipShut(rtl),
        opacity: open ? 1 : 0,
        // Hidden only after the close has run, so the close can be seen.
        visibility: open ? "visible" : "hidden",
        transition: open
          ? `clip-path ${SEARCH_OPEN_S}s ${SEARCH_OPEN_EASE}, opacity 0.1s linear, visibility 0s`
          : // The inside fades first, then the field shrinks into the mark,
            // and the last circle fades as the mark comes back.
            `clip-path ${SEARCH_SHUT_S}s ${SEARCH_SHUT_EASE} ${SEARCH_INSIDE_OUT_S}s, ` +
            `opacity 0.12s linear ${SEARCH_INSIDE_OUT_S + SEARCH_SHUT_S - 0.08}s, ` +
            `visibility 0s linear ${SEARCH_INSIDE_OUT_S + SEARCH_SHUT_S + 0.04}s`,
      }}
    >
      <div
        className="flex items-center w-full h-full motion-reduce:transition-none"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateX(0)" : `translateX(${rtl ? -12 : 12}px)`,
          transition: open
            ? `opacity 0.2s linear ${SEARCH_INSIDE_DELAY_S}s, transform ${SEARCH_OPEN_S}s ${SEARCH_OPEN_EASE} ${SEARCH_INSIDE_DELAY_S}s`
            : `opacity ${SEARCH_INSIDE_OUT_S}s linear, transform ${SEARCH_INSIDE_OUT_S}s linear`,
        }}
      >
        <span className="shrink-0" style={{ marginInlineStart: 9.5 }}>
          <Icon name="searchGlass" />
        </span>
        <div
          className="relative"
          style={{
            marginInlineStart: 40 - (9.5 + XD_ICON_SIZE.searchGlass.w),
            flex: "1 1 0",
            minWidth: 0,
            height: 24,
          }}
        >
          {search.ghost && (
            // The completion: the typed words are invisible (they only take
            // their width), the rest shows grey after them, under the field.
            <div
              aria-hidden="true"
              data-pw="demo-listing-search-ghost"
              className="absolute inset-0 overflow-hidden whitespace-pre pointer-events-none"
              style={{ fontSize: 16, lineHeight: "24px" }}
            >
              <span className="text-transparent">{search.value}</span>
              <span style={{ color: "#C4C2C2" }}>{search.ghost}</span>
            </div>
          )}
          <input
            ref={field}
            data-pw="demo-listing-search-input"
            type="search"
            enterKeyHint="search"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            onFocus={search.onFocus}
            onBlur={search.onBlur}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                hide(true);
                return;
              }
              search.onKeyDown?.(e);
            }}
            placeholder={t("Search...")}
            aria-label={t("Search")}
            className="block bg-transparent outline-none font-normal placeholder:text-[#8D8D8D] [&::-webkit-search-cancel-button]:hidden"
            style={{
              position: "relative",
              width: "100%",
              height: 24,
              // 16 px: iOS zooms the page into a field with smaller text.
              fontSize: 16,
              color: C.ink,
              padding: 0,
              border: 0,
            }}
          />
        </div>
        <button
          type="button"
          data-pw="demo-listing-search-close"
          aria-label={t("Close")}
          onClick={() => hide(true)}
          className="flex items-center justify-center shrink-0 cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
          style={{ width: 38, height: 38 }}
        >
          <CloseIcon color={C.grey} />
        </button>
      </div>
    </form>
  );
}

/** The header's parts. A slot left out draws the design's mark with no action (/demo). */
export type StoreHeader = {
  /** The logo, or the page's title as text where there is no logo (S7b-5). */
  title: ListingMark;
  search: StoreSearch;
  /** The back mark. */
  back: (slot: MarkSlot) => React.ReactNode;
  sort?: (slot: MarkSlot) => React.ReactNode;
  filter?: (slot: MarkSlot) => React.ReactNode;
  share?: (slot: MarkSlot) => React.ReactNode;
};

/** The widest the title may be: from x 36 to the search mark (x 250), less a gap. */
const TITLE_MAX_W = 250 - 36 - 14;

function Header({ header, t }: { header: StoreHeader; t: T }) {
  const dir = usePageDir();
  const rtl = dir === "rtl";
  const search = useStoreSearch(header.search);
  const { open } = search;
  const slot = (
    icon: "listSort" | "listFilter" | "listSend" | "back",
    label: string,
    testId: string,
    style: React.CSSProperties,
  ): MarkSlot => ({
    icon: <XdIcon name={icon} />,
    label,
    testId,
    className: MARK_CLASS,
    style: { ...MARK_BOX, ...style },
  });
  // The back mark's box is 12 x 21 at (14.5, 64.5); the target is the header's height.
  const backStyle: React.CSSProperties = {
    insetInlineStart: 0,
    top: 0,
    width: 34,
    height: 50,
    paddingTop: 14,
    paddingInlineStart: 14,
    // It steps aside while the search field fills the bar.
    ...asideStyle(open, -1, 2, rtl),
  };
  // `flex items-start`: a button centres its content up and down, which put
  // the mark 7 px under the file's y.
  const backClass =
    "absolute flex items-start cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent] motion-reduce:transition-none";
  // The box sits on whole pixels and a transform moves the mark the last
  // 0.5 px. Chromium draws an image box at a half-pixel layout place on the
  // next whole pixel, so a 14.5 px padding showed the mark at (15, 65); a
  // transform is not snapped (measured at 2x and 8x). It points the other
  // way on a right-to-left page (A-14).
  const backIcon = (
    <XdIcon
      name="back"
      style={{
        transform: `translate(${rtl ? -0.5 : 0.5}px, 0.5px)${rtl ? " scaleX(-1)" : ""}`,
      }}
    />
  );
  return (
    <header
      className="relative w-full"
      style={{ height: HEADER_BOTTOM - 50, background: C.white }}
    >
      <div className="contents" inert={open}>
        {header.back({
          icon: backIcon,
          label: t("Back"),
          testId: "demo-listing-back",
          className: backClass,
          style: backStyle,
        })}
      </div>
      {/* The store's logo (or the page's title): the page's h1 for search engines and screen readers. */}
      <h1
        className="absolute m-0 motion-reduce:transition-none"
        style={{
          insetInlineStart: 36,
          top: 68 - 50,
          ...asideStyle(open, -1, 1, rtl),
        }}
      >
        <StoreMark
          store={header.title}
          h={15}
          maxW={header.title.logo ? 100 : TITLE_MAX_W}
          eager
        />
      </h1>
      <div
        className="absolute flex items-center"
        style={{ insetInlineEnd: 10, top: 65 - 50, gap: 30 }}
      >
        {/* The search mark opens the field (StoreSearchField); it hides under the field's grow. */}
        <HeaderMark
          icon="listSearch"
          label={t("Search")}
          testId="demo-listing-search"
          buttonRef={search.mark}
          onClick={search.show}
          expanded={open}
          style={{
            opacity: open ? 0 : 1,
            // Back only as the field's last circle fades into it.
            transition: open
              ? "opacity 0.1s linear"
              : `opacity 0.15s linear ${SEARCH_INSIDE_OUT_S + SEARCH_SHUT_S - 0.1}s`,
          }}
        />
        {/* The other marks step aside while the field is open. */}
        <div className="contents" inert={open} aria-hidden={open || undefined}>
          {(header.sort ?? demoMark("listSort"))(
            slot(
              "listSort",
              t("Sort"),
              "demo-listing-sort",
              asideStyle(open, 1, 0, rtl),
            ),
          )}
          {(header.filter ?? demoMark("listFilter"))(
            slot(
              "listFilter",
              t("Filter"),
              "demo-listing-filter",
              asideStyle(open, 1, 1, rtl),
            ),
          )}
          {(header.share ?? demoMark("listSend"))(
            slot(
              "listSend",
              t("Share"),
              "demo-listing-share",
              asideStyle(open, 1, 2, rtl),
            ),
          )}
        </div>
      </div>
      <StoreSearchField state={search} search={header.search} rtl={rtl} t={t} />
    </header>
  );
}

/** A mark with no action yet (/demo: "the sort, filter and share marks do nothing yet"). */
const demoMark =
  (icon: "listSort" | "listFilter" | "listSend") => (slot: MarkSlot) => (
    <HeaderMark
      icon={icon}
      label={slot.label}
      testId={slot.testId}
      style={slot.style}
    />
  );

/** The fade over the bottom half of a category tile (y 312 – 382 in the file). */
const TILE_FADE =
  "linear-gradient(180deg, rgba(0,0,0,0) 13.884%, rgba(0,0,0,0.502) 83.605%)";

/**
 * The category row: a slider with the same behaviour as the sliders on Home
 * (see useSlider in HomeSections): Embla moves the row, so a finger and a
 * mouse can both drag it; it shows a one-time hint, and it moves on by
 * itself while it is in view. Each tile is a slide. Unlike Home's sliders,
 * the row scrolls freely: a swipe does not stop on the next tile.
 *
 * On the real pages a tile is a link to the listing with that category
 * picked (S7b-7); `onTile` opens it in the app.
 */
function Categories({
  tiles,
  viewportRef,
  nudge,
  onTile,
}: {
  tiles: readonly ListingTile[];
  viewportRef: (node: HTMLElement | null) => void;
  nudge: MotionValue<number>;
  onTile?: (tile: ListingTile, e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  // The 2 px gap above the row is on the <div>: a site-wide list rule takes
  // the margin off a <ul>, even an inline one (measured: 0 px in Chromium).
  return (
    <div
      ref={viewportRef}
      data-pw="demo-listing-categories"
      className="shrink-0 w-full overflow-hidden"
      // The page still scrolls up and down over the row.
      style={{ marginTop: GAP, height: 140, touchAction: "pan-y pinch-zoom" }}
    >
      <ul className="flex h-full m-0 p-0 list-none" style={{ gap: GAP }}>
        {tiles.map((c) => {
          // The hint moves this part, so the photo, its name and its frame
          // move together, as one card. If the <li> cut off its own insides,
          // each tile would show a white gap during the hint.
          const inside = (
            <motion.div
              className="relative w-full h-full overflow-hidden"
              style={{ x: nudge }}
            >
              <img
                src={c.image}
                alt=""
                width={100}
                height={140}
                draggable={false}
                decoding="async"
                className="block w-full h-full object-cover select-none"
              />
              <span
                aria-hidden="true"
                className="absolute inset-x-0"
                style={{ top: 70, height: 70, background: TILE_FADE }}
              />
              <span
                className="absolute inset-x-0 text-center font-normal whitespace-nowrap overflow-hidden text-ellipsis"
                style={{
                  top: textTop(131, 13),
                  fontSize: 13,
                  lineHeight: `${lineBox(13)}px`,
                  color: c.color,
                  paddingInline: 4,
                }}
              >
                {c.name}
              </span>
              <Stroke color={C.grey} width={0.3} />
            </motion.div>
          );
          return (
            <li
              key={c.key}
              data-pw={`demo-listing-category-${c.key}`}
              className="relative shrink-0"
              style={{ width: 100, height: 140 }}
            >
              {c.href ? (
                <a
                  href={c.href}
                  draggable={false}
                  className="block w-full h-full [-webkit-tap-highlight-color:transparent]"
                  onClick={(e) => {
                    if (
                      e.metaKey ||
                      e.ctrlKey ||
                      e.shiftKey ||
                      e.altKey ||
                      e.button !== 0
                    )
                      return;
                    onTile?.(c, e);
                  }}
                >
                  {inside}
                </a>
              ) : (
                inside
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The 15 px pill under a product's name, 9 px words; its mark (if any) 6 px in. */
function Badge({ badge, t }: { badge: CardLabel; t: T }) {
  const look = BADGE[badge.kind];
  return (
    <p
      data-pw={`demo-listing-badge-${badge.kind}`}
      className="relative block w-fit m-0 font-normal whitespace-nowrap"
      style={{
        height: 15,
        minWidth: look.minW,
        paddingInlineStart: look.textAt,
        paddingInlineEnd: 6,
        paddingTop: 2,
        borderRadius: look.radius,
        background: look.bg,
        color: look.ink,
        fontSize: 9,
        lineHeight: `${lineBox(9)}px`,
      }}
    >
      {badge.kind === "bag" && (
        <XdIcon
          name="listBag"
          className="absolute"
          style={{ insetInlineStart: 6, top: 2 }}
        />
      )}
      {badge.kind === "flash" && (
        <XdIcon
          name="listFlash"
          className="absolute"
          style={{ insetInlineStart: 6, top: 2 }}
        />
      )}
      <LabelWords label={badge} t={t} />
    </p>
  );
}

/** The top of the labels' row in the footer: y 738 on the file, under the photo. */
const LABELS_TOP = 738 - 384 - PHOTO.h;

/** The card's labels: 15 px pills that take turns (LabelTurns). None: an empty row. */
function Labels({ badges, t }: { badges: readonly CardLabel[]; t: T }) {
  if (badges.length === 0) return null;
  return (
    <LabelTurns
      badges={badges}
      top={LABELS_TOP}
      height={15}
      testId="demo-listing-labels"
      render={(badge) => <Badge badge={badge} t={t} />}
    />
  );
}

/** How a card that a later page adds comes in: it fades in and rises 12 px. */
const APPEAR = { duration: 0.32, ease: [0.2, 0, 0, 1] } as const;

/** What a card hands the page when its colour dots are tapped. */
export type OpenColors = (
  product: StoreCard,
  /** Shows a colour on the card (the sheet calls it when a colour is tapped). */
  pick: (index: number) => void,
) => void;

/** What the page does with a card: open it, warm it, add it. */
export type CardActions = {
  /** A tap on the card: open the product's page in colour `colorIndex`. */
  open: (card: StoreCard, colorIndex: number, el: HTMLElement) => void;
  /** A finger or the mouse is on the card: start loading its page. */
  warm?: (card: StoreCard, colorIndex: number) => void;
  /** A finger or the mouse is on the dots: start loading every colour's photo. */
  warmColors?: (card: StoreCard) => void;
  /** The add button (S7b-1). */
  add?: (card: StoreCard) => void;
};

function ProductCard({
  product,
  index,
  appear,
  onOpenColors,
  actions,
  t,
}: {
  product: StoreCard;
  index: number;
  /** Set on a card a later page adds: its place in that page, for a small delay. */
  appear?: number;
  onOpenColors: OpenColors;
  actions: CardActions;
  t: T;
}) {
  const [colorIndex, setColorIndex] = useState(product.selected);
  const color = product.colors[colorIndex] ?? product.colors[0];
  const name = product.name.join(" . ");
  // The first row is what the page opens on: load it first.
  const first = index < 2;
  const href = product.links[colorIndex] ?? product.links[0];
  /**
   * A tap on the card opens the product's page. The colour dots and the add
   * button keep their own taps, and a swipe on the photos is not a tap (the
   * slider stops that click). A click with a modifier on the name's link is
   * left to the browser (a new tab).
   */
  const open = (e: React.MouseEvent<HTMLElement>) => {
    if (
      e.defaultPrevented ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0
    )
      return;
    if ((e.target as Element).closest("button")) return;
    e.preventDefault();
    actions.open(product, colorIndex, e.currentTarget);
  };
  return (
    <motion.article
      data-pw={`demo-listing-product-${product.id}`}
      data-color={colorIndex}
      className="relative flex flex-col min-w-0 bg-white cursor-pointer [-webkit-tap-highlight-color:transparent]"
      onClick={open}
      onPointerDown={() => actions.warm?.(product, colorIndex)}
      // The cards in the HTML are there at once; only added cards move.
      initial={appear === undefined ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      // Two cards share a row; the second one comes 50 ms after the first one.
      transition={{ ...APPEAR, delay: ((appear ?? 0) % 2) * 0.05 }}
    >
      {/* The card's line is drawn first; the photo lies over its top. */}
      <Stroke color="#D3D3D3" width={0.3} />
      <div
        className="relative w-full"
        style={{ aspectRatio: `${PHOTO.w} / ${PHOTO.h}` }}
      >
        {/* A new colour is a new slider, on its first photo. */}
        {color && color.images.length > 0 ? (
          <ColorPhotos
            key={colorIndex}
            color={color}
            alt={`${product.mark.name} ${name}`.trim()}
            eager={first}
          />
        ) : (
          <span aria-hidden="true" className="absolute inset-0 bg-[#F4F4F4]" />
        )}
        <PhotoGlow />
        <Stroke color={product.line} width={0.5} />
        {product.colors.length > 1 && (
          <SwatchPicker
            colors={product.colors}
            selected={colorIndex}
            onSelect={setColorIndex}
            onOpen={() => onOpenColors(product, setColorIndex)}
            onTouch={() => actions.warmColors?.(product)}
            t={t}
          />
        )}
      </div>

      <div className="relative w-full shrink-0" style={{ height: FOOTER_H }}>
        <CardLogo mark={product.mark} />
        <ProductName product={product} href={href} />
        <Labels badges={product.labels} t={t} />
        <PricePill product={product} />
        <AddButton
          product={product}
          t={t}
          onAdd={actions.add ? () => actions.add?.(product) : undefined}
        />
      </div>
    </motion.article>
  );
}

/** A grey card of the same size, shown while the next page loads. */
function SkeletonCard() {
  const bar = "rounded-[4px] bg-[#EFEFEF]";
  return (
    <div
      aria-hidden="true"
      data-pw="demo-listing-skeleton"
      className="relative flex flex-col min-w-0 bg-white animate-pulse motion-reduce:animate-none"
    >
      <Stroke color="#D3D3D3" width={0.3} />
      <div
        className="w-full bg-[#F4F4F4]"
        style={{ aspectRatio: `${PHOTO.w} / ${PHOTO.h}` }}
      />
      <div className="relative w-full shrink-0" style={{ height: FOOTER_H }}>
        <span
          className={`absolute ${bar}`}
          style={{ insetInlineStart: 12, top: 8, width: 40, height: 11 }}
        />
        <span
          className={`absolute ${bar}`}
          style={{ insetInlineStart: 12, top: 26, width: "60%", height: 11 }}
        />
        <span
          className={`absolute ${bar}`}
          style={{ insetInlineStart: 12, top: 43, width: 100, height: 15 }}
        />
        <span
          className={`absolute ${bar}`}
          style={{ insetInlineStart: 12, top: 62, width: 50, height: 18 }}
        />
      </div>
    </div>
  );
}

/** The store page's banner: a brand store's card (S7b-6). */
export type StoreBanner = {
  name: string;
  /** The name as the card's line writes it, where it differs (the file's "boyner"). */
  shown?: string;
  logo?: ListingMark["logo"] & { top?: number; left?: number };
};

/** Where the list is with its pages. */
export type StorePaging = {
  /** The next page is on its way: two rows of grey cards show. */
  loading: boolean;
  /** No more pages: the end line shows. */
  done: boolean;
  /** Put at the end of the list; the page reads the next page when it comes near. */
  end: React.Ref<HTMLDivElement>;
  /** Cards from this place on came with a later page, and come in with a move. */
  addedFrom: number;
};

/**
 * The store page, from the data it is given. `/demo` (ListingScreen)
 * and the real listings (AppListing) both draw it.
 */
export function StorePage({
  t,
  body,
  header,
  banner,
  tiles,
  onTile,
  cards,
  paging,
  actions,
  empty,
  tabBar,
  contentHeight,
}: {
  /** Labels in Apple's title style, messages in sentence style (demoCase). */
  t: T;
  body: T;
  header: StoreHeader;
  /** Null: no banner (a listing with no boutique, D-46). */
  banner: StoreBanner | null;
  tiles: readonly ListingTile[];
  onTile?: (tile: ListingTile, e: React.MouseEvent<HTMLAnchorElement>) => void;
  cards: readonly StoreCard[];
  paging: StorePaging;
  actions: CardActions;
  /** Shown in place of the grid when there are no cards. */
  empty?: React.ReactNode;
  tabBar: boolean;
  contentHeight?: number;
}) {
  // Free: a swipe goes as far as the finger throws it, not one tile.
  const categories = useSlider({ free: true });
  const calm = useReducedMotion();
  // The colour sheet: the product it shows stays while the sheet slides out.
  const [colors, setColors] = useState<{
    product: StoreCard;
    pick: (index: number) => void;
  } | null>(null);
  const [colorsOpen, setColorsOpen] = useState(false);
  const openColors: OpenColors = (product, pick) => {
    setColors({ product, pick });
    setColorsOpen(true);
  };
  const { loading, done, end, addedFrom } = paging;
  return (
    <ScreenPage
      testId="demo-listing"
      bg={C.white}
      header={<Header header={header} t={t} />}
      scrollTop={HEADER_BOTTOM}
      contentHeight={contentHeight}
      // The demo draws the tab bar; the real pages' layout keeps its room.
      tabBar={tabBar}
      // A long list: the header leaves on a scroll down and comes back on any scroll up.
      hideHeadOnScroll
      // The colour sheet blurs the page behind it (`Home Page – 54`).
      glass={colorsOpen ? COLOR_GLASS : undefined}
    >
      {banner && (
        <BrandCard
          t={t}
          brand={banner.name}
          shown={banner.shown}
          logo={
            banner.logo
              ? { top: 65, ...banner.logo, h: banner.logo.h ?? 20 }
              : undefined
          }
          centreAt={109}
          capitalize
          nameMark
          testId="demo-listing-banner"
          style={{ width: "100%" }}
        />
      )}
      {tiles.length > 0 && (
        <Categories
          tiles={tiles}
          viewportRef={categories.viewportRef}
          nudge={categories.nudge}
          onTile={onTile}
        />
      )}
      {cards.length === 0 && !loading && empty ? (
        empty
      ) : (
        <section
          aria-label={header.title.name}
          aria-busy={loading}
          data-pw="demo-listing-products"
          className="grid w-full"
          style={{ gridTemplateColumns: "1fr 1fr", gap: GAP, marginTop: GAP }}
        >
          {cards.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              index={i}
              // Cards in the first HTML are there at once; later ones come in.
              appear={i < addedFrom || calm ? undefined : i - addedFrom}
              onOpenColors={openColors}
              actions={actions}
              t={t}
            />
          ))}
          {loading &&
            Array.from({ length: 4 }, (_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))}
        </section>
      )}
      {/* What the list is doing, for screen readers. */}
      <p role="status" className="sr-only">
        {loading ? body("Loading more products") : ""}
      </p>
      <div ref={end} aria-hidden="true" style={{ height: 1 }} />
      {done && cards.length > 0 && (
        <p
          data-pw="demo-listing-end"
          className="m-0 text-center font-normal"
          style={{ padding: "24px 16px 40px", fontSize: 11, color: "#8C8C8C" }}
        >
          {body("You have seen all products")}
        </p>
      )}
      {colors && (
        <ListingColorSheet
          open={colorsOpen}
          onClose={() => setColorsOpen(false)}
          product={colors.product}
          onPick={colors.pick}
          onAdd={actions.add ? () => actions.add?.(colors.product) : undefined}
          t={t}
        />
      )}
    </ScreenPage>
  );
}
