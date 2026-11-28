"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, usePathname } from "next/navigation";
import { useAppStore } from "store";
import { isValidPhone } from "utils/phone";
import { isCrawlerAgent } from "utils/botAgent";
import type { DemoDictionary } from "../DemoApp/demoKeys";
import { anyLayerOpen } from "./layerLocks";

/**
 * The real sign-in request (Stage 7e part 2 of UI-MIGRATION-PLAN.md, Step 5):
 * the /demo sheet (XD `Sign In request`) on every page, with real data.
 *
 * This part runs on every page, so it holds only the timer and the rules. The
 * sheet, its toast and its login layer are SignInAskLayer, which loads only
 * when the request is due (NFR-1, review finding P-1).
 *
 *  - A guest only: the profile is known and has no valid phone. A guest has a
 *    numeric id too, so the phone decides, never `auth.UserID()`. Before the
 *    profile is known, it waits; a signed-in profile ends it for good.
 *  - Every page but the login page, /loginDemo and /demo (the owner, 2026-11-28).
 *    Not `shellStepsAside`: that one also covers the product page.
 *  - SIGN_IN_ASK_MS after the page shows, once per page load (a move inside
 *    the site keeps the module's `asked`). While another layer is open, or the
 *    shopper types, it waits and looks again every SIGN_IN_RETRY_MS, as /demo.
 *    A start flow that ends without a sign-in reloads the page, so the 5 s
 *    start again from there; while it is open `loginLayerOpen` holds the ask.
 *  - A crawler never gets it.
 */

/** How long after the page shows the request comes up, in ms (as /demo). */
export const SIGN_IN_ASK_MS = 5000;

/** How often a request that is due but must wait looks again, in ms (as /demo). */
const SIGN_IN_RETRY_MS = 1000;

/** The first path parts (after the locale) where the request never comes. */
const NO_ASK = new Set(["login", "loginDemo", "demo"]);

/** True once the request came up on this page load. */
let asked = false;

/** For tests: forget that the request came up. */
export const resetSignInAsk = () => {
  asked = false;
};

const SignInAskLayer = dynamic(() => import("./SignInAskLayer"), { ssr: false });

/** True while any overlay of the page is open, or a field has the focus. */
function busy(): boolean {
  const s = useAppStore.getState() as any;
  const typing = document.activeElement?.matches(
    "input, textarea, [contenteditable]",
  );
  return Boolean(
    anyLayerOpen() ||
      typing ||
      s.loginLayerOpen ||
      s.loginOpen ||
      s.shouldAuthinticated ||
      s.selectedStory?.id ||
      s.addStoryEnable ||
      s.call ||
      s.openPayIframe ||
      s.chatVar ||
      s.enable_search ||
      s.isNotificationModal ||
      s.selected_product_for_add_to_cart,
  );
}

export default function AppSignInAsk({ words }: { words: DemoDictionary }) {
  const pathname = usePathname() ?? "";
  const params = useParams();
  const locale = typeof params?.lang === "string" ? params.lang : "sy-en";
  const first = pathname.split("/")[2] ?? "";
  const off = NO_ASK.has(first);
  const [due, setDue] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (off || asked) return;
    if (isCrawlerAgent(navigator.userAgent)) return;
    const check = () => {
      const profile = useAppStore.getState().userProfile as any;
      // A signed-in shopper is never asked.
      if (profile && isValidPhone(profile.phone)) return;
      if (!profile || busy()) {
        timer.current = setTimeout(check, SIGN_IN_RETRY_MS);
        return;
      }
      asked = true;
      setDue(true);
    };
    timer.current = setTimeout(check, SIGN_IN_ASK_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [off]);

  if (!due) return null;
  return <SignInAskLayer words={words} locale={locale} />;
}
