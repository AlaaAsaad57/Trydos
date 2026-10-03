/**
 * The grid of the fluid demo at /[lang]/demo1.
 *
 * /demo draws the 430 x 932 artboard on one canvas and scales the whole
 * canvas to the window (AppScaler). /demo1 draws the same design as a normal
 * web page instead, the way a shop site is built:
 *
 *  - One design px is one CSS px on every phone. Text, icons, heights and the
 *    space between blocks keep the file's numbers.
 *  - Widths are fluid. A block keeps the file's distance from the screen's
 *    edges and stretches or shrinks with the screen. On a 430 px phone every
 *    width is the file's own number.
 *  - The document scrolls, not a box inside the page. So Safari 26 on the
 *    iPhone draws the page under its glass bar, and takes the colour of its
 *    top area from the sticky header.
 *
 * Everything that does not depend on the canvas (colours, the text rules, the
 * file's boxes) is shared with /demo and comes from its demoLayout.ts.
 */

export {
  BANNER,
  BODY_Y,
  C,
  CTA,
  DESIGN_H,
  DESIGN_W,
  HEADER,
  ROW,
  SCREEN_TRANSITION,
  SF_ROUNDED,
  SHEET,
  STATUS_BAR,
  TAB_BAR,
  gapTo,
  lineBox,
  paraTop,
  sfTop,
  textBottom,
  textTop,
} from "../DemoApp/demoLayout";

import { DESIGN_W, STATUS_BAR, TAB_BAR } from "../DemoApp/demoLayout";

/** The widest the page grows. Past it (a tablet, a laptop) it is a centred column. */
export const PAGE_MAX = 500;

/** The device's own top inset. 0 in a browser tab, the notch in a home-screen app. */
export const SAFE_TOP = "env(safe-area-inset-top, 0px)";

/** The device's own bottom inset. 0 in a browser tab, the home bar in a home-screen app. */
export const SAFE_BOTTOM = "env(safe-area-inset-bottom, 0px)";

/**
 * A width that keeps `left` px to the left edge and `right` px to the right
 * edge of its parent. Use it with `ml={left}`. On a 430 px phone it is the
 * file's own width: `fill(20)` is 390, `fill(12)` is 406.
 */
export const fill = (left: number, right: number = left) =>
  `calc(100% - ${left + right}px)`;

/**
 * The same, for a block the file draws `w` px wide at x `left` on the
 * 430 artboard: it keeps the file's distance to both edges.
 */
export const fillFrom = (left: number, w: number) =>
  fill(left, DESIGN_W - left - w);

/**
 * A design y as a CSS top, inside a layer that covers the screen (a sheet):
 * the drawn status bar is taken off, and the device's own inset is added.
 */
export const top = (y: number) => `calc(${y - STATUS_BAR}px + ${SAFE_TOP})`;

/** Room the tab bar takes at the bottom of a tab screen, so its last row is not under the bar. */
export const TAB_ROOM = `calc(${TAB_BAR.height + 15}px + ${SAFE_BOTTOM})`;

/**
 * Hides the site's own chrome (the [lang] layout's navbar) while the demo is
 * on the page. A CSS rule, served with the route's html, so the navbar is not
 * drawn even once before the demo starts.
 */
export const HIDE_SITE_CHROME =
  'body:has([data-pw="demo1-app"]) .home-navbar { display: none !important; }';
