"use client";

import React from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useIsPresent,
} from "framer-motion";
import { useIsTouchDevice } from "hooks/useIsTouchDevice";
import XdIcon from "../DemoApp/XdIcon";
import { XD_ICON_SIZE, type XdIconName } from "../DemoApp/xdIcons";
import type { DemoKey } from "../DemoApp/demoKeys";
import { Box, Icon, Txt, type Weight } from "../DemoApp/ui";
import { holdTopTint, type TintHome } from "../DemoApp/topTint";
import { useDemoDebug } from "../DemoApp/demoDebug";
import {
  BANNER,
  BODY_Y,
  C,
  CTA,
  DESIGN_H,
  EDGE_ANCHOR,
  HEADER,
  ROW,
  SAFE_BOTTOM,
  SAFE_TOP,
  SHEET,
  STATUS_BAR,
  TAB_ROOM,
  UNDER_BAR,
  WINDOW_COVER,
  columnBox,
  fill,
  lineBox,
  paraTop,
  top,
} from "./demo1Layout";

/**
 * The building blocks of the fluid demo (/demo).
 *
 * The blocks that do not care about the canvas are the old scaled demo ones, unchanged:
 * a line (`Stroke`), a text line (`Txt`), a box (`Box`), an icon (`Icon`) and
 * the scrolling part of a sheet (`Under`). Every block below is the old scaled demo
 * block, changed in three ways only:
 *
 *  1. Widths are fluid (`fill()` in demo1Layout.ts): a row keeps the file's
 *     distance to both edges of the screen, so it is the file's width on a
 *     430 px phone and follows the phone on every other width.
 *  2. The page is the document. Nothing scrolls inside a box of its own; the
 *     header is `sticky` at the top and the bottom button is `sticky` at the
 *     bottom.
 *  3. A layer over the page (a sheet, the receipt) is a `fixed` layer on
 *     <body>, and the page under it does not scroll while it is open.
 */

export { Box, Icon, Stroke, Txt, type Weight } from "../DemoApp/ui";

/**
 * The part of a sheet that scrolls: everything under the head. The old scaled demo
 * block (`Under` in DemoApp/ui), with room at its end.
 *
 * On /demo a sheet runs on under Safari's bar (UNDER_BAR), and this part
 * with it, so its rows are seen through the bar's glass while they scroll.
 * The room at the end, as tall as the part under the bar, lets the last row
 * scroll back up over the bar.
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
      <div
        aria-hidden="true"
        data-pw="demo-under-bar-room"
        className="shrink-0"
        style={{ height: UNDER_BAR }}
      />
    </div>
  );
}

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
 * An x inside a fluid box, kept at the file's distance from the box's centre.
 * The file draws the box `w` wide and puts the thing at `x`; on a wider or a
 * narrower screen it stays centred the same way.
 */
export const fromCentre = (x: number, w: number) =>
  `calc(50% + ${x - w / 2}px)`;

/** `#1D1D1D` at 90% over the white page: what a dimmed page looks like. */
export const DIMMED = "rgb(52, 52, 52)";

/**
 * Paints the document in the page's colour while this screen is on show.
 *
 * Safari 26 on the iPhone colours its top area and the room under its bars
 * from the page: the sticky header at the top, and `<body>` everywhere else.
 * `theme-color` is no longer read. globals.css forces `<body>` transparent
 * with `!important`, so the colour is set on `<html>` and, with `important`,
 * on `<body>`. A screen that is sliding out leaves the colour to the new one.
 */
export function usePageColor(color: string) {
  const present = useIsPresent();
  React.useLayoutEffect(() => {
    if (!present) return;
    document.documentElement.style.setProperty("background-color", color);
    document.body.style.setProperty("background-color", color, "important");
  }, [present, color]);
}

/** How many layers hold the page still right now. */
let locks = 0;

/**
 * True for a box that scrolls on its own and can still move the way the
 * gesture goes: `dx`, `dy` are how far the content is asked to scroll (0, 0
 * when the way is not known yet). A box at its end does not count: there the
 * browser would pass the scroll on to the page.
 */
const takesScroll = (el: Element, dx: number, dy: number) => {
  const style = getComputedStyle(el);
  const scrolls = (overflow: string) => /auto|scroll/.test(overflow);
  const down = Math.abs(dy) >= Math.abs(dx);
  if (down && scrolls(style.overflowY) && el.scrollHeight > el.clientHeight) {
    if (dy > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    if (dy < 0) return el.scrollTop > 0;
    return true;
  }
  if (
    (!down || dy === 0) &&
    scrolls(style.overflowX) &&
    el.scrollWidth > el.clientWidth
  )
    return true;
  return false;
};

/** Where the finger was at the last touch event, to tell which way it moves. */
let finger: { x: number; y: number } | null = null;

const startTouch = (e: TouchEvent) => {
  const touch = e.touches[0];
  finger = touch ? { x: touch.clientX, y: touch.clientY } : null;
};

/**
 * Stops a touch or a wheel from scrolling the page. A part of a sheet that
 * scrolls on its own keeps the gesture while it can still move that way.
 */
const holdPage = (e: Event) => {
  let dx = 0;
  let dy = 0;
  if (e instanceof WheelEvent) {
    dx = e.deltaX;
    dy = e.deltaY;
  } else if (typeof TouchEvent !== "undefined" && e instanceof TouchEvent) {
    const touch = e.touches[0];
    if (touch && finger) {
      // A finger moving up asks the content to scroll down.
      dx = finger.x - touch.clientX;
      dy = finger.y - touch.clientY;
    }
  }
  for (
    let el = e.target instanceof Element ? e.target : null;
    el && el !== document.body;
    el = el.parentElement
  )
    if (takesScroll(el, dx, dy)) return;
  if (e.cancelable) e.preventDefault();
};

/**
 * Holds the page still while a layer is open: a finger on the dimmed page
 * must not scroll the page under it. Layers can lie on layers, so the page
 * moves again only when the last one closes.
 *
 * Not with `overflow: hidden` on <html>. Seen on the iPhone: while the
 * document cannot scroll, Safari 26 draws nothing of it under its floating
 * bar but the page's background colour, so the room under the bar was a plain
 * block whenever a sheet was open, whatever the sheet drew there. The touch
 * and the wheel are stopped instead, and the document stays one that scrolls.
 */
export function useScrollLock(on: boolean) {
  React.useEffect(() => {
    if (!on) return;
    const html = document.documentElement;
    if (locks === 0) {
      html.style.setProperty("overscroll-behavior", "none");
      // `passive: false`: a passive listener cannot stop the scroll.
      document.addEventListener("touchstart", startTouch, { passive: true });
      document.addEventListener("touchmove", holdPage, { passive: false });
      document.addEventListener("wheel", holdPage, { passive: false });
    }
    locks += 1;
    return () => {
      locks -= 1;
      if (locks === 0) {
        html.style.removeProperty("overscroll-behavior");
        document.removeEventListener("touchstart", startTouch);
        document.removeEventListener("touchmove", holdPage);
        document.removeEventListener("wheel", holdPage);
      }
    };
  }, [on]);
}

/**
 * The top strip of /demo (see components/DemoApp/topTint.ts), on <body>.
 * Hidden while no layer is open: Safari then reads what is under it, the
 * screen's white sticky header, or the page through its glass.
 */
const DEMO1_TINT: TintHome = { host: () => document.body, rest: null };

/** True once the page runs in the browser, so a portal has a <body> to go to. */
function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * A layer over the whole screen, on <body>: the sheets, the receipt and the
 * withdrawal request. It is the width of the page column, centred, and it
 * holds the page still while it is up. Put it inside AnimatePresence when it
 * fades or slides.
 *
 * It is IN THE DOCUMENT, not fixed to the window: an `absolute` anchor with
 * no size on <body>, at the place the page is scrolled to, and the layer's
 * own box hangs on it. The page is held still while the layer is open, so
 * the layer stays on the screen; if a browser lets the page move all the
 * same, the anchor follows the scroll.
 *
 * Why not `fixed`. Seen on the iPhone: under the window's end, where its
 * floating bar lies, Safari 26 draws the document, but of a fixed layer it
 * draws only a plain colour. A fixed sheet was a solid white block under the
 * bar, with its rows cut at the window's end. A sheet in the document is
 * drawn under the bar like the page, and the bar is glass over it. A fixed
 * box as wide as the screen is also what makes Safari paint that room in one
 * solid colour (see EDGE_ANCHOR in demo1Layout.ts).
 *
 * It is as tall as the window (`innerHeight`), the height the old scaled demo's canvas has,
 * and not the box `inset: 0` gives: on iOS 26 that box ends above Safari's
 * floating bar. So a sheet runs on under the bar, as on the old scaled demo, and what the
 * bar covers is reached by scrolling the sheet.
 */
export function Layer({
  children,
  z = 30,
  tint,
  testId,
  className = "",
  style,
}: {
  children: React.ReactNode;
  z?: number;
  /**
   * The colour the layer shows at the top of the screen (the dimmed page's
   * grey for a sheet). Safari's top area takes it while the layer is open, and
   * gives it back as the layer starts to close. None for a layer that leaves
   * the top of the page in view.
   */
  tint?: string;
  testId?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const mounted = useMounted();
  useScrollLock(true);
  // Inside AnimatePresence a closing layer stays mounted while it fades;
  // the top follows the start of the fade, with the page under it.
  const present = useIsPresent();
  React.useEffect(() => {
    if (!tint || !present) return;
    return holdTopTint(tint, DEMO1_TINT);
  }, [tint, present]);
  const height = useScreenHeight();
  const anchor = React.useRef<HTMLDivElement>(null);
  const room = React.useRef<HTMLDivElement>(null);
  /** How tall the document must be to reach the layer's tail under Safari's bar. */
  const reach = (h: number | undefined) =>
    window.scrollY + (h ?? window.innerHeight) + UNDER_BAR;
  React.useLayoutEffect(() => {
    if (!mounted) return;
    const follow = () => {
      if (anchor.current) anchor.current.style.top = `${window.scrollY}px`;
      if (room.current) room.current.style.height = `${reach(height)}px`;
    };
    follow();
    window.addEventListener("scroll", follow, { passive: true });
    return () => window.removeEventListener("scroll", follow);
  }, [mounted, height]);
  if (!mounted) return null;
  return createPortal(
    <>
      {/* The document itself must reach under Safari's bar. Safari draws
          there only what the document holds; a layer that hangs past the
          document's end showed the page's background colour instead. This
          block is in <body>'s flow, with no width, and as tall as the
          layer's tail is low. Only on a touch device: with a mouse there is
          no such bar, and the block would make a short page scroll. */}
      {navigator.maxTouchPoints > 0 && (
        <div
          ref={room}
          aria-hidden="true"
          data-pw="demo-doc-room"
          style={{
            flex: "0 0 0px",
            width: 0,
            height: reach(height),
            pointerEvents: "none",
          }}
        />
      )}
      <div
        ref={anchor}
        style={{
          ...EDGE_ANCHOR,
          position: "absolute",
          top: window.scrollY,
          zIndex: 2147483000 + z,
        }}
      >
        <div
          data-pw={testId}
          // The demo's keyboard moves this box up when a field in it cannot scroll.
          data-demo-layer=""
          className={`font-quicksand ${className}`}
          style={{ ...columnBox(height), ...style }}
        >
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}

/**
 * A paragraph, drawn the way the file draws it.
 *
 * When `text` is the file's own words (English), the file's own line breaks
 * are kept. A centred line is centred on the box, which is fluid; a left line
 * keeps its x from the box's left edge. Any other text (another language)
 * wraps as a normal paragraph.
 *
 * The box is fluid, so on a phone narrower than the file it can be narrower
 * than the file's longest line. The paragraph measures its widest line once,
 * and while the box is narrower than that it wraps as a normal paragraph
 * instead of running past its edge.
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
  lines: { x: number; text: string; node?: React.ReactNode }[];
  /** The design x where the paragraph's box starts. */
  left: number;
  /** The box's width: a number from the file, or a fluid width (`fill()`). */
  width: number | string;
  size: number;
  lineHeight: number;
  color?: string;
  weight?: Weight;
  mt?: number;
  ml?: number;
  family?: string;
  align?: "center" | "left";
  testId?: string;
  children?: React.ReactNode;
}) {
  const plain = (t: string) => t.replace(/\s+/g, " ").trim();
  const ownWords =
    plain(lines.map((line) => line.text).join(" ")) === plain(text);
  const centred = align === "center";
  const box = React.useRef<HTMLParagraphElement>(null);
  /** The width the file's lines need, measured while they are drawn. */
  const needed = React.useRef(0);
  const [fits, setFits] = React.useState(true);
  React.useLayoutEffect(() => {
    const el = box.current;
    if (!el || !ownWords) return;
    const check = () => {
      if (fits) {
        const spans = [...el.children] as HTMLElement[];
        needed.current = Math.max(
          0,
          ...spans.map(
            (span) =>
              span.scrollWidth +
              (centred ? 0 : Number.parseFloat(span.style.marginLeft) || 0),
          ),
        );
      }
      setFits(el.clientWidth + 0.5 >= needed.current);
    };
    check();
    const watch = new ResizeObserver(check);
    watch.observe(el);
    return () => watch.disconnect();
  }, [ownWords, fits, centred]);
  const own = ownWords && fits;
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
        ref={box}
        data-pw={testId}
        className={`shrink-0 ${centred ? "text-center" : ""} ${WEIGHT_CLASS[weight]}`}
        style={style}
      >
        {children ?? text}
      </p>
    );
  return (
    <p
      ref={box}
      data-pw={testId}
      className={`flex flex-col shrink-0 ${WEIGHT_CLASS[weight]}`}
      style={style}
    >
      {lines.map((line, i) => (
        <span
          key={i}
          className={`block shrink-0 whitespace-pre ${centred ? "text-center" : ""}`}
          style={{
            marginLeft: centred ? undefined : line.x - left,
            minHeight: lineHeight,
          }}
        >
          {line.node ?? line.text.trimEnd()}
        </span>
      ))}
    </p>
  );
}

/**
 * The page of a screen.
 *
 * The head (`header`: everything from the top of the app to design y
 * `scrollTop`) is sticky at the top of the screen, and the page under it
 * scrolls with the document. The page is at least as tall as the screen, and
 * as tall as the file's page (`contentHeight`) when that is taller than the
 * artboard.
 *
 * `footer` holds what the file pins to the bottom of the screen (the wide
 * button, the "Why add a address?" card). It is a sticky anchor 0 px tall at
 * the end of the page: it rests on the bottom of the screen while the page
 * scrolls, and the blocks inside it are placed with `bottom`, their distance
 * from the bottom of the screen, as in the old scaled demo.
 *
 * `tabBar` keeps room for the tab bar under the last block of a tab screen.
 */
export function ScreenPage({
  header,
  children,
  footer,
  contentHeight = DESIGN_H,
  bg = C.white,
  scrollTop = BODY_Y,
  glass,
  tabBar = false,
  testId,
}: {
  /** A CSS filter for the page and its head while a glass layer lies over them (the receipt). */
  glass?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** The design y where the page ends. */
  contentHeight?: number;
  bg?: string;
  /** Design y where the head ends and the page begins. */
  scrollTop?: number;
  tabBar?: boolean;
  testId?: string;
}) {
  // The debug page colour (demoDebug.tsx) wins over the design's.
  const page = useDemoDebug().color ?? bg;
  usePageColor(page);
  return (
    <div
      data-pw={testId}
      className="relative flex flex-col w-full font-quicksand"
      style={{ background: page, minHeight: "100dvh" }}
    >
      <div
        className="flex flex-col w-full grow"
        style={{ filter: glass, transition: "filter 0.25s" }}
      >
        {header && (
          <div
            data-pw="demo1-head"
            className="sticky top-0 z-10 w-full"
            style={{ paddingTop: SAFE_TOP, background: C.white }}
          >
            {header}
          </div>
        )}
        <div
          className="flex flex-col w-full grow"
          style={{
            marginTop: header
              ? undefined
              : `calc(${scrollTop - STATUS_BAR}px + ${SAFE_TOP})`,
            minHeight:
              contentHeight > DESIGN_H ? contentHeight - scrollTop : undefined,
            paddingBottom: tabBar ? TAB_ROOM : undefined,
          }}
        >
          {children}
        </div>
      </div>
      {footer && <PageFooter>{footer}</PageFooter>}
    </div>
  );
}

/**
 * The bottom of the screen, as a place to pin blocks to: a sticky anchor 0 px
 * tall. Its children are positioned with `bottom` from it.
 */
export function PageFooter({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-pw="demo1-foot"
      className="sticky bottom-0 z-[5] w-full shrink-0"
      style={{ height: 0 }}
    >
      {children}
    </div>
  );
}

/**
 * The header of every inner screen: a white 50 px strip with the back arrow,
 * a centred title and, on some screens, "Cancel" or "Edit" on the right. It is
 * the old scaled demo header in the flow: `ScreenPage` makes the head sticky.
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
  small?: boolean;
  crumb?: [DemoKey, DemoKey];
  icon?: XdIconName;
  action?: DemoKey;
  onBack?: () => void;
  onAction?: () => void;
  shadow?: boolean;
  nudge?: number;
  t: (key: DemoKey) => string;
}) {
  return (
    <header
      className="relative w-full font-quicksand grid items-center shrink-0"
      style={{
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

/** The grey note under the header on the profile forms, as wide as the screen. */
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
      w="100%"
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
          width: fill(48, 12),
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
 * A field: a 12 px label on baseline +20 and a 14 px value on +43, 55 tall,
 * 12 px in from both edges of the screen (the file's 406 on a 430 phone).
 * Same looks and the same "in use" rule as the old scaled demo field.
 */
export function Field({
  mt,
  label,
  ml = ROW.x,
  w = fill(ROW.x),
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
  w?: number | string;
  editing: boolean;
  line?: boolean;
  focused?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  testId?: string;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
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

/** The value line of a field: as wide as the field's inside. */
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
        width: "100%",
        height: 23,
        fontSize: 14,
        color,
        padding: 0,
        border: 0,
      }}
    />
  );
}

/**
 * The wide button at the bottom of a form: 60 tall, 20 px from both edges of
 * the screen (the file's 390 on a 430 phone), 36 above the bottom. Put it in
 * the `footer` of `ScreenPage`.
 */
export function WideButton({
  label,
  onClick,
  fill: background = C.purple,
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
          className={`absolute cursor-pointer font-quicksand ${WEIGHT_CLASS[weight]}`}
          style={{
            left: CTA.x,
            right: CTA.x,
            bottom: `calc(${DESIGN_H - (CTA.y + CTA.height)}px + ${SAFE_BOTTOM})`,
            height: CTA.height,
            borderRadius: CTA.radius,
            background,
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

/** A list row 60 tall, 12 px from both edges: the icon 12 px in, then the 14 px label. */
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
  iconSize: 18 | 30;
  label: string;
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
        width: fill(ROW.x),
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
 * The design y where the screen ends, for a layer that covers the screen:
 * the screen's height, from the top of the app (design y 50).
 */
export function useCanvasEnd(watch: boolean) {
  const height = useScreenHeight(watch);
  return STATUS_BAR + (height ?? DESIGN_H);
}

const isTextField = (el: Element | null) =>
  !!el &&
  (el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    (el as HTMLElement).isContentEditable);

/**
 * The window's height (`innerHeight`), the number the old scaled demo's canvas is fitted to.
 * Held while a text field has focus, as on the old scaled demo: Android makes `innerHeight`
 * smaller when the keyboard opens, and the layer must not shrink under it.
 * Undefined before the page runs in the browser.
 */
function useScreenHeight(watch = true) {
  const [height, setHeight] = React.useState<number | undefined>(undefined);
  React.useLayoutEffect(() => {
    if (!watch) return;
    const read = () => {
      if (!isTextField(document.activeElement)) setHeight(window.innerHeight);
    };
    read();
    window.addEventListener("resize", read);
    document.addEventListener("focusout", read);
    return () => {
      window.removeEventListener("resize", read);
      document.removeEventListener("focusout", read);
    };
  }, [watch]);
  return height;
}

/**
 * The bottom sheet: the page dims to `#1D1D1D` at 90%, and a white sheet with
 * round top corners slides up from the bottom. The old scaled demo sheet, as a layer on
 * <body> over the whole screen (`Layer`), with the dimmed page's grey as the
 * colour of Safari's top area while it is open (`tint`).
 *
 * `y`, `lower`, `fit` and `outline` mean what they mean in the old scaled demo, with the
 * screen in place of the canvas.
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
  fit?: boolean;
  onEntered?: () => void;
  y: number;
  lower?: number;
  radius?: number;
  outline?: string;
  children: React.ReactNode;
  testId?: string;
}) {
  const touch = useIsTouchDevice();
  const grip = useDragControls();
  const rest = lower;
  return (
    <AnimatePresence>
      {open && (
        <Layer key="sheet" testId={testId} tint={DIMMED}>
          <div data-no-keyboard-lift="" className="absolute inset-0">
            {touch && (
              <style>{`
                [data-no-keyboard-lift] input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]),
                [data-no-keyboard-lift] textarea {
                  pointer-events: none;
                }
              `}</style>
            )}
            <motion.div
              data-pw="demo-sheet-backdrop"
              style={{ ...WINDOW_COVER, background: C.backdrop }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={onClose}
            />
            <motion.div
              data-pw="demo-sheet-panel"
              className="absolute left-0 w-full overflow-hidden"
              style={{
                // A picker keeps its height and rests on the bottom; a tall
                // sheet keeps its top, so the dimmed page shows above it.
                // Both run on under Safari's bar (UNDER_BAR): the window ends
                // above that bar, and the page would show under it.
                ...(fit || y < 300
                  ? { top: top(y) }
                  : { height: DESIGN_H - y + UNDER_BAR }),
                bottom: -UNDER_BAR,
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
                  // A `fit` sheet scrolls, and its steps run on under
                  // Safari's bar; it keeps room for the part of a lowered
                  // sheet that hangs under the screen. Any other sheet keeps
                  // its blocks over the bar, and only its white runs on.
                  paddingBottom: fit ? rest : UNDER_BAR,
                  scrollbarWidth: fit ? "none" : undefined,
                }}
                onClick={(e) => focusTappedField(e, touch)}
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
          </div>
        </Layer>
      )}
    </AnimatePresence>
  );
}

const INPUT_SELECTOR =
  'input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea';

/**
 * On a touch device the inputs of a sheet take no taps (the app's own keypad
 * opens instead of the phone's), so a tap is handed to the field under it.
 * The same rule as the old scaled demo sheet.
 */
function focusTappedField(e: React.MouseEvent<HTMLDivElement>, touch: boolean) {
  if (!touch) return;
  const target = e.target as HTMLElement;
  if (!target) return;
  if (target.closest("button, a, [role='button'], [data-pw='demo-sheet-grip']"))
    return;

  const sheet = e.currentTarget as HTMLElement;
  let input: HTMLInputElement | HTMLTextAreaElement | null = null;

  // 1. The tap lands on (or within 8 px of) a field.
  if (e.clientX !== 0 || e.clientY !== 0) {
    for (const el of sheet.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >(INPUT_SELECTOR)) {
      const r = el.getBoundingClientRect();
      if (
        r.width > 0 &&
        r.height > 0 &&
        e.clientX >= r.left - 8 &&
        e.clientX <= r.right + 8 &&
        e.clientY >= r.top - 8 &&
        e.clientY <= r.bottom + 8
      ) {
        input = el;
        break;
      }
    }
  }

  // 2. The tap lands in a box about as tall as a field that holds one input.
  if (!input) {
    let curr: HTMLElement | null = target;
    while (curr && curr !== sheet) {
      if (curr.getBoundingClientRect().height > 150) break;
      const found = curr.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement
      >(INPUT_SELECTOR);
      if (found.length === 1) {
        input = found[0];
        break;
      }
      if (found.length > 1) break;
      curr = curr.parentElement;
    }
  }

  if (input) {
    if (document.activeElement !== input) input.focus({ preventScroll: true });
    return;
  }
  // A tap outside every field: the field in use lets go.
  const inUse = document.activeElement as HTMLElement | null;
  if (inUse && sheet.contains(inUse) && inUse.matches(INPUT_SELECTOR))
    inUse.blur();
}

/**
 * The grey "Why add a address?" card with its "Learn more" button, 20 px from
 * both edges of the screen. Put it in the `footer` of `ScreenPage`; `bottom`
 * is its distance from the bottom of the screen, as in the old scaled demo.
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
      className="absolute flex flex-col"
      style={{
        left: 20,
        right: 20,
        bottom: `calc(${fromBottom}px + ${SAFE_BOTTOM})`,
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
          width: fill(24, 12),
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
          width: fill(12),
          height: 38,
          borderRadius: 15,
          background: C.field,
          // The file's 134.5 px from the left of a 366 px button, kept as the
          // same distance from the button's centre. A padding's % is of the
          // card (24 px wider than the button), not of the button.
          padding: `12px 0 0 calc(50% - ${12 + 366 / 2 - 134.5}px)`,
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
