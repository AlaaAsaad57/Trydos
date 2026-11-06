"use client";

import { AnimatePresence } from "framer-motion";
import type { DemoKey } from "../DemoApp/demoKeys";
import type { DemoScreen, DemoStaticScreen } from "../DemoApp/demoRoutes";
import AppScreenView from "./AppScreenView";
import { ChatDataProvider } from "./chat/ChatDataProvider";
import { PAGE_MAX } from "./demo1Layout";
import DemoKeyboard from "./keyboard/DemoKeyboard";
import { ScreenFrame, type Slide } from "./ScreenFrame";
import { NavCtx } from "./screenNav";

/**
 * What a new screen needs around it: its slide, the chat's data and the drawn
 * keyboard. Its own chunk, because an old page needs none of this: AppScreens
 * sits in the [lang] layout, so anything it imports loads on every page.
 */
export default function ScreenMount({
  shown,
  move,
  dir,
  navigate,
  back,
  locale,
  t,
}: {
  shown: DemoStaticScreen;
  move: Slide;
  dir: "ltr" | "rtl";
  navigate: (to: DemoScreen, dir?: 1 | -1) => void;
  back: () => void;
  locale: string;
  t: (key: DemoKey) => string;
}) {
  return (
    <NavCtx.Provider value={{ shown, navigate, back, locale, t }}>
      <div
        data-pw="app-screens"
        dir={dir}
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
    </NavCtx.Provider>
  );
}
