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
  MotionConfig,
  useIsPresent,
  usePresenceData,
} from "framer-motion";
import { DemoDataProvider, useDemoData } from "../DemoApp/DemoData";
import { DemoChatProvider } from "../DemoApp/demoChatState";
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
import DemoKeyboard from "./keyboard/DemoKeyboard";
import { usePageDir } from "./rtl";

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

/**
 * A slide, as framer-motion gets it: the way the walk goes (`dir`, 1 = deeper)
 * and the side "deeper" comes in from (`side`, 1 = the right). On a
 * right-to-left page the side is mirrored: a deeper screen comes in from the
 * left, and going back slides it out to the left.
 */
type Slide = Leave & { side: 1 | -1 };

const slide = {
  enter: ({ dir, side }: Slide) => ({ x: `${dir * side * 100}%`, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: ({ dir, side }: Slide) => ({ x: `${-dir * side * 100}%`, opacity: 0 }),
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

  const key = shown ?? `page:${pathname}`;
  const showBar = shown !== null && isTabRoot(shown);
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

        <Demo1BottomNav
          active={shown && isTabRoot(shown) ? tabOf(shown) : null}
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
  move,
  children,
}: {
  id: string;
  move: Slide;
  children: React.ReactNode;
}) {
  const present = useIsPresent();
  // The scroll it had when it was left; given to the frame by AnimatePresence.
  const leaving = usePresenceData() as Slide | undefined;
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
        custom={move}
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
