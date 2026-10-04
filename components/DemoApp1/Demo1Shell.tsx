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
} from "framer-motion";
import DemoDeviceInfoModal from "NewLoginDesign/DemoDeviceInfoModal";
import { DemoDataProvider, useDemoData } from "../DemoApp/DemoData";
import { DebugButtons } from "../DemoApp/demoDebug";
import type { DemoDictionary, DemoKey } from "../DemoApp/demoKeys";
import {
  direction,
  hrefFor,
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
  columnBox,
} from "./demo1Layout";

/**
 * The shell of the fluid demo at /[lang]/demo1.
 *
 * The same app as /demo (the same screens, the same data, the same URLs under
 * /demo1), built as a normal web page instead of a scaled canvas:
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
 * Navigation is the /demo shell's (see DemoShell for why it feels instant):
 * the screen changes on the tap, and the URL follows behind it.
 *
 * The slide between two screens
 * -----------------------------
 * The new screen slides in, in the document, from its top. The old one slides
 * out where it was: it is taken out of the document (`fixed`, the size of the
 * screen) and keeps the scroll it had, so nothing jumps while it leaves. Each
 * screen's scroll is kept, so "back" opens the last one where it was left.
 */

type DemoNav = {
  shown: DemoScreen | null;
  navigate: (to: DemoScreen, dir?: 1 | -1) => void;
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

/** What a screen that slides out needs: the way it goes, and the scroll it had. */
type Leave = { dir: 1 | -1; scrollY: number };

const slide = {
  enter: ({ dir }: Leave) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: ({ dir }: Leave) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
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

  const urlScreen = screenFromUrl(pathname, searchParams.toString(), "demo1");
  const [shown, setShown] = useState<DemoScreen | null>(urlScreen);
  const [leave, setLeave] = useState<Leave>({ dir: 1, scrollY: 0 });
  /** The screen a navigation we started is still on its way to. */
  const pending = useRef<DemoScreen | null>(null);
  /** The screens we walked through, so the browser's back can slide the right way. */
  const trail = useRef<DemoScreen[]>([urlScreen ?? "home"]);
  /** The scroll each screen had when it was left. */
  const scrolls = useRef(new Map<string, number>());
  const [hideMenu, setHideMenu] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(false);

  const key = shown ?? `page:${pathname}`;
  const showBar = shown !== null && isTabRoot(shown);

  // The shell keeps each screen's scroll itself, so the browser must not
  // put one back on its own when the URL changes.
  useEffect(() => {
    const before = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = before;
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

  /** Starts a slide: remembers where the screen on show was left. */
  const leaveTo = (to: DemoScreen | null, d: 1 | -1) => {
    const y = window.scrollY;
    scrolls.current.set(key, y);
    setLeave({ dir: d, scrollY: y });
    setShown(to);
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

  const go = (to: DemoScreen, d: 1 | -1, how: "push" | "replace") => {
    const from = shown;
    leaveTo(to, d);
    const href = hrefFor(locale, to, "demo1");
    if (from && sameRoute(from, to)) {
      // Search params only: no server call. Next keeps useSearchParams in step.
      if (how === "push") window.history.pushState(null, "", href);
      else window.history.replaceState(null, "", href);
    } else {
      pending.current = to;
      if (how === "push") router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    }
  };

  const navigate = (to: DemoScreen, d?: 1 | -1) => {
    if (to === shown) return;
    trail.current.push(to);
    go(to, d ?? (shown ? direction(shown, to) : 1), "push");
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
      <div
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

      <Demo1BottomNav
        active={shown && isTabRoot(shown) ? tabOf(shown) : null}
        visible={showBar}
        photo={profile.photo}
        verified={profile.emailVerified}
        resetKey={key}
        onSelect={(tab) => navigate(tab)}
        t={t}
      />

      {/* The demo's own switches, as on /demo: the right edge, mid-height. */}
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
      <DemoDeviceInfoModal
        open={deviceInfo}
        onClose={() => setDeviceInfo(false)}
      />
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

  return (
    <div style={present ? { position: "relative", width: "100%" } : EDGE_ANCHOR}>
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
