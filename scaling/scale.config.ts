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
 * One scale, min(vw / DESIGN_W, vh / DESIGN_H, MAX_SCALE) — see canvasFit.ts.
 * The whole artboard is always drawn, so the layout never reshapes itself and
 * every element stays where the design puts it.
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
