/**
 * The grid of the new app design, read out of the XD file.
 *
 * Every number is design px on the 430 x 932 artboard, the same canvas the new
 * login uses (scaling/scale.config.ts). Inside `#master-canvas` one design px is
 * one CSS px, so a screen places a block with the number from the file and it
 * lands where the designer put it, on every device.
 *
 * The status bar
 * --------------
 * Every artboard draws a phone status bar in its top 50 px (time, network,
 * battery). The real phone draws its own, so the app does not. That makes the
 * design y 50 the top of the app. `top(y)` turns a design y into a CSS top:
 * `y - 50`, plus the device's own top inset, the same rule `controlTop()` in
 * NewLoginDesign/authLayout.ts uses for the login's corner control.
 *
 * The bottom
 * ----------
 * Bottom elements (the tab bar, the wide buttons) keep their distance from the
 * bottom of the canvas, like `fromBottom()` in the login. The canvas is
 * `932 - deficit` tall, so a CSS `bottom` equal to the design gap does exactly
 * that: `bottom(y, h)` = 932 - (y + h).
 */

export const DESIGN_W = 430;
export const DESIGN_H = 932;

/** The phone status bar every artboard draws on top. */
export const STATUS_BAR = 50;

/** The device's own top inset. 0 in a browser tab, the notch in a home-screen app. */
export const SAFE_TOP = "env(safe-area-inset-top, 0px)";

/** A design y as a CSS top, with the drawn status bar taken off. */
export const top = (y: number) => `calc(${y - STATUS_BAR}px + ${SAFE_TOP})`;

/**
 * The same for the header row. It also cancels the keyboard lift, so the
 * header stays on screen when AppScaler slides the canvas up for the keyboard.
 */
export const headerTop = (y: number) =>
  `calc(${y - STATUS_BAR}px + ${SAFE_TOP} + var(--app-keyboard-lift, 0px))`;

/** A design box as a CSS bottom: its distance from the bottom of the artboard. */
export const bottom = (y: number, h: number) => DESIGN_H - (y + h);

/**
 * The top of a text box from the y that XD stores.
 *
 * XD keeps the BASELINE of a positioned text. Quicksand's ascender is exactly
 * 1.0 em and `.font-quicksand` sets `line-height: 1.25`, so the CSS box top is
 * the baseline minus the font size — see docs/login-design-xd-parity.md.
 */
export const textTop = (baseline: number, size: number) => baseline - size;

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
  blue: "#388CFF",
  red: "#FF5F61",
  card: "#FCFCFC",
  field: "#F8F8F8",
  page: "#FCFCFC",
  white: "#FFFFFF",
  backdrop: "rgba(29, 29, 29, 0.9)",
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

/** The wide button at the bottom of a form: 390 x 60 at (20, 836). */
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
  handle: { width: 40, top: 12, height: 2 },
} as const;
