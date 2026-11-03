"use client";

import React, { useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import type { XdIconName } from "../../DemoApp/xdIcons";
import type { DemoKey } from "../../DemoApp/demoKeys";
import {
  GALLERY_PHOTO,
  PRODUCT_STATS,
  RECOMMEND_SHARE,
  REVIEWER,
  SIZE_VOTES,
  colorTileOf,
  galleryOf,
  openColorOf,
  gallerySrcSet,
  titleWords,
  videoPosterOf,
} from "../../DemoApp/demoProduct";
import {
  productById,
  storeBySlug,
  type DemoProduct,
  type DemoStore,
} from "../../DemoApp/demoStores";
import { useDemoNav } from "../Demo1Shell";
import { C, fill, lineBox, paraTop, textTop } from "../demo1Layout";
import { ScreenPage, Stroke } from "../ui";
import { PhotoGlow, StoreMark, Weighted, type T } from "./ListingParts";
import { useSettled } from "./useSettled";
import { ROW_HINT_CLASS, useRowHint } from "./useRowHint";
import { useDragScroll } from "./useDragScroll";
import { LikeHeart, useLike } from "./LikeHeart";

/**
 * A product's page — XD `Home Page – 49` (430 x 2383), opened from a product
 * card on a store's page at /[lang]/demo/store/<slug>/<product id>.
 *
 * Top to bottom, in design px (y on the artboard):
 *
 *  - The header, y 50 – 100: the back mark at (15, 65), the store's logo at
 *    (36, 68), 15 tall, and three 20 x 20 marks at x 318, 358 and 398
 *    (two alerts and "more").
 *  - The gallery, y 102 – 566: 319 x 464 photos, 2 apart, in a row that
 *    scrolls sideways. The last photo has round right corners (15). Each
 *    photo has a 0.3 px line and a soft white glow inside its top. A video
 *    card (121 x 170, round 15, a dark shadow) lies over the gallery at
 *    (297, 384), with a close mark on its top right corner.
 *  - The product, y 580 – 685: the logo and the verified mark, the name
 *    (13 Regular), the heart, two lines of text (11, 18 apart), and a row
 *    that scrolls sideways: the stars, the raters, the views, "Good Quality",
 *    the buyers that recommend it and the country.
 *  - Two rows of pills (18 tall, round 6): the price and trend badges at
 *    y 699, and the shipping pills at y 731 (a row that scrolls sideways).
 *  - The colours, y 761: a grey chip, then a 70 x 98 tile for each colour.
 *    A tap on a tile shows that colour's photos in the gallery.
 *  - "Product information" and "Shipping & Delivery": dark chips, with
 *    lists under them; the four shipping promises; three blue trust pills.
 *  - The reviews, y 1365: a chip, three tabs, and a row of 386 x 111 cards.
 *  - The buyers' votes, y 1592: recommend or not (a green and orange bar),
 *    and the size (three bars).
 *  - The questions, y 1741: a chip and a row of 386 x 222 cards.
 *  - "Need help ? Start Chat about this product !", y 2001: a blue button.
 *
 * Every block keeps the file's distance to the block above it, so a longer
 * translation that takes one more line moves the blocks under it down and
 * nothing overlaps. Widths follow the screen like the store page: a block
 * keeps the file's distance to the screen's edges. The rows that do not fit
 * a small phone scroll sideways.
 *
 * Server rendering: the page is the same HTML on the server and in the
 * browser (no clock, no random numbers, no window read while rendering), so
 * React hydrates it as it is. Opened by a tap, the part under the screen's
 * first view is drawn just after the card has grown into the page (see
 * useSettled in ListingScreen); from the server it is all in the HTML.
 */

/** The file's height for this board; the page is at least this tall. */
const BOARD_H = 2383;

/** Design y where the header ends and the page begins. */
const HEADER_BOTTOM = 100;

/** The dark of the file (#1D1D1D) and the grey of its small dates. */
const INK = C.ink;
const DATE_GREY = C.grey;

/** One line of 11 px text: a line box that puts the baseline where the file does. */
const LINE_11 = { fontSize: 11, lineHeight: `${lineBox(11)}px` } as const;
const LINE_9 = { fontSize: 9, lineHeight: `${lineBox(9)}px` } as const;

/**
 * A sideways row with no scroll bar, that the page still scrolls up and down
 * over. Each row shows the slider hint once (useRowHint), so a person sees
 * that it scrolls.
 */
const ROW_SCROLL = `flex w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${ROW_HINT_CLASS}`;

/**
 * The marks of a translated line: `<b>` Bold, `<m>` Medium, `<a>` the blue of
 * a link, `<c>` the blue in Medium. `{name}` is replaced by `values.name`.
 * The translations keep the marks, so each language puts the weights on its
 * own words.
 */
const MARK = /<(b|m|a|c)>([\s\S]*?)<\/\1>/g;

function Rich({
  text,
  values,
}: {
  text: string;
  values?: Record<string, string | number>;
}) {
  let line = text;
  for (const [name, value] of Object.entries(values ?? {}))
    line = line.split(`{${name}}`).join(String(value));
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(MARK)) {
    const at = match.index ?? 0;
    if (at > last) parts.push(line.slice(last, at));
    const tag = match[1];
    parts.push(
      <span
        key={at}
        className={tag === "b" ? "font-bold" : tag === "m" || tag === "c" ? "font-medium" : undefined}
        style={tag === "a" || tag === "c" ? { color: C.blue } : undefined}
      >
        {match[2]}
      </span>,
    );
    last = at + match[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  // A `<bdi>`, as on Home (HomeSections): the page stays left to right in
  // every language, and the line takes its direction from its first letter,
  // so an Arabic line with numbers and Latin words in it keeps its order.
  return <bdi>{parts}</bdi>;
}

/**
 * One header mark: the 20 x 20 icon in a 50 x 50 target round it (the
 * padding is taken back with a negative margin, so the icons stay 20 px apart
 * as in the file). They do nothing yet, like the store page's marks.
 */
function HeaderMark({ icon, label, testId }: { icon: XdIconName; label: string; testId: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      data-pw={testId}
      className="relative shrink-0 cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
      style={{ width: 50, height: 50, padding: 15, margin: -15 }}
    >
      <XdIcon name={icon} />
    </button>
  );
}

function Header({ store, t }: { store: DemoStore; t: T }) {
  const { back } = useDemoNav();
  return (
    <header className="relative w-full" style={{ height: HEADER_BOTTOM - 50, background: C.white }}>
      {/* The same back mark as the store page: (15, 65), in a target as tall as the header. */}
      <button
        type="button"
        aria-label={t("Back")}
        data-pw="demo-product-back"
        onClick={back}
        className="absolute flex items-start cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
        style={{ left: 0, top: 0, width: 34, height: 50, padding: "14px 0 0 14px" }}
      >
        <XdIcon name="back" style={{ transform: "translate(0.5px, 0.5px)" }} />
      </button>
      <div className="absolute" style={{ left: 36, top: 68 - 50 }}>
        <StoreMark store={store} h={15} maxW={100} eager />
      </div>
      <div className="absolute flex items-center" style={{ right: 12, top: 65 - 50, gap: 20 }}>
        <HeaderMark icon="productBellPurple" label={t("Price alert")} testId="demo-product-price-alert" />
        <HeaderMark icon="productBellYellow" label={t("Stock alert")} testId="demo-product-stock-alert" />
        <HeaderMark icon="productMore" label={t("More options")} testId="demo-product-more" />
      </div>
    </header>
  );
}

/** The last photo's line: 0.3 px inside a box with round right corners (15), as the file draws it. */
function LastPhotoLine() {
  const { w, h } = GALLERY_PHOTO;
  const r = 15;
  const i = 0.15;
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
    >
      <path
        d={`M${i},${i} H${w - r} A${r - i},${r - i} 0 0 1 ${w - i},${r} V${h - r} A${r - i},${r - i} 0 0 1 ${w - r},${h - i} H${i} Z`}
        fill="none"
        stroke={C.line}
        strokeWidth={0.3}
      />
    </svg>
  );
}

/** The video card over the gallery, and its close mark. Closed, it fades out. */
function VideoCard({ poster, t }: { poster: string; t: T }) {
  const [open, setOpen] = useState(true);
  return (
    <div
      data-pw="demo-product-video"
      data-open={open}
      className="absolute"
      style={{
        // The card's box in the file: (297, 384), 121 x 170; 12 px from the right edge.
        right: 12,
        top: 384 - 102,
        width: 121,
        height: 170,
        opacity: open ? 1 : 0,
        transform: open ? "none" : "scale(0.94)",
        transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
        pointerEvents: open ? undefined : "none",
      }}
    >
      <div
        role="img"
        aria-label={t("Video")}
        className="relative w-full h-full overflow-hidden"
        style={{ borderRadius: 15, boxShadow: "0 0 10px rgba(29,29,29,0.204)" }}
      >
        <img
          src={poster}
          alt=""
          width={121}
          height={170}
          draggable={false}
          decoding="async"
          className="block w-full h-full object-cover select-none"
        />
        <PhotoGlow />
        <Stroke color={C.line} width={0.5} radius={15} />
        <XdIcon name="productFilm" className="absolute" style={{ left: 6, top: 530 - 384 }} />
      </div>
      {/* The close mark (400, 375), 18 x 18: on the card's top right corner, in a 44 px target. */}
      <button
        type="button"
        aria-label={t("Close video")}
        data-pw="demo-product-video-close"
        onClick={() => setOpen(false)}
        className="absolute cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
        style={{ right: -13, top: 375 - 384 - 13, width: 44, height: 44, padding: 13 }}
      >
        <XdIcon name="productClose" />
      </button>
    </div>
  );
}

function Gallery({
  photos,
  alt,
  t,
}: {
  photos: readonly string[];
  alt: string;
  t: T;
}) {
  const { w, h } = GALLERY_PHOTO;
  const hint = useRowHint<HTMLUListElement>();
  return (
    <div className="relative w-full shrink-0" style={{ marginTop: 102 - HEADER_BOTTOM, height: h }}>
      {/* A new colour is a new row, at its first photo. */}
      <ul
        key={photos.join()}
        ref={hint}
        data-pw="demo-product-gallery"
        aria-label={t("Photos")}
        className={`${ROW_SCROLL} h-full p-0 list-none`}
        style={{ gap: 2, scrollSnapType: "x mandatory", overscrollBehaviorX: "contain" }}
      >
        {photos.map((src, i) => {
          const last = i === photos.length - 1;
          return (
            <li
              key={src}
              className="relative shrink-0 overflow-hidden"
              style={{
                width: w,
                height: h,
                scrollSnapAlign: "start",
                borderRadius: last ? "0 15px 15px 0" : undefined,
              }}
            >
              <img
                src={src}
                srcSet={gallerySrcSet(src)}
                sizes={`${w}px`}
                // The other photos show the same product; one name is enough.
                alt={i === 0 ? alt : ""}
                width={w}
                height={h}
                draggable={false}
                loading={i < 2 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                decoding="async"
                className="block w-full h-full object-cover select-none"
              />
              <PhotoGlow />
              {last ? <LastPhotoLine /> : <Stroke color={C.line} width={0.3} />}
            </li>
          );
        })}
      </ul>
      <VideoCard poster={videoPosterOf(photos)} t={t} />
    </div>
  );
}

/**
 * A dark or grey chip (22 tall, round 6): the mark 6 px in and 4 down, the
 * words at x 26. The file's width is the minimum, and the right padding is 3,
 * not 6, for the reason given at Pill.
 */
function Chip({
  icon,
  bg,
  ink,
  minW,
  children,
  testId,
}: {
  icon: XdIconName;
  bg: string;
  ink: string;
  minW: number;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <h2
      data-pw={testId}
      className="relative shrink-0 font-normal whitespace-nowrap"
      style={{
        height: 22,
        minWidth: minW,
        padding: "4px 3px 0 26px",
        borderRadius: 6,
        background: bg,
        color: ink,
        ...LINE_11,
      }}
    >
      <XdIcon name={icon} className="absolute" style={{ left: 6, top: 4 }} />
      {children}
    </h2>
  );
}

/** The help mark after a chip (the file's "?" bubble). It explains nothing yet. */
function HelpMark({ left, t }: { left: number; t: T }) {
  return (
    <span role="img" aria-label={t("Help")} className="block shrink-0" style={{ marginLeft: left, marginTop: 4 }}>
      <XdIcon name="productHelp" />
    </span>
  );
}

/**
 * A pill of the badge and shipping rows: 18 tall, round 6, the mark 6 px in
 * and 2 down, the words at x 26. The file's width is the minimum. The browser
 * draws some lines up to 1% wider than XD, so the right padding is 3, not the
 * file's 6: the English pills keep the file's width, and a longer
 * translation still grows the pill.
 */
function Pill({
  icon,
  bg,
  ink,
  minW,
  children,
  testId,
}: {
  icon: XdIconName;
  bg: string;
  ink: string;
  minW: number;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <li
      data-pw={testId}
      className="relative shrink-0 font-normal whitespace-nowrap"
      style={{
        height: 18,
        minWidth: minW,
        padding: "2px 3px 0 26px",
        borderRadius: 6,
        background: bg,
        color: ink,
        ...LINE_11,
      }}
    >
      <XdIcon name={icon} className="absolute" style={{ left: 6, top: 2 }} />
      {children}
    </li>
  );
}

/**
 * A row that scrolls sideways: the file's first item at x `left`, the same
 * room at the end.
 *
 * A row of `cards` (the reviews and the questions) also stops on a card: a
 * swipe never leaves a card cut in half at the left edge (CSS snap, each card
 * at `left` px from the edge). And a mouse can drag it (useDragScroll), since
 * on a PC the row has no scroll bar and the wheel scrolls the page.
 */
function SideRow({
  left,
  gap,
  mt,
  h,
  label,
  testId,
  cards = false,
  children,
}: {
  left: number;
  gap: number;
  mt: number;
  h: number;
  label?: string;
  testId?: string;
  cards?: boolean;
  children: React.ReactNode;
}) {
  const hint = useRowHint<HTMLUListElement>();
  const drag = useDragScroll<HTMLUListElement>();
  return (
    <ul
      ref={(el) => {
        hint(el);
        if (cards) drag(el);
      }}
      aria-label={label}
      data-pw={testId}
      className={`${ROW_SCROLL} shrink-0 list-none ${cards ? "relative [&>*]:[scroll-snap-align:start] [@media(pointer:fine)]:cursor-grab" : ""}`}
      style={{
        marginTop: mt,
        height: h,
        gap,
        padding: `0 ${left}px`,
        overscrollBehaviorX: "contain",
        ...(cards ? { scrollSnapType: "x mandatory", scrollPaddingInline: left } : null),
      }}
    >
      {children}
    </ul>
  );
}

/** The 11 px text after a mark in the rating row, `ml` px after the item before it. */
function RowText({ ml, children }: { ml: number; children: React.ReactNode }) {
  return (
    <span className="block shrink-0 font-normal whitespace-nowrap" style={{ marginLeft: ml, ...LINE_11, color: INK }}>
      {children}
    </span>
  );
}

function RowMark({ ml, icon }: { ml: number; icon: XdIconName }) {
  return <XdIcon name={icon} className="shrink-0" style={{ marginLeft: ml }} />;
}

/**
 * The rating row, y 671 – 685. The file places each item by hand, so the
 * gaps are its own: 6 px after a mark, and 7, 5, 4 and 12 px before the bars.
 */
function RatingRow({ t }: { t: T }) {
  const hint = useRowHint<HTMLDivElement>();
  return (
    <div
      ref={hint}
      data-pw="demo-product-rating"
      className={`${ROW_SCROLL} shrink-0 items-start`}
      style={{ marginTop: 671 - 659, height: 14, padding: "0 14px", overscrollBehaviorX: "contain" }}
    >
      {/* The stars' box takes in half of their 0.5 px line on each side. */}
      <span role="img" aria-label={`${PRODUCT_STATS.stars}/5`} className="block shrink-0" style={{ margin: -0.25 }}>
        <XdIcon name="productStars" />
      </span>
      <RowText ml={6}>
        <Rich text={t("<b>{count} </b>buyer Rate")} values={{ count: PRODUCT_STATS.raters }} />
      </RowText>
      <RowText ml={7}>|</RowText>
      <RowMark ml={6} icon="productEye" />
      <RowText ml={6}>{PRODUCT_STATS.views}</RowText>
      <RowText ml={5}>|</RowText>
      <RowMark ml={6} icon="productBadge" />
      <RowText ml={6}>{t("Good Quality")}</RowText>
      <RowText ml={4}>|</RowText>
      <RowMark ml={6} icon="productPeopleGreen" />
      <RowText ml={6}>
        <Rich text={t("<m>recommend it by</m> {count} buyer")} values={{ count: PRODUCT_STATS.recommend }} />
      </RowText>
      <RowText ml={12}>|</RowText>
      <RowMark ml={6} icon="productFlagTr" />
      <RowText ml={6}>{t("made in turkey")}</RowText>
    </div>
  );
}

/** The colour chip and a 70 x 98 tile for each colour. The picked tile has a purple line and the glow. */
function Colors({
  product,
  picked,
  onPick,
  t,
}: {
  product: DemoProduct;
  picked: number;
  onPick: (index: number) => void;
  t: T;
}) {
  const hint = useRowHint<HTMLUListElement>();
  return (
    <>
      <div className="flex items-start shrink-0" style={{ marginTop: 761 - 749, paddingLeft: 14 }}>
        <Chip icon="productPalette" bg="#F4F4F4" ink={INK} minW={118} testId="demo-product-colors-chip">
          <Rich text={t("Available <b>{count}</b> Color")} values={{ count: product.colors.length }} />
        </Chip>
        <HelpMark left={137 - 132} t={t} />
      </div>
      <ul
        ref={hint}
        data-pw="demo-product-colors"
        aria-label={t("Colors")}
        className={`${ROW_SCROLL} shrink-0 list-none`}
        style={{ marginTop: 789 - 783, height: 98, gap: 2, padding: "0 14px 0 40px" }}
      >
        {product.colors.map((color, i) => {
          const on = i === picked;
          return (
            <li key={`${color.name}-${i}`} className="shrink-0">
              <button
                type="button"
                aria-label={t(color.name)}
                aria-pressed={on}
                data-pw={`demo-product-color-${i}`}
                onClick={() => onPick(i)}
                className="relative block p-0 cursor-pointer overflow-hidden [-webkit-tap-highlight-color:transparent]"
                style={{ width: 70, height: 98 }}
              >
                <img
                  src={colorTileOf(color)}
                  alt=""
                  width={70}
                  height={98}
                  draggable={false}
                  decoding="async"
                  className="block w-full h-full object-cover select-none"
                />
                {on && <PhotoGlow />}
                <Stroke color={on ? C.purple : C.line} width={on ? 0.5 : 0.3} />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** A line of a list: the 4 px dot at x 25, the words at x 40, `mt` px under the line above. */
function Bullet({ mt, children }: { mt: number; children: React.ReactNode }) {
  return (
    <li
      className="relative shrink-0 font-normal whitespace-nowrap"
      style={{ marginTop: mt, paddingLeft: 40, color: INK, ...LINE_11 }}
    >
      <span
        aria-hidden="true"
        className="absolute rounded-full"
        style={{ left: 25, top: 5, width: 4, height: 4, background: INK }}
      />
      {children}
    </li>
  );
}

/**
 * One shipping promise: the 14 px mark at x 40, the title (11 Medium) and the
 * text (11 Regular) at x 60. A title or a text of more than one line keeps
 * the file's 16 px between its lines; `iconTop` puts the mark on the title.
 */
function Guarantee({
  mt,
  icon,
  iconTop,
  title,
  titleLine,
  textMt,
  textLine,
  children,
}: {
  mt: number;
  icon: XdIconName;
  iconTop: number;
  title: string;
  titleLine: number;
  textMt: number;
  textLine: number;
  children: React.ReactNode;
}) {
  return (
    <li className="relative shrink-0" style={{ marginTop: mt }}>
      <XdIcon name={icon} className="absolute" style={{ left: 40, top: iconTop }} />
      <h3
        className="font-medium"
        style={{ marginLeft: 60, width: fill(60, 23), fontSize: 11, lineHeight: `${titleLine}px`, color: INK }}
      >
        {title}
      </h3>
      <p
        className="font-normal whitespace-pre-line"
        // The file's box is 350 wide (right 20). XD measures Quicksand a little
        // wider than the browser, so 4 px less breaks the lines where it does
        // ("if" ends line 1 of the delivery guarantee, not "shipping").
        style={{ marginTop: textMt, marginLeft: 60, width: fill(60, 24), fontSize: 11, lineHeight: `${textLine}px`, color: INK }}
      >
        {children}
      </p>
    </li>
  );
}

function Shipping({ t }: { t: T }) {
  return (
    <section aria-label={t("Shipping & Delivery")} className="flex flex-col shrink-0">
      <div className="flex items-start" style={{ marginTop: 1015 - 995, paddingLeft: 14 }}>
        <Chip icon="productRocket" bg={INK} ink="#FCFCFC" minW={131}>
          {t("Shipping & Delivery")}
        </Chip>
        <HelpMark left={151 - 145} t={t} />
      </div>
      <ul className="flex flex-col p-0 list-none">
        <Bullet mt={1045 - 1037}>{t("Expected Shipping & delivery Date")}</Bullet>
      </ul>
      {/* The date pill: (40, 1067), 311 x 18, a 0.3 px purple line; the map pin 6 px from its right end. */}
      <p
        data-pw="demo-product-delivery-date"
        className="relative flex items-start shrink-0 font-normal whitespace-nowrap self-start"
        style={{
          marginTop: 1067 - 1059,
          marginLeft: 40,
          height: 18,
          minWidth: 311,
          padding: "2px 6px 0",
          borderRadius: 6,
          background: "#F8F8F8",
          color: C.purple,
          ...LINE_11,
        }}
      >
        <span>
          <Rich text={t("Monday <m>2.jun </m>| <m>3</m> work days in your hands in <m>Lebanon</m>")} />
        </span>
        <XdIcon name="productPin" className="shrink-0" style={{ marginLeft: "auto", paddingLeft: 6, boxSizing: "content-box" }} />
        <Stroke color={C.purple} width={0.3} radius={6} />
      </p>
      <ul className="flex flex-col p-0 list-none">
        <Guarantee
          mt={1097 - 1085}
          icon="productFastGreen"
          iconTop={0}
          title={t("Free Shipping")}
          titleLine={lineBox(11)}
          textMt={1117 - 1111}
          textLine={lineBox(11)}
        >
          {t("Shipping is completely free without any extras")}
        </Guarantee>
        <Guarantee
          mt={paraTop(1150, 11, 16) - 1131}
          icon="productRefundGreen"
          iconTop={1139 - paraTop(1150, 11, 16)}
          title={t("Delivery guarantee")}
          titleLine={16}
          textMt={paraTop(1170, 11, 16) - (paraTop(1150, 11, 16) + 16)}
          textLine={16}
        >
          <Rich text={t("get a <c>25% Cash refund</c> to your wallet of the product price if shipping is delayed")} />
        </Guarantee>
        <Guarantee
          mt={1201 - (paraTop(1170, 11, 16) + 32)}
          icon="productFastRed"
          iconTop={0}
          title={t("Free Return")}
          titleLine={lineBox(11)}
          textMt={1221 - 1215}
          textLine={lineBox(11)}
        >
          {t("Return is completely free without any extras or conditions")}
        </Guarantee>
        <Guarantee
          mt={paraTop(1254, 11, 16) - 1235}
          icon="productRefundOrange"
          iconTop={1243 - paraTop(1254, 11, 16)}
          title={t("Return guarantee")}
          titleLine={16}
          textMt={paraTop(1274, 11, 16) - (paraTop(1254, 11, 16) + 16)}
          textLine={16}
        >
          <Rich
            text={t(
              "Within <m>3 days</m> after receiving the product, you can return it without conditions or reasons with complete ease and \n<a>get the amount back </a>to your wallet",
            )}
          />
        </Guarantee>
      </ul>
      {/* The trust pills, y 1323: 22 tall, from x 18, 6 apart. */}
      <SideRow left={18} gap={6} mt={1323 - (paraTop(1274, 11, 16) + 48)} h={22} testId="demo-product-trust">
        {(
          [
            ["productShield", "#2C63F7", 107, "Secure Privacy"],
            ["productCard", "#04109F", 141, "Safe & Easy Payment"],
            ["productBag", "#04109F", 134, "purchase protection"],
          ] as const
        ).map(([icon, bg, minW, key]) => (
          <li
            key={key}
            className="relative shrink-0 font-normal whitespace-nowrap"
            style={{ height: 22, minWidth: minW, padding: "4px 3px 0 26px", borderRadius: 6, background: bg, color: "#FCFCFC", ...LINE_11 }}
          >
            <XdIcon name={icon} className="absolute" style={{ left: 6, top: 4 }} />
            {t(key)}
          </li>
        ))}
      </SideRow>
    </section>
  );
}

/**
 * A card's likes, `top` px under the card's top: the 11 px heart at x 8 and
 * the count at x 25. A tap likes the card (LikeHeart). The button reaches
 * 10 px over and under the heart and 8 px past the count, so a finger finds
 * it; it stays clear of the stars at x 123.
 */
function Likes({ top, t }: { top: number; t: T }) {
  const like = useLike();
  return (
    <button
      type="button"
      aria-label={t("Like")}
      aria-pressed={like.liked}
      data-pw="demo-product-card-like"
      onClick={like.toggle}
      className="absolute flex items-start cursor-pointer font-normal [-webkit-tap-highlight-color:transparent]"
      style={{ left: 0, top: top - 10, padding: "10px 8px 10px 8px", color: INK, ...LINE_9 }}
    >
      <LikeHeart liked={like.liked} burst={like.burst} outline="productLove" filled="productLoveFilled" size={11} />
      <span style={{ marginLeft: 25 - 8 - 11 }}>{PRODUCT_STATS.likes}</span>
    </button>
  );
}

/** The card's first lines: the mark or photo, the name, the date, the size and colour, and two lines of text. */
function CardText({
  top,
  name,
  t,
}: {
  /** Where the name's line starts: 8 for the first entry of a card, 119 for the answer. */
  top: number;
  name: React.ReactNode;
  t: T;
}) {
  return (
    <>
      <span className="absolute font-normal whitespace-nowrap" style={{ left: 28, top, ...LINE_11, color: INK }}>
        {name}
      </span>
      {/* The file's date starts at x 349 and ends 7 px from the card's edge;
          held by its end, a longer date in another language stays in the card. */}
      <span className="absolute font-normal whitespace-nowrap" style={{ right: 7, top, ...LINE_11, color: DATE_GREY }}>
        {t("18 feb")}
      </span>
      <span className="absolute font-medium whitespace-nowrap" style={{ left: 8, top: top + 20, ...LINE_11, color: INK }}>
        {t("Medium | Bule")}
      </span>
      <p
        className="absolute font-normal"
        style={{ left: 8, top: top + paraTop(1522, 11, 16) - 1469, width: 369, fontSize: 11, lineHeight: "16px", color: INK }}
      >
        {t("Amazing product I buy it and I saw it is good quality regarding price Amazing product I buy it and I saw it is good quality regardin")}
      </p>
    </>
  );
}

function Avatar({ top }: { top: number }) {
  return (
    <span className="absolute overflow-hidden rounded-full" style={{ left: 8, top, width: 14, height: 14 }}>
      <img src="/assets/demo/product/avatar.webp" alt="" width={14} height={14} draggable={false} decoding="async" className="block w-full h-full select-none" />
      <Stroke color={C.line} width={0.5} radius={7} />
    </span>
  );
}

/** A review card: 386 x 111, round 15, #FCFCFC, a 0.3 px purple line. */
function ReviewCard({ ai, t }: { ai: boolean; t: T }) {
  return (
    <li className="relative shrink-0" style={{ width: 386, height: 111, borderRadius: 15, background: "#FCFCFC" }}>
      {ai ? (
        <XdIcon name="productAi" className="absolute" style={{ left: 8, top: 8 }} />
      ) : (
        <Avatar top={8} />
      )}
      <CardText
        top={8}
        name={ai ? <Rich text={t("<m>AI</m> analysis & summary of all reviews")} /> : <span className="font-medium">{REVIEWER}</span>}
        t={t}
      />
      <Likes top={92} t={t} />
      <span role="img" aria-label={`${PRODUCT_STATS.stars}/5`} className="absolute" style={{ left: 136.75 - 14, top: 91.75 }}>
        <XdIcon name="productStarsSmall" />
      </span>
      <span className="absolute font-normal whitespace-nowrap" style={{ left: 196, top: 92, ...LINE_9, color: INK }}>
        {t("Good quality | Ture size")}
      </span>
      <XdIcon name="productPeopleSmall" className="absolute" style={{ left: 300, top: 92 }} />
      <span className="absolute font-normal whitespace-nowrap" style={{ left: 317, top: 92, ...LINE_9, color: INK }}>
        {t("recommend it")}
      </span>
      <Stroke color={C.purple} width={0.3} radius={15} />
    </li>
  );
}

/** A question card: 386 x 222, round 15, #FCFCFC: the question, a line, and the store's answer. */
function QuestionCard({ store, t }: { store: DemoStore; t: T }) {
  return (
    <li className="relative shrink-0" style={{ width: 386, height: 222, borderRadius: 15, background: "#FCFCFC" }}>
      <Avatar top={8} />
      <CardText top={8} name={<Rich text={t("<b>Q</b> {name}")} values={{ name: REVIEWER }} />} t={t} />
      <Likes top={92} t={t} />
      <span aria-hidden="true" className="absolute" style={{ left: 8.5, top: 111 - 0.25, width: 372, height: 0.5, background: C.line }} />
      <Avatar top={119} />
      <CardText top={119} name={<Rich text={t("<b>a</b> {name}")} values={{ name: store.name }} />} t={t} />
      <Likes top={203} t={t} />
      {/* At x 296 in the file, 11 px from the card's edge: held by its end, as the date. */}
      <span className="absolute font-normal whitespace-nowrap" style={{ right: 11, top: 203, ...LINE_9, color: DATE_GREY }}>
        {t("{n} minute answered").replace("{n}", "13")}
      </span>
    </li>
  );
}

const TABS = [
  { key: "comment", icon: "productComment", left: 42 },
  { key: "Video", icon: "productVideo", left: 184 },
  { key: "Photo", icon: "productPhoto", left: 298 },
] as const satisfies readonly { key: DemoKey; icon: XdIconName; left: number }[];

function Reviews({ t }: { t: T }) {
  const [tab, setTab] = useState(0);
  return (
    <section aria-label={t("by Buyers")} className="flex flex-col shrink-0">
      <div className="flex items-start" style={{ marginTop: 1365 - 1345, paddingLeft: 14 }}>
        <Chip icon="productStory" bg={INK} ink="#FCFCFC" minW={84}>
          {t("by Buyers")}
        </Chip>
        <HelpMark left={104 - 98} t={t} />
      </div>
      <p className="font-normal whitespace-nowrap" style={{ marginTop: 1393 - 1387, paddingLeft: 25, ...LINE_11, color: INK }}>
        {t("comment . Video . Photo . May help you !")}
      </p>
      {/* The tabs, y 1421: the picked one has a 26 px box with a 0.5 px purple line. */}
      <div role="tablist" className="relative w-full shrink-0" style={{ marginTop: 1421 - 1407, height: 26 }}>
        {TABS.map((item, i) => {
          const on = i === tab;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={on}
              data-pw={`demo-product-tab-${item.key.toLowerCase()}`}
              onClick={() => setTab(i)}
              className={`absolute flex items-start cursor-pointer whitespace-nowrap [-webkit-tap-highlight-color:transparent] ${on ? "font-medium" : "font-normal"}`}
              style={{
                left: item.left,
                top: 0,
                height: 26,
                padding: "6px 8px 0 26px",
                borderRadius: 6,
                background: on ? "#FCFCFC" : "transparent",
                color: INK,
                transition: "background-color 0.2s",
                ...LINE_11,
              }}
            >
              <XdIcon name={item.icon} className="absolute" style={{ left: 6, top: 6 }} />
              {t(item.key)}
              <Stroke color={C.purple} width={0.5} radius={6} visible={on} />
            </button>
          );
        })}
      </div>
      <SideRow left={14} gap={4} mt={1461 - 1447} h={111} testId="demo-product-reviews" cards>
        <ReviewCard ai t={t} />
        <ReviewCard ai={false} t={t} />
      </SideRow>
    </section>
  );
}

/** The two votes: who recommends the product, and how its size fits. */
function Votes({ t }: { t: T }) {
  return (
    <>
      <div className="flex shrink-0" style={{ marginTop: 1592 - 1572, paddingLeft: 14 }}>
        <Chip icon="productPeopleDark" bg="#F4F4F4" ink={INK} minW={178}>
          {t("buyers recommend product")}
        </Chip>
      </div>
      {/* The two halves start at x 20 and x 230 (the middle of the screen + 15). */}
      <div className="relative w-full shrink-0" style={{ marginTop: 1622 - 1614, height: 14, color: INK, ...LINE_11 }}>
        <p className="absolute flex items-start whitespace-nowrap" style={{ left: 20, top: 0 }}>
          <XdIcon name="productPeopleGreenRow" />
          <span style={{ marginLeft: 6 }}>
            <Rich text={t("<b>{count} </b>buyer")} values={{ count: PRODUCT_STATS.recommend }} />
          </span>
          <span className="font-bold" style={{ marginLeft: 6 }}>
            {t("recommend it")}
          </span>
        </p>
        <p className="absolute flex items-start whitespace-nowrap" style={{ left: "calc(50% + 15px)", top: 0 }}>
          <XdIcon name="productPeopleOrange" />
          <span style={{ marginLeft: 6 }}>
            <Rich text={t("<b>{count} </b>buyer")} values={{ count: PRODUCT_STATS.notRecommend }} />
          </span>
          <span className="font-bold" style={{ marginLeft: 6 }}>
            {t("don’t recommend it")}
          </span>
        </p>
      </div>
      <div
        role="img"
        aria-label={`${Math.round(RECOMMEND_SHARE * 100)}%`}
        className="relative shrink-0 overflow-hidden"
        style={{ marginTop: 1644 - 1636, marginLeft: 14, width: fill(14), height: 4, borderRadius: 5, background: "#FF6200" }}
      >
        <span className="absolute left-0 top-0 h-full" style={{ width: `${RECOMMEND_SHARE * 100}%`, borderRadius: 5, background: "#068D06" }} />
      </div>

      <div className="flex shrink-0" style={{ marginTop: 1668 - 1648, paddingLeft: 14 }}>
        <Chip icon="productPeopleDark" bg="#F4F4F4" ink={INK} minW={204}>
          {t("buyers reviews on product sizing")}
        </Chip>
      </div>
      {/* Three columns, 130 px wide and 6 apart on a 430 px screen. */}
      <div className="grid shrink-0" style={{ gridTemplateColumns: "1fr 1fr 1fr", columnGap: 6, margin: `${1698 - 1690}px 14px 0` }}>
        {SIZE_VOTES.map((vote) => (
          <p key={vote.key} className="flex items-start font-normal whitespace-nowrap" style={{ height: 14, ...LINE_11, color: INK }}>
            {t(vote.key)}
            <span className="font-bold" style={{ marginLeft: vote.gap }}>
              {vote.share}
            </span>
          </p>
        ))}
      </div>
      <div className="grid shrink-0" style={{ gridTemplateColumns: "1fr 1fr 1fr", columnGap: 6, margin: `${1716 - 1712}px 14px 0` }}>
        {SIZE_VOTES.map((vote) => (
          <span key={vote.key} className="relative block" style={{ height: 5, borderRadius: 5, background: "#FCFCFC" }}>
            <Stroke color={C.line} width={0.5} radius={2.5} />
            <span className="absolute left-0 top-0 h-full" style={{ width: `${vote.fill * 100}%`, borderRadius: 5, background: INK }} />
          </span>
        ))}
      </div>
    </>
  );
}

function Questions({ store, t }: { store: DemoStore; t: T }) {
  return (
    <section aria-label={t("Product FAQ Buyer & Seller")} className="flex flex-col shrink-0">
      <div className="flex items-start" style={{ marginTop: 1741 - 1721, paddingLeft: 14 }}>
        <Chip icon="productQuestion" bg="#F4F4F4" ink={INK} minW={171}>
          {t("Product FAQ Buyer & Seller")}
        </Chip>
        <HelpMark left={190 - 185} t={t} />
      </div>
      <SideRow left={14} gap={4} mt={1771 - 1763} h={222} testId="demo-product-questions" cards>
        <QuestionCard store={store} t={t} />
        <QuestionCard store={store} t={t} />
      </SideRow>
    </section>
  );
}

/** The chat button: (15, 2001), 402 x 38, #388CFF, corners 15 x 13.57 as the file draws them. */
function ChatButton({ t }: { t: T }) {
  const { navigate } = useDemoNav();
  return (
    <button
      type="button"
      data-pw="demo-product-chat"
      onClick={() => navigate("chat")}
      className="flex items-start justify-center shrink-0 cursor-pointer font-normal whitespace-nowrap active:brightness-95 [-webkit-tap-highlight-color:transparent]"
      style={{
        marginTop: 2001 - 1993,
        marginLeft: 15,
        width: fill(15, 13),
        height: 38,
        paddingTop: 2013 - 2001,
        gap: 6,
        borderRadius: "15px / 13.5714px",
        background: C.blue,
        color: C.white,
        ...LINE_11,
      }}
    >
      <XdIcon name="productChat" />
      {/* The file centres the icon and the words on the button: the words run
          from x 116 to 336 (220 px). The browser draws them 218 px wide (XD
          measures Quicksand a little wider), so a centred row would sit 1 px
          to the right. The file's width is the minimum; a longer language
          still centres. */}
      <span className="block text-start" style={{ minWidth: 220 }}>
        {t("Need help ? Start Chat about this product !")}
      </span>
    </button>
  );
}

export default function ProductScreen({ slug, id }: { slug: string; id: string }) {
  const { t } = useDemoNav();
  const settled = useSettled();
  const product = productById(id);
  const store = storeBySlug(slug);
  // The colour the tapped card showed; from the server, the product's own colour.
  const [colorIndex, setColorIndex] = useState(() => openColorOf(id) ?? product?.selected ?? 0);
  if (!product || !store) return null;
  const color = product.colors[colorIndex];
  const photos = galleryOf(product, colorIndex);
  const name = titleWords(product, color).map((word) => t(word));

  return (
    <ScreenPage
      testId="demo-product"
      bg={C.white}
      header={<Header store={store} t={t} />}
      scrollTop={HEADER_BOTTOM}
      contentHeight={BOARD_H}
      // A long page: the header leaves on a scroll down and comes back on a
      // fast scroll up, the same code as the store page (useHeadOnScroll).
      hideHeadOnScroll
    >
      <article className="flex flex-col w-full">
        <Gallery photos={photos} alt={`${store.name} ${name.join(" . ")}`} t={t} />

        {/* The logo and the verified mark, y 580. */}
        <div className="flex items-start shrink-0" style={{ marginTop: 580 - 566, height: 15, paddingLeft: 14, gap: 55 - 14 - 35.66 }}>
          <StoreMark store={store} h={15} maxW={100} />
          <span role="img" aria-label={t("Verified store")} className="block shrink-0">
            <XdIcon name="productVerified" />
          </span>
        </div>

        {/* The name, baseline 616, and the heart at (400, 603). */}
        <div className="relative shrink-0" style={{ marginTop: textTop(616, 13) - 595, height: lineBox(13) }}>
          <h1
            className="font-normal whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ paddingLeft: 14, paddingRight: 14 + 16 + 8, fontSize: 13, lineHeight: `${lineBox(13)}px`, color: INK }}
          >
            {/* All Regular, the dots too (the store page's card has Medium dots). */}
            {name.join(" . ")}
          </h1>
          <LikeButton t={t} />
        </div>

        <p
          className="font-normal shrink-0"
          // The file's box is 390 wide (right 26), but XD measures Quicksand a
          // little wider than the browser and puts "comfortable" on line 2;
          // the browser fits it with 1 px to spare. 4 px less breaks the line
          // where the file does.
          style={{ marginTop: paraTop(636, 11, 18) - 619, marginLeft: 14, width: fill(14, 30), fontSize: 11, lineHeight: "18px", color: INK }}
        >
          {t("Stay cool and chic in this airy women’s summer top, featuring a comfortable fit and fresh seasonal prints")}
        </p>

        <RatingRow t={t} />

        <SideRow left={14} gap={6} mt={699 - 685} h={18} testId="demo-product-badges">
          <Pill icon="productTrendDown" bg="#EFF6FF" ink="#388CFF" minW={151}>
            {/* The file draws the space after "price" in Bold too, as on the store page. */}
            <span className="font-bold">{t("! Best price")} </span>
            <Weighted text={t("last {days} days!")} values={{ days: "3" }} medium={["days"]} />
          </Pill>
          <Pill icon="productTrendFire" bg="#FFF9EF" ink="#FF631A" minW={97}>
            <Rich text={t("<b>Trend </b>color<b> !</b>")} />
          </Pill>
          <Pill icon="productTrendUp" bg="#F0EFFF" ink={C.purple} minW={133}>
            <Rich text={t("<b>Best sell </b>last week<b> !</b>")} />
          </Pill>
        </SideRow>

        <SideRow left={14} gap={6} mt={731 - 717} h={18} testId="demo-product-shipping-pills">
          <Pill icon="productWork" bg="#EFFEFF" ink="#1A84FF" minW={323}>
            <Rich text={t("<b>Fast Packing </b>& today shipping If buy before <m>{time}</m> today")} values={{ time: "13:00" }} />
          </Pill>
          <Pill icon="productBox" bg="#EFFEFF" ink={INK} minW={229}>
            <Rich text={t("<b>in {hours} hours</b> shipping If buy in <m>{minutes} minute</m>")} values={{ hours: 6, minutes: 30 }} />
          </Pill>
          <Pill icon="productShop" bg="#F8F8F8" ink={INK} minW={165}>
            <Rich text={t("<m>just {days} days</m> In your hands")} values={{ days: 3 }} />
          </Pill>
          <Pill icon="productMap" bg="#E8FFED" ink={INK} minW={120}>
            <Rich text={t("<b>2.jun</b> in lebanon")} />
          </Pill>
        </SideRow>

        <Colors product={product} picked={colorIndex} onPick={setColorIndex} t={t} />

        {/* The rest is under the first view: on a tap it comes just after the grow. */}
        {settled && (
          <>
            <section aria-label={t("Product information")} className="flex flex-col shrink-0">
              <div className="flex" style={{ marginTop: 907 - 887, paddingLeft: 14 }}>
                <Chip icon="productInfo" bg={INK} ink={C.white} minW={134}>
                  {t("Product information")}
                </Chip>
              </div>
              <ul className="flex flex-col p-0 list-none">
                <Bullet mt={937 - 929}>
                  <Rich text={t("pattern<m> | Fit Slim</m>")} />
                </Bullet>
                <Bullet mt={959 - 951}>
                  <Rich text={t("Suitable occasions<m> | Birthday</m> <b>.</b> <m>Casual</m> <b>.</b> <m>Business</m>")} />
                </Bullet>
                <Bullet mt={981 - 973}>
                  <Rich text={t("material <m>|</m> <m>polyester</m> <m>97%</m> <b>.</b> <m>elastane</m> <m>3%</m>")} />
                </Bullet>
              </ul>
            </section>
            <Shipping t={t} />
            <Reviews t={t} />
            <Votes t={t} />
            <Questions store={store} t={t} />
            <ChatButton t={t} />
          </>
        )}
      </article>
    </ScreenPage>
  );
}

/** The heart at (400, 603), 16 x 16, in a 44 px target. A tap keeps the product, with the like pop (LikeHeart). */
function LikeButton({ t }: { t: T }) {
  const like = useLike();
  return (
    <button
      type="button"
      aria-label={t("Add to favourites")}
      aria-pressed={like.liked}
      data-pw="demo-product-like"
      onClick={like.toggle}
      className="absolute cursor-pointer [-webkit-tap-highlight-color:transparent]"
      style={{ right: 14 - 14, top: -14, width: 44, height: 44, padding: 14 }}
    >
      <LikeHeart liked={like.liked} burst={like.burst} outline="productHeart" filled="productHeartFilled" size={16} />
    </button>
  );
}
