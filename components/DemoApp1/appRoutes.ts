import type { DemoTab } from "components/DemoApp/demoRoutes";

// Paths of the three tabs that are real pages.
export function tabHref(
  locale: string,
  tab: "home" | "cart" | "settings",
): string {
  return tab === "home" ? `/${locale}` : `/${locale}/${tab}`;
}

// The path without the locale part, split in segments.
const afterLocale = (pathname: string): string[] =>
  pathname.split("/").filter(Boolean).slice(1);

// Which tab is lit. An open chat or search wins over the path.
// A page that belongs to no tab lights nothing.
export function litTab(
  pathname: string,
  open: { chat: boolean; search: boolean },
): DemoTab | null {
  if (open.chat) return "chat";
  if (open.search) return "search";
  const [first] = afterLocale(pathname);
  if (first === undefined) return "home";
  if (first === "cart") return "cart";
  if (first === "settings") return "settings";
  return null;
}

// Pages that draw their own bar. The shell shows no bar on them.
export function shellStepsAside(pathname: string): boolean {
  const [first] = afterLocale(pathname);
  return first === "demo" || first === "loginDemo" || first === "login";
}
