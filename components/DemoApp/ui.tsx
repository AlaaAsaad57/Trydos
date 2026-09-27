"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
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
 */
export function Stroke({
  color,
  width = 0.5,
  radius = 0,
  visible = true,
}: {
  color: string;
  width?: number;
  radius?: number;
  /** Fades the line out (0.3 s) instead of removing it. */
  visible?: boolean;
}) {
  const id = `demo-stroke-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      aria-hidden="true"
      data-stroke={color}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s" }}
    >
      <defs>
        <clipPath id={id}>
          <rect width="100%" height="100%" rx={radius} />
        </clipPath>
      </defs>
      <rect
        width="100%"
        height="100%"
        rx={radius}
        fill="none"
        stroke={color}
        strokeWidth={width * 2}
        clipPath={`url(#${id})`}
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
  radius?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
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
  testId,
}: {
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
 * is SemiBold and the line is the site's blue `#388CFF`. A product rule: the
 * file draws the field in use like the others. SemiBold, not Medium: at 12 px
 * Quicksand Medium looks the same as Regular. An input that is read-only
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
  plain = false,
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
  /** No line unless in use (the complete address form, `Home Page – 99`). The field in use keeps its blue line. */
  plain?: boolean;
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
      strokeVisible={inUse || (!plain && (editing || line))}
      onClick={onClick}
      onFocus={(e) =>
        setTyping(e.target instanceof HTMLInputElement && !e.target.readOnly)
      }
      onBlur={() => setTyping(false)}
      data-pw={testId}
      className={`flex flex-col transition-[background-color] duration-300 ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{ padding: "8px 12px 0" }}
    >
      <Txt size={12} color={C.label} weight={inUse ? "semibold" : "regular"}>
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
 * The bottom sheet: the page dims to `#1D1D1D` at 90%, and a white sheet with
 * 30 px top corners and a 40 x 2 `#C4C2C2` handle slides up from the bottom.
 * The same sheet the login uses for its QR code (QrBottomSheet).
 *
 * The content stacks under the handle, which ends 13 px below the sheet's top
 * edge (design y `y + 13`). So the first block's `mt` is its design y minus
 * `y + 13`.
 */
export function Sheet({
  open,
  onClose,
  y,
  children,
  testId,
  onEntered,
}: {
  open: boolean;
  onClose: () => void;
  /** Called once the sheet has finished rising. */
  onEntered?: () => void;
  /** Design y of the sheet's top edge. */
  y: number;
  children: React.ReactNode;
  testId?: string;
}) {
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
        >
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
              ...(y < 300
                ? { top: `calc(${top(y)} + var(--app-keyboard-lift, 0px))` }
                : { height: 932 - y }),
              bottom: 0,
              background: C.white,
              borderRadius: `${SHEET.radius}px ${SHEET.radius}px 0 0`,
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            onAnimationComplete={() => onEntered?.()}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 34,
              mass: 0.9,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <div
              className="flex flex-col w-full h-full"
              style={{
                marginTop:
                  y < 300
                    ? "calc(-1 * var(--app-keyboard-lift, 0px))"
                    : undefined,
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
