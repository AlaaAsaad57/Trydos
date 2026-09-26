"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import XdIcon from "./XdIcon";
import type { XdIconName } from "./xdIcons";
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
  textTop,
  top,
} from "./demoLayout";

/**
 * The building blocks every demo screen is drawn with.
 *
 * All numbers are design px from the XD file. Blocks are placed with absolute
 * positions, the way the login screens are (NewLoginDesign/authLayout.ts),
 * because the design does not space things evenly and a stack of margins
 * cannot reproduce it.
 */

export type Weight = "light" | "regular" | "medium" | "bold";

const WEIGHT_CLASS: Record<Weight, string> = {
  light: "font-light",
  regular: "font-normal",
  medium: "font-medium",
  bold: "font-bold",
};

/**
 * One line of text, placed by the BASELINE the XD file stores.
 *
 * `x` is the left edge. `center` centres it on the artboard instead (the file
 * centres titles by eye; every one of them measures within 2 px of 215).
 */
export function Txt({
  x = 0,
  baseline,
  size,
  weight = "regular",
  color = C.ink,
  center = false,
  right,
  width,
  className = "",
  style,
  children,
  as: Tag = "span",
  ...rest
}: {
  x?: number;
  baseline: number;
  size: number;
  weight?: Weight;
  color?: string;
  center?: boolean;
  /** Distance of the right edge from the artboard's right edge. */
  right?: number;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  as?: "span" | "p" | "h1" | "h2" | "label";
} & React.HTMLAttributes<HTMLElement>) {
  const place: React.CSSProperties = center
    ? { left: 0, width: DESIGN_W, textAlign: "center" }
    : right !== undefined
      ? { right, textAlign: "right" }
      : { left: x, width };
  return (
    <Tag
      {...rest}
      className={`absolute block ${width ? "" : "whitespace-nowrap"} ${WEIGHT_CLASS[weight]} ${className}`}
      style={{
        top: textTop(baseline, size),
        fontSize: size,
        lineHeight: `${lineBox(size)}px`,
        color,
        ...place,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/** A box on the artboard: position, size and the fill/stroke/radius XD gives it. */
export function Box({
  x,
  y,
  w,
  h,
  fill,
  stroke,
  strokeWidth = 0.5,
  radius = 0,
  className = "",
  style,
  children,
  ...rest
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number | string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={`absolute ${className}`}
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        background: fill,
        borderRadius: radius,
        // XD aligns every stroke inside the box.
        boxShadow: stroke
          ? `inset 0 0 0 ${strokeWidth}px ${stroke}`
          : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** An icon at its design position. */
export function Icon({
  name,
  x,
  y,
  size,
  style,
}: {
  name: XdIconName;
  x: number;
  y: number;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <XdIcon
      name={name}
      size={size}
      style={{ position: "absolute", left: x, top: y, ...style }}
    />
  );
}

/**
 * The page of an inner screen: the header strip, then a box that scrolls.
 *
 * Children are placed with DESIGN y values. The scroll box starts at the
 * bottom of the header (design y 100), so the page shifts its content up by
 * that much — a screen writes `y={160}` for a field the file draws at 160.
 * `contentHeight` is the design y where the content ends (932 for a screen
 * that fits, 1129 for the tall profile page).
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
  /** The design height of the content from `scrollTop` down. */
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
          className="relative w-full"
          style={{ height: contentHeight - scrollTop }}
        >
          {/* Shifted up by the scroll box's own top, so children use design y. */}
          <div
            className="absolute left-0 w-full"
            style={{ top: -scrollTop, height: contentHeight }}
          >
            {children}
          </div>
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
      className="absolute left-0 w-full font-quicksand z-10"
      style={{
        top: headerTop(HEADER.y),
        height: HEADER.height,
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
          className="absolute flex items-center justify-center cursor-pointer active:opacity-60 transition-opacity"
          // A 44 px target around the 12 x 21 arrow at (23.5, 64.5).
          style={{ left: 7.5, top: 0, width: 44, height: HEADER.height }}
        >
          <XdIcon name="back" />
        </button>
      )}
      {title && (
        <h1
          className="absolute w-full text-center font-medium whitespace-nowrap pointer-events-none"
          style={
            small
              ? {
                  left: nudge,
                  top: textTop(HEADER.crumbBaseline, 14) - HEADER.y,
                  fontSize: 14,
                  lineHeight: `${lineBox(14)}px`,
                  color: C.ink,
                }
              : {
                  left: nudge,
                  top: textTop(HEADER.titleBaseline, 16) - HEADER.y,
                  fontSize: 16,
                  color: C.ink,
                }
          }
        >
          {t(title)}
        </h1>
      )}
      {crumb && (
        <h1
          className="absolute w-full flex justify-center pointer-events-none"
          style={{
            left: nudge,
            top: textTop(HEADER.crumbBaseline, 14) - HEADER.y,
            fontSize: 14,
            lineHeight: `${lineBox(14)}px`,
            color: C.ink,
          }}
        >
          <span className="relative whitespace-nowrap">
            <span className="font-normal">{t(crumb[0])} | </span>
            <span className="font-medium">{t(crumb[1])}</span>
            {icon && (
              <XdIcon
                name={icon}
                // The icon's top is design y 66; the text's is 66 too.
                style={{
                  position: "absolute",
                  left: "100%",
                  marginLeft: 4,
                  top: 0,
                }}
              />
            )}
          </span>
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
            className="absolute font-light cursor-pointer active:opacity-60"
            style={{
              right: 20,
              top: textTop(HEADER.titleBaseline, 16) - HEADER.y,
              fontSize: 16,
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

/** The grey note under the header on the profile forms. */
export function InfoBanner({
  t,
  purple = false,
}: {
  t: (key: DemoKey) => string;
  purple?: boolean;
}) {
  return (
    <Box
      x={0}
      y={BANNER.y}
      w={DESIGN_W}
      h={BANNER.height}
      fill={C.field}
      stroke={C.line}
    >
      <XdIcon
        name={purple ? "infoBannerPurple" : "infoBanner"}
        style={{ position: "absolute", left: 11.5, top: 11.5 }}
      />
      <p
        className="absolute font-normal"
        style={{
          left: 48,
          top: paraTop(119, 11, 16) - BANNER.y,
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
 * A 406 x 55 field: a 12 px label and a 14 px value under it.
 *
 * Two looks in the file. Editing (`88`, `93`): white with a 0.5 `#D3D3D3`
 * line. Saved (`92`, `99`): `#FCFCFC` and no line.
 */
export function Field({
  y,
  label,
  x = ROW.x,
  w = ROW.width,
  editing,
  line = false,
  children,
  onClick,
  testId,
}: {
  y: number;
  label: string;
  x?: number;
  w?: number;
  editing: boolean;
  /** Keep the line on a filled field (the address form until it is complete). */
  line?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  testId?: string;
}) {
  return (
    <Box
      x={x}
      y={y}
      w={w}
      h={55}
      radius={ROW.radius}
      fill={editing ? C.white : C.card}
      stroke={editing || line ? C.line : undefined}
      onClick={onClick}
      data-pw={testId}
      className={`transition-[background-color,box-shadow] duration-300 ${onClick ? "cursor-pointer" : ""}`}
    >
      <Txt x={12} baseline={20} size={12} color={C.label}>
        {label}
      </Txt>
      {children}
    </Box>
  );
}

/** The value line of a field: an input when editing, the text when saved. */
export function FieldInput({
  value,
  placeholder,
  onChange,
  editing,
  color = C.ink,
  x = 12,
  inputMode,
  type = "text",
  onBlur,
  testId,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  editing: boolean;
  color?: string;
  x?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
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
      onBlur={onBlur}
      className="absolute bg-transparent outline-none font-normal placeholder:text-[#D3D3D3]"
      // Baseline 43 in the box, 14 px: the box top is 29, the line 17.5.
      style={{
        left: x,
        top: 29 - 3,
        width: 406 - x - 12,
        height: 23,
        fontSize: 14,
        color,
        padding: 0,
        border: 0,
      }}
    />
  );
}

/** The wide button at the bottom of a form, 390 x 60 at (20, 836). */
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
          className={`absolute cursor-pointer font-quicksand ${WEIGHT_CLASS[weight]}`}
          style={{
            left: CTA.x,
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

/** A 406 x 60 list row with an icon and a 14 px label. */
export function MenuRow({
  y,
  icon,
  iconSize,
  label,
  textX,
  onClick,
  testId,
}: {
  y: number;
  icon: XdIconName;
  /** 18 on the profile page, 30 on the profile menu. */
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
      className="absolute cursor-pointer text-left"
      style={{
        left: ROW.x,
        top: y,
        width: ROW.width,
        height: 60,
        borderRadius: ROW.radius,
        background: C.card,
      }}
    >
      <XdIcon
        name={icon}
        style={{
          position: "absolute",
          left: 12,
          top: iconSize === 18 ? 21 : 15,
        }}
      />
      <Txt x={textX - ROW.x} baseline={35} size={14}>
        {label}
      </Txt>
    </motion.button>
  );
}

/**
 * The bottom sheet: the page dims to `#1D1D1D` at 90%, and a white sheet with
 * 30 px top corners and a 40 x 2 `#C4C2C2` handle slides up from the bottom.
 * The same sheet the login uses for its QR code (QrBottomSheet).
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
              className="absolute"
              style={{
                left: (DESIGN_W - SHEET.handle.width) / 2,
                top: SHEET.handle.top - 1,
                width: SHEET.handle.width,
                height: SHEET.handle.height,
                background: "#C4C2C2",
              }}
            />
            {/* Children use design y; the sheet shifts them up by its own top. */}
            <div
              className="absolute left-0 w-full"
              style={{
                top:
                  y < 300
                    ? `calc(${-y}px - var(--app-keyboard-lift, 0px))`
                    : -y,
              }}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The grey "Why add a address?" card with its "Learn more" button.
 *
 * It sits just above the bottom of the screen in the file (above the wide
 * button where there is one), so it is pinned to the bottom like the button:
 * `bottom` is its distance from the artboard's bottom edge. Render it inside
 * AnimatePresence; it fades out when closed.
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
      className="absolute"
      style={{
        left: 20,
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
      <Txt x={24} baseline={23} size={11} weight="medium">
        {t("Why add a address?")}
      </Txt>
      <p
        className="absolute font-normal"
        style={{
          left: 24,
          top: paraTop(43, 11, 16),
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
      <button
        type="button"
        aria-label={t("Close")}
        onClick={onClose}
        className="absolute cursor-pointer"
        style={{ left: 364 - 8, top: 12 - 8, width: 30, height: 30 }}
      >
        <XdIcon
          name="closeSmall"
          style={{ position: "absolute", left: 8, top: 8 }}
        />
      </button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        className="absolute cursor-pointer"
        style={{
          left: 12,
          top: 74,
          width: 366,
          height: 38,
          borderRadius: 15,
          background: C.field,
        }}
      >
        {/* Top-aligned: centred on the 15 px icon, the 14 px line sat 1 px low. */}
        <span
          className="absolute flex items-start"
          style={{ left: 134.5, top: 12 }}
        >
          <XdIcon name="help" />
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
        </span>
      </motion.button>
    </motion.div>
  );
}

/** Hands a design position to a child of a Box that is itself placed at (bx, by). */
export const inside = (bx: number, by: number) => (x: number, y: number) => ({
  x: x - bx,
  y: y - by,
});
