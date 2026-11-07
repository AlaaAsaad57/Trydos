"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { tabHref } from "components/DemoApp1/appRoutes";
import { isDemoPath } from "components/skeleton/pageKinds";
import { useAppStore } from "store";
import { pageIsReady } from "utils/pageIsReady";
import { isValidPhone } from "utils/phone";

/** After the page is ready, so this never takes a byte from the first screen. */
const START_AFTER_MS = 1000;
/** The steps go one by one, so a slow line is not filled all at once. */
const STEP_GAP_MS = 1200;

type Connection = { saveData?: boolean; effectiveType?: string };

/**
 * Readies what the next tap needs, once the page is ready and the phone is
 * idle: the tabs' routes, and the code that left the first load (the screen
 * mount, the chat and Profile tabs, the login flow, the size sheet). A tap then
 * finds them here, and its skeleton lasts only for the data.
 *
 * A guest's Chat and Profile tabs lead to the login page, so a guest gets that
 * and not the screens. Nothing runs on a "save data" line or on 2G.
 */
export default function PageWarmup() {
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.lang === "string" ? params.lang : "sy-en";

  useEffect(() => {
    if (isDemoPath(window.location.pathname)) return;
    const line = (navigator as { connection?: Connection }).connection;
    if (line?.saveData || /2g/.test(line?.effectiveType ?? "")) return;

    // At once, not with the steps: on a direct landing the back mark goes here,
    // and this is about 3 KB.
    router.prefetch(tabHref(locale, "home"));

    const signedIn = isValidPhone(useAppStore.getState().userProfile?.phone);
    const steps: (() => unknown)[] = [
      () => router.prefetch(tabHref(locale, "search")),
      ...(signedIn
        ? [
            () => import("components/DemoApp1/ScreenMount"),
            () => import("components/DemoApp1/screens/ChatListScreen"),
            () => import("components/DemoApp1/screens/ProfileScreen"),
          ]
        : [
            () => router.prefetch(`/${locale}/login`),
            () => import("NewLoginDesign/NewLoginWidget"),
          ]),
      () => import("components/Cart/AddToCart/AddToCartComponent"),
      () => import("components/Login/ConfirmMobilePhoneWidget"),
    ];

    let timer: ReturnType<typeof setTimeout>;
    let idle = 0;
    const whenIdle = (run: () => void) => {
      if ("requestIdleCallback" in window) {
        idle = window.requestIdleCallback(run, { timeout: 2000 });
      } else {
        run();
      }
    };
    const next = () => {
      const step = steps.shift();
      if (!step) return;
      whenIdle(() => {
        // A chunk that cannot load now loads at the tap, with its skeleton.
        Promise.resolve(step()).catch(() => {});
        timer = setTimeout(next, STEP_GAP_MS);
      });
    };
    let stopped = false;
    void pageIsReady().then(() => {
      if (!stopped) timer = setTimeout(next, START_AFTER_MS);
    });

    return () => {
      stopped = true;
      clearTimeout(timer);
      if (idle && "cancelIdleCallback" in window) window.cancelIdleCallback(idle);
    };
    // Once per visit: the layout keeps this mounted.
  }, []);

  return null;
}
