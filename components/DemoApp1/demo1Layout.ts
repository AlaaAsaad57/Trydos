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

/**
 * The size of the tab bar when the page has scrolled down: the size of
 * Safari 26's own small address pill on the iPhone, so the two bars match.
 *
 * Measured on an iPhone screenshot (2.14 px per CSS px): the pill is
 * 306 x 66 px, so 143 x 31 CSS px. The pill is narrower for its height than
 * the tab bar (386 x 58), so one scale cannot give both numbers. The bar
 * scales by the height (31 / 58), and its box also gets narrower, so the
 * scaled bar is 143 wide. The icons keep their shape.
 * (The shared NavigationDemo bar keeps its own 0.72.)
 */
export const TAB_BAR_MIN = { width: 143, height: 31 } as const;

/** The smallest scale of the tab bar: the height ratio (31 / 58). */
export const TAB_BAR_MIN_SCALE = TAB_BAR_MIN.height / TAB_BAR.height;

/**
 * Where the tab bar's bottom edge is, above the browser's toolbar: 6 px.
 *
 * In Chrome (and most browsers) the window ends right at the toolbar, so
 * this is 6 px above the window's end. In iPhone Safari 26 the window ends
 * SAFARI_BAND px above Safari's toolbar, so there the bar goes down by
 * SAFARI_SHIFT (see BAND). That is less than the band, so the gap to
 * Safari's toolbar is about 8.5 px there, not 6 (see SAFARI_SHIFT for why).
 *
 * Never under 0 outside Safari: in Chrome a value under 0 cuts the bar's
 * bottom off, and the icons (8 px above the bar's bottom) touch the toolbar.
 *
 * It is the same at full size and when the bar has shrunk on a scroll (see
 * TAB_BAR_DROP), on every screen.
 */
export const TAB_BAR_BOTTOM = 6;

/**
 * True for Safari 26 or newer in an iPhone's tab, where Safari's toolbar
 * floats over the page. Chrome, Firefox and Edge on the iPhone do not match:
 * their names stand between "Version/" and "Mobile/", or they have no
 * "Version/" at all. (ProductBuy.tsx has the same check in useFloatingBar.)
 */
export function isFloatingBarSafari(ua: string) {
  const version = ua.match(/Version\/(\d+)[^ ]* Mobile\/\S+ Safari/);
  return /iPhone|iPod/.test(ua) && !!version && Number(version[1]) >= 26;
}

/**
 * The band between the window's end and Safari 26's toolbar on the iPhone,
 * in CSS px. No web API gives it: Safari ends the window above the toolbar's
 * margins, and paints the page's white in the band.
 *
 * Measured on two iPhone screenshots of the bag (2026-11-11, 440 x 956
 * screen, toolbar open): the window ends at y 857.5, the toolbar starts at
 * about y 873.
 */
export const SAFARI_BAND = 15.5;

/**
 * How far the tab bar's icons end above the bar's bottom edge: the file's
 * bar ends at y 917, its active icons at y 909.
 */
const TAB_ICON_ROOM = 917 - 909;

/**
 * How far the tab bar goes down in iPhone Safari 26: the band, but never so
 * far that the icons pass the window's end.
 *
 * Why. Safari cuts every fixed box at the window's end, also where it then
 * paints the band under it. With the full band (bar bottom 9.5 px under the
 * window's end) the icons' lowest 1.5 px were cut: an iPhone screenshot
 * (2026-11-11) showed the bag icon's bottom corner cut flat at y 857.1, the
 * window's end. So the icons keep 1 px over that line: 6 + 8 - 1 = 13. The
 * bar's own glass under the line is cut too, but it is clear, so it does not
 * show.
 */
export const SAFARI_SHIFT = Math.min(SAFARI_BAND, TAB_BAR_BOTTOM + TAB_ICON_ROOM - 1);

/** The shift in this browser, as a number: SAFARI_SHIFT in iPhone Safari 26, else 0. Client only. */
export const safariBand = () =>
  typeof navigator !== "undefined" && isFloatingBarSafari(navigator.userAgent) ? SAFARI_SHIFT : 0;

/**
 * The shift in this browser, for CSS. Demo1BottomNav sets the variable on
 * <html> in iPhone Safari 26; everywhere else it is 0. Take it off every
 * `bottom` that is measured from the tab bar.
 */
export const BAND = "var(--demo-safari-band, 0px)";

/**
 * How far the bar moves down as it shrinks: half of the height it loses
 * (58 - 31) / 2. The bar scales around its centre, so this keeps its bottom
 * edge on TAB_BAR_BOTTOM in every state.
 */
export const TAB_BAR_DROP = (TAB_BAR.height - TAB_BAR_MIN.height) / 2;

/** The tab bar's top edge at full size, above the window's end (less the safe area). */
export const TAB_BAR_TOP = TAB_BAR_BOTTOM + TAB_BAR.height;

/** The widest the page grows. Past it (a tablet, a laptop) it is a centred column. */
export const PAGE_MAX = 500;

/**
 * A store's page growing out of the tapped card (see Demo1Shell, "A store's
 * page"). Material 3 gives a container transform 450 – 500 ms and its
 * "emphasized" curve: a quick start that slows into place. The demo takes the
 * short end, 450 ms, so the page feels light, and the curve's standard form
 * (0.2, 0, 0, 1), which has no overshoot.
 */
export const STORE_GROW = {
  duration: 0.45,
  ease: [0.2, 0, 0, 1] as const,
};

/** The page shrinking back into its card: a little quicker, as leaving should be. */
export const STORE_SHRINK = {
  duration: 0.38,
  ease: [0.2, 0, 0, 1] as const,
};

/**
 * The move of a slide in the Home sliders, as a list of points from 0 to 1,
 * one for each frame at 60 frames a second.
 *
 * Embla (the sliders on Home, `duration: 25`) does not use a CSS curve. On
 * each 1/60 s step it adds (target - place) / 25 to the speed, keeps 0.68 of
 * the speed (Embla's friction), and moves by it. This runs the same steps,
 * so a page that slides with these points moves exactly like a Home slide.
 * The list stops when the slide is 0.2 % from its end (under 1 px on a phone);
 * Embla's last frames move less than that.
 */
function sliderCurve(): number[] {
  const points = [0];
  let place = 0;
  let speed = 0;
  while (1 - place > 0.002 && points.length < 120) {
    speed += (1 - place) / 25;
    speed *= 0.68;
    place += speed;
    points.push(place);
  }
  points[points.length - 1] = 1;
  return points;
}

const SLIDER_POINTS = sliderCurve();

/**
 * Home ↔ a store's page: both screens move a full screen width together, as
 * one Home slide moves, with the Home slider's own speed (see sliderCurve).
 * `dir` 1 moves the screens to the left (a new page comes from the right).
 * `leaving` is the screen that goes out; the other one comes in.
 */
export function sliderMove(dir: 1 | -1, leaving: boolean) {
  const from = leaving ? 0 : dir * 100;
  const to = leaving ? -dir * 100 : 0;
  return {
    x: SLIDER_POINTS.map((p) => `${from + (to - from) * p}%`),
    opacity: 1,
    transition: {
      x: {
        duration: (SLIDER_POINTS.length - 1) / 60,
        ease: "linear" as const,
        times: SLIDER_POINTS.map((_, i) => i / (SLIDER_POINTS.length - 1)),
      },
      opacity: { duration: 0 },
    },
  };
}

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
export const TAB_ROOM = `calc(${TAB_BAR_TOP}px - ${BAND} + ${SAFE_BOTTOM})`;

/**
 * Hides the site's own chrome (the [lang] layout's navbar) while the demo is
 * on the page. A CSS rule, served with the route's html, so the navbar is not
 * drawn even once before the demo starts.
 */
export const HIDE_SITE_CHROME =
  'body:has([data-pw="demo1-app"]) .home-navbar { display: none !important; }';
