/**
 * The grid of the new app design, read out of the XD file.
 *
 * Every number is design px on the 430 x 932 artboard. The fluid demo draws
 * one design px as one CSS px (see components/DemoApp1/demo1Layout.ts).
 *
 * The status bar
 * --------------
 * Every artboard draws a phone status bar in its top 50 px (time, network,
 * battery). The real phone draws its own, so the app does not. That makes the
 * design y 50 the top of the app.
 */

export const DESIGN_W = 430;
export const DESIGN_H = 932;

/** The phone status bar every artboard draws on top. */
export const STATUS_BAR = 50;

/**
 * The top of a text box from the y that XD stores.
 *
 * XD keeps the BASELINE of a positioned text. Quicksand's ascender is exactly
 * 1.0 em and `.font-quicksand` sets `line-height: 1.25`, so the CSS box top is
 * the baseline minus the font size — see docs/login-design-xd-parity.md.
 */
export const textTop = (baseline: number, size: number) => baseline - size;

/**
 * The line height that keeps a text's baseline exactly 1.0 em below its box top.
 *
 * `line-height: 1.25` is right on paper, but the browsers round the descender
 * (0.25 em) to a whole px first. At 10, 11, 14, 15 and 18 px the half-leading
 * then goes negative, and Chrome floors it: the text is drawn 1 px higher than
 * the file puts it (WebKit 1/3 px). A line box of exactly the rounded ascender
 * + descender has no half-leading, so both engines put the baseline where the
 * file does, at every size (measured 9 to 28 px, Chrome and WebKit).
 */
export const lineBox = (size: number) => size + Math.round(size / 4);

/** The design y where a text's line box ends. */
export const textBottom = (baseline: number, size: number) =>
  textTop(baseline, size) + lineBox(size);

/**
 * The margin above a text, so that its baseline lands on the file's
 * `baseline` when the block above it ends at design y `above`.
 */
export const gapTo = (above: number, baseline: number, size: number) =>
  textTop(baseline, size) - above;

/**
 * The box top of a paragraph whose lines are `lineHeight` apart, from the
 * first line's baseline. The extra line height is shared above and below the
 * text, so the first baseline sits half of it lower than in a `lineBox`.
 */
export const paraTop = (baseline: number, size: number, lineHeight: number) =>
  textTop(baseline, size) - (lineHeight - lineBox(size)) / 2;

/** The colours the new design uses, by the name of the job they do. */
export const C = {
  ink: "#1D1D1D",
  inkSoft: "#404040",
  label: "#505050",
  grey: "#8D8D8D",
  hint: "#C3C3C3",
  line: "#D3D3D3",
  placeholder: "#D3D3D3",
  purple: "#4A31E7",
  /** The pale purple behind "Recommended" on the cash-out sheet. */
  purpleTint: "#F5F4FF",
  /** The chosen tab on the cash-out form. */
  green: "#79E9B3",
  blue: "#388CFF",
  /** The line of the amount field when the balance is too small (`Home Page – 20`). */
  orange: "#F4BB7A",
  /** Behind "Your balance is insufficient" (`– 20`). */
  orangeTint: "#FFF8F4",
  /** Behind "Only the named person may receive the amount !" (`– 27`). */
  noteTint: "#FFF8F2",
  /** The dashed line of the "Back" button (`– 30`). */
  lineDark: "#5D5C5D",
  /** The chosen tab and the network tag on the cash-in sheet (`– 26`, `– 33`, `– 37`). */
  yellow: "#FAE26B",
  /** "I Agree" and the time left on the crypto code (`– 39`, `– 37`). */
  cryptoBlue: "#3066CC",
  /** The line of "I Agree" (`– 39`). */
  agreeLine: "#3EAA72",
  /** The line round the sheet that lies over another sheet (`– 39`). */
  sheetEdge: "#707070",
  /** The rings and the small text of the safety list (`– 39`). */
  ring: "#8E8E8E",
  /** The dots of the safety list: done (green) and take care (amber). */
  safeGreen: "#00DD80",
  safeAmber: "#F2B835",
  /** The expiry lines of the crypto code (`– 37`, `– 38`). */
  expiry: "#F4780E",
  red: "#FF5F61",
  card: "#FCFCFC",
  field: "#F8F8F8",
  page: "#FCFCFC",
  white: "#FFFFFF",
  backdrop: "rgba(29, 29, 29, 0.9)",
  /** Behind the receipt: `#1D1D1D` at 50%, over the file's background blur. */
  backdropGlass: "rgba(29, 29, 29, 0.5)",
} as const;

/** The header every inner screen has: a white 50 px strip under the status bar. */
export const HEADER = {
  y: 50,
  height: 50,
  /** Back arrow, 12 x 21 (design x 23.5, y 64.5). */
  back: { x: 23.5, y: 64.5 },
  /** Title baseline. 16 Medium for a single word, 14 for "Profile | ..." */
  titleBaseline: 81,
  crumbBaseline: 80,
  /** The right action ("Cancel", "Edit"), 16 Light, ends 30 in from the right. */
  actionRight: 30,
} as const;

/** Content under the header starts here. */
export const BODY_Y = HEADER.y + HEADER.height;

/** The grey banner under the header on the profile forms. */
export const BANNER = { y: 100, height: 48 } as const;

/** The wide button at the bottom of a form: 390 x 60 at (20, 836), 36 above the bottom. */
export const CTA = {
  x: 20,
  y: 836,
  width: 390,
  height: 60,
  radius: 20,
} as const;

/** Rows and cards. */
export const ROW = { x: 12, width: 406, radius: 15 } as const;

/** The tab bar, from `Home Page`. */
export const TAB_BAR = {
  x: 22,
  y: 859,
  width: 386,
  height: 58,
  /** Top corners 10, bottom corners 40 — the bar is a "D" turned on its side. */
  radius: "10px 10px 40px 40px",
  /** The file's background blur: 30, brightness +15%, fill opacity 0 (no fill). */
  glass: "blur(30px) brightness(1.15)",
  /**
   * How far the bar moves down when the page is scrolled to the end.
   * `Home Page – 9`, the scrolled profile page, draws the bar at y 1091 on its
   * 1129 px board: the top is 38 above the bottom edge instead of 73, so 20 px
   * of the bar hang below the screen. 73 - 38 = 35.
   */
  drop: 35,
} as const;

/** The same slide the login uses between its screens (NewLoginWidget). */
export const SCREEN_TRANSITION = {
  duration: 0.35,
  ease: [0.4, 0, 0.2, 1] as const,
};

/** The bottom sheets (QR sheet in the login, the pickers here). */
export const SHEET = {
  radius: 30,
  /** The wallet sheets (`Home Page – 21`, `– 19`) have rounder corners. */
  radiusWallet: 50,
  handle: { width: 40, top: 12, height: 2 },
} as const;

/**
 * The phone's own rounded font. The file writes a few lines in it (the safety
 * list of `Home Page – 39`, the expiry lines of `– 37`): `ui-rounded` is
 * SF Pro Rounded on an iPhone. Other systems have no such font and fall back
 * to Quicksand.
 */
export const SF_ROUNDED = `ui-rounded, "SF Pro Rounded", var(--Quicksand-Regular), sans-serif`;

/**
 * The box top of an SF Pro Rounded line, so that its baseline lands on the
 * file's `baseline` in a line `lineHeight` tall. SF Pro's ascent is 0.952 em
 * and its descent 0.241 em; WebKit rounds each to a whole px and shares what
 * is left of the line above and below them (at 12 px on an 18 px line the
 * baseline is 13 px down).
 */
export const sfTop = (baseline: number, size: number, lineHeight: number) => {
  const ascent = Math.round(0.952 * size);
  const descent = Math.round(0.241 * size);
  return baseline - ((lineHeight - (ascent + descent)) / 2 + ascent);
};
