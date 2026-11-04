import type { DemoScreen, DemoStaticScreen } from "../DemoApp/demoRoutes";

/**
 * The paths of the real app that a new screen owns (UI-MIGRATION-PLAN.md,
 * "The screen mount").
 *
 * One row per path. `path` is the URL after the locale part (no leading
 * slash); `screen` is the screen's key in AppScreenView. The screen mount
 * (AppScreens) draws the screen on its path. A path with no row shows its
 * old page, as before.
 *
 * To turn a screen on, a stage:
 *  1. adds its row here;
 *  2. makes that path's `page.tsx` render nothing (the mount draws the
 *     screen, not the page). The page may still redirect, for example a
 *     guest to the login (S4-4).
 *
 * Only exact paths match. A screen with no row here (for example the chat
 * before Stage 6) still has a URL: appHrefFor gives its old path.
 */
export type AppScreenRow = { path: string; screen: DemoStaticScreen };

export const APP_SCREENS: readonly AppScreenRow[] = [
  // Stage 6 (lane B): the chat. One chat's screens carry `?id=` (chat/chatPaths.ts).
  { path: "chat", screen: "chat" },
  { path: "chat/conversation", screen: "chat/conversation" },
  { path: "chat/contact", screen: "chat/contact" },
  { path: "chat/call", screen: "chat/call" },
  // Profile (Stage 4). Old paths where an old page existed (S4-1).
  { path: "settings", screen: "settings" },
  { path: "settings/profile", screen: "settings/profile" },
  { path: "settings/profile/info", screen: "settings/profile/personal-info" },
  { path: "settings/profile/size", screen: "settings/profile/body" },
  { path: "settings/profile/picture", screen: "settings/photo" },
  { path: "settings/profile/address", screen: "settings/profile/address" },
  { path: "settings/profile/address/new", screen: "settings/profile/address/new" },
  { path: "settings/profile/client-info", screen: "settings/profile/client-info" },
  { path: "settings/client-id", screen: "settings/client-id" },
  { path: "settings/preferences", screen: "settings/preferences" },
  // Wallet (Stage 5). The screen keeps its mock data (A-17).
  { path: "settings/wallet", screen: "settings/wallet" },
];

/** The path without the locale part, without slashes at the ends. */
const afterLocale = (pathname: string): string =>
  pathname.split("/").filter(Boolean).slice(1).join("/");

/** The screen a URL shows, or null when the path shows an old page. */
export function appScreenFromPath(
  pathname: string,
  rows: readonly AppScreenRow[] = APP_SCREENS,
): DemoStaticScreen | null {
  const path = afterLocale(pathname);
  return rows.find((row) => row.path === path)?.screen ?? null;
}

/** True when the screen is turned on: it has a row. */
export const isAppScreenOn = (
  screen: DemoScreen,
  rows: readonly AppScreenRow[] = APP_SCREENS,
): screen is DemoStaticScreen => rows.some((row) => row.screen === screen);

/**
 * The URL of a screen, under a locale segment such as `sy-en`. A screen with
 * a row goes to its row's path. Any other screen goes to the path with its
 * own name (Home to the home page), which is its old page.
 */
export function appHrefFor(
  locale: string,
  screen: DemoScreen,
  rows: readonly AppScreenRow[] = APP_SCREENS,
): string {
  const row = rows.find((r) => r.screen === screen);
  if (row) return `/${locale}/${row.path}`;
  return screen === "home" ? `/${locale}` : `/${locale}/${screen}`;
}
