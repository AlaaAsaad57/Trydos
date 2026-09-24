/**
 * Every screen of the demo app, and the URL that opens it.
 *
 * Two kinds of address, as agreed for the new design:
 *
 *  - Search, cart and chat are search params on the home route
 *    (`/demo?search`). They open over the home screen and are changed with
 *    `history.pushState`, which Next.js keeps in step with `useSearchParams`,
 *    so there is no server round trip at all.
 *  - The settings and profile pages are real paths under `/demo/settings`.
 *    They can be linked to and reloaded.
 *
 * The demo shell draws the screen from this table, not from the page file of
 * the route, so a tap slides the next screen in on the same frame and the URL
 * catches up behind it. See DemoShell for why.
 */

export const DEMO_SCREENS = [
  "home",
  "search",
  "cart",
  "chat",
  "settings",
  "settings/photo",
  "settings/client-id",
  "settings/profile",
  "settings/profile/client-info",
  "settings/profile/personal-info",
  "settings/profile/body",
  "settings/profile/address",
  "settings/profile/address/new",
] as const;

export type DemoScreen = (typeof DEMO_SCREENS)[number];

/** The tab bar, left to right. `settings` is the profile tab. */
export const DEMO_TABS = [
  "home",
  "search",
  "cart",
  "chat",
  "settings",
] as const;
export type DemoTab = (typeof DEMO_TABS)[number];

/** The screens that are search params on the home route, not paths. */
const OVERLAYS: DemoScreen[] = ["search", "cart", "chat"];

const isScreen = (key: string): key is DemoScreen =>
  (DEMO_SCREENS as readonly string[]).includes(key);

/**
 * Which screen a URL shows, or null for a path under /demo that is not a
 * screen of its own (a server-rendered page added later — the shell shows the
 * route's own page for it).
 */
export function screenFromUrl(
  pathname: string,
  search: URLSearchParams | string,
): DemoScreen | null {
  const parts = pathname.split("/").filter(Boolean);
  const at = parts.indexOf("demo");
  if (at === -1) return null;
  const rest = parts.slice(at + 1).join("/");
  if (!rest) {
    const params =
      typeof search === "string" ? new URLSearchParams(search) : search;
    return OVERLAYS.find((key) => params.has(key)) ?? "home";
  }
  return isScreen(rest) ? rest : null;
}

/** The URL of a screen, under a locale segment such as `sy-en`. */
export function hrefFor(lang: string, key: DemoScreen): string {
  if (key === "home") return `/${lang}/demo`;
  if (OVERLAYS.includes(key)) return `/${lang}/demo?${key}`;
  return `/${lang}/demo/${key}`;
}

/** True when going from one screen to the other changes only the search params. */
export const sameRoute = (a: DemoScreen, b: DemoScreen) =>
  (a === "home" || OVERLAYS.includes(a)) &&
  (b === "home" || OVERLAYS.includes(b));

/** The tab a screen belongs to. */
export const tabOf = (key: DemoScreen): DemoTab => key.split("/")[0] as DemoTab;

/** The screens that show the tab bar. */
export const isTabRoot = (key: DemoScreen) =>
  (DEMO_TABS as readonly string[]).includes(key);

/** Where "back" goes when there is no history to go back through. */
export function parentOf(key: DemoScreen): DemoScreen {
  if (isTabRoot(key)) return "home";
  const parts = key.split("/");
  while (parts.length > 1) {
    parts.pop();
    const up = parts.join("/");
    if (isScreen(up)) return up;
  }
  return "home";
}

/**
 * Which way the screens slide: 1 = the new one comes in from the right,
 * -1 = from the left. The rule the login uses between its steps, applied to
 * places: deeper is forward, shallower is back, between tabs the tab further
 * right is forward, and any other move inside a tab is forward.
 */
export function direction(from: DemoScreen, to: DemoScreen): 1 | -1 {
  if (to.startsWith(`${from}/`)) return 1;
  if (from.startsWith(`${to}/`)) return -1;
  const a = DEMO_TABS.indexOf(tabOf(from));
  const b = DEMO_TABS.indexOf(tabOf(to));
  if (a !== b) return b > a ? 1 : -1;
  // A move inside one tab that is neither up nor down (client info → client
  // ID) is still a tap on something, so it goes forward. Only going back
  // through history slides the other way, and DemoShell decides that itself.
  return 1;
}
