"use client";

import { createContext, useContext } from "react";
import type { DemoKey } from "../DemoApp/demoKeys";
import type { DemoScreen } from "../DemoApp/demoRoutes";

/**
 * What a new screen needs from the shell that draws it: the screen on show,
 * a way to open another screen, a way back, the locale and the words.
 *
 * Two shells give it: the /demo preview (Demo1Shell) and the real app's
 * screen mount (AppScreens). A screen reads it with useDemoNav() and does
 * not know which shell it is in.
 */
export type DemoNav = {
  shown: DemoScreen | null;
  /**
   * Opens a screen. `from` is the element that was tapped; on /demo a
   * store's page grows out of it (see Demo1Shell).
   */
  navigate: (to: DemoScreen, dir?: 1 | -1, from?: Element | null) => void;
  back: () => void;
  /** The locale segment, e.g. `sy-en`. */
  locale: string;
  t: (key: DemoKey) => string;
};

export const NavCtx = createContext<DemoNav | null>(null);

export function useDemoNav(): DemoNav {
  const value = useContext(NavCtx);
  if (!value) throw new Error("useDemoNav must be used inside a screen shell");
  return value;
}
