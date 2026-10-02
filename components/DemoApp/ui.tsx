"use client";

import React from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useIsTouchDevice } from "hooks/useIsTouchDevice";
import XdIcon from "./XdIcon";
import { XD_ICON_SIZE, type XdIconName } from "./xdIcons";
import type { DemoKey } from "./demoKeys";
import {
  BANNER,
  BODY_Y,
  C,
  CTA,
  DESIGN_W,
  HEADER,
  ROW,
  SHEET,
  STATUS_BAR,
  bottom,
  headerTop,
  lineBox,
  paraTop,
  top,
} from "./demoLayout";

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

/**
 * A paragraph, drawn the way the file draws it.
 *
 * XD stores the x of every line of a centred text, worked out with its own
 * font widths. The browser's widths are a fraction different, and XD also
 * counts a line's closing space when it centres it, so the browser's centred
 * lines landed 1 to 2 px off the file's. When `text` is the file's own words
 * (English), each of the file's `lines` is drawn from its x instead, which is
 * exactly where the file puts it, with the file's own line breaks. Any other
 * text (another language) wraps as a normal paragraph in `width`.
 *
 * `left` is the design x where the paragraph's box starts; a line's margin is
 * its x minus `left`.
 */
export function FileLines({
  text,
  lines,
  left,
  width,
  size,
  lineHeight,
  color = C.ink,
  weight = "regular",
  mt,
  ml,
  family,
  align = "center",
  testId,
  children,
}: {
  text: string;
  /**
   * The file's lines: the x, the words, and, where a line mixes weights, the
   * `node` to draw. A line with no words is an empty line of the file.
   */
  lines: { x: number; text: string; node?: React.ReactNode }[];
  left: number;
  width: number;
  size: number;
  lineHeight: number;
  color?: string;
  weight?: Weight;
  /** Margins above and left of the paragraph's box, in design px. */
  mt?: number;
  ml?: number;
  /** A font other than Quicksand (the phone's SF Pro Rounded). */
  family?: string;
  /** How another language's text is set: the file's lines are always at their x. */
  align?: "center" | "left";
  testId?: string;
  /** What another language draws, when it is more than `text` (Bold words). */
  children?: React.ReactNode;
}) {
  const plain = (t: string) => t.replace(/\s+/g, " ").trim();
  const own = plain(lines.map((line) => line.text).join(" ")) === plain(text);
  const style: React.CSSProperties = {
    marginTop: mt,
    marginLeft: ml,
    width,
    fontFamily: family,
    fontSize: size,
    lineHeight: `${lineHeight}px`,
    color,
  };
  if (!own)
    return (
      <p
        data-pw={testId}
        className={`shrink-0 ${align === "center" ? "text-center" : ""} ${WEIGHT_CLASS[weight]}`}
        style={style}
      >
        {children ?? text}
      </p>
    );
  return (
    <p
      data-pw={testId}
      className={`flex flex-col shrink-0 ${WEIGHT_CLASS[weight]}`}
      style={style}
    >
      {lines.map((line, i) => (
        <span
          key={i}
          className="block shrink-0 whitespace-pre"
          style={{ marginLeft: line.x - left, minHeight: lineHeight }}
        >
          {line.node ?? line.text.trimEnd()}
        </span>
      ))}
    </p>
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

/**
 * The page of an inner screen: the header strip, then a box that scrolls.
 *
 * The scroll box starts at design y `scrollTop` (the bottom of the header,
 * 100, on most screens), and the screen's blocks stack down from there. So the
 * first block's `mt` is its design y minus `scrollTop`: the banner at 100 has
 * none, a row at 120 has `mt={20}`. `contentHeight` is the design y where the
 * page ends (932 for a screen that fits, 1129 for the tall profile page).
 */
export function ScreenPage({
  header,
  children,
  footer,
  contentHeight = 932,
  bg = C.white,
  scrollTop = BODY_Y,
  glass,
  testId,
}: {
  /**
   * A CSS filter for the page and its header while a glass layer lies over
   * them (the receipt, `Home Page – 18`). The page itself is blurred, not the
   * layer's backdrop: in a window shorter than the artboard Chrome's
   * `backdrop-filter` kept the purple cards strong at the canvas's edges.
   */
  glass?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
  /** Pinned to the bottom (the wide button). Drawn over the scroll box. */
  footer?: React.ReactNode;
  /** The design y where the page ends. */
  contentHeight?: number;
  bg?: string;
  /** Design y where the scroll box begins. */
  scrollTop?: number;
  testId?: string;
}) {
  return (
    <div
      data-pw={testId}
      className="absolute inset-0 font-quicksand"
      style={{ background: bg }}
    >
      <div
        className="absolute inset-0"
        style={{ filter: glass, transition: "filter 0.25s" }}
      >
        <div
          className="absolute left-0 w-full overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ top: top(scrollTop), bottom: 0, scrollbarWidth: "none" }}
        >
          <div
            className="flex flex-col w-full"
            style={{ minHeight: contentHeight - scrollTop }}
          >
            {children}
          </div>
        </div>
        {header}
      </div>
      {footer}
    </div>
  );
}

/**
 * The header of every inner screen: a white 50 px strip with the back arrow,
 * a centred title and, on some screens, "Cancel" or "Edit" on the right.
 *
 * Three columns: the two sides share what is left equally, so the title in the
 * middle is centred on the screen whatever sits beside it. Everything is
 * centred on the strip's height, which puts the 16 px title on baseline 81,
 * the 14 px crumb on 80 and the 21 px arrow at y 64.5 — the file's numbers.
 *
 * `crumb` draws the "Profile | Personal Info" form: the first part Regular, the
 * second Medium, both 14, and an 18 px icon 4 px after the text. The text is
 * what is centred — the icon trails it, exactly as the file has it.
 */
export function ScreenHeader({
  title,
  crumb,
  icon,
  action,
  onBack,
  onAction,
  shadow = false,
  nudge = 0,
  small = false,
  t,
}: {
  title?: DemoKey;
  /**
   * Draw `title` in the crumb's type — 14 Medium on the crumb baseline, like
   * "Address" in "Profile | Address" — for a one-word screen that sits beside
   * the profile pages (cart, chat).
   */
  small?: boolean;
  crumb?: [DemoKey, DemoKey];
  icon?: XdIconName;
  action?: DemoKey;
  onBack?: () => void;
  onAction?: () => void;
  shadow?: boolean;
  /**
   * How far the file puts the title off true centre, in px (+ is right). The
   * file centres titles by eye, so each screen's English title sits up to 2 px
   * off; this moves it to the file's x and keeps it centred in other languages.
   */
  nudge?: number;
  t: (key: DemoKey) => string;
}) {
  return (
    <header
      className="absolute left-0 w-full font-quicksand z-10 grid items-center"
      style={{
        top: headerTop(HEADER.y),
        height: HEADER.height,
        gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
        background: C.white,
        boxShadow: shadow ? "0 0 3px rgba(0,0,0,0.1)" : undefined,
      }}
    >
      {onBack && (
        <button
          type="button"
          data-pw="demo-back"
          aria-label={t("Back")}
          onClick={onBack}
          className="flex items-center justify-center justify-self-start cursor-pointer active:opacity-60 transition-opacity"
          // A 44 px target round the 12 x 21 arrow at (23.5, 64.5).
          style={{
            gridColumn: 1,
            gridRow: 1,
            marginLeft: 7.5,
            width: 44,
            height: HEADER.height,
          }}
        >
          <XdIcon name="back" />
        </button>
      )}
      {title && (
        <h1
          className="font-medium whitespace-nowrap pointer-events-none"
          style={{
            gridColumn: 2,
            gridRow: 1,
            fontSize: small ? 14 : 16,
            lineHeight: `${lineBox(small ? 14 : 16)}px`,
            color: C.ink,
            ...offCentre(nudge),
          }}
        >
          {t(title)}
        </h1>
      )}
      {crumb && (
        <h1
          className="flex items-start whitespace-nowrap pointer-events-none"
          style={{
            gridColumn: 2,
            gridRow: 1,
            fontSize: 14,
            lineHeight: `${lineBox(14)}px`,
            color: C.ink,
            ...offCentre(nudge),
          }}
        >
          <span className="font-normal whitespace-pre">{`${t(crumb[0])} | `}</span>
          <span className="font-medium">{t(crumb[1])}</span>
          {icon && (
            // 4 px after the text, its top on the text's top (design y 66).
            // The negative right margin keeps the icon out of the width that
            // is centred.
            <XdIcon
              name={icon}
              className="shrink-0"
              style={{
                marginLeft: 4,
                marginRight: -(4 + XD_ICON_SIZE[icon].w),
              }}
            />
          )}
        </h1>
      )}
      <AnimatePresence>
        {action && (
          <motion.button
            key={action}
            type="button"
            data-pw="demo-header-action"
            onClick={onAction}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="justify-self-end font-light cursor-pointer active:opacity-60"
            style={{
              gridColumn: 3,
              gridRow: 1,
              marginRight: 20,
              fontSize: 16,
              lineHeight: `${lineBox(16)}px`,
              color: C.ink,
            }}
          >
            {t(action)}
          </motion.button>
        )}
      </AnimatePresence>
    </header>
  );
}

/**
 * The grey note under the header on the profile forms: 48 tall, the 25 px
 * info mark at (11.5, 111.5), the text from x 48 with its first baseline
 * on 119 and 16 px between lines.
 */
export function InfoBanner({
  t,
  purple = false,
}: {
  t: (key: DemoKey) => string;
  purple?: boolean;
}) {
  const icon = purple ? "infoBannerPurple" : "infoBanner";
  return (
    <Box
      w={DESIGN_W}
      h={BANNER.height}
      fill={C.field}
      stroke={C.line}
      className="flex items-start"
    >
      <Icon name={icon} mt={11.5} ml={11.5} />
      <p
        className="shrink-0 font-normal"
        style={{
          marginTop: paraTop(119, 11, 16) - BANNER.y,
          marginLeft: 48 - 11.5 - XD_ICON_SIZE[icon].w,
          width: 370,
          fontSize: 11,
          lineHeight: "16px",
          color: C.grey,
        }}
      >
        {t(
          "Entering your information correctly allows us to provide you with better service and benefit from all services.",
        )}
      </p>
    </Box>
  );
}

/**
 * A 406 x 55 field: a 12 px label on baseline +20 and a 14 px value on +43.
 * The label box starts 8 px down (20 - 12), 12 px in.
 *
 * Two looks in the file. Editing (`88`, `93`): white with a 0.5 `#D3D3D3`
 * line. Saved (`92`, `99`): `#FCFCFC` and no line.
 *
 * In use — its input has focus, or `focused` (its sheet is open) — the label
 * is Medium and the line is the site's blue `#388CFF`. A product rule: the
 * file draws the field in use like the others. An input that is read-only
 * (Personal Info before "Edit") does not count as in use.
 */
export function Field({
  mt,
  label,
  ml = ROW.x,
  w = ROW.width,
  editing,
  line = false,
  focused = false,
  children,
  onClick,
  testId,
  className = "",
  ...rest
}: {
  mt?: number;
  label: string;
  ml?: number;
  w?: number;
  editing: boolean;
  /** Keep the line on a filled field (the address form until it is complete). */
  line?: boolean;
  /** In use without an input of its own: a field whose sheet is open. */
  focused?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  testId?: string;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  // Focus events bubble up from the field's input.
  const [typing, setTyping] = React.useState(false);
  const inUse = focused || typing;
  return (
    <Box
      {...rest}
      mt={mt}
      ml={ml}
      w={w}
      h={55}
      radius={ROW.radius}
      fill={editing ? C.white : C.card}
      stroke={inUse ? C.blue : C.line}
      strokeVisible={inUse || editing || line}
      onClick={onClick}
      onFocus={(e) =>
        setTyping(e.target instanceof HTMLInputElement && !e.target.readOnly)
      }
      onBlur={() => setTyping(false)}
      data-pw={testId}
      className={`flex flex-col transition-[background-color] duration-300 ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{ padding: "8px 12px 0" }}
    >
      <Txt size={12} color={C.label} weight={inUse ? "medium" : "regular"}>
        {label}
      </Txt>
      {children}
    </Box>
  );
}

/**
 * The value line of a field: an input when editing, the text when saved.
 * Its box is 23 tall from 26 px down the field (3 under the label), which puts
 * the 14 px text on the field's baseline +43.
 */
export function FieldInput({
  value,
  placeholder,
  onChange,
  editing,
  color = C.ink,
  inputMode,
  type = "text",
  onFocus,
  onBlur,
  testId,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  editing: boolean;
  color?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  testId?: string;
}) {
  return (
    <input
      data-pw={testId}
      type={type}
      value={value}
      readOnly={!editing}
      inputMode={inputMode}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      className="block shrink-0 bg-transparent outline-none font-normal placeholder:text-[#D3D3D3]"
      style={{
        marginTop: 3,
        width: 406 - 24,
        height: 23,
        fontSize: 14,
        color,
        padding: 0,
        border: 0,
      }}
    />
  );
}

/** The wide button at the bottom of a form, 390 x 60, centred, 36 above the bottom. */
export function WideButton({
  label,
  onClick,
  fill = C.purple,
  color = C.white,
  weight = "regular",
  visible = true,
  testId,
}: {
  label: string;
  onClick: () => void;
  fill?: string;
  color?: string;
  weight?: Weight;
  visible?: boolean;
  testId?: string;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          data-pw={testId}
          onClick={onClick}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          whileTap={{ scale: 0.98 }}
          className={`absolute inset-x-0 mx-auto cursor-pointer font-quicksand ${WEIGHT_CLASS[weight]}`}
          style={{
            bottom: bottom(CTA.y, CTA.height),
            width: CTA.width,
            height: CTA.height,
            borderRadius: CTA.radius,
            background: fill,
            color,
            fontSize: 16,
            zIndex: 5,
          }}
        >
          {label}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/** A 406 x 60 list row: the icon 12 px in, centred on the row, then the 14 px label. */
export function MenuRow({
  mt,
  icon,
  iconSize,
  label,
  textX,
  onClick,
  testId,
}: {
  mt: number;
  icon: XdIconName;
  /** 18 on the profile page, 30 on the profile menu. */
  iconSize: 18 | 30;
  label: string;
  /** The label's design x. */
  textX: number;
  onClick?: () => void;
  testId?: string;
}) {
  return (
    <motion.button
      type="button"
      data-pw={testId}
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className="flex items-center shrink-0 cursor-pointer text-left"
      style={{
        marginTop: mt,
        marginLeft: ROW.x,
        width: ROW.width,
        height: 60,
        borderRadius: ROW.radius,
        background: C.card,
      }}
    >
      <Icon name={icon} ml={12} />
      <Txt size={14} ml={textX - ROW.x - 12 - iconSize}>
        {label}
      </Txt>
    </motion.button>
  );
}

/**
 * Paints the room round the canvas while a layer is open.
 *
 * The canvas does not always fill the window: on a window taller or wider
 * than the artboard it is centred, and `#app-outer` (white) shows round it.
 * A dark layer inside the canvas cannot reach out there, so the white showed
 * as a strip above the dimmed page. This gives `#app-outer` the colour the
 * layer has at the canvas's edge, and takes it back when the layer closes.
 *
 * Only the column the canvas stands in is painted. On a wide window the room
 * left and right of the canvas stays white, as it is on every other screen.
 *
 * `top` is the layer's colour at the top of the screen. Safari 26 on the
 * iPhone paints its own top area (the clock and the battery) in the
 * background colour of a fixed element at the top edge, not from
 * `theme-color`. `#app-outer` is such an element, and it stays white under
 * the painted column, so the top area stayed white over a dimmed page. A
 * thin fixed strip in `top` gives Safari the layer's colour while it is open.
 */
export function useOuterBackdrop(open: boolean, paint: string, top: string) {
  // 1 px narrower on each side than the canvas, so no sliver of it shows
  // beside the canvas where the two edges round differently.
  // The fallback background-color is `top` so Safari's modern sampling engine
  // samples `top` instead of white across the entire viewport.
  const background = `${paint} calc(var(--app-canvas-left, 0px) + 1px) 0 / calc(${DESIGN_W}px * var(--app-scale, 1) - 2px) 100% no-repeat ${top}`;
  React.useEffect(() => {
    if (!open) return;
    const outer = document.getElementById("app-outer");
    const demoApp = document.querySelector<HTMLElement>('[data-pw="demo-app"]');
    const beforeOuter = outer?.style.background ?? "";
    const beforeOuterBg = outer?.style.backgroundColor ?? "";
    const beforeDemoAppBg = demoApp?.style.backgroundColor ?? "";
    const beforeBody = document.body.style.backgroundColor;
    const beforeHtml = document.documentElement.style.backgroundColor;
    if (outer) {
      outer.style.background = background;
      outer.style.backgroundColor = top;
    }
    if (demoApp) {
      demoApp.style.backgroundColor = top;
    }
    document.body.style.backgroundColor = top;
    document.documentElement.style.backgroundColor = top;

    // Safari 15+ native mobile topbar theme-color API
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    const beforeMeta = meta.content;
    meta.content = top;

    return () => {
      if (outer) {
        outer.style.background = beforeOuter;
        outer.style.backgroundColor = beforeOuterBg;
      }
      if (demoApp) {
        demoApp.style.backgroundColor = beforeDemoAppBg;
      }
      document.body.style.backgroundColor = beforeBody;
      document.documentElement.style.backgroundColor = beforeHtml;
      if (created) meta?.remove();
      else if (meta) meta.content = beforeMeta;
    };
  }, [open, background, top]);
  React.useEffect(() => {
    if (!open) return;
    const strip = document.createElement("div");
    strip.dataset.pw = "demo-top-tint";
    // Over the entire viewport width and safe-area-inset-top so Safari paints
    // the native status bar and dynamic island area in the backdrop colour.
    Object.assign(strip.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "max(59px, env(safe-area-inset-top, 59px))",
      backgroundColor: top,
      background: top,
      pointerEvents: "none",
      zIndex: "2147483647",
    });
    const targetParent =
      document.querySelector<HTMLElement>('[data-pw="demo-app"]') || document.body;
    targetParent.appendChild(strip);
    return () => strip.remove();
  }, [open, top]);
}

/** `#1D1D1D` at 90% over the white page: what a dimmed page looks like. */
export const DIMMED = "rgb(52, 52, 52)";
/** Round an open sheet: the dimmed page above it, the white sheet below it. */
const ROUND_A_SHEET = `linear-gradient(to bottom, ${DIMMED} 50%, ${C.white} 50%)`;

/**
 * The height the page does not have, in design px (`--xd-flex-deficit`, set
 * by AppScaler). 0 on a full-height phone, up to 200 on a short window.
 */
function useDeficit(watch: boolean) {
  const [deficit, setDeficit] = React.useState(0);
  React.useEffect(() => {
    if (!watch) return;
    const read = () =>
      setDeficit(
        Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--xd-flex-deficit",
          ),
        ) || 0,
      );
    read();
    // AppScaler fits on the same event, a tick later.
    const onResize = () => setTimeout(read, 50);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [watch]);
  return deficit;
}

/**
 * The design y where the canvas ends: 932 on a full-height phone, less on a
 * short one (the canvas is the artboard from y 50, less the deficit).
 */
export function useCanvasEnd(watch: boolean) {
  return STATUS_BAR + 932 - useDeficit(watch);
}

/**
 * The bottom sheet: the page dims to `#1D1D1D` at 90%, and a white sheet with
 * 30 px top corners and a 40 x 2 `#C4C2C2` handle slides up from the bottom.
 * The same sheet the login uses for its QR code (QrBottomSheet).
 *
 * The content stacks under the handle, which ends 13 px below the sheet's top
 * edge (design y `y + 13`). So the first block's `mt` is its design y minus
 * `y + 13`.
 *
 * `lower` is for a sheet with two steps of different height (cash out,
 * `Home Page – 21` then `– 19`): the sheet is laid out at the taller step's
 * `y` and rests `lower` px further down for the shorter one. Changing `lower`
 * moves the open sheet on the same spring it rises with.
 *
 * `fit` is for a sheet that fills the artboard to its bottom (the wallet
 * sheets). On a window shorter than the artboard the canvas is shorter too,
 * and such a sheet lost its bottom rows. A `fit` sheet stays at its design
 * `y`, so the dimmed page above it stays in view as in the file, and its
 * content keeps the file's spacing; what does not fit scrolls inside the
 * sheet. The sheet is then dragged by its top strip only, so a finger on the
 * content scrolls it.
 *
 * The wallet sheets do not scroll as a whole. Each step is as tall as the
 * canvas lets it be, keeps its head (the handle, the title row and its tabs)
 * in place, and scrolls only the part under the head (see `Under`).
 */
export function Sheet({
  open,
  onClose,
  y,
  lower = 0,
  radius = SHEET.radius,
  fit = false,
  outline,
  children,
  testId,
  onEntered,
}: {
  open: boolean;
  onClose: () => void;
  /** Stay at `y` on a short canvas, and scroll what does not fit. */
  fit?: boolean;
  /** Called once the sheet has finished rising. */
  onEntered?: () => void;
  /** Design y of the sheet's top edge. */
  y: number;
  /** How far under `y` the sheet rests, in design px. */
  lower?: number;
  /** The top corners: 30 in the file's pickers, 50 on the wallet sheets. */
  radius?: number;
  /**
   * A 0.5 px line inside the sheet's edge, in this colour. Only the sheet
   * over another sheet has one (`Home Page – 39`, `#707070`).
   */
  outline?: string;
  children: React.ReactNode;
  testId?: string;
}) {
  useOuterBackdrop(open, ROUND_A_SHEET, DIMMED);
  const touch = useIsTouchDevice();
  const grip = useDragControls();
  const rest = lower;
  return (
    <AnimatePresence
      // A sheet can hold the code boxes, which make AppScaler lift the canvas
      // above the keypad. When the sheet is gone the boxes are gone too, but
      // AppScaler only re-measures on focus changes and on the anchor
      // attribute — a removed element is neither — so the page stayed lifted.
      // A focusout is the signal it already listens to for "measure again".
      // It is sent a moment later: this callback runs before React has taken
      // the sheet out of the page, and measuring then found the old boxes.
      onExitComplete={() =>
        setTimeout(() => document.dispatchEvent(new FocusEvent("focusout")), 50)
      }
    >
      {open && (
        <motion.div
          key="sheet"
          className="absolute inset-0 z-30 font-quicksand"
          data-pw={testId}
          data-no-keyboard-lift=""
        >
          {touch && (
            <style>{`
              [data-no-keyboard-lift] input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]),
              [data-no-keyboard-lift] textarea {
                pointer-events: none;
              }
            `}</style>
          )}
          <motion.div
            className="absolute inset-0"
            style={{ background: C.backdrop }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute left-0 w-full overflow-hidden"
            style={{
              // A picker is anchored to the bottom, so it keeps its
              // height on a short page. A tall sheet (the email code,
              // from y 90) keeps its top instead, or a short page
              // would push it off the top of the screen.
              // When AppScaler lifts the canvas for the keypad, a tall sheet
              // keeps its top edge where it was (the lift is added back here)
              // and only its content moves up with the canvas (below).
              ...(fit
                ? { top: top(y) }
                : y < 300
                  ? { top: `calc(${top(y)} + var(--app-keyboard-lift, 0px))` }
                  : { height: 932 - y }),
              bottom: 0,
              background: C.white,
              borderRadius: `${radius}px ${radius}px 0 0`,
            }}
            initial={{ y: "100%" }}
            animate={{ y: rest }}
            onAnimationComplete={() => onEntered?.()}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 34,
              mass: 0.9,
            }}
            drag="y"
            dragControls={fit ? grip : undefined}
            dragListener={!fit}
            dragConstraints={{ top: rest, bottom: rest }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            {fit && (
              // The strip the sheet is dragged by: the handle and the title row.
              <div
                data-pw="demo-sheet-grip"
                className="absolute inset-x-0 top-0 z-10 cursor-grab"
                style={{ height: 50, touchAction: "none" }}
                onPointerDown={(e) => grip.start(e)}
              />
            )}
            <div
              className={`flex flex-col w-full h-full ${fit ? "overflow-y-auto overflow-x-hidden overscroll-contain" : ""}`}
              style={{
                marginTop:
                  !fit && y < 300
                    ? "calc(-1 * var(--app-keyboard-lift, 0px))"
                    : undefined,
                // The part of a lowered sheet that hangs under the canvas.
                paddingBottom: fit ? rest : undefined,
                scrollbarWidth: fit ? "none" : undefined,
              }}
              onClick={(e) => {
                if (!touch) return;
                const target = e.target as HTMLElement;
                if (!target || target === e.currentTarget) return;
                if (
                  target.closest(
                    "button, a, [role='button'], [data-pw='demo-sheet-grip']"
                  )
                )
                  return;

                const sheet = e.currentTarget as HTMLElement;
                const inputSelector =
                  'input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea';

                let targetInput: HTMLInputElement | HTMLTextAreaElement | null =
                  null;

                // 1. Check by client coordinates if the tap lands directly within any input's rect
                if (
                  typeof e.clientX === "number" &&
                  typeof e.clientY === "number" &&
                  (e.clientX !== 0 || e.clientY !== 0)
                ) {
                  const allInputs =
                    sheet.querySelectorAll<
                      HTMLInputElement | HTMLTextAreaElement
                    >(inputSelector);
                  for (const el of allInputs) {
                    const rect = el.getBoundingClientRect();
                    if (
                      rect.width > 0 &&
                      rect.height > 0 &&
                      e.clientX >= rect.left - 8 &&
                      e.clientX <= rect.right + 8 &&
                      e.clientY >= rect.top - 8 &&
                      e.clientY <= rect.bottom + 8
                    ) {
                      targetInput = el;
                      break;
                    }
                  }
                }

                // 2. If not found by coordinate hit, check closest container (e.g. field box or label)
                if (!targetInput) {
                  let curr: HTMLElement | null = target;
                  while (curr && curr !== sheet) {
                    const found =
                      curr.querySelectorAll<
                        HTMLInputElement | HTMLTextAreaElement
                      >(inputSelector);
                    if (found.length === 1) {
                      targetInput = found[0];
                      break;
                    } else if (found.length > 1) {
                      break;
                    }
                    curr = curr.parentElement;
                  }
                }

                if (targetInput && document.activeElement !== targetInput) {
                  targetInput.focus({ preventScroll: true });
                }
              }}
            >
              <div
                className="shrink-0 self-center"
                style={{
                  marginTop: SHEET.handle.top - 1,
                  width: SHEET.handle.width,
                  height: SHEET.handle.height,
                  background: "#C4C2C2",
                }}
              />
              {children}
            </div>
            {outline && (
              // A 1 px line ON the edge; the panel's round clip keeps the
              // inner half. The line runs on past the bottom, where the file's
              // sheet ends with the screen.
              <svg
                aria-hidden="true"
                data-stroke={outline}
                className="absolute left-0 top-0 w-full pointer-events-none"
                style={{ height: `calc(100% + ${radius}px)` }}
              >
                <rect
                  width="100%"
                  height="100%"
                  rx={radius}
                  fill="none"
                  stroke={outline}
                  strokeWidth={1}
                />
              </svg>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The part of a sheet's step under its head: under the title row, the line
 * under it and the tabs. On a canvas shorter than the board it scrolls on its
 * own, and the handle and the head above it stay in view. On a full-height
 * canvas it fits and does not move.
 *
 * `minHeight` is the height the file gives this part, from the head's end to
 * the board's end (y 930). With it the blocks keep the file's spacing on a
 * short canvas too: a button at the bottom stays at its design y, under the
 * screen's end, and the part scrolls to it. Without it the part ends where
 * the canvas ends (a form with a field in use, so it does not scroll under
 * the keyboard).
 */
export function Under({
  testId,
  minHeight,
  children,
}: {
  testId: string;
  minHeight?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      data-pw={testId}
      className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex flex-col shrink-0 grow" style={{ minHeight }}>
        {children}
      </div>
    </div>
  );
}

/**
 * The grey "Why add a address?" card with its "Learn more" button: 390 x 124,
 * centred on the screen.
 *
 * It sits just above the bottom of the screen in the file (above the wide
 * button where there is one), so it is pinned to the bottom like the button:
 * `bottom` is its distance from the artboard's bottom edge. Render it inside
 * AnimatePresence; it fades out when closed.
 *
 * Inside, from the file: the title 11 Medium on baseline 23, 24 px in; the
 * close mark (14 px) at (364, 12) in a 30 px target; the text from baseline
 * 43, 16 px between lines, 354 wide; the 366 x 38 button at (12, 74).
 */
export function WhyCard({
  bottom: fromBottom,
  t,
  onClose,
}: {
  bottom: number;
  t: (key: DemoKey) => string;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="absolute inset-x-0 mx-auto flex flex-col"
      style={{
        bottom: fromBottom,
        width: 390,
        height: 124,
        borderRadius: 15,
        background: C.card,
        zIndex: 4,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-start shrink-0">
        <Txt size={11} weight="medium" mt={12} ml={24}>
          {t("Why add a address?")}
        </Txt>
        <button
          type="button"
          aria-label={t("Close")}
          onClick={onClose}
          // The 30 px target reaches 8 px under the title's line box (4 + 30
          // against 12 + 14); the negative margin keeps it out of the flow.
          className="shrink-0 ml-auto cursor-pointer"
          style={{
            marginTop: 4,
            marginRight: 4,
            marginBottom: -8,
            width: 30,
            height: 30,
            padding: 8,
          }}
        >
          <XdIcon name="closeSmall" />
        </button>
      </div>
      <p
        className="shrink-0 font-normal"
        style={{
          marginTop: paraTop(43, 11, 16) - 26,
          marginLeft: 24,
          width: 354,
          fontSize: 11,
          lineHeight: "16px",
          color: C.ink,
        }}
      >
        {t(
          "Accurate address details ensure faster delivery of your correct products and show you the best options in your area.",
        )}
      </p>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        className="shrink-0 flex items-start cursor-pointer"
        style={{
          marginTop: "auto",
          marginBottom: 12,
          marginLeft: 12,
          width: 366,
          height: 38,
          borderRadius: 15,
          background: C.field,
          // Top-aligned: centred on the 15 px icon, the 14 px line sat 1 px low.
          padding: "12px 0 0 134.5px",
        }}
      >
        <XdIcon name="help" className="shrink-0" />
        <span
          className="font-medium"
          style={{
            marginLeft: 4.5,
            fontSize: 11,
            color: C.ink,
            lineHeight: "14px",
          }}
        >
          {t("Learn more")}
        </span>
      </motion.button>
    </motion.div>
  );
}
