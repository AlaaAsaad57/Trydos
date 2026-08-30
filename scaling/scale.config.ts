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
 * Flex system
 * ───────────
 * On a phone shorter than DESIGN_H, the gaps inside a screen give up space
 * first (--xd-flex-deficit, read by FlexibleSpace), up to FLEX_GIVE of
 * FLEX_RANGE. Anything still needed after that comes out of a uniform shrink,
 * so the gaps keep their proportions instead of closing to nothing.
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

/** Floor of the compressible range. Only FLEX_RANGE is derived from it now —
 *  the canvas no longer freezes here, because a uniform shrink covers it. */
export const FLEX_FREEZE_H = 750;

/**
 * At or below this viewport width the layout is always the portrait one.
 *
 * The branch used to be picked from the height/width ratio (below 1.7 meant
 * "landscape"). A 375x553 phone — an iPhone SE with the Safari bottom bar
 * showing — has a ratio of 1.47, so it took the landscape branch and the canvas
 * snapped from 375px wide to 255px the moment the bar appeared. Width says what
 * kind of device this is; height does not.
 */
export const PHONE_MAX_W = 500;

/**
 * How far the phone design may be blown up on a tablet.
 *
 * A tablet reproduces the design exactly — one uniform scale, no gap squeezing —
 * so the only question is how large. Scaling to fill the height drew the 430px
 * design at 1.29x on an iPad Pro, which is bigger than it is drawn anywhere
 * else. It is capped and centred instead.
 */
export const MAX_TABLET_SCALE = 1.15;

/**
 * The share of FLEX_RANGE the spacers on a screen may be asked to give up.
 *
 * A screen's spacers add up to less than FLEX_RANGE, so asking for the whole
 * range drove every one of them to zero at the same moment — on Quick Preview
 * the pagination dots ended up on the card border and the button on the dots.
 * Gaps now give this much at most, and whatever is still needed comes out of a
 * uniform shrink, which keeps every gap in proportion to the design.
 */
export const FLEX_GIVE = 0.6;
/** Total compressible range (design-px) for FlexibleSpace */
export const FLEX_RANGE = DESIGN_H - FLEX_FREEZE_H; // 182

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
/**
 * The colour each ending lands on, from the XD: signing up on mint
 * (artboard "Registration - 27"), signing in on cream ("Registration - 33").
 *
 * Kept here, next to OUTER_BG, because the screen and the background around it
 * must always be the same colour — the two drifting apart is what put the
 * Welcome screen in a border of a colour it did not use.
 */
export const AUTH_SUCCESS_BG = {
  login: '#FFFEF2',
  signup: '#D8FFEA',
} as const;

export const OUTER_BG = {
  login: '#FFFFFF',
  signup: '#FFFFFF',
  passcode: '#F4FFF4',
  intro: '#FFFFFF',
  'already-registered': '#F4F8FF',
  'not-registered': '#FFF9F0',
  'login-success': AUTH_SUCCESS_BG.login,
  'signup-success': AUTH_SUCCESS_BG.signup,
} as const;

export type OuterBgKey = keyof typeof OUTER_BG | string;
