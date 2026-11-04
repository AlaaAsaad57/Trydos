"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig } from "framer-motion";
import type { DemoDictionary, DemoKey } from "../DemoApp/demoKeys";
import {
  direction,
  parentOf,
  type DemoScreen,
  type DemoStaticScreen,
} from "../DemoApp/demoRoutes";
import {
  APP_SCREENS,
  appHrefFor,
  appScreenFromPath,
  isAppScreenOn,
  type AppScreenRow,
} from "./appScreenPaths";
import AppScreenView from "./AppScreenView";
import { ChatDataProvider } from "./chat/ChatDataProvider";
import { PAGE_MAX } from "./demo1Layout";
import DemoKeyboard from "./keyboard/DemoKeyboard";
import { usePageDir } from "./rtl";
import { ScreenFrame, type Leave, type Slide } from "./ScreenFrame";
import { NavCtx } from "./screenNav";

/**
 * The screen mount of the real app (UI-MIGRATION-PLAN.md, "The screen mount";
 * S3-1). The [lang] layout puts it around the page.
 *
 *  - On a path with a row in appScreenPaths.ts it draws that new screen. The
 *    route's page stays in the tree, hidden: it renders nothing, but its
 *    redirect for a guest needs it.
 *  - On any other path it shows the old page, untouched: same DOM, same
 *    server render, the browser's own scroll restore.
 *
 * Between two new screens it works like the /demo shell: the screen changes
 * on the tap, the URL follows, the old screen slides out and the new one in,
 * and each screen keeps its scroll for "back". Between a new screen and an
 * old page nothing slides (Stage 3 rules).
 *
 * The drawn keyboard is mounted only while a new screen shows, so old pages
 * keep the phone's own keyboard.
 */
export default function AppScreens({
  children,
  dictionary,
  rows = APP_SCREENS,
}: {
  children: React.ReactNode;
  /** The new screens' words in the page's language, looked up on the server (S4-9). */
  dictionary: DemoDictionary;
  /** The path table; tests give their own. */
  rows?: readonly AppScreenRow[];
}) {
  return (
    // Reduced motion: moves are instant and fades stay (A-10).
    <MotionConfig reducedMotion="user">
      <AppScreensInner dictionary={dictionary} rows={rows}>
        {children}
      </AppScreensInner>
    </MotionConfig>
  );
}

function AppScreensInner({
  children,
  dictionary,
  rows,
}: {
  children: React.ReactNode;
  dictionary: DemoDictionary;
  rows: readonly AppScreenRow[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.lang === "string" ? params.lang : "sy-en";
  const pageDir = usePageDir();
  const t = (key: DemoKey) => dictionary[key] ?? key;

  const urlScreen = appScreenFromPath(pathname, rows);
  const [shown, setShown] = useState<DemoStaticScreen | null>(urlScreen);
  const [leave, setLeave] = useState<Leave>({ dir: 1, scrollY: 0 });
  /** The screen a navigation we started is still on its way to. */
  const pending = useRef<DemoStaticScreen | null>(null);
  /** What we walked through (null = an old page), so the browser's back slides the right way. */
  const trail = useRef<(DemoStaticScreen | null)[]>([urlScreen]);
  /** The scroll each new screen had when it was left. */
  const scrolls = useRef(new Map<string, number>());

  const move: Slide = { ...leave, side: pageDir === "rtl" ? -1 : 1 };
  const onScreen = shown !== null;

  // While a new screen shows, the mount keeps each screen's scroll itself, so
  // the browser must not put one back on its own. The site's <html> carries
  // `overflow-x: clip`; a new screen clips itself (see Demo1Shell for why
  // Safari 26 wants no clip on the root). Old pages get both back.
  useEffect(() => {
    if (!onScreen) return;
    const before = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    document.documentElement.style.setProperty(
      "overflow-x",
      "visible",
      "important",
    );
    return () => {
      window.history.scrollRestoration = before;
      document.documentElement.style.removeProperty("overflow-x");
    };
  }, [onScreen]);

  // A new screen starts at its top; going back opens the last one where it
  // was left. Before paint, so the new screen never shows the old scroll.
  useLayoutEffect(() => {
    if (!shown) return;
    const y = leave.dir < 0 ? (scrolls.current.get(shown) ?? 0) : 0;
    window.scrollTo(0, y);
  }, [shown]);

  /** Starts a change of screen, and remembers where the screen on show was left. */
  const leaveTo = (to: DemoStaticScreen | null, dir: 1 | -1) => {
    const y = window.scrollY;
    if (shown) scrolls.current.set(shown, y);
    setLeave({ dir, scrollY: y });
    setShown(to);
  };

  // The URL moved without us: the browser's back or forward, a link, a tab of
  // the bottom bar, or a navigation of ours to an old page.
  useEffect(() => {
    if (pending.current) {
      if (urlScreen === pending.current) pending.current = null;
      return;
    }
    if (urlScreen === shown) return;
    const path = trail.current;
    let dir: 1 | -1 = 1;
    if (path.length > 1 && path[path.length - 2] === urlScreen) {
      path.pop();
      dir = -1;
    } else {
      path.push(urlScreen);
      if (urlScreen && shown) dir = direction(shown, urlScreen);
    }
    leaveTo(urlScreen, dir);
    // Only the URL decides here; `shown` is read, not followed.
  }, [urlScreen]);

  /** Goes to a screen that has a row: draw it now, the URL follows. */
  const go = (to: DemoStaticScreen, dir: 1 | -1, how: "push" | "replace") => {
    leaveTo(to, dir);
    pending.current = to;
    const href = appHrefFor(locale, to, rows);
    if (how === "push") router.push(href, { scroll: false });
    else router.replace(href, { scroll: false });
  };

  const navigate = (to: DemoScreen, dir?: 1 | -1) => {
    if (to === shown) return;
    // A screen that is not turned on is an old page: the router opens it,
    // and the URL effect above clears the screen when the page is there.
    if (!isAppScreenOn(to, rows)) {
      router.push(appHrefFor(locale, to, rows));
      return;
    }
    trail.current.push(to);
    go(to, dir ?? (shown ? direction(shown, to) : 1), "push");
  };

  const back = () => {
    const path = trail.current;
    if (path.length > 1) {
      // Slide now when the way back is a new screen; the browser's own back
      // brings the URL after it. An old page comes with the URL.
      path.pop();
      const to = path[path.length - 1];
      if (to) {
        leaveTo(to, -1);
        pending.current = to;
      }
      window.history.back();
      return;
    }
    // Opened straight on an inner screen: go up one level instead.
    const up = shown ? parentOf(shown) : "home";
    if (isAppScreenOn(up, rows)) {
      trail.current = [up];
      go(up, -1, "replace");
    } else {
      trail.current = [null];
      router.replace(appHrefFor(locale, up, rows));
    }
  };

  if (!shown) return <>{children}</>;

  return (
    <NavCtx.Provider value={{ shown, navigate, back, locale, t }}>
      <div
        data-pw="app-screens"
        dir={pageDir}
        className="relative w-full mx-auto font-quicksand"
        // `clip` and not `hidden`: it cuts the screen sliding in at the
        // column's edges without making the column a scroll box, so the
        // document still scrolls and the sticky headers still stick.
        style={{ maxWidth: PAGE_MAX, minHeight: "100dvh", overflowX: "clip" }}
      >
        {/* The real chat (Stage 6). Always here, so the tree never changes and
            the slides keep working; it loads and maps the chat only while a
            chat screen shows. */}
        <ChatDataProvider locale={locale} screen={shown}>
          <AnimatePresence initial={false} custom={move}>
            <ScreenFrame key={shown} id={shown} move={move}>
              <AppScreenView screen={shown} />
            </ScreenFrame>
          </AnimatePresence>
        </ChatDataProvider>
      </div>
      <DemoKeyboard locale={locale} t={t} />
      {/* The route's page renders nothing here, but it must stay in the tree:
          its redirect (a guest to the login, S4-4) reaches the browser only
          when the page is rendered. Hidden, so the settings template's box
          takes no room. */}
      <div hidden>{children}</div>
    </NavCtx.Provider>
  );
}
