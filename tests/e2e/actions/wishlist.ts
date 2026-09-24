// What a shopper does with their saved products — the "checklist".
//
// Follows the rules in `nav.ts`: `page` first then one options object, an action
// asserts its own success, an action returns what the spec needs, and no spec
// ever sees a raw selector.
//
// ---------------------------------------------------------------------------
// One feature, two names, and both are correct
//
// The screen a shopper sees is the **checklist** (`My Checklist`, the heart
// icon, `components/setting/checklist/`). The code behind it is
// `services/wishlist.ts`. Neither name is wrong and neither is going away, so
// this file uses "checklist" for anything on screen and keeps the file named
// after the service. A reader arriving from either side lands here.
//
// ---------------------------------------------------------------------------
// Why these actions ask the backend as well as the screen
//
// The checklist screen keeps its rows in React state. Removing one splices the
// array the moment the request resolves, so the row disappearing proves the
// request did not throw — it does **not** prove the product is gone from the
// shopper's account. Come back tomorrow and it could still be there.
//
// So every action that changes something offers a matching backend reading, and
// the specs assert both as the separate facts they are. The screen says what the
// app believes; the backend says what is true.
//
// ---------------------------------------------------------------------------
// Which backend answers, and why no message here guesses
//
// `/checklist` is served by **two different backends** depending on who is
// asking (`utils/server/tokenManager.ts:178-190`):
//
//   guest or unverified shopper  -> the gateway
//   signed-in verified shopper   -> the core backend
//
// A guest case and a signed-in case therefore exercise different servers while
// running identical steps. Rather than infer it, these actions read
// `x-market-backend` off the proxy's own response — the app labels it there
// (`app/api/proxy/route.ts:380-386`) precisely so the routing decision can be
// read instead of assumed. Every failure message quotes that label, so the
// reader never has to work out which server refused.

import { expect, type Page } from "@playwright/test";

import { checklist, moreOptions } from "../selectors";
import { credentialsHeld } from "../harness/session";
import { localeParts } from "./nav";
import { gotoUnderLocale } from "./profile";

/** The opaque wire name `/api/proxy` uses for the storefront service.
 *
 *  Taken from `utils/serviceTokens.ts`, where the mapping lives. Written out
 *  rather than imported so this test file has no import into app code — and
 *  repeated nowhere else in the suite, so there is one place to fix it if the
 *  token ever changes. A wrong token answers 503 like every other refusal, so
 *  `askTheShop` below says so explicitly when it sees one. */
const MARKET_SERVICE_TOKEN = "vv7qsd";

/** How long the checklist screen gets to decide what it is showing.
 *
 *  It renders skeletons first, then either the list or the empty panel. Judging
 *  it before the skeletons go reads "no list" off a screen that is still
 *  loading, which is the same words as a real fault and none of the meaning. */
const CHECKLIST_SETTLE_MS = 45_000;

/** What the backend answered about a shopper's checklist.
 *
 *  `backend` is the label the app's own proxy put on the answer — `"gateway"`,
 *  `"core"`, or `null` when the proxy refused before it reached either. Every
 *  message that mentions a backend gets the word from here. */
export type ChecklistReading = {
  status: number;
  backend: string | null;
  /** The backend's own words, so a failure quotes it rather than paraphrasing. */
  message: string | null;
  /** The slugs on this page of the checklist. Slugs, not names: a slug is
   *  unique and a name is not, and a product page hands us its slug for free. */
  slugs: string[];
  /** Product ids, in the same order as `slugs`. */
  ids: number[];
  /** The paginator's own fields, exactly as they arrived. Kept raw because one
   *  spec asks which keys are present, and a tidied copy could not answer. */
  paging: Record<string, unknown>;
};

const NOTHING_ANSWERED: ChecklistReading = {
  status: 0,
  backend: null,
  message: null,
  slugs: [],
  ids: [],
  paging: {},
};

/** Ask the shop a question the way the app asks it.
 *
 *  Goes through `/api/proxy` from inside the page, so it carries the same
 *  cookies, picks the same backend by the same rule, and needs no backend
 *  address in this repository. A test that called a backend host directly would
 *  be testing a URL we wrote down, not the one the app uses.
 *
 *  Nothing sensitive comes back: the caller reduces the body to slugs, ids and
 *  the paginator before it leaves the browser. */
const askTheShop = async (
  page: Page,
  options: { path: string },
): Promise<{
  status: number;
  backend: string | null;
  body: any;
}> => {
  const { country, language } = localeParts(page);

  return await page.evaluate(
    async ({ path, service, country, language }) => {
      const query = new URLSearchParams({
        s: service,
        u: path,
        c: country || "sy",
        l: language || "en",
      });
      try {
        const response = await fetch(`/api/proxy?${query}`, {
          method: "GET",
          credentials: "include",
        });
        return {
          status: response.status,
          backend: response.headers.get("x-market-backend"),
          body: await response.json().catch(() => null),
        };
      } catch {
        // Caught in the browser: a network error's message can quote the URL it
        // was given, and this one carries the shopper's country and language.
        return { status: 0, backend: null, body: null };
      }
    },
    { path: options.path, service: MARKET_SERVICE_TOKEN, country, language },
  );
};

/** Wait until the visitor has a credential to ask the shop with.
 *
 *  A first visit has none. The app registers a guest while the page renders,
 *  and the cookies that come back are written when the answer arrives — some
 *  way after the page is usable and the logo is on screen. A question asked in
 *  that window is answered `401`, and the failure reads like the backend
 *  refusing this shopper's checklist when nothing refused anything.
 *
 *  Waiting is not asserting: this is the app finishing its boot, not the
 *  behaviour under test. Only the **number** of credential cookies is read —
 *  `credentialsHeld` returns names, never values. */
export const waitForShopCredential = async (page: Page): Promise<void> => {
  await expect
    .poll(async () => (await credentialsHeld(page)).length, {
      timeout: 45_000,
      message:
        "the visitor never got a credential, so nothing here could ask the shop anything — the app registers a guest on a first visit and this one did not finish",
    })
    .toBeGreaterThan(0);
};

/** Read one page of the shopper's checklist straight from the shop.
 *
 *  `page` here is the paginator's page number, not the browser page — the
 *  browser page is the first argument, as everywhere else in this folder. */
export const checklistFromBackend = async (
  browserPage: Page,
  options: { page?: number } = {},
): Promise<ChecklistReading> => {
  const which = options.page ?? 1;
  const answer = await askTheShop(browserPage, {
    path: `/checklist?page=${which}&page_size=10`,
  });

  if (!answer.body) return { ...NOTHING_ANSWERED, status: answer.status };

  const paginator = answer.body?.data ?? {};
  const rows: any[] = Array.isArray(paginator?.data) ? paginator.data : [];

  // The rows are dropped here and only slugs and ids survive. The full row also
  // carries a name and an image URL, which nothing below needs and which a
  // careless assertion would print into a public job log.
  const { data: _rows, ...paging } = paginator;

  return {
    status: answer.status,
    backend: answer.backend,
    message:
      typeof answer.body?.message === "string" ? answer.body.message : null,
    slugs: rows.map((row) => String(row?.slug ?? "")),
    ids: rows.map((row) => Number(row?.id)),
    paging,
  };
};

/** Does the shop say this one product is saved?
 *
 *  A different endpoint from the list, and a different question — this is the
 *  one the product page itself asks (`wishlistService.isInWishlist`). A case
 *  about the toggle on a product page has to ask what the toggle asks, or it is
 *  proving the list and reporting the toggle. */
export const savedOnBackend = async (
  page: Page,
  options: { productId: number },
): Promise<{ status: number; backend: string | null; saved: boolean | null }> => {
  const answer = await askTheShop(page, {
    path: `/checklist/product/${options.productId}/exist`,
  });

  const exists = answer.body?.data?.is_exist;
  return {
    status: answer.status,
    backend: answer.backend,
    saved: typeof exists === "boolean" ? exists : null,
  };
};

/** Take a product off the checklist without using the screen.
 *
 *  For cleanup only. A case that means "the shopper removed it" presses the X
 *  — see `removeFromChecklistScreen`. This exists so a case that dies half way
 *  through does not leave a row behind on staging, which is rule 6 in
 *  `tests/e2e/README.md`.
 *
 *  Never asserts. Cleanup that throws replaces the failure the case was
 *  reporting with a failure about tidying up. */
export const forgetProductQuietly = async (
  page: Page,
  options: { productId: number },
): Promise<void> => {
  const { country, language } = localeParts(page);
  await page
    .evaluate(
      async ({ productId, service, country, language }) => {
        await fetch("/api/proxy", {
          method: "POST",
          credentials: "include",
          headers: {
            "x-proxy-server": service,
            "x-proxy-url": `/checklist/${productId}`,
            "x-proxy-method": "DELETE",
            "x-country": country || "sy",
            "x-language": language || "en",
          },
        }).catch(() => undefined);
      },
      {
        productId: options.productId,
        service: MARKET_SERVICE_TOKEN,
        country,
        language,
      },
    )
    .catch(() => undefined);
};

// ---------------------------------------------------------------------------
// The product page
// ---------------------------------------------------------------------------

/** The slug in a product page's address.
 *
 *  The slug is how a saved row is matched back to the product that was opened.
 *  The trailing number in a slug is **not** the product id — `t-real-13` is
 *  product 12 — so nothing here tries to read an id out of it. */
export const slugOnScreen = (page: Page): string => {
  const parts = new URL(page.url()).pathname.split("/");
  const at = parts.indexOf("products");
  return at >= 0 ? (parts[at + 1] ?? "") : "";
};

/** Open the three-dot panel on a product page.
 *
 *  The panel is mounted only while it is open and it animates, so this waits
 *  for the panel itself rather than for the click to return. */
export const openMoreOptions = async (page: Page): Promise<void> => {
  const trigger = moreOptions.trigger(page);
  await expect(
    trigger,
    "the product page has no three-dot button, so the checklist and compare controls cannot be reached",
  ).toBeVisible();
  await trigger.click();

  await expect(
    moreOptions.panel(page),
    "the three-dot panel did not open on the product page",
  ).toBeVisible();
};

/** Does the product page's own toggle say this product is saved?
 *
 *  Read from the green background the component paints, because that is the
 *  whole of what the shopper sees. The component sets it from the backend's
 *  answer to `isInWishlist`, so this is the app's claim — the backend's own
 *  answer is `savedOnBackend`, and the two are asserted separately on purpose. */
export const checklistToggleSaysSaved = async (
  page: Page,
): Promise<boolean> => {
  const classes =
    (await moreOptions.checklistToggle(page).getAttribute("class")) ?? "";
  return classes.includes("bg-green-300");
};

/** Press "Add To My Checklist" and wait until the shop has answered.
 *
 *  It is a **toggle**, not an add: pressing it on a saved product removes it.
 *  So this returns what it was before and what it became, and a spec says which
 *  of the two it meant.
 *
 *  Waiting is done on the spinner the component shows while the request is in
 *  flight (`add-checkList-spinner`), not on a timer. A press judged before the
 *  spinner clears reads the state the toggle had beforehand. */
export const pressChecklistToggle = async (
  page: Page,
): Promise<{ wasSaved: boolean; nowSaved: boolean }> => {
  const wasSaved = await checklistToggleSaysSaved(page);

  await moreOptions.checklistToggle(page).click();

  // Waited on the toggle's own state, never on the spinner.
  //
  // `toBeHidden` on the spinner is true **before the request starts** as well as
  // after it finishes, so it can return the instant the click lands and hand
  // back the state the toggle had beforehand. That is the same trap
  // `gotoCompare` documents for the compare page's loading cells, and it is
  // worth naming twice because both look like a sensible wait and neither is.
  //
  // The toggle is the right signal because `toggleWishlist` only flips it once
  // the shop has confirmed — so this waiting out means the shop refused, or
  // never answered.
  await expect
    .poll(() => checklistToggleSaysSaved(page), {
      timeout: 45_000,
      message: wasSaved
        ? "the checklist toggle never turned off after it was pressed, so the shop did not confirm the removal"
        : "the checklist toggle never turned on after it was pressed, so the shop did not confirm the save",
    })
    .toBe(!wasSaved);

  return { wasSaved, nowSaved: await checklistToggleSaysSaved(page) };
};

// ---------------------------------------------------------------------------
// The checklist screen
// ---------------------------------------------------------------------------

/** What the checklist screen is showing.
 *
 *  `empty` and `rows` are two different screens, not one screen with a count of
 *  zero — `ChecklistView` renders one or the other. Both are reported, so a
 *  case can tell "it says you have nothing saved" apart from "it rendered
 *  neither", which is what a screen still loading, or broken, looks like. */
export type ChecklistScreen = {
  /** The "your checklist is empty" panel is up. */
  empty: boolean;
  /** How many rows the list is showing. */
  rows: number;
  /** Is "Load more" offered? */
  loadMore: boolean;
};

/** Open the checklist screen and wait until it has decided what to show. */
export const gotoChecklist = async (page: Page): Promise<void> => {
  await gotoUnderLocale(page, "/settings/checklist");

  await expect(
    checklist.screen(page),
    "the checklist screen did not render its back bar, so the page itself did not load",
  ).toBeVisible();

  // The skeletons are the screen saying "I do not know yet". Reading the list
  // or the empty panel while they are up answers a question the screen has not
  // answered.
  await expect(
    checklist.loading(page),
    "the checklist screen is still showing loading rows, so the shop never answered",
  ).toBeHidden({ timeout: CHECKLIST_SETTLE_MS });
};

/** Read the checklist screen. Does not navigate — open it first. */
export const readChecklistScreen = async (
  page: Page,
): Promise<ChecklistScreen> => ({
  empty: await checklist.empty(page).isVisible(),
  rows: await checklist.items(page).count(),
  loadMore: await checklist.loadMore(page).isVisible(),
});

/** The row for one product, found by the **slug** in the link it wraps.
 *
 *  Not by name, and that is a correction rather than a preference. The name a
 *  product page shows comes from `getProductText`, which joins the product's
 *  name with its category names — "Polished Checked Dress | Dresses" there is
 *  "Polished Checked Dress" on this row. Matching the two failed on a screen
 *  that was completely right, and reported that the screen and the shop
 *  disagreed.
 *
 *  The slug is one value, it is unique, and the product page hands it over for
 *  free. It is also the same string the shop keyed its answer on, so the screen
 *  and the backend are now being asked about provably the same product. */
export const checklistRowFor = (page: Page, options: { slug: string }) =>
  checklist.itemForSlug(page, options.slug);

/** Is a product listed on the checklist screen? */
export const checklistScreenShows = async (
  page: Page,
  options: { slug: string },
): Promise<boolean> =>
  (await checklistRowFor(page, options).count()) > 0;

/** Press the X on a row, the way a shopper removes a saved product.
 *
 *  Returns once the row has gone from the screen. That is the app's claim and
 *  nothing more — whether the shop agrees is `checklistFromBackend`, and the
 *  specs ask both. */
export const removeFromChecklistScreen = async (
  page: Page,
  options: { slug: string },
): Promise<void> => {
  const row = checklistRowFor(page, options);

  await expect(
    row,
    `there is no row for this product on the checklist screen, so there is nothing to remove`,
  ).toHaveCount(1);

  await checklist.itemDelete(row).click();

  await expect(
    row,
    "the row is still on the checklist screen after pressing its remove button",
  ).toHaveCount(0, { timeout: 45_000 });
};
