// Where the cart page is, and whether this tab has a page of this site behind
// it. Used by the cart page (its close), CartProvider (it notes each page) and
// DetectScreen (analytics).

// The cart page is /[lang]/cart: the part after the locale is "cart".
export const isCartPath = (pathname: string) =>
  pathname.split("/").filter(Boolean)[1] === "cart";

// Set once this tab has shown a page of this site that is not the cart page.
// sessionStorage belongs to one tab and lives through a reload, as the tab's
// history does. The `last_paths` cookie (utils/history.ts) is not used here:
// it lives 30 days and is shared by every tab, so a cart page opened in a new
// tab (a push notice) would find old paths, go back, and go nowhere.
const SITE_PAGE_KEY = "cart_site_page_behind";

/** CartProvider calls this for every page it sees. */
export function noteSitePage(pathname: string) {
  if (!pathname || isCartPath(pathname)) return;
  try {
    sessionStorage.setItem(SITE_PAGE_KEY, "1");
  } catch {
    // Storage can be turned off. Then the cart page closes to home.
  }
}

/** The cart page reads this when it closes: back if true, else home. */
export function hasSitePageBehind() {
  try {
    return sessionStorage.getItem(SITE_PAGE_KEY) === "1";
  } catch {
    return false;
  }
}
