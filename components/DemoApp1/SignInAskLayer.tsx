"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "store";
import type { DemoDictionary, DemoKey } from "../DemoApp/demoKeys";
import { appBarShrink } from "./appBarShrink";
import { NavCtx, type DemoNav } from "./screenNav";
import StartCover from "./StartCover";
import SheetSkeleton from "components/skeleton/SheetSkeleton";
import Toast, { useToast } from "./chat/Toast";

/**
 * The sign-in request's sheet and its login layer (Stage 7e part 2). This
 * file loads only when the request is due (AppSignInAsk, which runs on every
 * page, holds only the timer), so the sheet, the toast and the screen context
 * cost an old page nothing until then (NFR-1, review finding P-1).
 *
 *  - The sheet (XD `Sign In request`) opens at once. "Later", the dimmed page
 *    and a drag down close it (its own `onClose`).
 *  - "More Info" says "Soon available": there is no page for it yet (S7e-3).
 *  - "Get Started" opens the real login (NewLoginWidget) as a layer over the
 *    page, as /demo does. Its end (signed in, "Later", the close) closes it
 *    and leaves the shopper where they were: no route change. The widget
 *    itself refreshes the page's server parts after a sign-in.
 *  - The login's code starts loading as the sheet opens, so "Get Started"
 *    does not wait on it.
 */

const loadLogin = () => import("NewLoginDesign/NewLoginWidget");
const SignInRequestSheet = dynamic(() => import("./screens/SignInRequestSheet"), {
  ssr: false,
  loading: () => <SheetSkeleton />,
});
const NewLoginWidget = dynamic(loadLogin, {
  ssr: false,
  loading: () => <StartCover />,
});

/**
 * The page as it was before the login layer: the login's page scaler
 * (scaling/AppScaler.tsx) leaves `--xd-unit` on <html> and clears <body>'s
 * colour when it closes. A layer does not remount the page, so it is put back
 * here, as Demo1Shell does after its own login layer.
 *
 * It must run AFTER the scaler's own clean-up, which runs when the widget
 * unmounts, so it is called from an effect once the layer is gone, never from
 * the close handler (a close-handler restore was undone at once, seen on a
 * production build: <body> lost the page's colour after a sign-in).
 */
function restorePage() {
  const root = document.documentElement;
  root.style.removeProperty("--xd-unit");
  const color = root.style.getPropertyValue("background-color");
  if (color) document.body.style.setProperty("background-color", color, "important");
}

export default function SignInAskLayer({
  words,
  locale,
}: {
  words: DemoDictionary;
  locale: string;
}) {
  const [open, setOpen] = useState(true);
  const [signing, setSigning] = useState(false);
  const [toast, showToast] = useToast();
  const wasSigning = useRef(false);

  // After the login layer has gone (its scaler has cleaned up): the page back.
  useEffect(() => {
    if (signing) {
      wasSigning.current = true;
      return;
    }
    if (!wasSigning.current) return;
    wasSigning.current = false;
    restorePage();
  }, [signing]);

  // The login's code loads while the shopper reads the sheet.
  useEffect(() => {
    void loadLogin();
  }, []);

  const t = (key: DemoKey) => words[key] ?? key;
  const nav: DemoNav = {
    shown: null,
    navigate: () => {},
    back: () => {},
    locale,
    t,
    barShrink: appBarShrink,
  };

  const start = () => {
    setOpen(false);
    useAppStore.getState().setLoginLayerOpen(true);
    setSigning(true);
  };

  const endLogin = () => {
    setSigning(false);
    useAppStore.getState().setLoginLayerOpen(false);
  };

  return (
    <NavCtx.Provider value={nav}>
      <SignInRequestSheet
        open={open}
        onClose={() => setOpen(false)}
        onStart={start}
        onMoreInfo={() => showToast(t("Soon available"))}
      />
      <Toast text={toast} bottom={110} fixed />
      {signing && <NewLoginWidget initialStep="get-started" onFinish={endLogin} />}
    </NavCtx.Provider>
  );
}
