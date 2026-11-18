"use client";

import React, { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import { demoAsset } from "../../DemoApp/demoAssetVersion";
import type { DemoCountry } from "../../DemoApp/DemoData";
import { COUNTRIES } from "../../DemoApp/demoPlaces";
import { useDemoNav } from "../Demo1Shell";
import { C, SAFE_TOP, STATUS_BAR } from "../demo1Layout";
import { Rich } from "./ListingParts";
import { usePageColor } from "../ui";
import CountryRow from "./CountryRow";

/**
 * The country picker that opens the demo: XD `Ramaaz pay signin – 16` (no
 * country yet) and `– 15` (Turkiye chosen).
 *
 * From the top (design y, the status bar is the window's own):
 *  - the pill ". Your new shopping buddy ." at y 56: 206 x 30, radius 12,
 *    `#F8F7FF`, the words 14 Regular from x 124, "shopping buddy" Medium, the
 *    two dots `#4A31E7`;
 *  - the logo with the purple eyes, 150 x 150 at (140, 98);
 *  - the map of the four countries, 406.5 x 286.5 at (11.75, 287.75). Each
 *    country is `#F4F4F4` with a 0.5 px `#D3D3D3` line; the chosen one is
 *    `#8D8D8D` with a `#4A31E7` line (`– 15`);
 *  - the four rows from y 594, 4 apart (CountryRow, as the address form's
 *    country sheet).
 *
 * A tap on a row, or on a country of the map, chooses it. The grey fills the
 * country on the map from the tap (FILL), then the page shows the choice
 * (`– 15`) until HOLD_MS, and hands it to the shell, which opens the app.
 *
 * The page is in the document, as every screen of /demo, so it scrolls on a
 * short phone and Safari 26 draws it under its glass bar.
 */

/**
 * The chosen country's fill on the map: the grey spreads from the tap (from
 * the country's middle for a tap on a row) to the whole country, in seconds.
 */
const FILL = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

/** The fill's soft edge, as a share of the gradient's radius. */
const FILL_EDGE = 0.02;

/**
 * How long after the tap the app opens, in ms: the fill, then a moment on
 * the finished choice (`– 15`).
 */
export const HOLD_MS = 1000;

/** Where the fill starts, as a share of the country's box (0 to 1 on each side). */
type FillFrom = { x: number; y: number };

/** The country's middle: where a tap on a row starts the fill. */
const MIDDLE: FillFrom = { x: 0.5, y: 0.5 };

/** The map's box in the file, in design px: its viewBox, and where it sits. */
const MAP = { x: 11.75, y: 287.75, w: 406.5, h: 286.5 } as const;

/** The countries in the file's order on the map: Turkiye last, so it lies on top. */
const MAP_ORDER: DemoCountry[] = ["sy", "lb", "iq", "tr"];

const MAP_FILE = demoAsset("/assets/demo/xd/countryMap.svg");

/** A country on the map that is not chosen: `#F4F4F4`, as the file fills it. */
const EMPTY = "#F4F4F4";

export default function CountryPickerScreen({
  onDone,
}: {
  /** Called once, HOLD_MS after a country is chosen. */
  onDone: (country: DemoCountry) => void;
}) {
  const { t } = useDemoNav();
  usePageColor(C.white);
  const [picked, setPicked] = useState<DemoCountry | null>(null);
  const [from, setFrom] = useState<FillFrom>(MIDDLE);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const pick = (id: DemoCountry, at: FillFrom = MIDDLE) => {
    // The first choice wins: the app is already on its way.
    if (picked) return;
    setFrom(at);
    setPicked(id);
    timer.current = setTimeout(() => onDone(id), HOLD_MS);
  };

  return (
    <div
      data-pw="demo-country-picker"
      className="flex flex-col w-full"
      style={{
        minHeight: "100dvh",
        background: C.white,
        paddingTop: SAFE_TOP,
        // The last row ends at y 846; the artboard at 932.
        paddingBottom: 932 - 846,
      }}
    >
      {/* The pill: the words' line box (18) is centred in its 30 px. The
          words start at x 124, 12 px in, as in the file. The browser draws
          them about 2 px wider than XD, so the pill keeps the file's 206
          (minWidth) and leaves 8 px on the right. A longer line (another
          language) makes the pill wider. */}
      <span
        data-pw="demo-country-picker-tagline"
        className="flex items-center self-center shrink-0 whitespace-nowrap"
        style={{
          marginTop: 56 - STATUS_BAR,
          height: 30,
          minWidth: 206,
          paddingLeft: 124 - 112,
          paddingRight: 8,
          borderRadius: 12,
          background: "#F8F7FF",
          color: C.ink,
          fontSize: 14,
          lineHeight: "18px",
        }}
      >
        {/* One inline box: a flex box would drop the spaces between the parts. */}
        <span>
          <span style={{ color: C.purple }}>.</span>{" "}
          <Rich text={t("Your new <m>shopping buddy</m>")} />{" "}
          <span style={{ color: C.purple }}>.</span>
        </span>
      </span>

      <XdIcon
        name="countryLogo"
        className="self-center shrink-0"
        style={{ marginTop: 98 - (56 + 30) }}
      />

      <CountryMap
        picked={picked}
        from={from}
        onPick={pick}
        mt={MAP.y - (98 + 150)}
      />

      <div
        role="group"
        aria-label={t("Select Your Region")}
        className="flex flex-col w-full"
      >
        {COUNTRIES.map((c, i) => (
          <CountryRow
            key={c.id}
            country={c}
            on={c.id === picked}
            label={t(c.name)}
            mt={i === 0 ? 594 - (MAP.y + MAP.h) : 4}
            testId={`demo-picker-country-${c.id}`}
            onPick={() => pick(c.id)}
          />
        ))}
      </div>
    </div>
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
 * fades in over the same time. With "reduce motion" on, the grey and the line
 * come at once.
 *
 * The map keeps the file's width (406.5) on a 430 px phone, and its distance
 * to both edges on a narrower one; its height follows its width.
 */
function CountryMap({
  picked,
  from,
  onPick,
  mt,
}: {
  picked: DemoCountry | null;
  from: FillFrom;
  onPick: (id: DemoCountry, at: FillFrom) => void;
  mt: number;
}) {
  const calm = useReducedMotion();
  const grey = useRef<SVGStopElement>(null);
  const edge = useRef<SVGStopElement>(null);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (!picked) return;
    if (calm) {
      setFilled(true);
      return;
    }
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
  }, [picked, calm]);

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
      {picked && !filled && (
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
        const on = id === picked;
        return (
          <use
            key={id}
            href={`${MAP_FILE}#${id}`}
            data-pw={`demo-country-map-${id}`}
            data-on={on || undefined}
            fill={!on ? EMPTY : filled ? C.grey : "url(#demo-country-fill)"}
            stroke={on ? C.purple : C.line}
            strokeWidth={0.5}
            onClick={(e) => onPick(id, tapIn(e))}
            style={{
              cursor: "pointer",
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
            opacity: id === picked ? 1 : 0,
            transition: calm ? undefined : `opacity ${FILL.duration}s`,
          }}
        />
      ))}
    </svg>
  );
}
