import { flushSync } from "react-dom";
import { isTabRoot } from "components/DemoApp/demoRoutes";
import { shellStepsAside } from "components/DemoApp1/appRoutes";
import { appScreenFromPath } from "components/DemoApp1/appScreenPaths";
import { sliderMove } from "components/DemoApp1/demo1Layout";
import { isRtlLocale } from "components/DemoApp1/rtl";
import { pageOnItsWay, showPageCover } from "components/global/pageCoverState";
import { isDemoPath } from "components/skeleton/pageKinds";
import { HISTORY_HOLD } from "utils/historyHold";

/**
 * The slide between any two pages, both ways. The two screens move together a
 * full screen width, with the Home slider's curve (`sliderMove`) in SLIDE_MS.
 * With "reduce motion" on, the page only fades.
 *
 * The browser's View Transition API does the move: it takes a picture of the
 * old page, the page changes behind the picture, and the picture slides away.
 * The new picture is live, so the skeleton comes in first and the page takes
 * its place as soon as it is here, during the slide or after it.
 *
 * Why the browser's API and not framer-motion or React's <ViewTransition>:
 *
 *  - The old page is only a picture, so it needs no second copy on screen. Two
 *    real pages would share one window scroll, and overlayScroll.ts keeps that
 *    scroll exact.
 *  - A base page is hidden with `display:none`, not removed, so the `exit` of
 *    React's <ViewTransition> never fires for it.
 *  - The skeleton of a tap comes from store state, and a state change does not
 *    start React's <ViewTransition>. Here the change is any function.
 *
 * A browser without the API changes the page at once, with no slide.
 *
 * A NEW TAP ALWAYS WINS. A tap during a slide, or while a page is on its way,
 * starts its own slide: the browser ends the last one, the picture of what is
 * on screen moves out, and the router drops the page it was waiting for.
 */

/**
 * A page's slide, in ms. Its own speed and not the Home slider's 900 ms: when the
 * page is already here, this is the whole wait of the tap.
 */
const SLIDE_MS = 400;

/** How long a page may take to arrive after "back". Later, it comes with no slide. */
const MAX_WAIT_MS = 400;

/** Set on <html> during a slide. Styles: "Page slide" in globals.css. */
const SLIDING = "page-slide";

/** Set with SLIDING when both pages have the bottom bar, so it stays still. */
const KEEP_BAR = "page-slide-keep-bar";

/** The tabs in the order of the bar: a tab to the right of this one is "ahead". */
const TAB_ROOTS = ["", "search", "cart", "chat", "settings"];

const LISTINGS = ["filters", "featured", "flashDeals"];

const pathOf = (address: string) => address.split(/[?#]/)[0];

/** The path after the locale, in segments. */
const partsOf = (path: string) => path.split("/").filter(Boolean).slice(1);

/** Home is 0, a listing 1, a product 2. Any other page: how deep its path goes. */
const depthOf = (parts: string[]) => {
  if (LISTINGS.includes(parts[0])) return 1;
  if (parts[0] === "products") return 2;
  return parts.length;
};

/**
 * 1 goes on to a new page, -1 goes back, null does not slide.
 *
 * `onHistory` is for the browser's own moves: two pages at the same depth have
 * no order, and Back is by far the usual one.
 */
export function wayBetween(
  from: string | null,
  to: string | null,
  onHistory = false,
): 1 | -1 | null {
  if (!from || !to) return null;
  const a = pathOf(from);
  const b = pathOf(to);
  if (a === b || isDemoPath(a) || isDemoPath(b)) return null;
  // A new language or country is a new site, not a step.
  if (a.split("/")[1] !== b.split("/")[1]) return null;
  // Two new screens: ScreenFrame already slides them.
  if (appScreenFromPath(a) && appScreenFromPath(b)) return null;
  const partsA = partsOf(a);
  const partsB = partsOf(b);
  // A new filter changes the grid of the same listing, in place.
  if (LISTINGS.includes(partsA[0]) && LISTINGS.includes(partsB[0])) return null;
  const tabA = TAB_ROOTS.indexOf(partsA.join("/"));
  const tabB = TAB_ROOTS.indexOf(partsB.join("/"));
  if (tabA >= 0 && tabB >= 0) return tabB > tabA ? 1 : -1;
  const depthA = depthOf(partsA);
  const depthB = depthOf(partsB);
  if (depthA === depthB) return onHistory ? -1 : 1;
  return depthB > depthA ? 1 : -1;
}

/** The same rule as AppShell's `showBar`, without the overlays. */
const hasBar = (path: string) => {
  const screen = appScreenFromPath(path);
  return !shellStepsAside(path) && (screen === null || isTabRoot(screen));
};

/** The page React shows. During "back" the address is already ahead of it. */
let shownPath: string | null = null;

/** Ends the wait of a "back" that is on its way. */
let arrived: (() => void) | null = null;

/** Slides on the way. A new slide ends the last one, so the class needs a count. */
let running = 0;

/** True while a held link tap is sent on: it must not be held again. */
let replaying = false;

/** Where the last slide is going, while it runs. */
let slidingTo: string | null = null;

/**
 * The scroll each page had when a tap left it. A held "back" (see below) comes
 * too late for the browser's own restore: at that moment the old page is still
 * in the document, so the browser's position is cut to that page's height.
 */
const leftAt = new Map<string, number>();

const here = () => window.location.pathname + window.location.search;

const rememberScroll = () => {
  leftAt.set(here(), window.scrollY);
};

/** How many frames a restore tries, at most: about a third of a second. */
const RESTORE_FRAMES = 20;

/**
 * Puts this address back where a tap left it, if one did. A page that was
 * hidden comes back shorter for a moment, because its parts measure themselves
 * again, and the browser cuts the scroll to that height. So this tries again on
 * the next frames, until the page is tall enough.
 */
export function restoreScroll(): void {
  const y = leftAt.get(here());
  if (y === undefined) return;
  let frames = 0;
  const put = () => {
    window.scrollTo(0, y);
    frames += 1;
    if (window.scrollY < y - 1 && frames < RESTORE_FRAMES) {
      requestAnimationFrame(put);
    }
  };
  put();
}

const moveScreens = (way: 1 | -1) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const locale = window.location.pathname.split("/")[1] ?? "";
  const dir = (isRtlLocale(locale) ? -way : way) as 1 | -1;
  const slide = (pseudoElement: string, leaving: boolean) => {
    const { x } = sliderMove(dir, leaving);
    document.documentElement.animate(
      { transform: x.map((place) => `translateX(${place})`) },
      {
        duration: SLIDE_MS,
        easing: "linear",
        pseudoElement,
      },
    );
  };
  slide("::view-transition-old(root)", true);
  slide("::view-transition-new(root)", false);
};

const play = (
  way: 1 | -1,
  from: string,
  to: string,
  change: () => void | Promise<void>,
) => {
  const root = document.documentElement;
  running += 1;
  root.classList.add(SLIDING);
  root.classList.toggle(KEEP_BAR, hasBar(from) && hasBar(to));
  slidingTo = to;
  const transition = document.startViewTransition(change);
  // A skipped slide rejects `ready`. The page has still changed, so nothing is lost.
  transition.ready.then(() => moveScreens(way)).catch(() => {});
  const end = () => {
    running -= 1;
    if (running === 0) {
      root.classList.remove(SLIDING, KEEP_BAR);
      slidingTo = null;
    }
  };
  transition.finished.then(end, end);
  return transition;
};

/**
 * Runs a tap's `change` inside a slide. A tap that does not slide runs `change`
 * at once.
 *
 * `change` runs about one frame after the tap, because the browser takes its
 * picture first. So save the scroll (`rememberBaseScroll`) before this call.
 * It must show the skeleton by itself: the slide shows what `change` draws.
 */
export function slidePage(href: string, change: () => void): void {
  rememberScroll();
  const from = window.location.pathname;
  const to = pathOf(href);
  const way = replaying || slidingTo === to ? null : wayBetween(from, href);
  if (!way || !document.startViewTransition) {
    change();
    return;
  }
  play(way, from, to, () => flushSync(change));
}

/**
 * Opens a page from a button: the slide, with the page's skeleton as the new
 * picture. `go` starts the navigation, usually `router.push`.
 */
export function openPage(href: string, go: () => void): void {
  slidePage(href, () => {
    showPageCover(href);
    go();
  });
}

/** The bar's tab under a point. */
const tabAt = (x: number, y: number) =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[data-pw^="demo-tab-"]'),
  ).find((tab) => {
    const box = tab.getBoundingClientRect();
    return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  });

/**
 * Every link of the app slides, with no change to the links.
 *
 * The picture of the old page must be taken before the link's own handler
 * runs, because that handler hides the page. So the click is held here, in the
 * capture phase, and sent on to the link once the picture is taken.
 *
 * The bar is a named element during a slide, and the browser does not hit-test
 * a named element, so a press on it lands on <html>, and the shopper's tap would
 * be lost. It is sent on to the bar here, which picks the tab as it always does.
 *
 * Returns the function that stops watching.
 */
export function slideOnLinkTaps(): () => void {
  if (!document.startViewTransition) return () => {};

  const onPress = (e: PointerEvent) => {
    const root = document.documentElement;
    if (e.target !== root || !root.classList.contains(SLIDING)) return;
    const bar = document.querySelector('[data-pw="demo-tab-box"]');
    const box = bar?.getBoundingClientRect();
    if (!bar || !box) return;
    const { clientX: x, clientY: y } = e;
    if (x < box.left || x > box.right || y < box.top || y > box.bottom) return;
    bar.dispatchEvent(new PointerEvent("pointerdown", e));
  };

  const onClick = (e: MouseEvent) => {
    if (replaying) return;
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element | null)?.closest?.("a[href]");
    if (!(link instanceof HTMLAnchorElement)) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download")) return;
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    const from = window.location.pathname;
    const way = wayBetween(from, url.pathname);
    if (!way || slidingTo === url.pathname) return;

    rememberScroll();
    e.preventDefault();
    e.stopPropagation();
    const transition = play(way, from, url.pathname, () => {
      // Gone in the frame the tap was held: its handlers cannot run now, and a
      // tap must never be lost.
      if (!link.isConnected) {
        window.location.assign(link.href);
        return;
      }
      replaying = true;
      try {
        flushSync(() => link.click());
      } finally {
        replaying = false;
      }
      // A link's own handler may have kept the tap.
      if (!pageOnItsWay()) transition.skipTransition();
    });
  };

  document.addEventListener("pointerdown", onPress, true);
  document.addEventListener("click", onClick, true);
  return () => {
    document.removeEventListener("pointerdown", onPress, true);
    document.removeEventListener("click", onClick, true);
  };
}

/** ModalSlot calls this each time React shows a new page. */
export function pageShown(path: string | null): void {
  shownPath = path;
  const done = arrived;
  arrived = null;
  // Next task: a back-out puts the base page and its scroll back in the commits
  // that follow this effect, and the picture of the new page must show them.
  if (done) setTimeout(done, 0);
}

/**
 * The same slide for the browser's back and forward, and `router.back()`.
 *
 * React commits a `popstate` navigation at once, before the browser can take
 * its picture of the old page. So the event is held here, and sent on to Next
 * and the app's other listeners once the picture is taken. The inline script
 * in utils/historyHold.ts calls `onMove`, ahead of every other listener.
 *
 * Safari's swipe back and Android's back gesture play their own move, and the
 * event says so with `hasUAVisualTransition`. They get no second one.
 *
 * Returns the function that stops watching.
 */
export function slideOnHistoryMoves(): (() => void) | undefined {
  if (!document.startViewTransition) return undefined;

  let sendingOn = false;

  const onMove = (event: PopStateEvent) => {
    const ownMove = (event as { hasUAVisualTransition?: boolean })
      .hasUAVisualTransition;
    if (sendingOn || ownMove) return;
    const from = shownPath;
    const to = window.location.pathname;
    const way = wayBetween(from, to, true);
    if (!way || !from) return;

    event.stopImmediatePropagation();
    const transition = play(
      way,
      from,
      to,
      () =>
        new Promise<void>((resolve) => {
          const late = setTimeout(() => {
            arrived = null;
            transition.skipTransition();
            resolve();
          }, MAX_WAIT_MS);
          arrived = () => {
            clearTimeout(late);
            restoreScroll();
            resolve();
          };
          sendingOn = true;
          window.dispatchEvent(
            new PopStateEvent("popstate", { state: event.state }),
          );
          sendingOn = false;
        }),
    );
  };

  const page = window as unknown as Record<string, unknown>;
  page[HISTORY_HOLD] = onMove;
  return () => {
    delete page[HISTORY_HOLD];
  };
}
