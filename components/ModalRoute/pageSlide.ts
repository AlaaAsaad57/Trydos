import { flushSync } from "react-dom";
import { sliderMove } from "components/DemoApp1/demo1Layout";
import { isRtlLocale } from "components/DemoApp1/rtl";
import { HISTORY_HOLD } from "utils/historyHold";

/**
 * The slide between Home, a store's page and a product's page, both ways. The
 * two screens move together a full screen width, with the Home slider's own
 * speed (`sliderMove`). With "reduce motion" on, the page only fades.
 *
 * The browser's View Transition API does the move: it takes a picture of the
 * old page, the page changes behind the picture, and the picture slides away.
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
 */

/** How long a page may take to arrive after "back". Later, it comes with no slide. */
const MAX_WAIT_MS = 400;

/** Set on <html> during a slide. Styles: "Page slide" in globals.css. */
const SLIDING = "page-slide";

/** Home is 0, a store or any listing 1, a product 2. null: a page that does not slide. */
const depthOf = (address: string | null): number | null => {
  const path = address?.split(/[?#]/)[0] ?? "";
  if (/^\/[^/]+$/.test(path)) return 0;
  if (/^\/[^/]+\/filters(\/|$)/.test(path)) return 1;
  if (/^\/[^/]+\/products(\/|$)/.test(path)) return 2;
  return null;
};

/** 1 goes one page deeper, -1 one page back, null does not slide. */
const wayBetween = (from: string | null, to: string | null): 1 | -1 | null => {
  const a = depthOf(from);
  const b = depthOf(to);
  if (a === null || b === null || Math.abs(b - a) !== 1) return null;
  return b > a ? 1 : -1;
};

/** The page React shows. During "back" the address is already ahead of it. */
let shownPath: string | null = null;

/** Ends the wait of a "back" that is on its way. */
let arrived: (() => void) | null = null;

/** Slides on the way. A new slide ends the last one, so the class needs a count. */
let running = 0;

const moveScreens = (way: 1 | -1) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const locale = window.location.pathname.split("/")[1] ?? "";
  const dir = (isRtlLocale(locale) ? -way : way) as 1 | -1;
  const slide = (pseudoElement: string, leaving: boolean) => {
    const { x, transition } = sliderMove(dir, leaving);
    document.documentElement.animate(
      { transform: x.map((place) => `translateX(${place})`) },
      {
        duration: transition.x.duration * 1000,
        easing: "linear",
        pseudoElement,
      },
    );
  };
  slide("::view-transition-old(root)", true);
  slide("::view-transition-new(root)", false);
};

const play = (way: 1 | -1, change: () => void | Promise<void>) => {
  const root = document.documentElement;
  running += 1;
  root.classList.add(SLIDING);
  const transition = document.startViewTransition(change);
  // A skipped slide rejects `ready`. The page has still changed, so nothing is lost.
  transition.ready.then(() => moveScreens(way)).catch(() => {});
  const end = () => {
    running -= 1;
    if (running === 0) root.classList.remove(SLIDING);
  };
  transition.finished.then(end, end);
  return transition;
};

/**
 * Runs a tap's `change` inside a slide, when the tap goes one step between
 * Home, a store and a product. Any other tap runs `change` at once.
 *
 * `change` runs about one frame after the tap, because the browser takes its
 * picture first. So save the scroll (`rememberBaseScroll`) before this call.
 * It must show the skeleton by itself: the slide shows what `change` draws.
 */
export function slidePage(href: string, change: () => void): void {
  const way = wayBetween(window.location.pathname, href);
  if (!way || !document.startViewTransition) {
    change();
    return;
  }
  play(way, () => flushSync(change));
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
    const way = wayBetween(shownPath, window.location.pathname);
    if (!way) return;

    event.stopImmediatePropagation();
    const transition = play(
      way,
      () =>
        new Promise<void>((resolve) => {
          const late = setTimeout(() => {
            arrived = null;
            transition.skipTransition();
            resolve();
          }, MAX_WAIT_MS);
          arrived = () => {
            clearTimeout(late);
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
