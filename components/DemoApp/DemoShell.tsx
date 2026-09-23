"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Page from "scaling/Page";
import "public/styles/rdb-auth.css";
import DemoDeviceInfoModal from "NewLoginDesign/DemoDeviceInfoModal";
import { DemoDataProvider, useDemoData } from "./DemoData";
import DemoBottomNav from "./DemoBottomNav";
import DemoScreenView from "./DemoScreenView";
import { SCREEN_TRANSITION } from "./demoLayout";
import type { DemoDictionary, DemoKey } from "./demoKeys";
import {
  direction,
  hrefFor,
  isTabRoot,
  parentOf,
  sameRoute,
  screenFromUrl,
  tabOf,
  type DemoScreen,
} from "./demoRoutes";

/**
 * The shell of the new app design at /[lang]/demo.
 *
 * It is the route's layout, so it stays mounted while the shopper moves
 * between every demo screen: one scaled canvas (the login's AppScaler, via
 * <Page variant="scaled">), one tab bar, one copy of the shopper's data.
 *
 * Why navigation feels instant
 * ----------------------------
 * A Next.js navigation waits for the server's answer for the new route before
 * the new page appears. That wait is what made page changes feel slow. Here
 * the shell does not wait for it:
 *
 *   1. A tap calls `navigate(screen)`. The shell sets that screen as the one it
 *      shows AT ONCE, so the slide starts on the same frame as the tap.
 *   2. Then it updates the URL behind the slide: `history.pushState` for search,
 *      cart and chat (search params — Next keeps `useSearchParams` in step with
 *      it, and there is no server call at all), or `router.push` for a settings
 *      path (the route's page renders nothing, so its answer is tiny).
 *   3. When the URL lands, it already names the screen on show, and nothing
 *      moves again. `pending` holds the screen until then, so a URL that lands
 *      in between (the shopper tapped twice) does not pull the old one back.
 *
 * The back and forward buttons of the browser change the URL first. The effect
 * below sees a URL that does not match the screen on show and slides to it:
 * backwards if it is the screen before this one, forwards otherwise.
 *
 * Pages that need the server
 * --------------------------
 * A path under /demo that is not in `DEMO_SCREENS` is drawn from the route's
 * own page (`children`), inside the same slide. Such a page should ship a
 * `loading.tsx` shaped like its content: Next shows that skeleton the moment
 * the link is tapped, so the slide still starts at once and the content
 * streams in behind it (node_modules/next/dist/docs/01-app/02-guides/
 * instant-navigation.md).
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
  if (!value) throw new Error("useDemoNav must be used inside DemoShell");
  return value;
}

/** The slide between screens — the login's, see NewLoginWidget. */
const slide = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export default function DemoShell({
  children,
  dictionary,
}: {
  children: React.ReactNode;
  /** The demo's words in the page's language, looked up on the server — see demoKeys.ts. */
  dictionary: DemoDictionary;
}) {
  return (
    <DemoDataProvider>
      <DemoShellInner dictionary={dictionary}>{children}</DemoShellInner>
    </DemoDataProvider>
  );
}

function DemoShellInner({
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
  const [dir, setDir] = useState<1 | -1>(1);
  /** The screen a navigation we started is still on its way to. */
  const pending = useRef<DemoScreen | null>(null);
  /** The screens we walked through, so the browser's back can slide the right way. */
  const trail = useRef<DemoScreen[]>([urlScreen ?? "home"]);
  const [hideMenu, setHideMenu] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(false);

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
    setDir(next);
    setShown(urlScreen);
    // Only the URL decides here; `shown` is read, not followed.
  }, [urlScreen]);

  const go = (to: DemoScreen, d: 1 | -1, how: "push" | "replace") => {
    const from = shown;
    setDir(d);
    setShown(to);
    const href = hrefFor(locale, to);
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
      setDir(-1);
      setShown(to);
      if (!(from && sameRoute(from, to))) pending.current = to;
      window.history.back();
      return;
    }
    // Opened straight on an inner screen: there is nothing to go back to,
    // so go up one level instead, in place of this entry.
    const up = shown ? parentOf(shown) : "home";
    trail.current = [up];
    go(up, -1, "replace");
  };

  const onTab = (tab: ReturnType<typeof tabOf>) => navigate(tab);

  const key = shown ?? `page:${pathname}`;
  const showBar = shown !== null && isTabRoot(shown);

  return (
    <NavCtx.Provider value={{ shown, navigate, back, locale, t }}>
      <main
        data-pw="demo-app"
        className="fixed inset-0 z-[99999999999] w-full h-dvh overflow-hidden font-quicksand bg-white"
      >
        {/* The demo's own switches, outside the canvas so nothing scales them.
                    The same switches the login demo carries, but on the right edge at
                    mid-height: the top-left corner is the back arrow here. */}
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
        </div>
        <DemoDeviceInfoModal
          open={deviceInfo}
          onClose={() => setDeviceInfo(false)}
        />

        <Page variant="scaled">
          <div
            className="relative w-full h-full overflow-hidden"
            // The stage must never scroll sideways — see the same guard in NewLoginWidget.
            onScroll={(e) => {
              e.currentTarget.scrollLeft = 0;
              e.currentTarget.scrollTop = 0;
            }}
          >
            <AnimatePresence initial={false} custom={dir}>
              <motion.div
                key={key}
                data-demo-screen={key}
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={SCREEN_TRANSITION}
                className="absolute inset-0 w-full h-full"
              >
                {shown ? <DemoScreenView screen={shown} /> : children}
              </motion.div>
            </AnimatePresence>

            <DemoBottomNav
              active={shown && isTabRoot(shown) ? tabOf(shown) : null}
              visible={showBar}
              photo={profile.photo}
              resetKey={key}
              onSelect={onTab}
              t={t}
            />
          </div>
        </Page>
      </main>
    </NavCtx.Provider>
  );
}
