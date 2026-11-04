"use client";

import React, { useLayoutEffect, useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import type { CardColor, CardLabel, StoreCard } from "../listingData";
import { DESIGN_H, UNDER_BAR, lineBox, textTop } from "../demo1Layout";
import { Sheet, Stroke, useCanvasEnd } from "../ui";
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
  PhotoDots,
  PhotoGlow,
  PricePill,
  ProductName,
  type T,
} from "./ListingParts";

/**
 * A product's colours — XD `Home Page – 54`. A tap on the colour dots of a
 * card on the store page opens it.
 *
 * The page behind is covered with `#1D1D1D` at 50% and blurred by the file's
 * background blur (14.63). The sheet is white, from y 413 to the end of the
 * screen, with 30 px top corners and a soft shadow on its top edge. In it,
 * in design px (y on the artboard):
 *
 *  - the handle: a 40 x 2 line, `#C4C2C2`, at (195, 424);
 *  - from y 455, one card per colour, two to a row, 214 x 397 and 2 apart,
 *    flush with the sheet's edges. A card is the store page's card (the
 *    photo, the logo at 319, the name at 347, the price and the add button at
 *    373) with three changes:
 *      - the name ends with the colour ("Women . pajama . Pantaloon . blue");
 *      - the badge is words only, 9 px, baseline 365, with no pill;
 *      - dots under the photo say which photo is on show (PhotoDots), and a
 *        swipe on the photo shows the next one.
 *  - white under the last row, to the end of the screen.
 *
 * The file draws two colours: one row. With more colours the sheet grows up
 * the screen, to y SHEET_MIN_Y at most, and the cards scroll in it.
 *
 * A tap on a card's photo shows that colour on the store page's card and
 * closes the sheet. Like the wallet sheets (`Sheet`), the sheet runs on under
 * Safari's bar, the dimmed page shows in Safari's top area while it is open,
 * and a drag down on its top closes it. The handle does not scroll with the
 * cards (HANDLE_BAR).
 */

/** The file's background blur, as a filter on the page (`ScreenPage glass`). */
export const COLOR_GLASS = "blur(14.63px) brightness(1.001)";

/** The sheet's drop shadow in the file: 0, -3, blur 10, black at 10%. */
const SHEET_SHADOW = "0 -3px 10px rgba(0, 0, 0, 0.102)";

/** Design y of the sheet's top in the file, and of the first row of cards. */
const FILE_TOP = 413;
const CARDS_Y = 455;

/**
 * White under the last row, to the screen's end. The cards end at 852. This
 * artboard is 931 tall, one less than the others (932); with the sheet's top
 * at 413 on a 932 px screen, the white under the cards is 80 px.
 */
const UNDER_CARDS = DESIGN_H - (CARDS_Y + PHOTO.h + FOOTER_H);

/** The highest the sheet goes when it holds more than one row (the wallet sheets' top). */
const SHEET_MIN_Y = 90;

/**
 * The white band at the sheet's top with the handle, from y 413 to the first
 * row at 455. The band does not scroll: the cards scroll under it, and the
 * handle stays in place for the drag that closes the sheet.
 */
const HANDLE_BAR = CARDS_Y - FILE_TOP;

/** The best-price badge as `– 54` draws it: "! Best price ", " 3 " and the last "!" Bold. */
function BestWords({ days, t }: { days: number; t: T }) {
  const text = t("last {days} days!");
  const parts = text.split(/(\s*\{days\}\s*)/).filter(Boolean);
  return (
    <>
      <span className="font-bold">{t("! Best price")} </span>
      {parts.map((part, i) => {
        if (part.includes("{days}"))
          return (
            <span key={i} className="font-bold whitespace-pre">
              {part.replace("{days}", String(days))}
            </span>
          );
        const bang = part.endsWith("!");
        return (
          <React.Fragment key={i}>
            {bang ? part.slice(0, -1) : part}
            {bang && <span className="font-bold">!</span>}
          </React.Fragment>
        );
      })}
    </>
  );
}

/**
 * The badge as words only, 9 px, in the badge's colour, at x 12 and baseline
 * 365 on the card. The file draws the best-price one; the bag and flash ones
 * keep their mark in front of the words, as on the store page.
 */
function PlainBadge({ badge, t }: { badge: CardLabel; t: T }) {
  const look = BADGE[badge.kind];
  const words =
    badge.kind === "best" ? (
      <BestWords days={badge.days} t={t} />
    ) : (
      <LabelWords label={badge} t={t} />
    );
  const mark =
    badge.kind === "bag"
      ? "listBag"
      : badge.kind === "flash"
        ? "listFlash"
        : null;
  return (
    <p
      data-pw={`demo-color-badge-${badge.kind}`}
      className="relative m-0 flex items-center font-normal whitespace-nowrap"
      style={{
        height: lineBox(9),
        fontSize: 9,
        lineHeight: `${lineBox(9)}px`,
        color: look.ink,
        gap: 5,
      }}
    >
      {mark && <XdIcon name={mark} />}
      <span>{words}</span>
    </p>
  );
}

function ColorCard({
  product,
  color,
  index,
  onPick,
  onAdd,
  t,
}: {
  product: StoreCard;
  color: CardColor;
  index: number;
  onPick: (index: number) => void;
  onAdd?: () => void;
  t: T;
}) {
  const [photo, setPhoto] = useState(0);
  const name = [...product.name, ...(color.name ? [color.name] : [])].join(
    " . ",
  );
  return (
    <article
      data-pw={`demo-color-card-${index}`}
      className="relative flex flex-col min-w-0 bg-white"
    >
      {/* The card's line is drawn first; the photo lies over its top. */}
      <Stroke color="#D3D3D3" width={0.3} />
      <div
        role="button"
        tabIndex={0}
        aria-label={name}
        data-pw="demo-color-pick"
        className="relative w-full cursor-pointer"
        style={{ aspectRatio: `${PHOTO.w} / ${PHOTO.h}` }}
        // Embla drops the click that ends a swipe, so only a tap picks.
        onClick={() => onPick(index)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          onPick(index);
        }}
      >
        <ColorPhotos
          color={color}
          alt={`${product.mark.name} ${name}`.trim()}
          eager
          onIndex={setPhoto}
        />
        <PhotoGlow />
        <Stroke color={product.line} width={0.5} />
      </div>
      <div className="relative w-full shrink-0" style={{ height: FOOTER_H }}>
        <PhotoDots
          count={color.images.length}
          index={photo}
          label={`${t("Photo")} ${t("{n} of {m}")
            .replace("{n}", String(photo + 1))
            .replace("{m}", String(color.images.length))}`}
        />
        <CardLogo mark={product.mark} />
        <ProductName product={product} color={color} />
        {/* The labels take turns, as on the store page's card (LabelTurns). */}
        <LabelTurns
          badges={product.labels}
          top={textTop(365, 9) - PHOTO.h}
          height={lineBox(9)}
          testId="demo-color-labels"
          render={(badge) => <PlainBadge badge={badge} t={t} />}
        />
        <PricePill product={product} />
        <AddButton product={product} t={t} onAdd={onAdd} />
      </div>
    </article>
  );
}

export default function ListingColorSheet({
  open,
  onClose,
  product,
  onPick,
  onAdd,
  t,
}: {
  open: boolean;
  onClose: () => void;
  product: StoreCard;
  /** A colour was tapped: show it on the card. The sheet closes after. */
  onPick: (index: number) => void;
  /** The add button's tap (S7b-1). */
  onAdd?: () => void;
  /** The page's words: labels in Apple's title style (demoCase). */
  t: T;
}) {
  /** Where the screen ends (design y). */
  const end = useCanvasEnd(open);
  // The grid as a state, not a ref: the sheet's layer puts it on the page one
  // render after the sheet opens, and the measure must start then.
  const [grid, setGrid] = useState<HTMLElement | null>(null);
  // The cards' height follows the screen's width; it is measured before the
  // sheet is drawn. Until then, the file's 397 px a row.
  const rows = Math.ceil(product.colors.length / 2);
  const [cardsH, setCardsH] = useState(
    rows * (PHOTO.h + FOOTER_H) + (rows - 1) * GAP,
  );
  useLayoutEffect(() => {
    if (!grid) return;
    const read = () => setCardsH(grid.getBoundingClientRect().height);
    read();
    const watch = new ResizeObserver(read);
    watch.observe(grid);
    return () => watch.disconnect();
  }, [grid]);
  // The sheet rests on the bottom of the screen, as tall as its cards need:
  // with the file's two colours, on a phone as tall as the file, its top is
  // at y 413.
  const tall = CARDS_Y - FILE_TOP + cardsH + UNDER_CARDS;
  const y = Math.max(SHEET_MIN_Y, end - tall);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      y={y}
      fit
      glass
      shadow={SHEET_SHADOW}
      handleBar={HANDLE_BAR}
      testId="demo-color-sheet"
    >
      <section
        ref={setGrid}
        role="dialog"
        aria-modal="true"
        aria-label={t("Colors")}
        data-pw="demo-color-cards"
        className="grid w-full shrink-0"
        style={{ gridTemplateColumns: "1fr 1fr", gap: GAP }}
      >
        {product.colors.map((color, i) => (
          <ColorCard
            key={i}
            product={product}
            color={color}
            onAdd={onAdd}
            index={i}
            onPick={(index) => {
              onPick(index);
              onClose();
            }}
            t={t}
          />
        ))}
      </section>
      {/* The file's white under the cards, and the part under Safari's bar. */}
      <div
        aria-hidden="true"
        className="shrink-0"
        style={{ height: UNDER_CARDS + UNDER_BAR }}
      />
    </Sheet>
  );
}
