/**
 * The grid of the fluid demo at /[lang]/demo.
 *
 * The old scaled demo drew the 430 x 932 artboard on one canvas and scaled the whole
 * canvas to the window (AppScaler). /demo draws the same design as a normal
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
 * file's boxes) is shared with the old scaled demo and comes from its demoLayout.ts.
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

/** The width of the page column: the window's, up to PAGE_MAX. */
export const COLUMN_W = `min(100vw, ${PAGE_MAX}px)`;

/**
 * Where every fixed thing of /demo hangs: a fixed point with no width and no
 * height, in the middle of the window's top edge (give it `bottom` instead of
 * `top` to hang from the bottom edge).
 *
 * Why not a fixed box of the real size. Safari 26 on the iPhone hit-tests the
 * middle of each edge of the window and walks up to the first `fixed` or
 * `sticky` box that is about as wide as the screen (90 % or more). When it
 * finds one at the bottom edge, it covers the room under its own floating bar
 * with ONE SOLID COLOUR: the box's colour, or the page's background colour
 * when the box holds a backdrop-filter. The page is then cut off above the
 * bar, and the bar is no longer glass. Safari also keeps the last box it
 * found for as long as that box is on the page and visible, so one moment is
 * enough: a screen sliding out, the tab bar passing the edge.
 * (WebKit: LocalFrameView::fixedContainerEdges, Page::updateFixedContainerEdges,
 * WKWebView _updateFixedColorExtensionViews.)
 *
 * A fixed box smaller than 90 % of the screen both ways is "too small" for
 * Safari, and it walks on. A box that is not fixed or sticky never counts. So
 * the fixed box is this anchor, and the real box is an `absolute` child of
 * it (`columnBox`). Safari then finds no box at the bottom edge and draws the
 * page, the sheet or the tab bar under its glass bar.
 */
export const EDGE_ANCHOR = {
  position: "fixed",
  top: 0,
  left: "50%",
  width: 0,
  height: 0,
} as const;

/**
 * The box of a layer on an EDGE_ANCHOR: the page column, `height` tall, with
 * the anchor in the middle of its top edge.
 */
export const columnBox = (height: number | string | undefined) =>
  ({
    position: "absolute",
    top: 0,
    left: `calc(${COLUMN_W} / -2)`,
    width: COLUMN_W,
    height,
  }) as const;

/**
 * How far a sheet runs on past the window's end.
 *
 * On the iPhone the window (`innerHeight`, and the box a fixed layer gets)
 * ends ABOVE Safari 26's floating bar; the bar lies over what the page draws
 * under that line. CSS cannot ask how tall that part is (the safe-area inset
 * is 0 in a browser tab), so the sheet simply runs on 120 px: more than the
 * bar and the home bar take on any iPhone. What is past the screen is not
 * seen. On a phone or a laptop with no such bar all of it is past the screen.
 */
export const UNDER_BAR = 120;

/**
 * A backdrop inside a layer's box that covers the whole window, also the room
 * beside the page column on a wide screen. `absolute`, not `fixed`: a fixed
 * backdrop is one more box Safari reads at the bottom edge (see EDGE_ANCHOR).
 * It runs on under Safari's bar (UNDER_BAR), so the page is dimmed there too.
 */
export const WINDOW_COVER = {
  position: "absolute",
  top: 0,
  bottom: -UNDER_BAR,
  left: "calc(50% - 50vw)",
  width: "100vw",
} as const;

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
