"use client";

import React, {
  createContext,
  useContext,
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
  motion,
  useIsPresent,
  usePresenceData,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import DemoDeviceInfoModal from "NewLoginDesign/DemoDeviceInfoModal";
import { DemoDataProvider, useDemoData } from "../DemoApp/DemoData";
import { DemoChatProvider } from "../DemoApp/demoChatState";
import { DebugButtons } from "../DemoApp/demoDebug";
import type { DemoDictionary, DemoKey } from "../DemoApp/demoKeys";
import {
  direction,
  hrefFor,
  isStoreScreen,
  isTabRoot,
  parentOf,
  sameRoute,
  screenFromUrl,
  tabOf,
  type DemoScreen,
} from "../DemoApp/demoRoutes";
import Demo1BottomNav from "./Demo1BottomNav";
import Demo1ScreenView from "./Demo1ScreenView";
import {
  EDGE_ANCHOR,
  PAGE_MAX,
  SCREEN_TRANSITION,
  STORE_GROW,
  STORE_SHRINK,
  columnBox,
} from "./demo1Layout";
import DemoKeyboard from "./keyboard/DemoKeyboard";

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
 *  - The site's own navbar from the [lang] layout is hidden while the demo is
 *    on show (HIDE_SITE_CHROME, served by the route's layout, so it is hidden
 *    on the first paint too).
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
 * A store's page: the card grows into the page
 * --------------------------------------------
 * A store opened from a card on Home does not slide. The tapped card grows
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
 */

/**
 * The card a store's page grows from: its box in px, from the page column's
 * left edge and the window's top, when it was tapped. `vh` is the window's
 * height then. Back to the same screen, the page shrinks into the same box:
 * that screen opens at the same scroll, so the card is in the same place.
 */
export type Origin = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  vh: number;
};

type DemoNav = {
  shown: DemoScreen | null;
  /**
   * Opens a screen. `from` is the element that was tapped; a store's page
   * grows out of it (see "A store's page" above).
   */
  navigate: (to: DemoScreen, dir?: 1 | -1, from?: Element | null) => void;
  back: () => void;
  /** The locale segment, e.g. `sy-en`. */
  locale: string;
  t: (key: DemoKey) => string;
};

const NavCtx = createContext<DemoNav | null>(null);

export function useDemoNav(): DemoNav {
  const value = useContext(NavCtx);
  if (!value) throw new Error("useDemoNav must be used inside Demo1Shell");
  return value;
}

/**
 * What a change of screen needs: the way it goes and the scroll the old
 * screen had. `grow` and `shrink` are set for a store's page that grows out
 * of a card or shrinks back into it; `fade` replaces both when the system
 * asks for less motion.
 */
type Leave = {
  dir: 1 | -1;
  scrollY: number;
  grow?: Origin;
  shrink?: Origin;
  fade?: boolean;
};

/** The clip of a page cut to a card's box. `bottom` is the room under the box. */
const cutTo = (o: Origin, bottom: string) =>
  `inset(${o.top}px ${o.right}px ${bottom} ${o.left}px)`;

const slide: Variants = {
  enter: ({ dir, grow, shrink, fade }: Leave) => {
    if (fade) return { x: 0, opacity: 0 };
    // The page in the document is as tall as all of it, so the room under
    // the card is counted from the page's end: 100% less the card's bottom.
    if (grow)
      return { x: 0, opacity: 0, clipPath: cutTo(grow, `calc(100% - ${grow.bottom}px)`) };
    // Back from a store: the screen under it is already in place.
    if (shrink) return { x: 0, opacity: 1 };
    return { x: dir > 0 ? "100%" : "-100%", opacity: 0 };
  },
  center: ({ grow }: Leave) =>
    grow
      ? {
          x: 0,
          opacity: 1,
          // Open to the window's box (the same shape of value as the cut, so
          // it animates), then take the clip away.
          clipPath: `inset(0px 0px calc(100% - ${grow.vh}px) 0px)`,
          transitionEnd: { clipPath: "none" },
          transition: {
            clipPath: STORE_GROW,
            opacity: { duration: STORE_GROW.duration * 0.4, ease: "linear" },
          },
        }
      : { x: 0, opacity: 1 },
  exit: ({ dir, grow, shrink, fade }: Leave) => {
    if (fade) return { x: 0, opacity: 0 };
    // The screen under a growing page: it stays, and goes once it is covered.
    if (grow)
      return {
        x: 0,
        opacity: 0,
        transition: { duration: 0.15, delay: STORE_GROW.duration - 0.15 },
      };
    // The store's page leaving: it is a box the window's size now, so the
    // room under the card is the window's height less the card's bottom.
    if (shrink)
      return {
        x: 0,
        clipPath: [
          "inset(0px 0px 0px 0px)",
          cutTo(shrink, `${Math.max(0, shrink.vh - shrink.bottom)}px`),
        ],
        opacity: [1, 1, 0],
        transition: {
          clipPath: STORE_SHRINK,
          opacity: { duration: STORE_SHRINK.duration, times: [0, 0.6, 1] },
        },
      };
    return { x: dir > 0 ? "-100%" : "100%", opacity: 0 };
  },
};

export default function Demo1Shell({
  children,
  dictionary,
}: {
  children: React.ReactNode;
  /** The demo's words in the page's language, looked up on the server — see demoKeys.ts. */
  dictionary: DemoDictionary;
}) {
  return (
    <DemoDataProvider>
      <Demo1ShellInner dictionary={dictionary}>{children}</Demo1ShellInner>
    </DemoDataProvider>
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
  const [hideMenu, setHideMenu] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(false);

  const key = shown ?? `page:${pathname}`;
  // The tab bar shows on the tab screens, and on a store's page too (it
  // belongs to the Home tab, so Home is the active tab there).
  const barScreen = shown !== null && (isTabRoot(shown) || isStoreScreen(shown));
  const showBar = barScreen;

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
    const opening = to !== null && isStoreScreen(to) && d > 0;
    const closing = shown !== null && isStoreScreen(shown) && d < 0;
    if (opening && grow) {
      if (reduceMotion) next.fade = true;
      else next.grow = grow;
    } else if (closing) {
      // Shrink only into the card it grew from, on the screen it was on.
      const origin = origins.current.get(shown);
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
    if (from && (sameRoute(from, to) || (how === "push" && isStoreScreen(to)))) {
      // Search params only, or a store: no server call.
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
    const grow = isStoreScreen(to) ? originOf(from) : undefined;
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
          className="relative w-full mx-auto font-quicksand"
          // `clip` and not `hidden`: it cuts the screen sliding in at the
          // column's edges without making the column a scroll box, so the
          // document still scrolls and the sticky headers still stick.
          style={{ maxWidth: PAGE_MAX, minHeight: "100dvh", overflowX: "clip" }}
        >
          <AnimatePresence initial={false} custom={leave}>
            <ScreenFrame key={key} id={key} leave={leave}>
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
          onSelect={(tab) => navigate(tab)}
          t={t}
        />

        {/* The demo's own switches, as on the old scaled demo: the right edge, mid-height. */}
        <div
          data-pw="demo-controls"
          className="fixed right-2 top-1/2 -translate-y-1/2 z-[999999999999] flex flex-col items-end gap-2 font-quicksand select-none"
        >
          <label className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 shadow border border-gray-200 text-gray-800 flex items-center gap-1.5 backdrop-blur-sm cursor-pointer">
            <input
              type="checkbox"
              checked={hideMenu}
              onChange={(e) => setHideMenu(e.target.checked)}
              className="accent-[#402CDD] cursor-pointer"
            />
            <span>{t("Hide menu")}</span>
          </label>
          {!hideMenu && (
            <button
              type="button"
              aria-label={t("Device and browser info")}
              onClick={() => setDeviceInfo(true)}
              className="w-7 h-7 text-xs font-bold rounded-full bg-white/90 shadow border border-gray-200 text-[#402CDD] cursor-pointer"
            >
              i
            </button>
          )}
          {!hideMenu && <DebugButtons t={t} />}
        </div>
        <DemoKeyboard locale={locale} t={t} />
        <DemoDeviceInfoModal
          open={deviceInfo}
          onClose={() => setDeviceInfo(false)}
        />
      </DemoChatProvider>
    </NavCtx.Provider>
  );
}

/**
 * One screen on stage. In the document while it is on show; while it slides
 * out it is a layer the size of the window, fixed to it, that keeps the scroll
 * it had, so its sticky header stays where it was too.
 *
 * The fixed box is an anchor with no size and the screen hangs on it. A fixed
 * box the size of the screen is what Safari 26 reads at the bottom edge: it
 * painted the room under its bar in the leaving screen's colour, and kept it
 * after the slide (see EDGE_ANCHOR in demo1Layout.ts).
 */
function ScreenFrame({
  id,
  leave,
  children,
}: {
  id: string;
  leave: Leave;
  children: React.ReactNode;
}) {
  const present = useIsPresent();
  // The scroll it had when it was left; given to the frame by AnimatePresence.
  const leaving = usePresenceData() as Leave | undefined;
  const frame = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!present && frame.current)
      frame.current.scrollTop = leaving?.scrollY ?? 0;
  }, [present, leaving]);

  // A store's page lies over the screen under it, both while it grows in and
  // while it shrinks out.
  const onTop = present ? !!leave.grow : !!leaving?.shrink;

  return (
    <div
      style={{
        ...(present ? { position: "relative", width: "100%" } : EDGE_ANCHOR),
        zIndex: onTop ? 1 : undefined,
      }}
    >
      <motion.div
        ref={frame}
        data-demo-screen={id}
        custom={leave}
        variants={slide}
        initial="enter"
        animate="center"
        exit="exit"
        transition={SCREEN_TRANSITION}
        style={
          present
            ? { position: "relative", width: "100%" }
            : {
                ...columnBox("100dvh"),
                overflow: "hidden",
                pointerEvents: "none",
              }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}
