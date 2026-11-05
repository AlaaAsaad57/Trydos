"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Spinner from "components/global/Spinner";
import ProductRating from "components/Server/product/ProductRating";
import XdIcon from "../../DemoApp/XdIcon";
import type { XdIconName } from "../../DemoApp/xdIcons";
import type { DemoKey } from "../../DemoApp/demoKeys";
import { C, COLUMN_W, fill, lineBox, paraTop, textTop } from "../demo1Layout";
import type {
  AnswerData,
  CardLike,
  ProductPhoto,
  ProductView,
  QuestionCardData,
  ReviewCardData,
  RichLine,
} from "../productData";
import { mirrorFor, usePageDir } from "../rtl";
import { ScreenPage, Stroke } from "../ui";
import type { RowMore } from "../useCardPages";
import { PhotoGlow, StoreMark, Weighted, type T } from "./ListingParts";
import { useSettled } from "./useSettled";
import { ROW_HINT_CLASS, useRowHint } from "./useRowHint";
import { useSlider } from "./HomeSections";
import { LikeHeart, useLike } from "./LikeHeart";

/**
 * A product's page — XD `Home Page – 49` (430 x 2383). It draws the data it
 * is given: `screens/AppProduct.tsx` gives the real product (Stage 7c),
 * `screens/ProductScreen.tsx` gives `/demo` its mock product. It imports no
 * mock file and not the demo shell (A-16).
 *
 * Top to bottom, in design px (y on the artboard):
 *
 *  - The header, y 50 – 100: the back mark at (15, 65), the mark at (36, 68),
 *    15 tall, and three 20 x 20 marks at x 318, 358 and 398 (two alerts and
 *    "more").
 *  - The gallery, y 102 – 566: 319 x 464 photos, 2 apart, in a row that
 *    scrolls sideways. The last photo has round end corners (15). Each photo
 *    has a 0.3 px line and a soft white glow inside its top. A video card
 *    (121 x 170, round 15, a dark shadow) lies over the gallery at (297, 384),
 *    with a close mark on its top corner.
 *  - The product, y 580 – 685: the mark and the verified mark, the name (13
 *    Regular), the heart, the text (11, 18 apart), and a row that scrolls
 *    sideways: the stars, the raters, the views, "Good Quality", the buyers
 *    that recommend it and the country.
 *  - Two rows of pills (18 tall, round 6): the price and trend badges at
 *    y 699, and the shipping pills at y 731 (a row that scrolls sideways).
 *  - The colours, y 761: a grey chip, then a 70 x 98 tile for each colour.
 *    A tap on a tile shows that colour's photos in the gallery.
 *  - "Product information" and "Shipping & Delivery": dark chips, with
 *    lists under them; the four shipping promises; three blue trust pills.
 *  - The reviews, y 1365: a chip, three tabs, and a row of 386 x 111 cards.
 *    The first card is the fixed AI summary (S7c-4, S7c-5).
 *  - The buyers' votes, y 1592: recommend or not (a green and orange bar),
 *    and the size (three bars).
 *  - The questions, y 1741: a chip and a row of 386 x 222 cards. A question
 *    with no answer has only the top half (S7c-6).
 *  - "Need help ? Start Chat about this product !", y 2001: a blue button. On
 *    the real page a tap turns it into the ask field (S7c-7, AskField).
 *
 * The page has no price and no "add to cart" until D-45 (S7c-1).
 *
 * Every block keeps the file's distance to the block above it, so a longer
 * translation that takes one more line moves the blocks under it down and
 * nothing overlaps. A block with no data is left out, and the next block
 * keeps its own distance. Widths follow the screen like the store page: a
 * block keeps the file's distance to the screen's edges. The rows that do not
 * fit a small phone scroll sideways.
 *
 * Every side is a logical one (`insetInlineStart`, `marginInlineStart`), so
 * the page mirrors on `ar` and `ku` from the `dir` of its root (A-13).
 *
 * Server rendering: the page is the same HTML on the server and in the
 * browser (no clock, no random numbers, no window read while rendering), so
 * React hydrates it as it is. Opened by a tap, the part under the screen's
 * first view is drawn just after the page has opened (useSettled); from the
 * server it is all in the HTML.
 */

/** The file's height for this board; the page is at least this tall on `/demo`. */
const BOARD_H = 2383;

/** Design y where the header ends and the page begins. */
const HEADER_BOTTOM = 100;

/** The photo slot of the gallery, in design px. */
const GALLERY_PHOTO = { w: 319, h: 464 } as const;

/** The dark of the file (#1D1D1D) and the grey of its small dates. */
const INK = C.ink;
const DATE_GREY = C.grey;

/** The file's own likes on a card, for the fixed AI card (S7c-4). */
const FIXED_LIKES = "110k";

/** The AI card's stars, as the file draws them (S7c-4). */
const FIXED_STARS = 3;

/** One line of 11 px text: a line box that puts the baseline where the file does. */
const LINE_11 = { fontSize: 11, lineHeight: `${lineBox(11)}px` } as const;
const LINE_9 = { fontSize: 9, lineHeight: `${lineBox(9)}px` } as const;

/**
 * A sideways row with no scroll bar, that the page still scrolls up and down
 * over.
 */
const ROW_SCROLL = "flex w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/**
 * A row that also shows the slider hint once (useRowHint), so a person sees
 * that it scrolls: only the photos and the colours. The label rows and the
 * reviews and questions rows have no hint: on one page, eight rows that each
 * moved by themselves were too much, and their cut-off last item already
 * shows that they scroll.
 */
const HINT_ROW_SCROLL = `${ROW_SCROLL} ${ROW_HINT_CLASS}`;

/**
 * The marks of a translated line: `<b>` Bold, `<m>` Medium, `<a>` the blue of
 * a link, `<c>` the blue in Medium. `{name}` is replaced by `values.name`.
 * The translations keep the marks, so each language puts the weights on its
 * own words.
 */
const MARK = /<(b|m|a|c)>([\s\S]*?)<\/\1>/g;

export function Rich({
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
  // A `<bdi>`, as on Home (HomeSections): the line takes its direction from
  // its first letter, so an Arabic line with numbers and Latin words in it
  // keeps its order.
  return <bdi>{parts}</bdi>;
}

/**
 * One header mark: the 20 x 20 icon in a 50 x 50 target round it (the
 * padding is taken back with a negative margin, so the icons stay 20 px apart
 * as in the file).
 */
function HeaderMark({
  icon,
  label,
  testId,
  onClick,
}: {
  icon: XdIconName;
  label: string;
  testId: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      data-pw={testId}
      onClick={onClick}
      className="relative shrink-0 cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
      style={{ width: 50, height: 50, padding: 15, margin: -15 }}
    >
      <XdIcon name={icon} />
    </button>
  );
}

function Header({
  mark,
  onBack,
  onBell,
  onMore,
  t,
}: {
  mark: ProductView["mark"];
  onBack: () => void;
  onBell?: () => void;
  onMore?: () => void;
  t: T;
}) {
  const dir = usePageDir();
  return (
    <header className="relative w-full" style={{ height: HEADER_BOTTOM - 50, background: C.white }}>
      {/* The same back mark as the store page: (15, 65), in a target as tall as the header. */}
      <button
        type="button"
        aria-label={t("Back")}
        data-pw="demo-product-back"
        onClick={onBack}
        className="absolute flex items-start cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
        style={{ insetInlineStart: 0, top: 0, width: 34, height: 50, paddingTop: 14, paddingInlineStart: 14 }}
      >
        <span className="block" style={{ transform: "translate(0.5px, 0.5px)", ...mirrorFor(dir) }}>
          <XdIcon name="back" />
        </span>
      </button>
      <div className="absolute" style={{ insetInlineStart: 36, top: 68 - 50 }}>
        <StoreMark store={mark} h={15} maxW={100} eager />
      </div>
      <div className="absolute flex items-center" style={{ insetInlineEnd: 12, top: 65 - 50, gap: 20 }}>
        <HeaderMark icon="productBellPurple" label={t("Price alert")} testId="demo-product-price-alert" onClick={onBell} />
        <HeaderMark icon="productBellYellow" label={t("Stock alert")} testId="demo-product-stock-alert" onClick={onBell} />
        <HeaderMark icon="productMore" label={t("More options")} testId="demo-product-more" onClick={onMore} />
      </div>
    </header>
  );
}

/** The last photo's line: 0.3 px inside a box with round end corners (15), as the file draws it. */
function LastPhotoLine() {
  const { w, h } = GALLERY_PHOTO;
  const dir = usePageDir();
  const r = 15;
  const i = 0.15;
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={mirrorFor(dir)}
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

/**
 * The video card over the gallery, and its close mark. Closed, it fades out.
 * `media` is what plays in it. With `onOpen`, a tap on the card opens it.
 */
function VideoCard({ media, onOpen, t }: { media: React.ReactNode; onOpen?: () => void; t: T }) {
  const [open, setOpen] = useState(true);
  return (
    <div
      data-pw="demo-product-video"
      data-open={open}
      className="absolute"
      style={{
        // The card's box in the file: (297, 384), 121 x 170; 12 px from the end edge.
        insetInlineEnd: 12,
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
        role={onOpen ? "button" : "img"}
        aria-label={t("Video")}
        onClick={onOpen}
        className={`relative w-full h-full overflow-hidden ${onOpen ? "cursor-pointer" : ""}`}
        style={{ borderRadius: 15, boxShadow: "0 0 10px rgba(29,29,29,0.204)" }}
      >
        {media}
        <PhotoGlow />
        <Stroke color={C.line} width={0.5} radius={15} />
        <XdIcon name="productFilm" className="absolute" style={{ insetInlineStart: 6, top: 530 - 384 }} />
      </div>
      {/* The close mark (400, 375), 18 x 18: on the card's top corner, in a 44 px target. */}
      <button
        type="button"
        aria-label={t("Close video")}
        data-pw="demo-product-video-close"
        onClick={() => setOpen(false)}
        className="absolute cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
        style={{ insetInlineEnd: -13, top: 375 - 384 - 13, width: 44, height: 44, padding: 13 }}
      >
        <XdIcon name="productClose" />
      </button>
    </div>
  );
}

function Gallery({
  photos,
  alt,
  video,
  onVideo,
  t,
}: {
  photos: readonly ProductPhoto[];
  alt: string;
  video?: React.ReactNode;
  onVideo?: () => void;
  t: T;
}) {
  const { w, h } = GALLERY_PHOTO;
  // The same slider as the store page's category row: a finger and a mouse
  // both drag it, and a swipe scrolls freely. It shows the one-time hint, but
  // never slides by itself.
  const { viewportRef, nudge, pick } = useSlider({ free: true, autoSlide: false });
  const colour = photos.map((photo) => photo.src).join();
  // A new colour starts at its first photo. Embla sees the new photos itself.
  useEffect(() => {
    pick(0);
  }, [colour]);
  return (
    <div className="relative w-full shrink-0" style={{ marginTop: 102 - HEADER_BOTTOM, height: h }}>
      <div
        ref={viewportRef}
        data-pw="demo-product-gallery"
        className={`h-full overflow-hidden ${GRAB}`}
        // The page still scrolls up and down over the photos.
        style={{ touchAction: "pan-y pinch-zoom" }}
      >
        <ul aria-label={t("Photos")} className="flex h-full m-0 p-0 list-none" style={{ gap: 2 }}>
          {photos.map(({ src, srcSet }, i) => {
            const last = i === photos.length - 1;
            return (
              <li key={src} className="relative shrink-0" style={{ width: w, height: h }}>
                {/* The hint moves this part, so the photo, its glow and its
                    line move together. The <li> does not cut off its insides,
                    or each photo would show a white gap during the hint.
                    `product-slider-images`: the old zoom overlay finds the
                    photos by this class (ProductDetailsSlider). */}
                <motion.div
                  className="product-slider-images relative w-full h-full overflow-hidden"
                  style={{
                    x: nudge,
                    ...(last ? { borderStartEndRadius: 15, borderEndEndRadius: 15 } : null),
                  }}
                >
                  <img
                    src={src}
                    srcSet={srcSet}
                    sizes={srcSet ? `${w}px` : undefined}
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
                </motion.div>
              </li>
            );
          })}
        </ul>
      </div>
      {video && <VideoCard media={video} onOpen={onVideo} t={t} />}
    </div>
  );
}

/**
 * A dark or grey chip (22 tall, round 6): the mark 6 px in and 4 down, the
 * words at x 26. The file's width is the minimum, and the end padding is 3,
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
        paddingTop: 4,
        paddingInlineStart: 26,
        paddingInlineEnd: 3,
        borderRadius: 6,
        background: bg,
        color: ink,
        ...LINE_11,
      }}
    >
      <XdIcon name={icon} className="absolute" style={{ insetInlineStart: 6, top: 4 }} />
      {children}
    </h2>
  );
}

/** The help mark after a chip (the file's "?" bubble). It explains nothing yet. */
function HelpMark({ left, t }: { left: number; t: T }) {
  return (
    <span role="img" aria-label={t("Help")} className="block shrink-0" style={{ marginInlineStart: left, marginTop: 4 }}>
      <XdIcon name="productHelp" />
    </span>
  );
}

/**
 * A pill of the badge and shipping rows: 18 tall, round 6, the mark 6 px in
 * and 2 down, the words at x 26. The file's width is the minimum. The browser
 * draws some lines up to 1% wider than XD, so the end padding is 3, not the
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
        paddingTop: 2,
        paddingInlineStart: 26,
        paddingInlineEnd: 3,
        borderRadius: 6,
        background: bg,
        color: ink,
        ...LINE_11,
      }}
    >
      <XdIcon name={icon} className="absolute" style={{ insetInlineStart: 6, top: 2 }} />
      {children}
    </li>
  );
}

/**
 * A row that scrolls sideways: the file's first item at x `left`, the same
 * room at the end. The browser's own scroll moves it.
 */
function SideRow({
  left,
  gap,
  mt,
  h,
  label,
  testId,
  children,
}: {
  left: number;
  gap: number;
  mt: number;
  h: number;
  label?: string;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <ul
      aria-label={label}
      data-pw={testId}
      className={`${ROW_SCROLL} shrink-0 list-none`}
      style={{ marginTop: mt, height: h, gap, paddingBlock: 0, paddingInline: left, overscrollBehaviorX: "contain" }}
    >
      {children}
    </ul>
  );
}

/** A grab hand on a PC, where a mouse drags the row. A finger shows no cursor. */
const GRAB = "[@media(pointer:fine)]:cursor-grab [@media(pointer:fine)]:active:cursor-grabbing";

/**
 * The row of review or question cards: the same slider as the store page's
 * category row (useSlider, Embla). A finger and a mouse both drag it, a swipe
 * scrolls freely, and a drag never likes a card (Embla drops the click after
 * a drag). No hint and no auto slide: the row moves only when the person
 * moves it.
 *
 * `more`: near its end the row reads its next page (S7c-10). New cards never
 * move the row or stop a drag (`keepPlace` in useSlider). The end card stays
 * on the row until the last page is in, and only its inside changes.
 *
 * The first card is `left` px in (the list's start padding). Embla reads the
 * room at the end from the last card's end margin, not from the list's end
 * padding, so the last card has the margin.
 */
function CardRow({
  left,
  gap,
  mt,
  h,
  testId,
  more,
  t,
  children,
}: {
  left: number;
  gap: number;
  mt: number;
  h: number;
  testId: string;
  more?: RowMore;
  t: T;
  children: React.ReactNode;
}) {
  const { viewportRef, slidesChanged } = useSlider({
    free: true,
    hint: false,
    autoSlide: false,
    keepPlace: true,
    // After a failed read the row waits for a tap on its end card.
    onNearEnd: () => {
      if (more && !more.done && !more.failed) more.load();
    },
  });
  const slides = React.Children.count(children) + (more && !more.done ? 1 : 0);
  useEffect(() => {
    slidesChanged();
  }, [slides]);
  return (
    <div
      ref={viewportRef}
      data-pw={testId}
      className={`shrink-0 w-full overflow-hidden ${GRAB}`}
      // The page still scrolls up and down over the row.
      style={{ marginTop: mt, height: h, touchAction: "pan-y pinch-zoom" }}
    >
      <ul
        className="flex h-full m-0 list-none items-start [&>*:last-child]:[margin-inline-end:var(--row-end)]"
        style={{ gap, paddingInlineStart: left, "--row-end": `${left}px` } as React.CSSProperties}
      >
        {children}
        {more && !more.done && <RowEnd more={more} h={h} t={t} />}
      </ul>
    </div>
  );
}

/** The row's end card: a spinner while a page loads, "Load More" after a failed read. */
function RowEnd({ more, h, t }: { more: RowMore; h: number; t: T }) {
  return (
    <li
      data-pw="demo-product-row-end"
      className="flex items-center justify-center shrink-0"
      style={{ width: 96, height: Math.min(h, 111) }}
    >
      {more.failed ? (
        <button
          type="button"
          data-pw="demo-product-row-retry"
          onClick={more.load}
          className="cursor-pointer font-medium whitespace-nowrap active:opacity-60 [-webkit-tap-highlight-color:transparent]"
          style={{ padding: "10px 8px", color: C.blue, ...LINE_11 }}
        >
          {t("Load More")}
        </button>
      ) : (
        <Spinner />
      )}
    </li>
  );
}

/** The 11 px text after a mark in the rating row, `ml` px after the item before it. */
function RowText({ ml, children }: { ml: number; children: React.ReactNode }) {
  return (
    <span className="block shrink-0 font-normal whitespace-nowrap" style={{ marginInlineStart: ml, ...LINE_11, color: INK }}>
      {children}
    </span>
  );
}

function RowMark({ ml, icon }: { ml: number; icon: XdIconName }) {
  return <XdIcon name={icon} className="shrink-0" style={{ marginInlineStart: ml }} />;
}

/**
 * Stars: the file's picture on `/demo` (it draws 3 of 5), the real rating on
 * the real page. `size` and the old row's 4 px gap give the file's width.
 */
function Stars({
  rating,
  picture,
  size,
  useFilePicture,
}: {
  rating: number;
  picture: XdIconName;
  size: number;
  useFilePicture: boolean;
}) {
  return useFilePicture ? <XdIcon name={picture} /> : <ProductRating rating={rating} size={size} />;
}

/**
 * The rating row, y 671 – 685. The file places each item by hand, so the
 * gaps are its own: 6 px after a mark, and 7, 5, 4 and 12 px before the bars.
 * A part with no data is left out with its bar, as on the live page.
 */
function RatingRow({
  stats,
  origin,
  filePicture,
  t,
}: {
  stats: ProductView["stats"];
  origin?: { mark: React.ReactNode; text: string } | null;
  filePicture: boolean;
  t: T;
}) {
  return (
    <div
      data-pw="demo-product-rating"
      className={`${ROW_SCROLL} shrink-0 items-start`}
      style={{ marginTop: 671 - 659, height: 14, paddingInline: 14, overscrollBehaviorX: "contain" }}
    >
      {/* The stars' box takes in half of their 0.5 px line on each side. */}
      <span role="img" aria-label={`${stats.stars}/5`} className="block shrink-0" style={{ margin: -0.25 }}>
        <Stars rating={stats.stars} picture="productStars" size={14.1} useFilePicture={filePicture} />
      </span>
      {stats.raters && (
        <RowText ml={6}>
          <Rich text={t("<b>{count} </b>buyer Rate")} values={{ count: stats.raters }} />
        </RowText>
      )}
      {stats.views && (
        <>
          <RowText ml={7}>|</RowText>
          <RowMark ml={6} icon="productEye" />
          <RowText ml={6}>{stats.views}</RowText>
        </>
      )}
      {stats.quality && (
        <>
          <RowText ml={5}>|</RowText>
          <RowMark ml={6} icon="productBadge" />
          <RowText ml={6}>{t("Good Quality")}</RowText>
        </>
      )}
      {stats.recommend && (
        <>
          <RowText ml={4}>|</RowText>
          <RowMark ml={6} icon="productPeopleGreen" />
          <RowText ml={6}>
            <Rich text={t("<m>recommend it by</m> {count} buyer")} values={{ count: stats.recommend }} />
          </RowText>
        </>
      )}
      {origin && (
        <>
          <RowText ml={12}>|</RowText>
          <span className="block shrink-0" style={{ marginInlineStart: 6 }}>
            {origin.mark}
          </span>
          <RowText ml={6}>{origin.text}</RowText>
        </>
      )}
    </div>
  );
}

/** The colour chip and a 70 x 98 tile for each colour. The picked tile has a purple line and the glow. */
function Colors({
  colors,
  picked,
  onPick,
  t,
}: {
  colors: ProductView["colors"];
  picked: number;
  onPick: (index: number) => void;
  t: T;
}) {
  const hint = useRowHint<HTMLUListElement>();
  return (
    <>
      <div className="flex items-start shrink-0" style={{ marginTop: 761 - 749, paddingInlineStart: 14 }}>
        <Chip icon="productPalette" bg="#F4F4F4" ink={INK} minW={118} testId="demo-product-colors-chip">
          <Rich text={t("Available <b>{count}</b> Color")} values={{ count: colors.length }} />
        </Chip>
        <HelpMark left={137 - 132} t={t} />
      </div>
      <ul
        ref={hint}
        data-pw="demo-product-colors"
        aria-label={t("Colors")}
        className={`${HINT_ROW_SCROLL} shrink-0 list-none`}
        style={{ marginTop: 789 - 783, height: 98, gap: 2, paddingBlock: 0, paddingInlineStart: 40, paddingInlineEnd: 14 }}
      >
        {colors.map((color, i) => {
          const on = i === picked;
          return (
            <li key={`${color.name}-${i}`} className="shrink-0">
              <button
                type="button"
                aria-label={color.name}
                aria-pressed={on}
                data-pw={`demo-product-color-${i}`}
                onClick={() => onPick(i)}
                className="relative block p-0 cursor-pointer overflow-hidden [-webkit-tap-highlight-color:transparent]"
                style={{ width: 70, height: 98 }}
              >
                <img
                  src={color.tile}
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

/**
 * A line of a list: the 4 px dot at x 25, the words at x 40, `mt` px under
 * the line above. `wrap`: a line from the backend may take more than one line.
 */
function Bullet({ mt, wrap = false, children }: { mt: number; wrap?: boolean; children: React.ReactNode }) {
  return (
    <li
      className={`relative shrink-0 font-normal ${wrap ? "" : "whitespace-nowrap"}`}
      style={{ marginTop: mt, paddingInlineStart: 40, paddingInlineEnd: wrap ? 14 : undefined, color: INK, ...LINE_11 }}
    >
      <span
        aria-hidden="true"
        className="absolute rounded-full"
        style={{ insetInlineStart: 25, top: 5, width: 4, height: 4, background: INK }}
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
      <XdIcon name={icon} className="absolute" style={{ insetInlineStart: 40, top: iconTop }} />
      <h3
        className="font-medium"
        style={{ marginInlineStart: 60, width: fill(60, 23), fontSize: 11, lineHeight: `${titleLine}px`, color: INK }}
      >
        {title}
      </h3>
      <p
        className="font-normal whitespace-pre-line"
        // The file's box is 350 wide (right 20). XD measures Quicksand a little
        // wider than the browser, so 4 px less breaks the lines where it does
        // ("if" ends line 1 of the delivery guarantee, not "shipping").
        style={{ marginTop: textMt, marginInlineStart: 60, width: fill(60, 24), fontSize: 11, lineHeight: `${textLine}px`, color: INK }}
      >
        {children}
      </p>
    </li>
  );
}

function Shipping({
  freeShipping,
  returnDays,
  delivery,
  returnText,
  t,
  body,
}: {
  freeShipping: boolean;
  returnDays: number;
  delivery: RichLine;
  returnText: RichLine;
  t: T;
  body: T;
}) {
  return (
    <section aria-label={t("Shipping & Delivery")} className="flex flex-col shrink-0">
      <div className="flex items-start" style={{ marginTop: 1015 - 995, paddingInlineStart: 14 }}>
        <Chip icon="productRocket" bg={INK} ink="#FCFCFC" minW={131}>
          {t("Shipping & Delivery")}
        </Chip>
        <HelpMark left={151 - 145} t={t} />
      </div>
      <ul className="flex flex-col p-0 list-none">
        <Bullet mt={1045 - 1037}>{t("Expected Shipping & delivery Date")}</Bullet>
      </ul>
      {/* The date pill: (40, 1067), 311 x 18, a 0.3 px purple line; the map pin 6 px from its end. */}
      <p
        data-pw="demo-product-delivery-date"
        className="relative flex items-start shrink-0 font-normal whitespace-nowrap self-start"
        style={{
          marginTop: 1067 - 1059,
          marginInlineStart: 40,
          height: 18,
          minWidth: 311,
          paddingTop: 2,
          paddingInline: 6,
          borderRadius: 6,
          background: "#F8F8F8",
          color: C.purple,
          ...LINE_11,
        }}
      >
        <span>
          <Rich text={delivery.text} values={delivery.values} />
        </span>
        <XdIcon
          name="productPin"
          className="shrink-0"
          style={{ marginInlineStart: "auto", paddingInlineStart: 6, boxSizing: "content-box" }}
        />
        <Stroke color={C.purple} width={0.3} radius={6} />
      </p>
      <ul className="flex flex-col p-0 list-none">
        {freeShipping && (
          <>
            <Guarantee
              mt={1097 - 1085}
              icon="productFastGreen"
              iconTop={0}
              title={t("Free Shipping")}
              titleLine={lineBox(11)}
              textMt={1117 - 1111}
              textLine={lineBox(11)}
            >
              {body("Shipping is completely free without any extras")}
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
              <Rich text={body("get a <c>25% Cash refund</c> to your wallet of the product price if shipping is delayed")} />
            </Guarantee>
          </>
        )}
        {returnDays > 0 && (
          <>
            <Guarantee
              mt={1201 - (paraTop(1170, 11, 16) + 32)}
              icon="productFastRed"
              iconTop={0}
              title={t("Free Return")}
              titleLine={lineBox(11)}
              textMt={1221 - 1215}
              textLine={lineBox(11)}
            >
              {body("Return is completely free without any extras or conditions")}
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
              <Rich text={returnText.text} values={returnText.values} />
            </Guarantee>
          </>
        )}
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
            style={{
              height: 22,
              minWidth: minW,
              paddingTop: 4,
              paddingInlineStart: 26,
              paddingInlineEnd: 3,
              borderRadius: 6,
              background: bg,
              color: "#FCFCFC",
              ...LINE_11,
            }}
          >
            <XdIcon name={icon} className="absolute" style={{ insetInlineStart: 6, top: 4 }} />
            {t(key)}
          </li>
        ))}
      </SideRow>
    </section>
  );
}

/** What a card's likes get: `top` px under the card's top, and the like to show. */
export type CardLikesProps = { top: number; like: CardLike; t: T };

/**
 * A card's likes, `top` px under the card's top: the 11 px heart at x 8 and
 * the count at x 25. A tap likes the card (LikeHeart). The button reaches
 * 10 px over and under the heart and 8 px past the count, so a finger finds
 * it; it stays clear of the stars at x 123.
 */
export function LikesView({
  top,
  liked,
  burst,
  count,
  onToggle,
  t,
}: {
  top: number;
  liked: boolean;
  burst: number;
  count: React.ReactNode;
  onToggle: () => void;
  t: T;
}) {
  return (
    <button
      type="button"
      aria-label={t("Like")}
      aria-pressed={liked}
      data-pw="demo-product-card-like"
      onClick={onToggle}
      className="absolute flex items-start cursor-pointer font-normal [-webkit-tap-highlight-color:transparent]"
      style={{ insetInlineStart: 0, top: top - 10, padding: "10px 8px", color: INK, ...LINE_9 }}
    >
      <LikeHeart liked={liked} burst={burst} outline="productLove" filled="productLoveFilled" size={11} />
      <span style={{ marginInlineStart: 25 - 8 - 11 }}>{count}</span>
    </button>
  );
}

/** Likes that only live on the page: the fixed AI card, and every card on `/demo`. */
export function FixedLikes({ top, t }: { top: number; t: T }) {
  const like = useLike();
  return (
    <LikesView top={top} liked={like.liked} burst={like.burst} count={FIXED_LIKES} onToggle={like.toggle} t={t} />
  );
}

/** The card's first lines: the mark or photo, the name, the date, the size and colour, and two lines of text. */
function CardText({
  top,
  name,
  date,
  line,
  text,
}: {
  /** Where the name's line starts: 8 for the first entry of a card, 119 for the answer. */
  top: number;
  name: React.ReactNode;
  date: string;
  line: string;
  text: string;
}) {
  return (
    <>
      <span className="absolute font-normal whitespace-nowrap" style={{ insetInlineStart: 28, top, ...LINE_11, color: INK }}>
        {name}
      </span>
      {/* The file's date starts at x 349 and ends 7 px from the card's edge;
          held by its end, a longer date in another language stays in the card. */}
      <span className="absolute font-normal whitespace-nowrap" style={{ insetInlineEnd: 7, top, ...LINE_11, color: DATE_GREY }}>
        {date}
      </span>
      <span className="absolute font-medium whitespace-nowrap" style={{ insetInlineStart: 8, top: top + 20, ...LINE_11, color: INK }}>
        {line}
      </span>
      {/* Two lines, as the file: a longer text ends in dots. dir="auto": a
          buyer writes in any language, whatever the page's language is. */}
      <p
        dir="auto"
        className="absolute font-normal overflow-hidden"
        style={{
          insetInlineStart: 8,
          top: top + paraTop(1522, 11, 16) - 1469,
          width: 369,
          fontSize: 11,
          lineHeight: "16px",
          color: INK,
          textAlign: "start",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
        }}
      >
        {text}
      </p>
    </>
  );
}

function Avatar({ top, src }: { top: number; src: string }) {
  return (
    <span className="absolute overflow-hidden rounded-full" style={{ insetInlineStart: 8, top, width: 14, height: 14 }}>
      <img src={src} alt="" width={14} height={14} draggable={false} decoding="async" className="block w-full h-full object-cover select-none" />
      <Stroke color={C.line} width={0.5} radius={7} />
    </span>
  );
}

/** The card's last line: the stars, the facts and "recommend it". */
function CardFacts({
  rating,
  facts,
  recommends,
  filePicture,
  t,
}: {
  rating: number;
  facts: string;
  recommends: boolean;
  filePicture: boolean;
  t: T;
}) {
  return (
    <>
      <span role="img" aria-label={`${rating}/5`} className="absolute" style={{ insetInlineStart: 136.75 - 14, top: 91.75 }}>
        <Stars rating={rating} picture="productStarsSmall" size={10.3} useFilePicture={filePicture} />
      </span>
      <span className="absolute font-normal whitespace-nowrap" style={{ insetInlineStart: 196, top: 92, ...LINE_9, color: INK }}>
        {facts}
      </span>
      {recommends && (
        <>
          <XdIcon name="productPeopleSmall" className="absolute" style={{ insetInlineStart: 300, top: 92 }} />
          <span className="absolute font-normal whitespace-nowrap" style={{ insetInlineStart: 317, top: 92, ...LINE_9, color: INK }}>
            {t("recommend it")}
          </span>
        </>
      )}
    </>
  );
}

/** A review card's box: 386 x 111, round 15, #FCFCFC, a 0.3 px purple line. */
function ReviewBox({ children, testId }: { children: React.ReactNode; testId: string }) {
  return (
    <li data-pw={testId} className="relative shrink-0" style={{ width: 386, height: 111, borderRadius: 15, background: "#FCFCFC" }}>
      {children}
      <Stroke color={C.purple} width={0.3} radius={15} />
    </li>
  );
}

/**
 * The AI summary, the first card of the row: the file's own words, on every
 * product (S7c-4, S7c-5). No backend writes such a summary yet.
 */
function AiCard({ filePicture, t, body }: { filePicture: boolean; t: T; body: T }) {
  return (
    <ReviewBox testId="demo-product-ai-card">
      <XdIcon name="productAi" className="absolute" style={{ insetInlineStart: 8, top: 8 }} />
      <CardText
        top={8}
        name={<Rich text={t("<m>AI</m> analysis & summary of all reviews")} />}
        date={t("18 feb")}
        line={t("Medium | Bule")}
        text={body("Amazing product I buy it and I saw it is good quality regarding price Amazing product I buy it and I saw it is good quality regardin")}
      />
      <FixedLikes top={92} t={t} />
      <CardFacts rating={FIXED_STARS} facts={t("Good quality | Ture size")} recommends filePicture={filePicture} t={t} />
    </ReviewBox>
  );
}

function ReviewCard({
  review,
  Likes,
  filePicture,
  t,
}: {
  review: ReviewCardData;
  Likes: React.ComponentType<CardLikesProps>;
  filePicture: boolean;
  t: T;
}) {
  return (
    <ReviewBox testId="demo-product-review-card">
      <Avatar top={8} src={review.avatar} />
      <CardText
        top={8}
        name={<span className="font-medium">{review.name}</span>}
        date={review.date}
        line={review.variant}
        text={review.text}
      />
      <Likes top={92} like={review.like} t={t} />
      <CardFacts
        rating={review.rating}
        facts={review.facts}
        recommends={review.recommends}
        filePicture={filePicture}
        t={t}
      />
    </ReviewBox>
  );
}

/** A question card: 386 x 222, round 15, #FCFCFC: the question, a line, and the seller's answer. */
function QuestionCard({
  question,
  Likes,
  t,
}: {
  question: QuestionCardData;
  Likes: React.ComponentType<CardLikesProps>;
  t: T;
}) {
  const answer: AnswerData | null = question.answer;
  return (
    <li
      data-pw="demo-product-question-card"
      className="relative shrink-0"
      style={{ width: 386, height: answer ? 222 : 111, borderRadius: 15, background: "#FCFCFC" }}
    >
      <Avatar top={8} src={question.avatar} />
      <CardText
        top={8}
        name={<Rich text={t("<b>Q</b> {name}")} values={{ name: question.name }} />}
        date={question.date}
        line={question.variant}
        text={question.text}
      />
      <Likes top={92} like={question.like} t={t} />
      {answer && (
        <>
          <span
            aria-hidden="true"
            className="absolute"
            style={{ insetInlineStart: 8.5, top: 111 - 0.25, width: 372, height: 0.5, background: C.line }}
          />
          <Avatar top={119} src={answer.avatar} />
          <CardText
            top={119}
            name={<Rich text={t("<b>a</b> {name}")} values={{ name: answer.name }} />}
            date={answer.date}
            line={answer.greeting}
            text={answer.text}
          />
          <Likes top={203} like={answer.like} t={t} />
          {answer.minutes !== null && (
            // At x 296 in the file, 11 px from the card's edge: held by its end, as the date.
            <span className="absolute font-normal whitespace-nowrap" style={{ insetInlineEnd: 11, top: 203, ...LINE_9, color: DATE_GREY }}>
              {t("{n} minute answered").replace("{n}", String(answer.minutes))}
            </span>
          )}
        </>
      )}
    </li>
  );
}

const TABS = [
  { key: "comment", icon: "productComment", left: 42 },
  { key: "Video", icon: "productVideo", left: 184 },
  { key: "Photo", icon: "productPhoto", left: 298 },
] as const satisfies readonly { key: DemoKey; icon: XdIconName; left: number }[];

function Reviews({
  reviews,
  more,
  Likes,
  filePicture,
  onSeen,
  t,
  body,
}: {
  reviews: ProductView["reviews"];
  more?: RowMore;
  Likes: React.ComponentType<CardLikesProps>;
  filePicture: boolean;
  onSeen?: () => void;
  t: T;
  body: T;
}) {
  const [tab, setTab] = useState(0);
  const section = useRef<HTMLElement>(null);
  // The reviews are on the page now, not in a sheet a shopper opens, so
  // `view_comments` goes when the block first comes on screen.
  useEffect(() => {
    const el = section.current;
    if (!el || !onSeen) return;
    const seen = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      seen.disconnect();
      onSeen();
    });
    seen.observe(el);
    return () => seen.disconnect();
  }, []);
  return (
    <section ref={section} aria-label={t("by Buyers")} className="flex flex-col shrink-0">
      <div className="flex items-start" style={{ marginTop: 1365 - 1345, paddingInlineStart: 14 }}>
        <Chip icon="productStory" bg={INK} ink="#FCFCFC" minW={84}>
          {t("by Buyers")}
        </Chip>
        <HelpMark left={104 - 98} t={t} />
      </div>
      <p className="font-normal whitespace-nowrap" style={{ marginTop: 1393 - 1387, paddingInlineStart: 25, ...LINE_11, color: INK }}>
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
                insetInlineStart: item.left,
                top: 0,
                height: 26,
                paddingTop: 6,
                paddingInlineStart: 26,
                paddingInlineEnd: 8,
                borderRadius: 6,
                background: on ? "#FCFCFC" : "transparent",
                color: INK,
                transition: "background-color 0.2s",
                ...LINE_11,
              }}
            >
              <XdIcon name={item.icon} className="absolute" style={{ insetInlineStart: 6, top: 6 }} />
              {t(item.key)}
              <Stroke color={C.purple} width={0.5} radius={6} visible={on} />
            </button>
          );
        })}
      </div>
      <CardRow left={14} gap={4} mt={1461 - 1447} h={111} testId="demo-product-reviews" more={more} t={t}>
        <AiCard filePicture={filePicture} t={t} body={body} />
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} Likes={Likes} filePicture={filePicture} t={t} />
        ))}
      </CardRow>
    </section>
  );
}

/** Who recommends the product (a green and orange bar). */
function RecommendVotes({ votes, t }: { votes: NonNullable<ProductView["votes"]>; t: T }) {
  return (
    <>
      <div className="flex shrink-0" style={{ marginTop: 1592 - 1572, paddingInlineStart: 14 }}>
        <Chip icon="productPeopleDark" bg="#F4F4F4" ink={INK} minW={178}>
          {t("buyers recommend product")}
        </Chip>
      </div>
      {/* The two halves start at x 20 and x 230 (the middle of the screen + 15). */}
      <div className="relative w-full shrink-0" style={{ marginTop: 1622 - 1614, height: 14, color: INK, ...LINE_11 }}>
        <p className="absolute flex items-start whitespace-nowrap" style={{ insetInlineStart: 20, top: 0 }}>
          <XdIcon name="productPeopleGreenRow" />
          <span style={{ marginInlineStart: 6 }}>
            <Rich text={t("<b>{count} </b>buyer")} values={{ count: votes.recommend }} />
          </span>
          <span className="font-bold" style={{ marginInlineStart: 6 }}>
            {t("recommend it")}
          </span>
        </p>
        <p className="absolute flex items-start whitespace-nowrap" style={{ insetInlineStart: "calc(50% + 15px)", top: 0 }}>
          <XdIcon name="productPeopleOrange" />
          <span style={{ marginInlineStart: 6 }}>
            <Rich text={t("<b>{count} </b>buyer")} values={{ count: votes.notRecommend }} />
          </span>
          <span className="font-bold" style={{ marginInlineStart: 6 }}>
            {t("don’t recommend it")}
          </span>
        </p>
      </div>
      <div
        role="img"
        aria-label={`${Math.round(votes.share * 100)}%`}
        className="relative shrink-0 overflow-hidden"
        style={{ marginTop: 1644 - 1636, marginInlineStart: 14, width: fill(14), height: 4, borderRadius: 5, background: "#FF6200" }}
      >
        <span
          className="absolute top-0 h-full"
          style={{ insetInlineStart: 0, width: `${votes.share * 100}%`, borderRadius: 5, background: "#068D06" }}
        />
      </div>
    </>
  );
}

/** How the product's size fits (three bars). */
function SizeVotes({ votes, t }: { votes: NonNullable<ProductView["sizeVotes"]>; t: T }) {
  return (
    <>
      <div className="flex shrink-0" style={{ marginTop: 1668 - 1648, paddingInlineStart: 14 }}>
        <Chip icon="productPeopleDark" bg="#F4F4F4" ink={INK} minW={204}>
          {t("buyers reviews on product sizing")}
        </Chip>
      </div>
      {/* Three columns, 130 px wide and 6 apart on a 430 px screen. */}
      <div className="grid shrink-0" style={{ gridTemplateColumns: "1fr 1fr 1fr", columnGap: 6, margin: `${1698 - 1690}px 14px 0` }}>
        {votes.map((vote) => (
          <p key={vote.key} className="flex items-start font-normal whitespace-nowrap" style={{ height: 14, ...LINE_11, color: INK }}>
            {t(vote.key)}
            <span className="font-bold" style={{ marginInlineStart: vote.gap }}>
              {vote.share}
            </span>
          </p>
        ))}
      </div>
      <div className="grid shrink-0" style={{ gridTemplateColumns: "1fr 1fr 1fr", columnGap: 6, margin: `${1716 - 1712}px 14px 0` }}>
        {votes.map((vote) => (
          <span key={vote.key} className="relative block" style={{ height: 5, borderRadius: 5, background: "#FCFCFC" }}>
            <Stroke color={C.line} width={0.5} radius={2.5} />
            <span
              className="absolute top-0 h-full"
              style={{ insetInlineStart: 0, width: `${vote.fill * 100}%`, borderRadius: 5, background: INK }}
            />
          </span>
        ))}
      </div>
    </>
  );
}

function Questions({
  questions,
  more,
  Likes,
  t,
}: {
  questions: ProductView["questions"];
  more?: RowMore;
  Likes: React.ComponentType<CardLikesProps>;
  t: T;
}) {
  const answered = questions.some((question) => question.answer);
  return (
    <section aria-label={t("Product FAQ Buyer & Seller")} className="flex flex-col shrink-0">
      <div className="flex items-start" style={{ marginTop: 1741 - 1721, paddingInlineStart: 14 }}>
        <Chip icon="productQuestion" bg="#F4F4F4" ink={INK} minW={171}>
          {t("Product FAQ Buyer & Seller")}
        </Chip>
        <HelpMark left={190 - 185} t={t} />
      </div>
      <CardRow left={14} gap={4} mt={1771 - 1763} h={answered ? 222 : 111} testId="demo-product-questions" more={more} t={t}>
        {questions.map((question) => (
          <QuestionCard key={question.id} question={question} Likes={Likes} t={t} />
        ))}
      </CardRow>
    </section>
  );
}

/** The button's box in the file: (15, 2001), 402 x 38, corners 15 x 13.57. */
const ASK_BOX = {
  marginTop: 2001 - 1993,
  marginInlineStart: 15,
  width: fill(15, 13),
  height: 38,
} as const;
const ASK_CORNERS = "15px / 13.5714px";

/** The words of the button, on one line, where the file puts them. */
function ChatWords({ t }: { t: T }) {
  return (
    <>
      <XdIcon name="productChat" />
      {/* The file centres the icon and the words on the button: the words run
          from x 116 to 336 (220 px). With a capital on every word the browser
          draws them 221 px wide in WebKit and 223 in Chrome, so the centred
          row starts at most 1.5 px left of the file's. */}
      <span className="block">{t("Need help ? Start Chat about this product !")}</span>
    </>
  );
}

/** The chat button on `/demo`. */
function ChatButton({ onClick, t }: { onClick?: () => void; t: T }) {
  return (
    <button
      type="button"
      data-pw="demo-product-chat"
      onClick={onClick}
      className="flex items-start justify-center shrink-0 cursor-pointer font-normal whitespace-nowrap active:brightness-95 [-webkit-tap-highlight-color:transparent]"
      style={{
        ...ASK_BOX,
        paddingTop: 2013 - 2001,
        gap: 6,
        borderRadius: ASK_CORNERS,
        background: C.blue,
        color: C.white,
        ...LINE_11,
      }}
    >
      <ChatWords t={t} />
    </button>
  );
}

export type ProductAsk = {
  placeholder: string;
  sending: boolean;
  /** False when the shopper may not ask (a guest): the field stays closed. */
  canAsk: () => boolean;
  /** Sends the question. True when the backend took it. */
  send: (text: string) => Promise<boolean>;
};

/** How long the blue part takes to shrink or grow. */
const ASK_MOVE = "0.42s cubic-bezier(0.32, 0.72, 0, 1)";

/**
 * The blue button that turns into the ask field (S7c-7).
 *
 * A tap shrinks the blue part to its end, where it becomes the send button:
 * the words fade out, the send mark fades in, and the white field with its
 * blue line shows from under it. The field takes the focus in the same tap,
 * because iOS opens the keyboard only inside a tap.
 *
 * The field goes back to the button when it loses the focus with no words
 * in it, on Escape, and after a question went out. A question that failed
 * stays in the field, so the shopper can send it again.
 *
 * With "reduce motion" on, the blue part jumps and only the fades run (A-10).
 */
function AskField({ ask, t }: { ask: ProductAsk; t: T }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const words = text.trim();

  const openField = () => {
    if (!ask.canAsk()) return;
    setOpen(true);
    input.current?.focus();
  };
  const closeField = () => {
    setOpen(false);
    input.current?.blur();
  };
  const submit = async () => {
    if (ask.sending) return;
    if (!words) {
      closeField();
      return;
    }
    if (!(await ask.send(words))) return;
    setText("");
    closeField();
  };

  return (
    // The room under it keeps the field clear of the tab bar at the page's end.
    <div
      data-pw="demo-product-chat"
      data-open={open}
      className="relative shrink-0"
      style={{ ...ASK_BOX, marginBottom: 20 }}
    >
      {/* The field, under the blue part. */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: ASK_CORNERS,
          background: "#FCFCFC",
          opacity: open ? 1 : 0,
          transition: "opacity 0.2s ease-out",
        }}
      >
        <input
          ref={input}
          data-pw="demo-product-ask-input"
          type="text"
          dir="auto"
          enterKeyHint="send"
          maxLength={200}
          value={text}
          readOnly={ask.sending}
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          aria-label={ask.placeholder}
          placeholder={ask.placeholder}
          onChange={(e) => setText(e.target.value.slice(0, 200))}
          onBlur={() => {
            if (!words && !ask.sending) setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") closeField();
          }}
          className="block w-full h-full bg-transparent outline-hidden font-normal placeholder:text-[13px]"
          style={{
            paddingInlineStart: 14,
            paddingInlineEnd: 38 + 8,
            // Under 16 px, iOS zooms the page when the field takes the focus.
            fontSize: 16,
            color: INK,
            textAlign: "start",
            pointerEvents: open ? undefined : "none",
          }}
        />
        <Stroke color={C.blue} width={0.5} radius={15} />
      </div>
      {/* The blue part: the whole button when closed, the send button when open. */}
      <button
        type="button"
        aria-label={open ? t("Send") : undefined}
        data-pw={open ? "demo-product-ask-send" : "demo-product-ask-open"}
        // The tap must not take the focus from the field: its blur would close it.
        onMouseDown={(e) => {
          if (open) e.preventDefault();
        }}
        onClick={open ? submit : openField}
        className="absolute top-0 h-full overflow-hidden cursor-pointer font-normal whitespace-nowrap active:brightness-95 [-webkit-tap-highlight-color:transparent] motion-reduce:[transition-duration:0s]"
        style={{
          insetInlineEnd: 0,
          width: open ? 38 : "100%",
          borderRadius: ASK_CORNERS,
          background: C.blue,
          color: C.white,
          transition: `width ${ASK_MOVE}`,
          ...LINE_11,
        }}
      >
        {/* As wide as the whole button, held by its end: the words stay still while the blue moves off them. */}
        <span
          className="absolute top-0 flex items-start justify-center"
          style={{
            insetInlineEnd: 0,
            width: `calc(${COLUMN_W} - 28px)`,
            height: "100%",
            paddingTop: 2013 - 2001,
            gap: 6,
            opacity: open ? 0 : 1,
            transition: "opacity 0.16s ease-out",
          }}
        >
          <ChatWords t={t} />
        </span>
        <span
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: open ? (ask.sending ? 0.5 : 1) : 0,
            transition: "opacity 0.2s ease-out 0.12s",
          }}
        >
          <XdIcon name="listSend" size={18} style={{ filter: "brightness(0) invert(1)" }} />
        </span>
      </button>
    </div>
  );
}

export type ProductPageProps = {
  t: T;
  body: T;
  view: ProductView;
  /** The colour on show (an index in `view.colors`). */
  picked: number;
  onPick: (index: number) => void;
  onBack: () => void;
  /** Both bells. */
  onBell?: () => void;
  onMore?: () => void;
  heart: { liked: boolean; burst: number; toggle: () => void };
  /** The lines whose words come from the data. */
  lines: {
    delivery: RichLine;
    inHands: RichLine;
    arrives: RichLine;
    returnText: RichLine;
  };
  /** The lines of "Product information". None: the block is left out. */
  info: readonly React.ReactNode[];
  /** The country it was made in. Null: left out. */
  origin?: { mark: React.ReactNode; text: string } | null;
  /** What the video card plays. Nothing: the product has no video, and no card shows. */
  video?: React.ReactNode;
  onVideo?: () => void;
  Likes: React.ComponentType<CardLikesProps>;
  /** The ask field. Without it the button is the design's plain button. */
  ask?: ProductAsk;
  onChat?: () => void;
  onReviewsSeen?: () => void;
  /** The next pages of the rows. `/demo` has none. */
  reviewsMore?: RowMore;
  questionsMore?: RowMore;
  /** The design's picture of 3 stars, not the rating (`/demo` only). */
  filePicture?: boolean;
  /** The board's height. The real page is only as tall as its blocks. */
  boardHeight?: boolean;
};

export function ProductPage({
  t,
  body,
  view,
  picked,
  onPick,
  onBack,
  onBell,
  onMore,
  heart,
  lines,
  info,
  origin,
  video,
  onVideo,
  Likes,
  ask,
  onChat,
  onReviewsSeen,
  reviewsMore,
  questionsMore,
  filePicture = false,
  boardHeight = false,
}: ProductPageProps) {
  const settled = useSettled();
  const color = view.colors[picked] ?? view.colors[0];
  const name = [...view.words, color?.name].filter(Boolean);
  const details = view.details;

  return (
    <ScreenPage
      testId="demo-product"
      bg={C.white}
      header={<Header mark={view.mark} onBack={onBack} onBell={onBell} onMore={onMore} t={t} />}
      scrollTop={HEADER_BOTTOM}
      contentHeight={boardHeight ? BOARD_H : HEADER_BOTTOM}
      // A long page: the header leaves on a scroll down and comes back on a
      // fast scroll up, the same code as the store page (useHeadOnScroll).
      hideHeadOnScroll
    >
      <article className="flex flex-col w-full">
        <Gallery
          photos={color?.photos ?? []}
          alt={`${view.mark.name} ${name.join(" . ")}`}
          video={video}
          onVideo={onVideo}
          t={t}
        />

        {/* The mark and the verified mark, y 580. */}
        <div className="flex items-start shrink-0" style={{ marginTop: 580 - 566, height: 15, paddingInlineStart: 14, gap: 55 - 14 - 35.66 }}>
          <StoreMark store={view.mark} h={15} maxW={100} />
          {view.verified && (
            <span role="img" aria-label={t("Verified store")} className="block shrink-0">
              <XdIcon name="productVerified" />
            </span>
          )}
        </div>

        {/* The name, baseline 616, and the heart at (400, 603). */}
        <div className="relative shrink-0" style={{ marginTop: textTop(616, 13) - 595, height: lineBox(13) }}>
          <h1
            data-pw="productName_productPage"
            className="font-normal whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ paddingInlineStart: 14, paddingInlineEnd: 14 + 16 + 8, fontSize: 13, lineHeight: `${lineBox(13)}px`, color: INK }}
          >
            {/* All Regular, the dots too (the store page's card has Medium dots). */}
            {name.join(" . ")}
          </h1>
          <LikeButton heart={heart} t={t} />
        </div>

        {details && (
          <div
            data-pw="demo-product-details"
            className="font-normal shrink-0"
            // The file's box is 390 wide (right 26), but XD measures Quicksand a
            // little wider than the browser and puts "comfortable" on line 2;
            // the browser fits it with 1 px to spare. 4 px less breaks the line
            // where the file does.
            style={{ marginTop: paraTop(636, 11, 18) - 619, marginInlineStart: 14, width: fill(14, 30), fontSize: 11, lineHeight: "18px", color: INK }}
            {...("html" in details ? { dangerouslySetInnerHTML: { __html: details.html } } : { children: details.text })}
          />
        )}

        <RatingRow stats={view.stats} origin={origin} filePicture={filePicture} t={t} />

        <SideRow left={14} gap={6} mt={699 - 685} h={18} testId="demo-product-badges">
          <Pill icon="productTrendDown" bg="#EFF6FF" ink="#388CFF" minW={151}>
            {/* The file draws the space after "price" in Bold too, as on the store page. */}
            <span className="font-bold">{t("! Best price")} </span>
            <Weighted text={t("last {days} days!")} values={{ days: "3" }} medium={["days"]} />
          </Pill>
          {color?.trend && (
            <Pill icon="productTrendFire" bg="#FFF9EF" ink="#FF631A" minW={97}>
              <Rich text={t("<b>Trend </b>color<b> !</b>")} />
            </Pill>
          )}
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
            <Rich text={lines.inHands.text} values={lines.inHands.values} />
          </Pill>
          <Pill icon="productMap" bg="#E8FFED" ink={INK} minW={120}>
            <Rich text={lines.arrives.text} values={lines.arrives.values} />
          </Pill>
        </SideRow>

        {view.colors.length > 1 && <Colors colors={view.colors} picked={picked} onPick={onPick} t={t} />}

        {/* The rest is under the first view: on a tap it comes just after the page opens. */}
        {settled && (
          <>
            {info.length > 0 && (
              <section aria-label={t("Product information")} className="flex flex-col shrink-0">
                <div className="flex" style={{ marginTop: 907 - 887, paddingInlineStart: 14 }}>
                  <Chip icon="productInfo" bg={INK} ink={C.white} minW={134}>
                    {t("Product information")}
                  </Chip>
                </div>
                <ul className="flex flex-col p-0 list-none">
                  {info.map((line, i) => (
                    <Bullet key={i} mt={8} wrap>
                      {line}
                    </Bullet>
                  ))}
                </ul>
              </section>
            )}
            <Shipping
              freeShipping={view.freeShipping}
              returnDays={view.returnDays}
              delivery={lines.delivery}
              returnText={lines.returnText}
              t={t}
              body={body}
            />
            <Reviews reviews={view.reviews} more={reviewsMore} Likes={Likes} filePicture={filePicture} onSeen={onReviewsSeen} t={t} body={body} />
            {view.votes && <RecommendVotes votes={view.votes} t={t} />}
            {view.sizeVotes && <SizeVotes votes={view.sizeVotes} t={t} />}
            {view.questions.length > 0 && <Questions questions={view.questions} more={questionsMore} Likes={Likes} t={t} />}
            {ask ? <AskField ask={ask} t={t} /> : <ChatButton onClick={onChat} t={t} />}
          </>
        )}
      </article>
    </ScreenPage>
  );
}

/** The heart at (400, 603), 16 x 16, in a 44 px target. A tap likes the product (S7c-2), with the pop (LikeHeart). */
function LikeButton({ heart, t }: { heart: ProductPageProps["heart"]; t: T }) {
  return (
    <button
      type="button"
      aria-label={t("Like")}
      aria-pressed={heart.liked}
      data-pw="demo-product-like"
      onClick={heart.toggle}
      className="absolute cursor-pointer [-webkit-tap-highlight-color:transparent]"
      style={{ insetInlineEnd: 14 - 14, top: -14, width: 44, height: 44, padding: 14 }}
    >
      <LikeHeart liked={heart.liked} burst={heart.burst} outline="productHeart" filled="productHeartFilled" size={16} />
    </button>
  );
}
