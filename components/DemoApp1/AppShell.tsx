"use client";

import { useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAppStore } from "store";
import type { DemoTab } from "../DemoApp/demoRoutes";
import type { DemoDictionary, DemoKey } from "../DemoApp/demoKeys";
import Demo1BottomNav from "./Demo1BottomNav";
import { TAB_ROOM } from "./demo1Layout";
import { isHomePath, litTab, shellStepsAside, tabHref } from "./appRoutes";
import { openChatFromTab } from "./openChatFromTab";
import { usePageDir } from "./rtl";
import { useShellData } from "./useShellData";

/** The words the bar shows. The [lang] layout looks them up on the server. */
export type AppShellDictionary = Pick<
  DemoDictionary,
  "Home" | "Search" | "Cart" | "Chat" | "Profile" | "Main"
>;

/**
 * The new bottom bar on every page of the real app (Stage 3 of
 * UI-MIGRATION-PLAN.md, S3-1).
 *
 * It renders the bar only. The [lang] layout mounts it next to the page, not
 * around it, so the old pages keep their own DOM, their server render and the
 * browser's own scroll restore. The bar itself is portaled to <body>.
 *
 *  - No bar on the pages that draw their own (/demo, /loginDemo, /login).
 *  - The bar hides while an old overlay covers the screen (sign-in, phone
 *    check, a story, add story, a call, the payment frame). It stays over an
 *    open chat and an open search, with that tab lit (S3-10).
 *  - While the bar shows, `--app-bar-room` on <html> holds the room it takes,
 *    so `.main-content` (globals.css) keeps its last row above the bar.
 */
export default function AppShell({
  dictionary,
}: {
  dictionary: AppShellDictionary;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.lang === "string" ? params.lang : "sy-en";
  const pageDir = usePageDir();
  const t = (key: DemoKey) => dictionary[key as keyof AppShellDictionary] ?? key;
  const { cartCount, unreadChats, photo, phoneVerified } = useShellData();

  const loginOpen = useAppStore((s) => s.loginOpen);
  const shouldAuthinticated = useAppStore((s) => s.shouldAuthinticated);
  const storyOpen = useAppStore((s) => Boolean(s.selectedStory?.id));
  const addStoryEnable = useAppStore((s) => s.addStoryEnable);
  const call = useAppStore((s) => s.call);
  const openPayIframe = useAppStore((s) => s.openPayIframe);
  const chatOpen = useAppStore((s) => s.chatVar);
  const searchOpen = useAppStore((s) => s.enable_search);

  const stepsAside = shellStepsAside(pathname);
  const covered = Boolean(
    loginOpen ||
      shouldAuthinticated ||
      storyOpen ||
      addStoryEnable ||
      call ||
      openPayIframe,
  );
  const showBar = !stepsAside && !covered;

  // The room the bar takes, for the page's bottom padding. Only while it shows.
  useEffect(() => {
    if (!showBar) return;
    const root = document.documentElement.style;
    root.setProperty("--app-bar-room", TAB_ROOM);
    return () => {
      root.removeProperty("--app-bar-room");
    };
  }, [showBar]);

  // A Search request waits for the home page. When the shopper lands on a
  // page that is not home instead, the request is dropped, so it cannot open
  // search on a later, unrelated visit to the home page. This runs only when
  // the path changes, so a request made on /cart survives its own push home.
  useEffect(() => {
    if (isHomePath(pathname)) return;
    const { openSearchRequest, handledSearchRequest, setHandledSearchRequest } =
      useAppStore.getState();
    if (openSearchRequest > handledSearchRequest)
      setHandledSearchRequest(openSearchRequest);
  }, [pathname]);

  const onSelect = (tab: DemoTab) => {
    switch (tab) {
      case "home":
        router.push(tabHref(locale, "home"));
        return;
      case "search":
        // The tab opens the old search on the home page (S3-5). Only the home
        // page's SearchIcon takes the request, so go there first when the
        // shopper is on another page. The request is a counter in the store,
        // so the home SearchIcon still sees it when it mounts after the push.
        if (!isHomePath(pathname)) router.push(tabHref(locale, "home"));
        useAppStore.getState().requestOpenSearch();
        return;
      case "cart":
        useAppStore.getState().enableCart(true);
        return;
      case "chat":
        void openChatFromTab();
        return;
      case "settings":
        router.push(tabHref(locale, "settings"));
        return;
    }
  };

  if (stepsAside) return null;

  return (
    // `display: contents`: the root draws no box of its own next to the page.
    <div data-pw="app-shell" dir={pageDir} className="contents">
      <Demo1BottomNav
        active={litTab(pathname, { chat: chatOpen, search: searchOpen })}
        visible={showBar}
        photo={photo}
        verified={phoneVerified}
        resetKey={pathname}
        counts={{ cart: cartCount, chat: unreadChats }}
        onSelect={onSelect}
        t={t}
      />
    </div>
  );
}
