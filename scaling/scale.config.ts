/**
 * scale.config.ts — Single source of truth for the scaling system.
 *
 * Every file in scaling/ reads from here.
 * Change a value here → it propagates everywhere.
 *
 * Design canvas
 * ─────────────
 * DESIGN_W × DESIGN_H is the XD artboard size.
 * All xd-* utilities and FlexibleSpace use these as the 1:1 reference.
 *
 * How the canvas is fitted
 * ────────────────────────
 * The artboard always fills the width: scale = min(vw / DESIGN_W, MAX_SCALE).
 * The height the page does not have (Safari's bars take ~190 px of an iPhone)
 * is published as --xd-flex-deficit, and the screens move their bottom cluster
 * up by it. Only past MAX_DEFICIT does the canvas shrink — see canvasFit.ts.
 *
 * Scale clamp
 * ───────────
 * MIN_VW / MAX_VW define the viewport range for the CSS --xd-unit clamp.
 * Outside AppScaler, xd-* utilities scale proportionally within this range.
 */

/** XD artboard width (px) — the base for all horizontal scaling */
export const DESIGN_W = 430;

/** XD artboard height (px) — the "ideal" viewport height in design-px */
export const DESIGN_H = 932;

/**
 * The most design px the screens may give up from their vertical gaps before
 * the whole canvas shrinks as well.
 *
 * An iPhone in Safari needs about 187 (932 - 745). The tightest screen at that
 * number is Get Started: the mark's top (390 - 187 = 203) still clears the QR
 * icon (85), and the title (649 - 187 = 462) still clears the mark's bottom
 * (540 - 187 = 353). At 200 there is still room on every screen; past it the
 * bottom cluster would climb into the head block, so the canvas shrinks instead.
 */
export const MAX_DEFICIT = 200;

/**
 * Total compressible range (design-px) that FlexibleSpace shares were written
 * against.
 *
 * Nothing compresses any more: AppScaler pins --xd-flex-deficit to 0px, so
 * every FlexibleSpace returns its full `size`. This is kept only because
 * QuickPreviewScreen still divides by it to compute its (now inert) shares. It
 * goes when that screen is put on the design grid.
 */
export const FLEX_RANGE = 182;

/** Narrowest viewport (px) the CSS clamp considers — prevents text from getting too small */
export const MIN_VW = 350;

/** Widest viewport (px) the CSS clamp considers — prevents over-scaling */
export const MAX_VW = 500;

/** Pre-computed CSS clamp boundaries for useXdScale hook */
export const MIN_SCALE = MIN_VW / DESIGN_W;
export const MAX_SCALE = MAX_VW / DESIGN_W;

/**
 * Outer-background color map.
 * Keys are used as CSS class names: "outer-bg-{key}"
 * Values are hex colors.
 */
export const OUTER_BG = {
  login: '#FFFFFF',
  signup: '#FFFFFF',
  passcode: '#F4FFF4',
  intro: '#FFFFFF',
  'already-registered': '#F4F8FF',
  'not-registered': '#FFF9F0',
  // Two endings, two screens — cream for welcome back, mint for sign-up done.
  'login-success': '#FFFEF2',
  'signup-success': '#D8FFEA',
} as const;

export type OuterBgKey = keyof typeof OUTER_BG | string;

/**
 * Real px a focused field keeps between its bottom edge and the top of the
 * virtual keyboard. The page cannot make the keyboard smaller, so AppScaler
 * slides the canvas up by exactly the overlap plus this gap — see
 * `keyboardLift` in canvasFit.ts.
 */
export const KEYBOARD_GAP = 16;
