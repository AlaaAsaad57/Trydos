"use client";

import React from "react";
import XdIcon from "./XdIcon";
import type { XdIconName } from "./xdIcons";
import { C, lineBox } from "./demoLayout";

/**
 * The building blocks every demo screen is drawn with.
 *
 * All numbers are design px from the XD file. A screen is laid out like a
 * page: blocks stack in a column or sit in a row, and the space between them
 * is a margin or a padding with the file's number. Where the file puts two
 * blocks 4 px apart, the second one has `mt={4}`. Only layers that sit ON
 * something are positioned: a line over a box, a sheet over the page, the
 * header, and a button pinned to the bottom of the screen.
 *
 * Text is placed by the BASELINE the XD file stores: a line box of
 * `lineBox(size)` puts the baseline exactly `size` below the box top, so the
 * margin above a text is `textTop(baseline, size)` minus the bottom of the
 * block above it (`gapTo` in demoLayout.ts).
 */

export type Weight = "light" | "regular" | "medium" | "semibold" | "bold";

const WEIGHT_CLASS: Record<Weight, string> = {
  light: "font-light",
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

/** Moves a centred block `nudge` px right (or left) by padding one side. */
const offCentre = (nudge: number): React.CSSProperties =>
  nudge > 0
    ? { paddingLeft: nudge * 2 }
    : nudge < 0
      ? { paddingRight: -nudge * 2 }
      : {};

/**
 * A line on the inside of a box's edge, the way XD strokes a shape.
 *
 * Drawn as SVG and not as an `inset` box-shadow: Safari draws a 0.5 px inset
 * shadow with thick, dark straight edges and heavy corners, and the gaps
 * between lined boxes then look uneven. The SVG line is even all round and
 * matches the file in Safari and Chrome. The stroke is centred on the box's
 * edge at twice the width, and the half outside the box is clipped away.
 *
 * Put it last in a box that is `relative` (or positioned), so it is drawn over
 * a picture in the box.
 *
 * `align="center"` is XD's other stroke: the line sits ON the edge, half of it
 * outside the box (the cards of the cash-out sheet, `Home Page – 21`). Nothing
 * is clipped then, and the SVG lets the outer half show.
 */
export function Stroke({
  color,
  width = 0.5,
  radius = 0,
  visible = true,
  align = "inside",
  dash,
}: {
  color: string;
  width?: number;
  radius?: number;
  /** Fades the line out (0.3 s) instead of removing it. */
  visible?: boolean;
  align?: "inside" | "center";
  /** XD's dashed line, as "dash gap" in px ("3 3" on `Home Page – 30`). */
  dash?: string;
}) {
  const id = `demo-stroke-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const centred = align === "center";
  return (
    <svg
      aria-hidden="true"
      data-stroke={color}
      data-stroke-align={align}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s",
        overflow: centred ? "visible" : undefined,
      }}
    >
      {!centred && (
        <defs>
          <clipPath id={id}>
            <rect width="100%" height="100%" rx={radius} />
          </clipPath>
        </defs>
      )}
      <rect
        width="100%"
        height="100%"
        rx={radius}
        fill="none"
        stroke={color}
        strokeWidth={centred ? width : width * 2}
        strokeDasharray={dash}
        clipPath={centred ? undefined : `url(#${id})`}
        style={{ transition: "stroke 0.3s" }}
      />
    </svg>
  );
}

/**
 * One line of text in the flow, with a line box that puts its baseline where
 * the file does (see `lineBox`).
 *
 * `center` centres it on the full width of its column. The file centres
 * titles by eye; `nudge` moves a centred line that many px right (+) or left.
 */
export function Txt({
  size,
  weight = "regular",
  color = C.ink,
  center = false,
  nudge = 0,
  mt,
  ml,
  width,
  className = "",
  style,
  children,
  as: Tag = "span",
  ...rest
}: {
  size: number;
  weight?: Weight;
  color?: string;
  center?: boolean;
  nudge?: number;
  /** Margin above, in design px. */
  mt?: number;
  /** Margin on the left, in design px. */
  ml?: number;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  as?: "span" | "p" | "h1" | "h2" | "label";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      {...rest}
      className={`block shrink-0 ${width ? "" : "whitespace-nowrap"} ${WEIGHT_CLASS[weight]} ${className}`}
      style={{
        fontSize: size,
        lineHeight: `${lineBox(size)}px`,
        color,
        marginTop: mt,
        marginLeft: ml,
        width,
        ...(center
          ? { alignSelf: "stretch", textAlign: "center", ...offCentre(nudge) }
          : {}),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/** A box in the flow: its size, its margins and the fill / line / radius XD gives it. */
export function Box({
  w,
  h,
  mt,
  ml,
  fill,
  stroke,
  strokeWidth = 0.5,
  strokeVisible = true,
  strokeAlign = "inside",
  strokeDash,
  radius = 0,
  className = "",
  style,
  children,
  ...rest
}: {
  w: number | string;
  h: number;
  mt?: number;
  ml?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeVisible?: boolean;
  strokeAlign?: "inside" | "center";
  strokeDash?: string;
  radius?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={`relative shrink-0 ${className}`}
      style={{
        width: w,
        height: h,
        marginTop: mt,
        marginLeft: ml,
        background: fill,
        borderRadius: radius,
        ...style,
      }}
    >
      {children}
      {stroke && (
        <Stroke
          color={stroke}
          width={strokeWidth}
          radius={radius}
          visible={strokeVisible}
          align={strokeAlign}
          dash={strokeDash}
        />
      )}
    </div>
  );
}

/** An icon in the flow, with its margins. */
export function Icon({
  name,
  mt,
  ml,
  size,
  style,
}: {
  name: XdIconName;
  mt?: number;
  ml?: number;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <XdIcon
      name={name}
      size={size}
      className="shrink-0"
      style={{ marginTop: mt, marginLeft: ml, ...style }}
    />
  );
}
