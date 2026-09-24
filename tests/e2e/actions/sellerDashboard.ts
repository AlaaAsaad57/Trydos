// The seller dashboard **shell** — the door in, and moving between sections.
//
// ---------------------------------------------------------------------------
// This file knows about no single section, on purpose
//
// A dashboard spec for products, boutiques, stories or comments will need
// exactly what is here — sign in, reach the shop, open a tab, come back — and
// nothing else in common. So the shell lives here and each section keeps its
// own file beside it (`shopLocations.ts`, `shopInfo.ts` today). Adding a
// section means adding one file and touching none of these.
//
// Follows the rules in `nav.ts`: `page` first then one options object, an
// action asserts its own success, an action returns what the spec needs, and no
// spec ever sees a raw selector.
//
// ---------------------------------------------------------------------------
// How the active section is decided, and why that matters to a test
//
// The dashboard keeps the open section in the **address** (`?tab=locations`),
// not in component state, and re-reads it on every render. So a test asks the
// URL which section is open instead of guessing from what is drawn. The content
// area repeats the same value in `data-tab`.
//
// Those two facts let a navigation check make a narrow, honest claim: *this
// tile opened this section*. It never claims the section's own backend
// answered — a dead comments backend must not turn a navigation case red. Each
// section's own spec judges its own content.
//
// ---------------------------------------------------------------------------
// Nothing here signs in
//
// The QA seed already signed in as the QA seller and saved its cookie jar
// (`QA_SELLER_SESSION_PATH`). A spec opens that jar. A second sign-in would
// send a second one-time code for the same account, against limits that are not
// ours.

import { expect, type Locator, type Page } from "@playwright/test";

import { sellerDashboard, type DashboardTab } from "../selectors";
import { gotoUnderLocale } from "./profile";
import { localeParts, localePrefix } from "./nav";

export type { DashboardTab };

/** Stop the moment the app says the session died, and say so.
 *
 *  **This is the failure this suite hit first, and it looked like six other
 *  things.** A saved cookie jar is a snapshot. The moment one case does
 *  authenticated work the app can exchange the credential for a fresh pair, and
 *  the file on disk is then superseded. A later case opening that file is
 *  recovered by the app the only way it can be — as a guest — and the dashboard
 *  then draws "Member", "Access Denied", and this screen.
 *
 *  Reported here by name, so the next reader is sent to the session and not to
 *  the section. The cure is `handOnSession` after every case, not a longer
 *  wait.
 *
 *  Cheap: one `isVisible` against a screen that is almost never there. */
export const refuseIfSessionExpired = async (
  page: Page,
  what: string,
): Promise<void> => {
  const expired = await sellerDashboard
    .sessionExpired(page)
    .isVisible()
    .catch(() => false);

  expect(
    expired,
    `${what}: the app drew its "your session has expired" screen, so the saved session was refused and this page is being shown to a guest. The case that ran before this one did authenticated work and did not hand its session on.`,
  ).toBe(false);
};

/** The value `data-tab` carries on the dashboard home screen.
 *
 *  The app deletes `?tab=` for the home screen rather than writing a word, so
 *  "no section open" has two different spellings — an absent query parameter
 *  and this string. Both are checked by name below. */
export const DASHBOARD_HOME = "none";

/** Open the settings screen and follow the seller's own route to the shop list.
 *
 *  This is the journey a real seller takes: settings -> the black "Sales" card
 *  -> `/sellerProfile`. It is deliberately **not** a direct address: the point
 *  of the first case is that the route exists and works.
 *
 *  Fails naming which of the three things went wrong — the settings screen, the
 *  card that only a shop owner is shown, or the navigation itself. */
export const openSellerProfileFromSettings = async (
  page: Page,
): Promise<void> => {
  await gotoUnderLocale(page, "/settings");

  // A card only an account that owns a shop is shown. If this account owns
  // none, the same component draws "Become A Seller" instead — which is a fact
  // about the account, not a slow render, so say that rather than time out on
  // a generic locator.
  const sales = sellerDashboard.salesCard(page);
  const failed = sellerDashboard.permissionsError(page);

  await expect(
    sales.or(failed),
    "the settings screen drew neither the Sales card nor a permissions error, so the seller section never rendered at all",
  ).toBeVisible({ timeout: 30_000 });

  await expect(
    failed,
    "the settings screen could not load this account's shop permissions, so it never found out the account owns a shop — the core backend refused GET /shop/shops",
  ).toBeHidden();

  await expect(
    sales,
    "this account was not offered the Sales card, so the app believes it owns no shop — the QA seed's seller was not found on this account",
  ).toBeVisible();

  await sales.click();

  await page.waitForURL(/\/sellerProfile\/?(\?.*)?$/, { timeout: 30_000 });
  await refuseIfSessionExpired(page, "opening the seller's shop list");
};

/** Go straight to the shop list, for a case that is not about the route in. */
export const gotoSellerProfile = async (page: Page): Promise<void> => {
  await gotoUnderLocale(page, "/sellerProfile");
};

/** One shop's card in the list, asserted to be there.
 *
 *  Returns the card so the caller can read inside it. Scoped rather than
 *  page-wide because an account with several shops draws one card each, and
 *  every control inside them carries the same hook. */
export const shopCard = async (
  page: Page,
  options: { sellerId: string | number },
): Promise<Locator> => {
  const card = sellerDashboard.shopCard(page, options.sellerId);
  await expect(
    card,
    `the shop list has no card for seller ${options.sellerId}, so this account does not own the QA seed's shop — read the setup project's record (tests/e2e/.auth/qa-seed.json)`,
  ).toBeVisible({ timeout: 30_000 });
  return card;
};

/** Press "Enter Dashboard" on one shop's card and wait for the dashboard.
 *
 *  Proves the dashboard opened **for that shop**, not merely that some
 *  dashboard opened: the address has to carry the seller id and so does the
 *  screen's own label. */
export const enterDashboardFromShopCard = async (
  page: Page,
  options: { sellerId: string | number },
): Promise<void> => {
  const card = await shopCard(page, options);
  await sellerDashboard.enterDashboard(card).click();

  await page.waitForURL(
    new RegExp(`/sellerProfile/sellerDashboard/${options.sellerId}(\\?|/|$)`),
    { timeout: 45_000 },
  );

  await expect(
    sellerDashboard.sellerId(page),
    `the dashboard opened but says it is showing a different shop than seller ${options.sellerId}`,
  ).toHaveText(String(options.sellerId), { timeout: 30_000 });
};

/** Open the dashboard by address, optionally straight into one section.
 *
 *  For every case that is not about the route in. Waits for the content area,
 *  so a caller never reads a screen that has not mounted.
 *
 *  **A section reached this way still has to load its own data**, and this
 *  helper does not wait for that — it cannot, because what "loaded" means is
 *  different in every section. The section's own file owns that wait. */
export const gotoSellerDashboard = async (
  page: Page,
  options: { sellerId: string | number; tab?: DashboardTab },
): Promise<void> => {
  const query = options.tab ? `?tab=${options.tab}` : "";
  await gotoUnderLocale(
    page,
    `/sellerProfile/sellerDashboard/${options.sellerId}${query}`,
  );

  await expect(
    sellerDashboard.panel(page),
    "the seller dashboard never drew its content area, so the page did not render at all",
  ).toBeVisible({ timeout: 45_000 });

  await expect(
    sellerDashboard.panel(page),
    `the dashboard opened on a different section than "${options.tab ?? DASHBOARD_HOME}"`,
  ).toHaveAttribute("data-tab", options.tab ?? DASHBOARD_HOME, {
    timeout: 30_000,
  });

  await refuseIfSessionExpired(page, "opening the seller dashboard");

  // The home screen draws a skeleton until the permissions call returns, and
  // the section tiles are built from its answer. Without this wait a case that
  // reads the tiles sees an empty list and reports "this seller is offered no
  // section", which is a statement about an answer that had not arrived.
  if (!options.tab) await waitForDashboardHome(page);
};

/** The home screen has finished its permissions call and drawn its tiles.
 *
 *  The list is permission filtered, but it is never empty for an account that
 *  may open the dashboard at all: the `permissions` tile is drawn
 *  unconditionally. So "no tile at all" means the answer has not arrived — or
 *  the session is not this seller's, which is checked first and by name. */
export const waitForDashboardHome = async (page: Page): Promise<void> => {
  await expect(
    sellerDashboard.anyTile(page).first(),
    "the dashboard home never drew a single section tile, so its permissions call did not answer — the Permissions tile alone is drawn for every account that may open the dashboard at all",
  ).toBeVisible({ timeout: 45_000 });
};

/** Which section the dashboard says is open, read from the content area. */
export const currentTab = async (page: Page): Promise<string> =>
  (await sellerDashboard.panel(page).getAttribute("data-tab")) ?? "";

/** The `tab` value in the address, or `"none"` when there is none.
 *
 *  Read separately from `currentTab` because the two are different claims: one
 *  is what the URL asked for and the other is what the page drew. A case that
 *  checks navigation wants both to agree. */
export const tabInUrl = (page: Page): string => {
  const value = new URL(page.url()).searchParams.get("tab");
  return value ?? DASHBOARD_HOME;
};

/** Which sections this seller is offered on the home screen.
 *
 *  The list is permission filtered by the app, so what comes back is a fact
 *  about the account — not a fixed list this suite can hard-code. */
export const offeredTabs = async (page: Page): Promise<DashboardTab[]> => {
  const hooks = await sellerDashboard
    .anyTile(page)
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-pw") ?? ""),
    );
  return hooks
    .map((hook) => hook.replace("seller-dashboard-tab-", ""))
    .filter((name) => name !== "") as DashboardTab[];
};

/** Press one section tile on the home screen and prove that section opened.
 *
 *  **Three separate checks, because three different things can go wrong**: the
 *  address was not rewritten, the content area did not follow it, or the tile
 *  opened somebody else's section. Collapsed into one assertion they would all
 *  report the same useless sentence.
 *
 *  Judges navigation only. It does not wait for the section's data. */
export const openTab = async (page: Page, tab: DashboardTab): Promise<void> => {
  const tile = sellerDashboard.tile(page, tab);
  await expect(
    tile,
    `the dashboard home offers no "${tab}" tile, so this account is not permitted that section`,
  ).toBeVisible({ timeout: 30_000 });

  await tile.click();

  await expect
    .poll(() => tabInUrl(page), {
      message: `pressing the "${tab}" tile did not put that section in the address`,
      timeout: 20_000,
    })
    .toBe(tab);

  await expect(
    sellerDashboard.panel(page),
    `the address moved to "${tab}" but the dashboard kept drawing a different section`,
  ).toHaveAttribute("data-tab", tab, { timeout: 20_000 });
};

/** The same section, through the slide-out menu instead of the home tile.
 *
 *  The dashboard has **two** doors to every section and they are separate code
 *  paths, so a suite that only ever used the tiles would never touch the menu. */
export const openTabFromMenu = async (
  page: Page,
  tab: DashboardTab,
): Promise<void> => {
  await sellerDashboard.menuButton(page).click();

  const item = sellerDashboard.menuItem(page, tab);
  await expect(
    item,
    `the slide-out menu has no "${tab}" entry, so this account is not permitted that section`,
  ).toBeVisible({ timeout: 20_000 });

  await item.click();

  await expect
    .poll(() => tabInUrl(page), {
      message: `the menu's "${tab}" entry did not put that section in the address`,
      timeout: 20_000,
    })
    .toBe(tab);

  await expect(
    sellerDashboard.panel(page),
    `the menu moved the address to "${tab}" but the dashboard kept drawing a different section`,
  ).toHaveAttribute("data-tab", tab, { timeout: 20_000 });
};

/** Press back once and prove where it went.
 *
 *  The dashboard's back arrow does two different things (`onBackIntercept` in
 *  the page): with a section open it closes the section and stays; on the home
 *  screen it leaves for the shop list. The caller says which it expects, so a
 *  back that does the *other* one is a named failure rather than a timeout. */
export const pressDashboardBack = async (
  page: Page,
  options: { expect: "home" | "shopList" },
): Promise<void> => {
  await sellerDashboard.back(page).click();

  if (options.expect === "home") {
    await expect
      .poll(() => tabInUrl(page), {
        message:
          "back with a section open should have returned to the dashboard home, but the address still names a section",
        timeout: 20_000,
      })
      .toBe(DASHBOARD_HOME);

    await expect(
      sellerDashboard.panel(page),
      "the address returned to the dashboard home but the content area kept drawing the section",
    ).toHaveAttribute("data-tab", DASHBOARD_HOME, { timeout: 20_000 });
    return;
  }

  await page.waitForURL(/\/sellerProfile\/?(\?.*)?$/, { timeout: 30_000 });
};

/** The country and language the run landed on.
 *
 *  Needed by the section files: a direct read of a dashboard endpoint has to
 *  carry the same `x-country` the app itself would have sent, or the backend
 *  answers about a different market and the read looks like a mismatch the app
 *  caused. See `backend-country-header` — these endpoints read the header, not
 *  the query string. */
export const dashboardLocale = (
  page: Page,
): { country: string; language: string } => {
  expect(
    localePrefix(page),
    "no country-and-language prefix in the address yet — open a storefront page first",
  ).not.toBe("");
  return localeParts(page);
};
