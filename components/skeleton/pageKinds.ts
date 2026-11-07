/**
 * Which skeleton a URL has. One table, so a page shows the same skeleton
 * however the shopper reaches it. A new page needs a row here.
 *
 * The new screens are not here: appScreenPaths.ts already names them.
 */
export type PageKind =
  | "home"
  | "listing"
  | "product"
  | "search"
  | "cart"
  | "compare"
  | "login"
  | "text"
  | "orders"
  | "order"
  | "checklist"
  | "countries"
  | "languages"
  | "notifications"
  | "shops"
  | "dashboard"
  | "editor";

const TEXT_PAGES = ["about", "contact", "privacy-policy", "terms-of-service"];
const LISTINGS = ["filters", "featured", "flashDeals"];

/** The path without the locale part, split in segments. */
const segments = (pathname: string) =>
  pathname.split("/").filter(Boolean).slice(1);

/**
 * True on /demo and /loginDemo. These pages keep their own shell, and the
 * Safari top and bottom colour work on them must not meet anything new, so the
 * tap skeleton never runs there.
 */
export function isDemoPath(pathname: string): boolean {
  const [first] = segments(pathname);
  return first === "demo" || first === "loginDemo";
}

/**
 * The page column's class. The app is one 500 px column (PAGE_MAX) on any screen.
 * Two parts keep the wide box: /demo, so nothing new meets its Safari work, and
 * the seller's dashboard, a work tool with tables that needs the room.
 */
export const pageColumn = (pathname: string) =>
  isDemoPath(pathname) || segments(pathname)[0] === "sellerProfile"
    ? "max-w-[1365px]"
    : "max-w-[500px]";

/** The skeleton of an old or a public page, or null when it has none. */
export function pageKindFor(pathname: string): PageKind | null {
  if (isDemoPath(pathname)) return null;
  const [first, second, third, , fifth] = segments(pathname);
  if (first === undefined || first === "categories") return "home";
  if (LISTINGS.includes(first)) return "listing";
  if (TEXT_PAGES.includes(first)) return "text";
  if (first === "products") return "product";
  if (first === "search") return "search";
  if (first === "cart") return "cart";
  if (first === "compare") return "compare";
  if (first === "login") return "login";
  if (first === "settings") {
    if (second === "orders") return third ? "order" : "orders";
    if (second === "checklist") return "checklist";
    if (second === "countries") return "countries";
    if (second === "languages") return "languages";
    if (second === "prefferences") return "notifications";
    return null;
  }
  if (first === "sellerProfile") {
    if (!second) return "shops";
    return fifth ? "editor" : "dashboard";
  }
  return null;
}
