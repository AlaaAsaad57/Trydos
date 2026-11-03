"use client";

import React, { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import XdIcon from "../../DemoApp/XdIcon";
import type { DemoKey } from "../../DemoApp/demoKeys";
import {
  placeSwatches,
  type DemoProduct,
  type DemoStore,
  type ProductBadge,
  type ProductColor,
} from "../../DemoApp/demoStores";
import { C, lineBox, textTop } from "../demo1Layout";

/**
 * The parts a product card is made of, shared by the store page's cards
 * (`Home Page – 47`) and the cards of the colour sheet (`Home Page – 54`).
 * Both files draw the same card: a 214 x 311 photo and an 86 px footer.
 */

export type T = (key: DemoKey) => string;

/** The photo of a product card, and the footer under it. */
export const PHOTO = { w: 214, h: 311 } as const;
export const FOOTER_H = 397 - PHOTO.h;

/** The space between two cards, and between two rows of cards. */
export const GAP = 2;

/** A design y on the card (0 is the photo's top) as a top in the footer. */
const inFooter = (y: number) => y - PHOTO.h;

/** A logo drawn `h` px tall and at most `maxW` wide, or the store's name where the file has no logo. */
export function StoreMark({
  store,
  h,
  maxW,
  eager = false,
}: {
  store: DemoStore;
  h: number;
  maxW: number;
  eager?: boolean;
}) {
  if (!store.logo) {
    return (
      <span
        className="block font-medium whitespace-nowrap"
        style={{ fontSize: h, lineHeight: `${h}px`, color: C.ink }}
      >
        {store.name}
      </span>
    );
  }
  const ratio = store.logo.w / store.logo.h;
  const width = Math.min(maxW, h * ratio);
  return (
    <img
      src={store.logo.src}
      alt={store.name}
      width={width}
      height={width / ratio}
      draggable={false}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className="block select-none"
      style={{ width, height: width / ratio }}
    />
  );
}

/**
 * A translated line with `{token}` parts in another weight. `bold` names the
 * tokens drawn Bold, `medium` the ones drawn Medium; the rest is Regular. A
 * translation can put the tokens anywhere in its sentence.
 */
export function Weighted({
  text,
  values,
  bold = [],
  medium = [],
}: {
  text: string;
  values: Record<string, string>;
  bold?: string[];
  medium?: string[];
}) {
  const parts = text.split(/(\{[a-z]+\})/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        const name = part.startsWith("{") ? part.slice(1, -1) : null;
        if (!name || !(name in values)) return <React.Fragment key={i}>{part}</React.Fragment>;
        const weight = bold.includes(name)
          ? "font-bold"
          : medium.includes(name)
            ? "font-medium"
            : "font-normal";
        return (
          <span key={i} className={weight}>
            {values[name]}
          </span>
        );
      })}
    </>
  );
}

/** The colours of a badge: its pill, its words, where the words start, and the pill's width in the file. */
export const BADGE = {
  bag: { bg: "#F4F4FF", ink: "#4A31E7", textAt: 23, minW: 114, radius: "7.05px / 6px" },
  best: { bg: "#EFF6FF", ink: "#388CFF", textAt: 6, minW: 109, radius: 6 },
  flash: { bg: "#FFF6F0", ink: "#FF6201", textAt: 19, minW: 124, radius: 6 },
} as const;

/**
 * The name: 11 Regular, a Medium dot between two words, baseline 347 under
 * the photo's top. The colour sheet adds the colour's name as the last word
 * ("Women . pajama . Pantaloon . blue").
 */
export function ProductName({
  product,
  color,
  href,
  t,
}: {
  product: DemoProduct;
  color?: ProductColor;
  /** The product's page: the name is a real link to it, for search engines and the keyboard. */
  href?: string;
  t: T;
}) {
  const words: DemoKey[] = [...product.name, ...(color ? [color.name] : [])];
  const name = words.map((word, i) => (
    <React.Fragment key={`${word}-${i}`}>
      {i > 0 && (
        <>
          {" "}
          <span className="font-medium">.</span>{" "}
        </>
      )}
      {t(word)}
    </React.Fragment>
  ));
  return (
    <h2
      className="absolute m-0 font-normal whitespace-nowrap overflow-hidden text-ellipsis"
      style={{
        left: 12,
        right: 12,
        top: textTop(inFooter(347), 11),
        fontSize: 11,
        lineHeight: `${lineBox(11)}px`,
        color: C.ink,
      }}
    >
      {href ? (
        <a href={href} draggable={false} className="text-inherit no-underline">
          {name}
        </a>
      ) : (
        name
      )}
    </h2>
  );
}

/** The store's logo, 11 tall, 8 px under the photo (y 319 on the card). */
export function CardLogo({ store }: { store: DemoStore }) {
  return (
    <div className="absolute" style={{ left: 12, top: inFooter(319) }}>
      <StoreMark store={store} h={11} maxW={100} />
    </div>
  );
}

/** The price: an 18 px pill at y 373 on the card, "90" Bold and "USD" Regular. */
export function PricePill({ product, t }: { product: DemoProduct; t: T }) {
  return (
    <p
      data-pw="demo-listing-price"
      className="absolute m-0 font-normal whitespace-nowrap"
      style={{
        left: 12,
        top: inFooter(373),
        height: 18,
        minWidth: 50,
        padding: "2px 6px 0",
        borderRadius: 6,
        background: "#F8F8F8",
        color: C.ink,
        fontSize: 11,
        lineHeight: `${lineBox(11)}px`,
      }}
    >
      <data value={product.price} className="font-bold">
        {product.price}
      </data>{" "}
      {t(product.currency)}
    </p>
  );
}

/** The add button: the 18 px mark 12 px from the card's right edge, at y 373, in a 44 px target. */
export function AddButton({ product, t }: { product: DemoProduct; t: T }) {
  return (
    <button
      type="button"
      aria-label={t("Add to cart")}
      data-pw="demo-listing-add"
      className="absolute cursor-pointer active:opacity-60 [-webkit-tap-highlight-color:transparent]"
      style={{
        right: 12 - 13,
        top: inFooter(373) - 13,
        width: 44,
        height: 44,
        padding: 13,
      }}
    >
      <XdIcon name={product.addColor === "purple" ? "listAddPurple" : "listAddDark"} />
    </button>
  );
}

/**
 * How long one label stays in view, and how long the move to the next takes.
 * The same steps as the shop's own product cards (ProductLabelsAnimated): 2 s
 * a label, 80 % of it still and 20 % (0.4 s) moving, with its soft in-out
 * curve. The shop's card moves its labels up; here they turn over like a card.
 */
const LABEL_STEP_S = 2;
const LABEL_STILL = 0.8;
const LABEL_EASE = "cubic-bezier(0.45, 0, 0.55, 1)";

/** How far the eye is from the labels (CSS `perspective`), so the turn has depth. */
const LABEL_PERSPECTIVE_PX = 120;

/**
 * The CSS of the labels' flip for `n` labels (one copy of the CSS for each
 * count). Every label runs the same keyframes over one full round
 * (`n` × 2 s); each label starts at its own point in the round (see
 * flipDelay). One label's round, as a share of the round:
 *
 *  1. 0 → 80 % of its turn: it faces the viewer (rotateX 0).
 *  2. To the end of its turn: it turns away, top edge going back, to
 *     rotateX(-180deg). Its back is hidden, so it is gone.
 *  3. It waits hidden. Then it jumps to rotateX(180deg). The jump uses
 *     `step-end`, so it never passes through 0; both ends are hidden.
 *  4. In the last 20 % of the round it turns from 180deg to 0, at the same
 *     time as the label before it turns from 0 to -180deg. The two labels
 *     are the two sides of one card that turns over.
 */
function labelsCss(n: number) {
  const turn = 100 / n;
  const still = (turn * LABEL_STILL).toFixed(3);
  const out = turn.toFixed(3);
  const back = (100 - turn * (1 - LABEL_STILL)).toFixed(3);
  return `@keyframes demo-flip-${n} {
  0% { transform: rotateX(0deg); }
  ${still}% { transform: rotateX(0deg); }
  ${out}% { transform: rotateX(-180deg); animation-timing-function: step-end; }
  ${back}% { transform: rotateX(180deg); animation-timing-function: ${LABEL_EASE}; }
  100% { transform: rotateX(0deg); }
}
.demo-flip-${n} { animation: demo-flip-${n} ${n * LABEL_STEP_S}s ${LABEL_EASE} infinite both; }
@media (prefers-reduced-motion: reduce) {
  .demo-flip-${n} { animation: none; }
  .demo-flip-${n}:not(:first-child) { display: none; }
}`;
}

/**
 * Where label `i` of `n` starts in the round: label 0 at the start (facing
 * the viewer), label 1 one turn before its own turn, and so on. A negative
 * delay starts the animation part-way, so every label is in place on the
 * first frame.
 */
function flipDelay(i: number, n: number) {
  return `-${((n - i) % n) * LABEL_STEP_S}s`;
}

/**
 * A card's labels under its name (a flash deal is one of them), in a row
 * `height` px tall at `top` in the footer, 12 px in from both sides. The
 * store page's cards and the colour sheet's cards both use it; `render`
 * draws one label in the card's own style.
 *
 * One label sits still. With more, they take turns, as on the shop's product
 * cards: each one rests, then turns over like a card (around its middle line,
 * top edge going back), and the next label is on the card's other side.
 * After the last one, the first comes back, so the turns go round with no end.
 *
 * All labels lie on top of each other. Only CSS turns them (no script on
 * each frame), as a page can show many cards. With "reduce motion" on, the
 * first label stays and the others are not shown.
 */
export function LabelTurns({
  badges,
  top,
  height,
  testId,
  render,
}: {
  badges: readonly ProductBadge[];
  top: number;
  height: number;
  testId: string;
  render: (badge: ProductBadge) => React.ReactNode;
}) {
  const n = badges.length;
  if (n < 2) {
    return (
      <div
        data-pw={testId}
        data-count={n}
        className="absolute overflow-hidden"
        style={{ left: 12, right: 12, top, height }}
      >
        {render(badges[0])}
      </div>
    );
  }
  return (
    <div
      data-pw={testId}
      data-count={n}
      className="absolute"
      style={{ left: 12, right: 12, top, height, perspective: LABEL_PERSPECTIVE_PX }}
    >
      <style>{labelsCss(n)}</style>
      <div className={`relative h-full demo-labels-${n}`}>
        {badges.map((badge, i) => (
          <div
            key={i}
            className={`absolute inset-0 overflow-hidden demo-flip-${n}`}
            style={{
              animationDelay: flipDelay(i, n),
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transformOrigin: "50% 50%",
            }}
          >
            {render(badge)}
          </div>
        ))}
      </div>
    </div>
  );
}

/** The soft white glow inside the top of a photo (the file's inner shadow). */
export function PhotoGlow() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ boxShadow: "inset 0 3px 3px rgba(255,255,255,0.5)" }}
    />
  );
}

/** How long a slide to the next photo takes (Embla's unit; the Home sliders use the same). */
const SLIDE_DURATION = 25;

/** The photo of a colour with one photo: a plain image, with no slider. */
function OnePhoto({ src, alt, eager }: { src: string; alt: string; eager: boolean }) {
  return (
    <img
      src={src}
      alt={alt}
      width={PHOTO.w}
      height={PHOTO.h}
      draggable={false}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      data-pw="demo-listing-photos"
      data-count={1}
      className="absolute inset-0 block w-full h-full object-cover select-none"
    />
  );
}

/**
 * The photos of one colour, side by side in a slider: a swipe (or a mouse
 * drag) shows the next one. A colour with one photo is a plain photo, with
 * no slider at all (OnePhoto).
 *
 * Embla moves the row, as in the sliders on Home (useSlider in
 * HomeSections). The page still scrolls up and down over it.
 * `onIndex` hears which photo is on show.
 *
 * Only the first photo loads with the page. The others sit right beside it,
 * so `loading="lazy"` loaded them all at once: on the store page that was 6
 * photos (about 200 KB) for each blue shirt card, though only one shows. So
 * the other slides stay empty until a finger or the mouse is on the photo,
 * or it has focus; their photos start to load then, before the swipe ends.
 */
export function ColorPhotos(props: {
  color: ProductColor;
  alt: string;
  /** Load the first photo at once (the cards the page opens on). */
  eager?: boolean;
  onIndex?: (index: number) => void;
}) {
  const { color, alt, eager = false } = props;
  if (color.images.length < 2) return <OnePhoto src={color.images[0]} alt={alt} eager={eager} />;
  return <SlidingPhotos {...props} eager={eager} />;
}

function SlidingPhotos({
  color,
  alt,
  eager,
  onIndex,
}: {
  color: ProductColor;
  alt: string;
  eager: boolean;
  onIndex?: (index: number) => void;
}) {
  const [viewportRef, api] = useEmblaCarousel({
    align: "start",
    loop: false,
    containScroll: "trimSnaps",
    duration: SLIDE_DURATION,
  });
  /** True once the person reaches for the photo: the other photos may load. */
  const [awake, setAwake] = useState(false);
  const wake = () => setAwake(true);
  useEffect(() => {
    if (!api || !onIndex) return;
    const read = () => onIndex(api.selectedScrollSnap());
    read();
    api.on("select", read).on("reInit", read);
    return () => {
      api.off("select", read).off("reInit", read);
    };
  }, [api, onIndex]);
  return (
    <div
      ref={viewportRef}
      data-pw="demo-listing-photos"
      data-count={color.images.length}
      className="absolute inset-0 overflow-hidden"
      style={{ touchAction: "pan-y pinch-zoom" }}
      onPointerDown={wake}
      onPointerEnter={wake}
      onFocus={wake}
    >
      <div className="flex h-full">
        {color.images.map((src, i) =>
          i === 0 || awake ? (
            <img
              key={src}
              src={src}
              // The other photos show the same product; one name is enough.
              alt={i === 0 ? alt : ""}
              width={PHOTO.w}
              height={PHOTO.h}
              draggable={false}
              loading={eager && i === 0 ? "eager" : "lazy"}
              fetchPriority={eager && i === 0 ? "high" : undefined}
              decoding="async"
              className="block h-full min-w-0 object-cover select-none"
              style={{ flex: "0 0 100%" }}
            />
          ) : (
            <span key={src} aria-hidden="true" className="block h-full bg-[#F4F4F4]" style={{ flex: "0 0 100%" }} />
          ),
        )}
      </div>
    </div>
  );
}

/** At most this many dots under a photo; a longer row of photos moves the dark dot through them. */
const MAX_DOTS = 3;

/**
 * Which dot is dark for photo `index` of `count`. With more photos than dots,
 * the first dot is the first photo, the last dot the last photo, and the
 * middle dot every photo between.
 */
export function darkDot(count: number, index: number) {
  if (count <= MAX_DOTS) return index;
  if (index <= 0) return 0;
  if (index >= count - 1) return MAX_DOTS - 1;
  return 1;
}

/**
 * The dots under a colour's photo (`Home Page – 54`): 4 px, 5 px apart,
 * centred on the card, their centres at y 317 on the card. The dot of the
 * photo on show is `#8D8D8D`, the others `#D3D3D3`. None for a colour with
 * one photo.
 */
export function PhotoDots({
  count,
  index,
  label,
}: {
  count: number;
  index: number;
  label: string;
}) {
  if (count < 2) return null;
  const shown = Math.min(count, MAX_DOTS);
  const dark = darkDot(count, index);
  return (
    <span
      role="img"
      aria-label={label}
      data-pw="demo-color-dots"
      className="absolute"
      style={{ left: "50%", top: inFooter(317 - 2), width: 0, height: 4 }}
    >
      {Array.from({ length: shown }, (_, i) => (
        <span
          key={i}
          data-on={i === dark || undefined}
          className="absolute rounded-full"
          style={{
            left: (i - (shown - 1) / 2) * 5 - 2,
            top: 0,
            width: 4,
            height: 4,
            background: i === dark ? "#8D8D8D" : "#D3D3D3",
            transition: "background-color 0.2s",
          }}
        />
      ))}
    </span>
  );
}

/** How far a finger moves along the dots to go one colour on. */
const SWATCH_STEP = 14;

/** A move shorter than this is a tap. */
const TAP_SLOP = 6;

/** The target round the dots: wider and taller than the row, for a finger. */
const SWATCH_TARGET = { w: 120, h: 40 } as const;

/** How the dots move to their new places. */
const SWATCH_MOVE =
  "transform 0.22s cubic-bezier(0.2, 0, 0, 1), width 0.22s cubic-bezier(0.2, 0, 0, 1), height 0.22s cubic-bezier(0.2, 0, 0, 1)";

/**
 * The colour dots on the photo's bottom edge, as a swiper.
 *
 * The colour on show is the big dot with the red line; the others get
 * smaller the further they are (placeSwatches). A swipe along the dots (or a
 * mouse drag) moves the row: each SWATCH_STEP px brings the next colour to
 * the middle, and the photo above changes to it. A tap opens the colour
 * sheet (`Home Page – 54`). The arrow keys change the colour too.
 *
 * Each dot's centre is 5 px above the photo's edge; a dot is round, with a
 * 0.5 line (red on the colour on show), a soft shadow under it and a white
 * glow inside its top.
 */
export function SwatchPicker({
  colors,
  selected,
  onSelect,
  onOpen,
  onTouch,
  t,
}: {
  colors: readonly ProductColor[];
  selected: number;
  onSelect: (index: number) => void;
  onOpen: () => void;
  /** A finger or the mouse is on the dots: a moment to load the other colours' photos. */
  onTouch?: () => void;
  t: T;
}) {
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null);
  /** Set when a drag ends, so the click that follows it does not open the sheet. */
  const dragged = useRef(false);
  const last = colors.length - 1;
  const go = (index: number) => {
    const next = Math.max(0, Math.min(last, index));
    if (next !== selected) onSelect(next);
  };
  const placed = placeSwatches(colors.length, selected);
  return (
    <>
      {/* The dots hang from a point 5 px above the middle of the photo's bottom edge. */}
      <span
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{ left: "50%", top: "calc(100% - 5px)", width: 0, height: 0 }}
      >
        {placed.map((s, order) => (
          // A plain span that moves by a CSS transition: a card can have
          // seven dots and a page many cards, so no animation library here.
          <span
            key={s.index}
            data-pw="demo-listing-swatch"
            data-on={s.on || undefined}
            className="absolute overflow-hidden"
            style={{
              left: 0,
              top: 0,
              width: s.d,
              height: s.d,
              transform: `translate(${s.dx - s.d / 2}px, ${-s.d / 2}px)`,
              borderRadius: "50%",
              boxShadow: "0 3px 1.5px rgba(0,0,0,0.1)",
              zIndex: order,
              transition: SWATCH_MOVE,
            }}
          >
            <img
              src={colors[s.index].swatch}
              alt=""
              width={22}
              height={22}
              draggable={false}
              loading="lazy"
              decoding="async"
              className="block w-full h-full select-none"
            />
            {/* The white glow inside the top, and the 0.5 px line (red on the colour on show). */}
            <span
              className="absolute inset-0"
              style={{
                borderRadius: "50%",
                boxShadow: `inset 0 4px 3px rgba(255,255,255,0.5), inset 0 0 0 0.5px ${s.on ? "#FF5F61" : C.ink}`,
              }}
            />
          </span>
        ))}
      </span>
      <button
        type="button"
        data-pw="demo-listing-colors"
        aria-label={`${t("Colors")}: ${t(colors[selected].name)}`}
        aria-haspopup="dialog"
        className="absolute cursor-pointer [-webkit-tap-highlight-color:transparent]"
        style={{
          left: `calc(50% - ${SWATCH_TARGET.w / 2}px)`,
          top: `calc(100% - 5px - ${SWATCH_TARGET.h / 2}px)`,
          width: SWATCH_TARGET.w,
          height: SWATCH_TARGET.h,
          // A finger moving sideways moves the dots; up and down still scrolls the page.
          touchAction: "pan-y",
          zIndex: 1,
        }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, start: selected, moved: false };
          dragged.current = false;
          e.currentTarget.setPointerCapture(e.pointerId);
          onTouch?.();
        }}
        onPointerMove={(e) => {
          const now = drag.current;
          if (!now) return;
          const dx = e.clientX - now.x;
          if (Math.abs(dx) > TAP_SLOP) now.moved = true;
          // A finger moving left brings the colours on the right to the middle.
          if (now.moved) go(now.start - Math.round(dx / SWATCH_STEP));
        }}
        onPointerUp={() => {
          dragged.current = drag.current?.moved ?? false;
          drag.current = null;
        }}
        onPointerCancel={() => {
          dragged.current = drag.current?.moved ?? false;
          drag.current = null;
        }}
        onClick={() => {
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          onOpen();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(selected - 1);
          else if (e.key === "ArrowRight") go(selected + 1);
          else return;
          e.preventDefault();
        }}
      />
    </>
  );
}
