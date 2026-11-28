"use client";

import React, { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { demoAsset } from "../../DemoApp/demoAssetVersion";
import type { DemoKey } from "../../DemoApp/demoKeys";
import { useDemoNav } from "../screenNav";
import { C, fill } from "../demo1Layout";
import { Skeleton } from "components/Server/Skeleton";
import { Stroke, Txt } from "../ui";
import CountryRow, { type RowCountry } from "./CountryRow";

/**
 * The country picker's map and rows: XD `Ramaaz pay signin – 16` (no
 * country yet) and `– 15` (Turkiye chosen), from the map down.
 *
 * The picker is the login's first step at the start of /demo. The Quick
 * Preview's column draws the top (QuickPreviewScreen, its `picker` prop): the
 * flipping slogan pill and the badge logo, in the same place as on the Quick
 * Preview. This part is drawn under the logo, and keeps the file's distances
 * from the logo's bottom edge (y 248 in the file):
 *  - the map of the four countries, 406.5 x 286.5 at (11.75, 287.75). Each
 *    country is `#F4F4F4` with a 0.5 px `#D3D3D3` line; the chosen one is
 *    `#8D8D8D` with a `#4A31E7` line (`– 15`);
 *  - the four rows from y 594, 4 apart (CountryRow, as the address form's
 *    country sheet);
 *  - the room under the last row, to the artboard's end.
 *
 * A tap on a row, or on a country of the map, chooses it. The grey fills the
 * country on the map from the tap (FILL), then the page shows the choice
 * (`– 15`) until HOLD_MS, and calls `onDone`: this part slides out and the
 * Quick Preview's slides in, under the same pill and logo.
 *
 * The rows come from the host (`countries`): `/demo` gives the design's four
 * (COUNTRIES in demoPlaces.ts), the real start flow (AppStartFlow) gives the
 * real country list. The real flow may also mark a country at first
 * (`initial`, drawn as `– 15` with no fill motion) and limit which countries a
 * tap may pick (`only`). An empty list draws skeleton rows in the rows' place;
 * a list that could not be read draws two rows: the message and "Try again".
 */

/**
 * The chosen country's fill on the map: the grey spreads from the tap (from
 * the country's middle for a tap on a row) to the whole country, in seconds.
 */
const FILL = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

/** The fill's soft edge, as a share of the gradient's radius. */
const FILL_EDGE = 0.02;

/**
 * How long after the tap the picker hands over, in ms: the fill, then a
 * moment on the finished choice (`– 15`).
 */
const HOLD_MS = 1000;

/** Where the fill starts, as a share of the country's box (0 to 1 on each side). */
type FillFrom = { x: number; y: number };

/** The country's middle: where a tap on a row starts the fill. */
const MIDDLE: FillFrom = { x: 0.5, y: 0.5 };

/** The map's box in the file, in design px: its viewBox, and where it sits. */
const MAP = { x: 11.75, y: 287.75, w: 406.5, h: 286.5 } as const;

/** Where the badge logo ends in the file: its top (98) and its height (150). */
const LOGO_END = 98 + 150;

/** Where the last row ends in the file, and the artboard's height. */
const LAST_ROW_END = 846;
const ARTBOARD_H = 932;

/** The countries in the file's order on the map: Turkiye last, so it lies on top. */
const MAP_ORDER = ["sy", "lb", "iq", "tr"] as const;

const MAP_FILE = demoAsset("/assets/demo/xd/countryMap.svg");

/** A country on the map that is not chosen: `#F4F4F4`, as the file fills it. */
const EMPTY = "#F4F4F4";

export default function CountryPickerBody({
  countries,
  initial = null,
  only = null,
  failed = false,
  onRetry,
  onDone,
}: {
  /** The rows, in their order. An empty list draws skeleton rows. */
  countries: readonly RowCountry[];
  /** The country drawn as chosen before any tap (`– 15`), or none. */
  initial?: string | null;
  /** The countries a tap may pick; every row when not given. */
  only?: readonly string[] | null;
  /** The list could not be read: the rows give way to the message and a retry. */
  failed?: boolean;
  onRetry?: () => void;
  /** Called once, HOLD_MS after a country is chosen. */
  onDone: (country: string) => void;
}) {
  const { t } = useDemoNav();
  const [picked, setPicked] = useState<string | null>(null);
  const [from, setFrom] = useState<FillFrom>(MIDDLE);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  /** A tap may pick a country of the rows, and of `only` when it is given. */
  const canPick = (id: string) =>
    countries.some((c) => c.id === id) && (!only || only.includes(id));

  const pick = (id: string, at: FillFrom = MIDDLE) => {
    // The first choice wins: the next step is already on its way.
    if (picked || !canPick(id)) return;
    setFrom(at);
    setPicked(id);
    timer.current = setTimeout(() => onDone(id), HOLD_MS);
  };

  const chosen = picked ?? initial;
  const rowsTop = 594 - (MAP.y + MAP.h);

  return (
    <div
      data-pw="demo-country-picker"
      className="flex flex-col w-full shrink-0"
      style={{ paddingBottom: ARTBOARD_H - LAST_ROW_END }}
    >
      <CountryMap
        chosen={chosen}
        instant={!picked}
        from={from}
        canPick={canPick}
        onPick={pick}
        mt={MAP.y - LOGO_END}
      />

      <div
        role="group"
        aria-label={t("Select Your Region")}
        className="flex flex-col w-full"
      >
        {failed ? (
          <>
            <PickerNote mt={rowsTop} testId="country-load-failed">
              {t("The country list could not be loaded")}
            </PickerNote>
            <PickerNote mt={4} testId="country-retry" onTap={onRetry}>
              {t("Try again")}
            </PickerNote>
          </>
        ) : countries.length === 0 ? (
          [0, 1, 2, 3].map((i) => (
            <div
              key={i}
              data-pw="demo-picker-country-skeleton"
              aria-hidden="true"
              className="shrink-0"
              style={{
                marginTop: i === 0 ? rowsTop : 4,
                marginInlineStart: 12,
                width: fill(12),
                height: 60,
              }}
            >
              <Skeleton borderRadius="15px" />
            </div>
          ))
        ) : (
          countries.map((c, i) => (
            <CountryRow
              key={c.id}
              country={c}
              on={c.id === chosen}
              label={t(c.name as DemoKey)}
              mt={i === 0 ? rowsTop : 4}
              testId={`demo-picker-country-${c.id}`}
              onPick={() => pick(c.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * A row of the picker with words only, in the row's box: the message when the
 * list could not be read (no tap), and "Try again" under it (a button, in the
 * blue of a link).
 */
function PickerNote({
  children,
  mt,
  testId,
  onTap,
}: {
  children: React.ReactNode;
  mt: number;
  testId: string;
  onTap?: () => void;
}) {
  const box: React.CSSProperties = {
    marginTop: mt,
    marginInlineStart: 12,
    width: fill(12),
    height: 60,
    borderRadius: 15,
    background: C.card,
  };
  if (!onTap)
    return (
      <div
        data-pw={testId}
        role="status"
        className="relative flex items-center justify-center shrink-0"
        style={box}
      >
        <Txt size={14}>{children}</Txt>
      </div>
    );
  return (
    <button
      type="button"
      data-pw={testId}
      onClick={onTap}
      className="relative flex items-center justify-center shrink-0 cursor-pointer"
      style={box}
    >
      <Txt size={14} color={C.blue}>
        {children}
      </Txt>
      <Stroke color={C.line} radius={15} visible />
    </button>
  );
}

/**
 * The map, from countryMap.svg: one `<path id>` per country with no paint of
 * its own. Each `<use>` gives its country the fill and the line. A second set
 * of `<use>` draws only the chosen one's purple line, over all the others, so
 * the neighbours' grey lines never cover it.
 *
 * The chosen country fills with a radial gradient, in the country's own box:
 * a grey disc that grows from the tap (FILL), with a soft edge (FILL_EDGE). Once it
 * covers the country, the fill is the plain grey of `– 15`. Its purple line
 * fades in over the same time. With "reduce motion" on, or for a country
 * marked before any tap (`instant`), the grey and the line come at once.
 *
 * A country no tap may pick (not in the rows, or outside `only`) takes no tap
 * and shows no hand cursor.
 *
 * The map keeps the file's width (406.5) on a 430 px phone, and its distance
 * to both edges on a narrower one; its height follows its width.
 */
function CountryMap({
  chosen,
  instant,
  from,
  canPick,
  onPick,
  mt,
}: {
  chosen: string | null;
  instant: boolean;
  from: FillFrom;
  canPick: (id: string) => boolean;
  onPick: (id: string, at: FillFrom) => void;
  mt: number;
}) {
  const calm = useReducedMotion();
  const grey = useRef<SVGStopElement>(null);
  const edge = useRef<SVGStopElement>(null);
  const [filled, setFilled] = useState(Boolean(chosen) && instant);

  useEffect(() => {
    if (!chosen) return;
    if (calm || instant) {
      setFilled(true);
      return;
    }
    setFilled(false);
    // The disc's edge, as a share of the gradient's radius. Past 1 the
    // whole box is grey, from any start.
    const run = animate(0, 1.05, {
      ...FILL,
      onUpdate: (at) => {
        grey.current?.setAttribute("offset", String(at));
        edge.current?.setAttribute("offset", String(at + FILL_EDGE));
      },
      onComplete: () => setFilled(true),
    });
    return () => run.stop();
  }, [chosen, calm, instant]);

  /** Where in the country's box the tap landed, as shares of the box. */
  const tapIn = (e: React.MouseEvent<SVGUseElement>): FillFrom => {
    const use = e.currentTarget;
    const svg = use.ownerSVGElement;
    const matrix = svg?.getScreenCTM()?.inverse();
    let box: DOMRect | null = null;
    try {
      box = use.getBBox();
    } catch {
      box = null;
    }
    if (!svg || !matrix || !box || !box.width || !box.height) return MIDDLE;
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix);
    const share = (v: number) => Math.min(1, Math.max(0, v));
    return {
      x: share((point.x - box.x) / box.width),
      y: share((point.y - box.y) / box.height),
    };
  };

  return (
    <svg
      data-pw="demo-country-map"
      aria-hidden="true"
      viewBox={`${MAP.x} ${MAP.y} ${MAP.w} ${MAP.h}`}
      className="block self-center shrink-0"
      style={{
        marginTop: mt,
        width: `min(${MAP.w}px, calc(100% - ${MAP.x * 2}px))`,
        aspectRatio: `${MAP.w} / ${MAP.h}`,
        overflow: "visible",
      }}
    >
      {chosen && !filled && (
        <defs>
          {/* r 1.5: the disc covers the box from any corner (its diagonal is 1.42). */}
          <radialGradient
            id="demo-country-fill"
            cx={from.x}
            cy={from.y}
            fx={from.x}
            fy={from.y}
            r={1.5}
          >
            <stop ref={grey} offset={0} stopColor={C.grey} />
            <stop ref={edge} offset={FILL_EDGE} stopColor={EMPTY} />
          </radialGradient>
        </defs>
      )}
      {MAP_ORDER.map((id) => {
        const on = id === chosen;
        const tappable = canPick(id);
        return (
          <use
            key={id}
            href={`${MAP_FILE}#${id}`}
            data-pw={`demo-country-map-${id}`}
            data-on={on || undefined}
            fill={!on ? EMPTY : filled ? C.grey : "url(#demo-country-fill)"}
            stroke={on ? C.purple : C.line}
            strokeWidth={0.5}
            onClick={tappable ? (e) => onPick(id, tapIn(e)) : undefined}
            style={{
              cursor: tappable ? "pointer" : undefined,
              transition: `stroke ${FILL.duration}s`,
            }}
          />
        );
      })}
      {MAP_ORDER.map((id) => (
        <use
          key={`line-${id}`}
          href={`${MAP_FILE}#${id}`}
          fill="none"
          stroke={C.purple}
          strokeWidth={0.5}
          pointerEvents="none"
          style={{
            opacity: id === chosen ? 1 : 0,
            transition: calm || instant ? undefined : `opacity ${FILL.duration}s`,
          }}
        />
      ))}
    </svg>
  );
}
