"use client";

import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { motion, useReducedMotion, type MotionValue } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { XD_ICON_SIZE } from "../../DemoApp/xdIcons";
import { CloseIcon } from "../chat/chatIcons";
import { hrefFor } from "../../DemoApp/demoRoutes";
import { openProductInColor, productFirstImages } from "../../DemoApp/demoProduct";
import {
  LISTING_CATEGORIES,
  LISTING_FIRST_IMAGES,
  LISTING_PAGES,
  listingPage,
  productScreen,
  storeBySlug,
  type DemoProduct,
  type DemoStore,
  type ProductBadge,
} from "../../DemoApp/demoStores";
import { useDemoNav } from "../Demo1Shell";
import { useDemoCase } from "../demoCase";
import { C, lineBox, textTop } from "../demo1Layout";
import { Icon, ScreenPage, Stroke } from "../ui";
import { BrandCard, useSlider } from "./HomeSections";
import ListingColorSheet, { COLOR_GLASS } from "./ListingColorSheet";
import { useSettled } from "./useSettled";
import {
  AddButton,
  BADGE,
  CardLogo,
  ColorPhotos,
  FOOTER_H,
  GAP,
  LabelTurns,
  PHOTO,
  PhotoGlow,
  PricePill,
  ProductName,
  StoreMark,
  SwatchPicker,
  Weighted,
  type T,
} from "./ListingParts";

/**
 * A store's page — XD `Home Page – 47` (430 x 1779), opened from a brand or
 * store card on Home at /[lang]/demo/store/<slug>.
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
 *    and an 86 px footer: the store's logo, the name, a badge, the price and
 *    the add button.
 *  - Colours. The dots are a swiper (SwatchPicker): a swipe along them shows
 *    the next colour, and the photo changes to it. A colour can have more
 *    than one photo; a swipe on the photo shows the next one (ColorPhotos).
 *    A tap on the dots opens the colour sheet, `Home Page – 54`
 *    (ListingColorSheet).
 *  - More pages: the first 12 cards come in the HTML. When the end of the
 *    list comes near, the page shows two rows of grey cards for a moment (a
 *    "skeleton", as a real request would) and then adds the next 12. After
 *    the last page, one line says that there are no more products.
 *
 * Widths follow the screen: the banner and the grid fill it, a card is half
 * of it less the gap, and the photo keeps the file's shape (214 : 311). So on
 * a 430 px phone every box is the file's own number. The heights of the text
 * rows keep the file's numbers on every phone.
 *
 * The status bar is left out (the phone draws its own). The file draws no
 * tab bar on this page, but the page shows it, with Home as the active tab,
 * so the person can reach the other tabs from a store. The search mark opens
 * a search field in the header (StoreSearchField). The sort, filter and
 * share marks do nothing yet.
 *
 * For search engines the page is real HTML from the server: the logo is the
 * page's <h1>, every product is an <article> with an <h2> name and a price,
 * and the photos carry the product's name. The route's page adds the title,
 * the description and the JSON-LD (app/(client)/[lang]/demo/store/[store]).
 */

/** The file's height for this board; the page is at least this tall. */
const BOARD_H = 1779;

/** Design y where the header ends and the page begins. */
const HEADER_BOTTOM = 100;

let warmed = false;

/**
 * Starts loading the first pictures of a store's page, so they are already
 * there when it opens. Home calls it when a finger or the mouse is on a card,
 * a moment before the tap. It runs once.
 */
export function warmListing() {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  for (const src of LISTING_FIRST_IMAGES) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}

/**
 * One header mark: the 20 x 20 icon at the file's place, in a 50 x 50 target
 * round it (the padding is taken back with a negative margin, so the icons
 * stay 30 px apart as in the file).
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
      className="relative shrink-0 cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent] motion-reduce:transition-none"
      style={{ width: 50, height: 50, padding: 15, margin: -15, ...style }}
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
 *    end. The back mark and the logo fade and move 8 px left; sort, filter
 *    and share fade and move 8 px right, one after the other, 30 ms apart.
 *    The glass, the words and the close mark come in after the grow has
 *    started (SEARCH_INSIDE_DELAY_S), so they never show squeezed.
 *  - Close, in about 400 ms: the inside fades out first. Then the field
 *    shrinks back into the search mark's circle with the "standard" curve,
 *    the circle fades into the mark, and the other parts come back.
 *  - The field closes on a scroll of the page (SEARCH_CLOSE_PX), on the
 *    close mark, and on Escape. The page then is as it was: the words go,
 *    and the phone's keyboard goes down.
 *  - The field takes the focus in the tap itself. iOS opens the keyboard
 *    only for a focus inside the tap's event, so the field is on the page
 *    (but hidden) before the tap, and React draws it open at once
 *    (flushSync) before the focus.
 *  - "Reduce motion": no moves, the field is just there.
 *
 * There is no results design yet, as on the search screen: the field takes
 * text, and the search key puts the keyboard down.
 */
/** The field's distance from each edge of the screen: it fills the top bar. */
const SEARCH_EDGE = 10;

/** The search mark's box, as distances from the field's right edge (the marks end 10 px from the screen's edge). */
const SEARCH_MARK_RIGHT = 3 * 20 + 3 * 30;
const SEARCH_MARK_LEFT = SEARCH_MARK_RIGHT + 20;

/** The field's shape when closed (the search mark's box, round) and when open. */
const SEARCH_CLIP_SHUT = `inset(9px ${SEARCH_MARK_RIGHT}px 9px calc(100% - ${SEARCH_MARK_LEFT}px) round 10px)`;
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
 * `side` is the way it moves (-1 left, 1 right). `order` is how far it is
 * from the search mark: the near ones leave first and come back last.
 */
function asideStyle(
  open: boolean,
  side: -1 | 1,
  order: number,
): React.CSSProperties {
  const leave = order * 0.03;
  const back = SEARCH_INSIDE_OUT_S + SEARCH_SHUT_S * 0.5 + (2 - order) * 0.03;
  return {
    opacity: open ? 0 : 1,
    transform: open ? `translateX(${side * 8}px)` : "translateX(0)",
    pointerEvents: open ? "none" : undefined,
    transition: open
      ? `opacity 0.15s ease-out ${leave}s, transform 0.25s ${SEARCH_OPEN_EASE} ${leave}s`
      : `opacity 0.2s ease-in ${back}s, transform 0.3s ${SEARCH_OPEN_EASE} ${back}s`,
  };
}

/**
 * Whether the store's search field is open, and the ways to open and close
 * it. The field closes when the page scrolls more than SEARCH_CLOSE_PX,
 * counted from where the page was when the keyboard settled.
 */
function useStoreSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const mark = useRef<HTMLButtonElement>(null);

  const show = () => {
    flushSync(() => setOpen(true));
    field.current?.focus({ preventScroll: true });
  };
  const hide = (refocus: boolean) => {
    field.current?.blur();
    setOpen(false);
    setQuery("");
    // From the keys or the close mark, the focus goes back to the search
    // mark. Not after a scroll: the shopper's eyes are on the list.
    if (refocus) mark.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
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
        setQuery("");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(wait);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  return { open, query, setQuery, field, mark, show, hide };
}

function StoreSearchField({
  search,
  t,
}: {
  search: ReturnType<typeof useStoreSearch>;
  t: T;
}) {
  const { open, query, setQuery, field, hide } = search;
  return (
    <form
      role="search"
      data-pw="demo-listing-search-field"
      data-open={open || undefined}
      aria-hidden={!open}
      inert={!open}
      onSubmit={(e) => {
        e.preventDefault();
        // No results design yet: the search key puts the keyboard down.
        field.current?.blur();
      }}
      className="absolute motion-reduce:transition-none"
      style={{
        left: SEARCH_EDGE,
        right: SEARCH_EDGE,
        top: 6,
        height: 38,
        borderRadius: 12,
        background: C.field,
        clipPath: open ? SEARCH_CLIP_OPEN : SEARCH_CLIP_SHUT,
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
          transform: open ? "translateX(0)" : "translateX(12px)",
          transition: open
            ? `opacity 0.2s linear ${SEARCH_INSIDE_DELAY_S}s, transform ${SEARCH_OPEN_S}s ${SEARCH_OPEN_EASE} ${SEARCH_INSIDE_DELAY_S}s`
            : `opacity ${SEARCH_INSIDE_OUT_S}s linear, transform ${SEARCH_INSIDE_OUT_S}s linear`,
        }}
      >
        <Icon name="searchGlass" ml={9.5} />
        <input
          ref={field}
          data-pw="demo-listing-search-input"
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              hide(true);
            }
          }}
          placeholder={t("Search...")}
          aria-label={t("Search")}
          className="block bg-transparent outline-none font-normal placeholder:text-[#8D8D8D] [&::-webkit-search-cancel-button]:hidden"
          style={{
            marginLeft: 40 - (9.5 + XD_ICON_SIZE.searchGlass.w),
            flex: "1 1 0",
            minWidth: 0,
            height: 24,
            // 16 px: iOS zooms the page into a field with smaller text.
            fontSize: 16,
            color: C.ink,
            padding: 0,
            border: 0,
          }}
        />
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

function Header({ store, t }: { store: DemoStore; t: T }) {
  const { back } = useDemoNav();
  const search = useStoreSearch();
  const { open } = search;
  return (
    <header
      className="relative w-full"
      style={{ height: HEADER_BOTTOM - 50, background: C.white }}
    >
      {/* The back mark's box is 12 x 21 at (14.5, 64.5); the target is the header's height. */}
      <button
        type="button"
        aria-label={t("Back")}
        data-pw="demo-listing-back"
        onClick={back}
        // `flex items-start`: a button centres its content up and down, which
        // put the mark 7 px under the file's y.
        inert={open}
        className="absolute flex items-start cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent] motion-reduce:transition-none"
        // The box sits on whole pixels and a transform moves the mark the last
        // 0.5 px. Chromium draws an image box at a half-pixel layout place on
        // the next whole pixel, so `padding: 14.5px` showed the mark at
        // (15, 65); a transform is not snapped (measured at 2x and 8x).
        style={{
          left: 0,
          top: 0,
          width: 34,
          height: 50,
          padding: "14px 0 0 14px",
          // It steps aside while the search field fills the bar.
          ...asideStyle(open, -1, 2),
        }}
      >
        <XdIcon name="back" style={{ transform: "translate(0.5px, 0.5px)" }} />
      </button>
      {/* The store's logo: the page's title for search engines and screen readers. */}
      <h1
        className="absolute m-0 motion-reduce:transition-none"
        style={{ left: 36, top: 68 - 50, ...asideStyle(open, -1, 1) }}
      >
        <StoreMark store={store} h={15} maxW={100} eager />
      </h1>
      <div
        className="absolute flex items-center"
        style={{ right: 10, top: 65 - 50, gap: 30 }}
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
          <HeaderMark
            icon="listSort"
            label={t("Sort")}
            testId="demo-listing-sort"
            style={asideStyle(open, 1, 0)}
          />
          <HeaderMark
            icon="listFilter"
            label={t("Filter")}
            testId="demo-listing-filter"
            style={asideStyle(open, 1, 1)}
          />
          <HeaderMark
            icon="listSend"
            label={t("Share")}
            testId="demo-listing-share"
            style={asideStyle(open, 1, 2)}
          />
        </div>
      </div>
      <StoreSearchField search={search} t={t} />
    </header>
  );
}

/** The fade over the bottom half of a category tile (y 312 – 382 in the file). */
const TILE_FADE =
  "linear-gradient(180deg, rgba(0,0,0,0) 13.884%, rgba(0,0,0,0.502) 83.605%)";

/**
 * The category row: a slider with the same behaviour as the sliders on Home
 * (see useSlider in HomeSections): Embla moves the row, so a finger and a
 * mouse can both drag it; it shows a one-time hint, and it moves on by
 * itself while it is in view. Each tile is a slide. Unlike Home's sliders,
 * the row scrolls freely: a swipe does not stop on the next tile.
 */
function Categories({
  t,
  viewportRef,
  nudge,
}: {
  t: T;
  viewportRef: (node: HTMLElement | null) => void;
  nudge: MotionValue<number>;
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
        {LISTING_CATEGORIES.map((c) => (
          <li
            key={c.key}
            data-pw={`demo-listing-category-${c.key}`}
            className="relative shrink-0"
            style={{ width: 100, height: 140 }}
          >
            {/* The hint moves this part, so the photo, its name and its
                frame move together, as one card. If the <li> cut off its own
                insides, each tile would show a white gap during the hint. */}
            <motion.div className="relative w-full h-full overflow-hidden" style={{ x: nudge }}>
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
                className="absolute left-0 right-0"
                style={{ top: 70, height: 70, background: TILE_FADE }}
              />
              <span
                className="absolute left-0 right-0 text-center font-normal whitespace-nowrap"
                style={{
                  top: textTop(131, 13),
                  fontSize: 13,
                  lineHeight: `${lineBox(13)}px`,
                  color: c.color,
                }}
              >
                {t(c.key)}
              </span>
              <Stroke color={C.grey} width={0.3} />
            </motion.div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The 15 px pill under a product's name, 9 px words; its mark (if any) 6 px in. */
function Badge({ badge, t }: { badge: ProductBadge; t: T }) {
  const look = BADGE[badge.kind];
  let words: React.ReactNode;
  if (badge.kind === "bag") {
    words = (
      <Weighted
        text={t("{count} item {size} in your bag")}
        values={{ count: String(badge.count), size: badge.size }}
        bold={["count", "size"]}
      />
    );
  } else if (badge.kind === "best") {
    words = (
      <>
        {/* The file draws the space after "price" in Bold too. */}
        <span className="font-bold">{t("! Best price")} </span>
        <Weighted
          text={t("last {days} days!")}
          values={{ days: String(badge.days) }}
          medium={["days"]}
        />
      </>
    );
  } else {
    words = (
      <>
        <span className="font-bold">{t("Flash Deal")} | </span>
        {t("{n}d").replace("{n}", String(badge.days))} | {badge.time}
      </>
    );
  }
  return (
    <p
      data-pw={`demo-listing-badge-${badge.kind}`}
      className="relative block w-fit m-0 font-normal whitespace-nowrap"
      style={{
        height: 15,
        minWidth: look.minW,
        paddingLeft: look.textAt,
        paddingRight: 6,
        paddingTop: 2,
        borderRadius: look.radius,
        background: look.bg,
        color: look.ink,
        fontSize: 9,
        lineHeight: `${lineBox(9)}px`,
      }}
    >
      {badge.kind === "bag" && (
        <XdIcon name="listBag" className="absolute" style={{ left: 6, top: 2 }} />
      )}
      {badge.kind === "flash" && (
        <XdIcon name="listFlash" className="absolute" style={{ left: 6, top: 2 }} />
      )}
      {words}
    </p>
  );
}

/** The top of the labels' row in the footer: y 738 on the file, under the photo. */
const LABELS_TOP = 738 - 384 - PHOTO.h;

/** The card's labels: 15 px pills that take turns (LabelTurns). */
function Labels({ badges, t }: { badges: readonly ProductBadge[]; t: T }) {
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
  product: DemoProduct,
  /** Shows a colour on the card (the sheet calls it when a colour is tapped). */
  pick: (index: number) => void,
) => void;

/** Starts loading the first photos of a product's page, once per colour. */
const warmedProducts = new Set<string>();
function warmProduct(product: DemoProduct, colorIndex: number) {
  const key = `${product.id}:${colorIndex}`;
  if (warmedProducts.has(key)) return;
  warmedProducts.add(key);
  for (const src of productFirstImages(product, colorIndex)) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}

/** Starts loading the first photo of every colour of a product, once. */
const warmedColors = new Set<string>();
function warmColors(product: DemoProduct) {
  if (warmedColors.has(product.id)) return;
  warmedColors.add(product.id);
  for (const color of product.colors) {
    const img = new Image();
    img.decoding = "async";
    img.src = color.images[0];
  }
}

function ProductCard({
  product,
  store,
  index,
  appear,
  onOpenColors,
  t,
}: {
  product: DemoProduct;
  store: DemoStore;
  index: number;
  /** Set on a card a later page adds: its place in that page, for a small delay. */
  appear?: number;
  onOpenColors: OpenColors;
  t: T;
}) {
  const { navigate, locale } = useDemoNav();
  const [colorIndex, setColorIndex] = useState(product.selected);
  const color = product.colors[colorIndex];
  const name = product.name.map((part) => t(part)).join(" . ");
  // The first row is what the page opens on: load it first.
  const first = index < 2;
  const page = productScreen(store.slug, product.id);
  /**
   * A tap on the card opens the product's page, which slides in as one Home
   * slide, the same as a store's page from Home (Demo1Shell). The colour dots and the add button keep their own taps, and
   * a swipe on the photos is not a tap (the slider stops that click). A click
   * with a modifier on the name's link is left to the browser (a new tab).
   */
  const open = (e: React.MouseEvent<HTMLElement>) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
      return;
    if ((e.target as Element).closest("button")) return;
    e.preventDefault();
    openProductInColor(product.id, colorIndex);
    navigate(page, 1, e.currentTarget);
  };
  /** Starts loading the page's first photos while the finger is down, before the tap ends. */
  const warm = () => warmProduct(product, colorIndex);
  return (
    <motion.article
      data-pw={`demo-listing-product-${product.id}`}
      data-color={colorIndex}
      className="relative flex flex-col min-w-0 bg-white cursor-pointer [-webkit-tap-highlight-color:transparent]"
      onClick={open}
      onPointerDown={warm}
      // The cards in the HTML are there at once; only added cards move.
      initial={appear === undefined ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      // Two cards share a row; the right one comes 50 ms after the left one.
      transition={{ ...APPEAR, delay: ((appear ?? 0) % 2) * 0.05 }}
    >
      {/* The card's line is drawn first; the photo lies over its top. */}
      <Stroke color="#D3D3D3" width={0.3} />
      <div className="relative w-full" style={{ aspectRatio: `${PHOTO.w} / ${PHOTO.h}` }}>
        {/* A new colour is a new slider, on its first photo. */}
        <ColorPhotos
          key={colorIndex}
          color={color}
          alt={`${store.name} ${name}`}
          eager={first}
        />
        <PhotoGlow />
        <Stroke color={product.line} width={0.5} />
        <SwatchPicker
          colors={product.colors}
          selected={colorIndex}
          onSelect={setColorIndex}
          onOpen={() => onOpenColors(product, setColorIndex)}
          onTouch={() => warmColors(product)}
          t={t}
        />
      </div>

      <div className="relative w-full shrink-0" style={{ height: FOOTER_H }}>
        <CardLogo store={store} />
        <ProductName product={product} href={hrefFor(locale, page)} t={t} />
        <Labels badges={[product.badge, ...(product.labels ?? [])]} t={t} />
        <PricePill product={product} t={t} />
        <AddButton product={product} t={t} />
      </div>
    </motion.article>
  );
}

/** A grey card of the same size, shown while the next page "loads". */
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
        <span className={`absolute ${bar}`} style={{ left: 12, top: 8, width: 40, height: 11 }} />
        <span className={`absolute ${bar}`} style={{ left: 12, top: 26, width: "60%", height: 11 }} />
        <span className={`absolute ${bar}`} style={{ left: 12, top: 43, width: 100, height: 15 }} />
        <span className={`absolute ${bar}`} style={{ left: 12, top: 62, width: 50, height: 18 }} />
      </div>
    </div>
  );
}

/** How long a "next page" takes, as a quick real request would. */
const PAGE_LOAD_MS = 900;

/** How far under the screen the end of the list may be when the next page starts to load. */
const LOAD_AHEAD = "0px 0px 800px 0px";

/**
 * Paging, as a shop app does it: when the end of the list comes within
 * LOAD_AHEAD of the screen, the next page "loads" for PAGE_LOAD_MS. Its
 * photos start to download at once, so they are mostly there when the
 * cards come in. If the end is still near after that, the next page loads
 * too. Nothing loads after the last page.
 */
function usePages(enabled: boolean) {
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const done = pages >= LISTING_PAGES;

  useEffect(() => {
    const node = end.current;
    if (!enabled || !node || done || loading) return;
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setLoading(true);
      },
      { rootMargin: LOAD_AHEAD },
    );
    watch.observe(node);
    return () => watch.disconnect();
  }, [enabled, done, loading]);

  useEffect(() => {
    if (!loading) return;
    for (const product of listingPage(pages + 1)) {
      const img = new Image();
      img.decoding = "async";
      img.src = product.image;
    }
    const wait = setTimeout(() => {
      setPages((n) => n + 1);
      setLoading(false);
    }, PAGE_LOAD_MS);
    return () => clearTimeout(wait);
  }, [loading, pages]);

  return { pages, loading, done, end };
}

/** The cards drawn on the tap: two rows, more than a phone's screen shows under the banner. */
const FIRST_CARDS = 4;

export default function ListingScreen({ slug }: { slug: string }) {
  // Labels in Apple's title style, messages in sentence style (demoCase).
  const { t, body } = useDemoCase();
  // Free: a swipe goes as far as the finger throws it, not one tile.
  const categories = useSlider({ free: true });
  const settled = useSettled();
  // The next page loads only once the whole first page is there.
  const { pages, loading, done, end } = usePages(settled);
  const calm = useReducedMotion();
  // The colour sheet: the product it shows stays while the sheet slides out.
  const [colors, setColors] = useState<{
    product: DemoProduct;
    pick: (index: number) => void;
  } | null>(null);
  const [colorsOpen, setColorsOpen] = useState(false);
  const store = storeBySlug(slug);
  if (!store) return null;
  const openColors: OpenColors = (product, pick) => {
    setColors({ product, pick });
    setColorsOpen(true);
  };
  const shown = Array.from({ length: pages }, (_, p) =>
    p === 0 && !settled ? listingPage(1).slice(0, FIRST_CARDS) : listingPage(p + 1),
  );
  return (
    <ScreenPage
      testId="demo-listing"
      bg={C.white}
      header={<Header store={store} t={t} />}
      scrollTop={HEADER_BOTTOM}
      contentHeight={BOARD_H}
      // The tab bar shows on this page too; the last cards keep room above it.
      tabBar
      // A long list: the header leaves on a scroll down and comes back on any scroll up.
      hideHeadOnScroll
      // The colour sheet blurs the page behind it (`Home Page – 54`).
      glass={colorsOpen ? COLOR_GLASS : undefined}
    >
      <BrandCard
        t={t}
        brand={store.name}
        shown={store.shown}
        logo={store.logo}
        centreAt={109}
        capitalize
        nameMark
        testId="demo-listing-banner"
        style={{ width: "100%" }}
      />
      <Categories t={t} viewportRef={categories.viewportRef} nudge={categories.nudge} />
      <section
        aria-label={store.name}
        aria-busy={loading}
        data-pw="demo-listing-products"
        className="grid w-full"
        style={{ gridTemplateColumns: "1fr 1fr", gap: GAP, marginTop: GAP }}
      >
        {shown.map((page, p) =>
          page.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              store={store}
              index={p * page.length + i}
              // Cards of the first page are in the HTML; later ones come in.
              appear={p === 0 || calm ? undefined : i}
              onOpenColors={openColors}
              t={t}
            />
          )),
        )}
        {loading &&
          Array.from({ length: 4 }, (_, i) => <SkeletonCard key={`skeleton-${i}`} />)}
      </section>
      {/* What the list is doing, for screen readers. */}
      <p role="status" className="sr-only">
        {loading ? body("Loading more products") : ""}
      </p>
      <div ref={end} aria-hidden="true" style={{ height: 1 }} />
      {done && (
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
          store={store}
          onPick={colors.pick}
        />
      )}
    </ScreenPage>
  );
}
