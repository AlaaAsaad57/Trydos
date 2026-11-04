"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  AnimatePresence,
  MotionConfig,
  useReducedMotion,
} from "framer-motion";
import { DemoDataProvider, useDemoData } from "../DemoApp/DemoData";
import { DemoChatProvider } from "../DemoApp/demoChatState";
import type { DemoDictionary, DemoKey } from "../DemoApp/demoKeys";
import {
  direction,
  hrefFor,
  isTabRoot,
  isProductScreen,
  isStoreScreen,
  opensFromCard,
  parentOf,
  sameRoute,
  screenFromUrl,
  tabOf,
  type DemoScreen,
} from "../DemoApp/demoRoutes";
import Demo1BottomNav from "./Demo1BottomNav";
import Demo1ScreenView from "./Demo1ScreenView";
import { PAGE_MAX } from "./demo1Layout";
import { ScreenFrame, type Leave, type Origin, type Slide } from "./ScreenFrame";
import { NavCtx } from "./screenNav";
import DemoKeyboard from "./keyboard/DemoKeyboard";
import { usePageDir } from "./rtl";

// The screens read the shell through useDemoNav; it lives in screenNav.ts,
// so the real app's screen mount can give it too. Kept here for the files
// that still import it from this shell.
export { useDemoNav } from "./screenNav";

/**
 * The shell of the fluid demo at /[lang]/demo.
 *
 * The same app as the old scaled demo (the same screens, the same data, the same URLs under
 * /demo), built as a normal web page instead of a scaled canvas:
 *
 *  - No AppScaler and no fixed layer over the window. The screen on show is
 *    in the document, and the DOCUMENT scrolls. That is what lets Safari 26 on
 *    the iPhone draw the page under its glass bar and take its colours from
 *    the page, the way shop sites look in it.
 *  - The page is a centred column, at most PAGE_MAX wide.
 *
 * Navigation is the old scaled demo shell's:
 * the screen changes on the tap, and the URL follows behind it.
 *
 * The slide between two screens
 * -----------------------------
 * The new screen slides in, in the document, from its top. The old one slides
 * out where it was: it is taken out of the document (`fixed`, the size of the
 * screen) and keeps the scroll it had, so nothing jumps while it leaves. Each
 * screen's scroll is kept, so "back" opens the last one where it was left.
 *
 * A page opened from a card: the card grows into the page
 * --------------------------------------------------------
 * (A store's page used to open this way from Home; it now slides — see
 * "Home, a store's page and a product's page" below. The rest of this part
 * names it "store", and holds for a product's page from its card.)
 *
 * A page opened from a card does not slide. The tapped card grows
 * into the store's page, and "back" shrinks the page into the same card.
 * This is Material Design's "container transform", the motion it gives to a
 * card that opens its own page; shop apps (the App Store's cards, Farfetch,
 * Zara) open a product or a store the same way. The eye follows the card it
 * tapped, so the new page needs no explaining, and Home never moves.
 *
 *  - The page is cut to the card's box (a `clip-path`) and the cut opens to
 *    the whole screen. Only the clip and the opacity animate, so the browser
 *    does not lay out the page again on each frame.
 *  - The new page fades in over the first part of the move, so the card's own
 *    picture under it turns into the page instead of jumping.
 *  - Home stays where it was under the page, and goes away after it is covered.
 *  - With "reduce motion" on, the page only fades in and out.
 *  - Opened any other way (a link, the browser's forward), the page slides in
 *    like any other screen, because there is no card to grow from.
 *
 * (A product's page used to open this way from its card on a store's page
 * too; it now slides, the same as a store's page from Home. The grow is
 * kept for a store's or a product's page opened from a card on any other
 * screen: `opensFromCard` in demoRoutes.ts.)
 *
 * Home, a store's page and a product's page: one slide
 * ----------------------------------------------------
 * Between Home and a store's page, and between a store's page and a
 * product's page on it (both ways), the two screens move together a full
 * screen width, the way a Home slider moves one slide, with the same speed
 * and curve (sliderMove in demo1Layout.ts). Neither screen fades. With
 * "reduce motion" on, the page only fades in and out.
 */

/** True for a move between Home and a store's page, either way. */
const homeAndStore = (a: DemoScreen | null, b: DemoScreen | null) =>
  a === "home" && b !== null && isStoreScreen(b);

/** True for a move between a store's page and one of its products' pages, either way. */
const storeAndProduct = (a: DemoScreen | null, b: DemoScreen | null) =>
  a !== null && b !== null && isStoreScreen(a) && isProductScreen(b) && b.startsWith(`${a}/`);

/**
 * True for a move that goes as one Home slide, either way: Home and a
 * store's page, and a store's page and a product's page on it.
 */
const slidesLikeHome = (from: DemoScreen | null, to: DemoScreen | null) =>
  homeAndStore(from, to) ||
  homeAndStore(to, from) ||
  storeAndProduct(from, to) ||
  storeAndProduct(to, from);

export default function Demo1Shell({
  children,
  dictionary,
}: {
  children: React.ReactNode;
  /** The demo's words in the page's language, looked up on the server — see demoKeys.ts. */
  dictionary: DemoDictionary;
}) {
  return (
    // A shopper who turned motion off gets no slides: framer-motion makes every
    // move instant and keeps the fades (decided in Stage 1 of UI-MIGRATION-PLAN.md).
    <MotionConfig reducedMotion="user">
      <DemoDataProvider>
        <Demo1ShellInner dictionary={dictionary}>{children}</Demo1ShellInner>
      </DemoDataProvider>
    </MotionConfig>
  );
}

function Demo1ShellInner({
  children,
  dictionary,
}: {
  children: React.ReactNode;
  dictionary: DemoDictionary;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.lang === "string" ? params.lang : "sy-en";
  const t = (key: DemoKey) => dictionary[key] ?? key;
  const pageDir = usePageDir();
  const { profile } = useDemoData();

  const urlScreen = screenFromUrl(pathname, searchParams.toString());
  const [shown, setShown] = useState<DemoScreen | null>(urlScreen);
  const [leave, setLeave] = useState<Leave>({ dir: 1, scrollY: 0 });
  /** The screen a navigation we started is still on its way to. */
  const pending = useRef<DemoScreen | null>(null);
  /** The screens we walked through, so the browser's back can slide the right way. */
  const trail = useRef<DemoScreen[]>([urlScreen ?? "home"]);
  /** The scroll each screen had when it was left. */
  const scrolls = useRef(new Map<string, number>());
  /** For each store's page opened from a card: the card's box, and the screen it was on. */
  const origins = useRef(
    new Map<string, { rect: Origin; from: DemoScreen | null }>(),
  );
  const column = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const key = shown ?? `page:${pathname}`;
  // The tab bar shows on the tab screens, and on a store's page too (it
  // belongs to the Home tab, so Home is the active tab there). A product's
  // page has no tab bar: XD `Home Page – 49` draws none, and the bar slides
  // away as the product opens.
  const barScreen = shown !== null && (isTabRoot(shown) || isStoreScreen(shown));
  const showBar = barScreen;
  const move: Slide = { ...leave, side: pageDir === "rtl" ? -1 : 1 };

  // The shell keeps each screen's scroll itself, so the browser must not
  // put one back on its own when the URL changes.
  useEffect(() => {
    const before = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    // The site's <html> carries `overflow-x: clip` (a class in the [lang]
    // layout, `!important`). The demo's page column clips itself, and a clip
    // on the root is one more thing between the document and what Safari 26
    // draws under its floating bar. An inline `!important` is the only thing
    // that wins over the class.
    document.documentElement.style.setProperty(
      "overflow-x",
      "visible",
      "important",
    );
    return () => {
      window.history.scrollRestoration = before;
      document.documentElement.style.removeProperty("overflow-x");
      document.documentElement.style.removeProperty("background-color");
      document.body.style.removeProperty("background-color");
    };
  }, []);

  // A new screen starts at its top; going back opens the last one where it
  // was left. Before paint, so the new screen never shows the old scroll.
  useLayoutEffect(() => {
    const y = leave.dir < 0 ? (scrolls.current.get(key) ?? 0) : 0;
    window.scrollTo(0, y);
  }, [key]);

  /**
   * Starts a change of screen: remembers where the screen on show was left,
   * and picks the motion. `grow` is the card a store's page opens from.
   */
  const leaveTo = (to: DemoScreen | null, d: 1 | -1, grow?: Origin) => {
    const y = window.scrollY;
    scrolls.current.set(key, y);
    const next: Leave = { dir: d, scrollY: y };
    const opening = opensFromCard(to) && d > 0;
    const closing = opensFromCard(shown) && d < 0;
    if (slidesLikeHome(shown, to)) {
      if (reduceMotion) next.fade = true;
      else next.swipe = true;
    } else if (opening && grow) {
      if (reduceMotion) next.fade = true;
      else next.grow = grow;
    } else if (closing) {
      // Shrink only into the card it grew from, on the screen it was on.
      const origin = shown ? origins.current.get(shown) : undefined;
      if (origin && origin.from === to) {
        if (reduceMotion) next.fade = true;
        else next.shrink = origin.rect;
      }
    }
    setLeave(next);
    setShown(to);
  };

  /** The box of a tapped element, as an Origin, or undefined if it cannot be read. */
  const originOf = (el: Element | null | undefined): Origin | undefined => {
    const page = column.current;
    if (!el || !page) return undefined;
    const box = el.getBoundingClientRect();
    const col = page.getBoundingClientRect();
    if (!box.width || !box.height) return undefined;
    return {
      top: Math.max(0, box.top),
      left: Math.max(0, box.left - col.left),
      right: Math.max(0, col.right - box.right),
      bottom: Math.max(0, box.bottom),
      vh: window.innerHeight,
    };
  };

  // The URL moved without us: the browser's back or forward, or a plain link.
  useEffect(() => {
    if (pending.current) {
      if (urlScreen === pending.current) pending.current = null;
      return;
    }
    if (urlScreen === shown) return;
    const path = trail.current;
    let next: 1 | -1 = 1;
    if (urlScreen && path.length > 1 && path[path.length - 2] === urlScreen) {
      path.pop();
      next = -1;
    } else {
      if (urlScreen) path.push(urlScreen);
      if (urlScreen && shown) next = direction(shown, urlScreen);
    }
    leaveTo(urlScreen, next);
    // Only the URL decides here; `shown` is read, not followed.
  }, [urlScreen]);

  const go = (
    to: DemoScreen,
    d: 1 | -1,
    how: "push" | "replace",
    grow?: Origin,
  ) => {
    const from = shown;
    leaveTo(to, d, grow);
    const href = hrefFor(locale, to);
    // A store's page also needs no server call: the shell draws it, and its
    // route's page holds only tags for search engines, which read the URL
    // straight from the server. A router.push here asked the server anyway,
    // and its answer landed in the middle of the grow: one task of 0.6 to
    // 1.5 s (4x slower CPU, dev build) that froze the motion after 100 ms.
    // Next keeps usePathname in step with pushState, so the shell's URL
    // effect sees the same screen and does nothing. The browser's back then
    // gives Next its own entry for Home, which it restores from memory.
    if (from && (sameRoute(from, to) || (how === "push" && opensFromCard(to)))) {
      // Search params only, or a store or a product: no server call.
      if (how === "push") window.history.pushState(null, "", href);
      else window.history.replaceState(null, "", href);
    } else {
      pending.current = to;
      if (how === "push") router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    }
  };

  const navigate = (to: DemoScreen, d?: 1 | -1, from?: Element | null) => {
    if (to === shown) return;
    // Home, a store's page and a product's page slide as one Home slide;
    // nothing grows there.
    const grow =
      opensFromCard(to) && !slidesLikeHome(shown, to) ? originOf(from) : undefined;
    if (grow) origins.current.set(to, { rect: grow, from: shown });
    else origins.current.delete(to);
    trail.current.push(to);
    go(to, d ?? (shown ? direction(shown, to) : 1), "push", grow);
  };

  const back = () => {
    const path = trail.current;
    if (path.length > 1) {
      // Slide now; the browser's own back brings the URL after it.
      path.pop();
      const to = path[path.length - 1];
      const from = shown;
      leaveTo(to, -1);
      if (!(from && sameRoute(from, to))) pending.current = to;
      window.history.back();
      return;
    }
    // Opened straight on an inner screen: go up one level instead.
    const up = shown ? parentOf(shown) : "home";
    trail.current = [up];
    go(up, -1, "replace");
  };

  return (
    <NavCtx.Provider value={{ shown, navigate, back, locale, t }}>
      <DemoChatProvider t={t}>
        <div
          ref={column}
          data-pw="demo1-app"
          dir={pageDir}
          className="relative w-full mx-auto font-quicksand"
          // `clip` and not `hidden`: it cuts the screen sliding in at the
          // column's edges without making the column a scroll box, so the
          // document still scrolls and the sticky headers still stick.
          style={{ maxWidth: PAGE_MAX, minHeight: "100dvh", overflowX: "clip" }}
        >
          <AnimatePresence initial={false} custom={move}>
            <ScreenFrame key={key} id={key} move={move}>
              {shown ? <Demo1ScreenView screen={shown} /> : children}
            </ScreenFrame>
          </AnimatePresence>
        </div>
        {/* A screen the shell draws itself still gets its route's page: a
            store's page puts its JSON-LD there (see demo/store/[store]/page.tsx).
            The other pages render nothing. */}
        {shown !== null && children}

        <Demo1BottomNav
          active={shown && barScreen ? tabOf(shown) : null}
          visible={showBar}
          photo={profile.photo}
          verified={profile.emailVerified}
          resetKey={key}
          counts={{ cart: 3, chat: 11 }}
          onSelect={(tab) => navigate(tab)}
          t={t}
        />

        <DemoKeyboard locale={locale} t={t} />
      </DemoChatProvider>
    </NavCtx.Provider>
  );
}
