// The two admin approvals the QA seed needs, and the rule they both obey.
//
// A new environment cannot produce a buyable product without somebody in the
// admin dashboard saying yes twice:
//
//   1. **the seller** — the vendor request Shopper B submitted;
//   2. **the boutique** — the shop that seller then created.
//
// ---------------------------------------------------------------------------
// The rule, and it is the most important thing in this file
//
// **Never approve a row this run cannot prove is its own.**
//
// This is a real admin dashboard on a shared environment. The rows beside the
// QA one belong to real sellers waiting for a real decision. Approving one of
// them by accident is not a test failure — it is a change to somebody's
// business that no revert undoes.
//
// So every approval passes four gates, in order:
//
//   * the list is **filtered by address** — `?status=0`, and for the vendor
//     request also `?email=`, which is the screen's own filter form;
//   * the row's identity is **read** from a named cell, and a row whose
//     identity cannot be read at all is **refused**, not approved;
//   * the identity is **compared** to a value this run created;
//   * the comparison is asserted as a **boolean with a fixed message**. The
//     observed value never reaches the message: on a wrong row that would print
//     a real seller's e-mail into a CI log anybody can read.
//
// ---------------------------------------------------------------------------
// The screens, read on 2026-09-19 against staging
//
// **`/admin/vendor-requests`** — its filter form is a plain GET with two fields,
// `email` and `status`, so the list can be narrowed by address alone.
//
//   columns   # | FIRST NAME | LAST NAME | EMAIL | PHONE | … | SHOP NAME | … | STATUS | ACTION
//   identity  EMAIL is the 4th cell, PHONE the 5th
//   control   `select.status-select[data-id][data-current-status]` in the last
//             cell, options `0 Pending / 1 Approve / 2 Reject`
//   note      the control is `disabled` on a row that has already been decided,
//             so an enabled one is exactly a pending one
//   note      the page draws **two** tables and the first has no rows, so the
//             row locator asks for a row that contains the control
//
// **`/admin/boutique/seller?status=0`** — the Seller Boutiques list.
//
//   columns   SL# | BANNERS | ICON | NAME | … | STATUS | APPROVE STATUS | CREATED AT | ACTION
//   identity  NAME is the 4th cell. **The slug is not on this screen**, so the
//             shop's marked NAME is what is matched here. Every write the seed
//             makes to a backend is still bound by slug.
//   control   a `<select onchange="updateRequestStatus(id, this.value)">` in the
//             APPROVE STATUS cell, options `0 New / 1 Approved / 2 Denied`
//   note      select2 hides that element (`aria-hidden`, `tabindex="-1"`), so
//             the option is chosen with `force` — Playwright still dispatches
//             `change`, which is what the page listens for
//
// Every locator can be overridden from the environment, because these two
// screens belong to a different product and can change without this repository
// hearing about it.

import { expect, type Browser, type Page } from "@playwright/test";

import { envValue } from "./env";

/** One write this helper made, recorded for the case that checks the seed
 *  stayed inside its own data. Method and URL only. */
type CallRecord = { method: string; url: string; note?: string };

/** A selector with an environment override. */
const selector = (key: string, fallback: string): string =>
  envValue(key) || fallback;

/** Sign in to the admin dashboard.
 *
 *  The password never reaches a message, an assertion or a log line. What is
 *  reported is whether the sign-in landed, not what was typed. */
const signInToAdmin = async (page: Page): Promise<void> => {
  const loginUrl = envValue("ADMIN_DASHBOARD_BASE_URL");

  await page.goto(loginUrl, { waitUntil: "domcontentloaded" });

  const email = page
    .locator(selector("ADMIN_SELECTOR_EMAIL", 'input[name="email"]'))
    .first();
  const password = page
    .locator(selector("ADMIN_SELECTOR_PASSWORD", 'input[type="password"]'))
    .first();

  await expect(
    email,
    "the admin dashboard's sign-in screen has no e-mail field where this suite expects one. Set ADMIN_SELECTOR_EMAIL to the right locator",
  ).toBeVisible({ timeout: 45_000 });

  await email.fill(envValue("ADMIN_DASHBOARD_EMAIL"));
  await password.fill(envValue("ADMIN_DASHBOARD_PASSWORD"));
  await page
    .locator(selector("ADMIN_SELECTOR_SUBMIT", 'button[type="submit"]'))
    .first()
    .click();

  // Landed, not "the click happened". A refused sign-in leaves the form on
  // screen and every step below would then fail as a missing table.
  await expect(
    email,
    "the admin dashboard kept its sign-in screen on display after the credentials were sent, so the sign-in was refused. The password is not printed here",
  ).toBeHidden({ timeout: 45_000 });
};

/** Approve one row, having first proved it is the row this run created. */
const approveOneRow = async (
  page: Page,
  options: {
    /** What is being approved, for every message in this function. */
    what: string;
    /** The filtered list address. */
    listUrl: string;
    /** A row of the list — one that carries an approve control. */
    rowSelector: string;
    /** The cell holding the row's identity. */
    identityCell: string;
    /** The approve control inside the row. */
    controlSelector: string;
    /** The option value that means "approved". */
    approveValue: string;
    /** select2 hides the boutique control, so the option needs forcing. */
    force: boolean;
    /** A value only this run's row carries. Compared, never printed. */
    identity: string;
    record: CallRecord[];
  },
): Promise<void> => {
  await page.goto(options.listUrl, { waitUntil: "domcontentloaded" });

  const rows = page.locator(options.rowSelector);

  await expect(
    rows.first(),
    `the admin dashboard's ${options.what} list shows no row waiting for approval at ${options.listUrl}. Either nothing is pending, or the list is not where this suite expects it — set ADMIN_SELECTOR_ROW`,
  ).toBeVisible({ timeout: 45_000 });

  const row = rows.first();

  // ---- gate 1: the identity can be read at all --------------------------
  const shown = await row
    .locator(options.identityCell)
    .first()
    .textContent()
    .catch(() => null);

  expect(
    shown !== null && shown.trim() !== "",
    `this run could not read any identifying value from the first ${options.what} row, so it cannot prove the row is its own. Refusing to approve it — the rows beside it belong to real sellers. The observed value is deliberately not printed`,
  ).toBe(true);

  // ---- gate 2: the identity is this run's -------------------------------
  const normalise = (value: string): string =>
    value.replace(/\s+/g, " ").trim().toLowerCase();
  const digits = (value: string): string => value.replace(/\D/g, "");

  const seen = normalise(shown ?? "");
  const mine = normalise(options.identity);
  const matches =
    seen.includes(mine) ||
    mine.includes(seen) ||
    (digits(mine).length >= 6 && digits(seen).includes(digits(mine)));

  // A boolean with a fixed message. Putting the observed value in this message
  // would print a real seller's details into a world-readable CI log on exactly
  // the run where the row turned out to be the wrong one.
  expect(
    matches,
    `the first ${options.what} row waiting for approval is not the one this run created. Refusing to approve it. Neither value is printed here, on purpose: this repository is public`,
  ).toBe(true);

  // ---- the approval itself ----------------------------------------------
  const control = row.locator(options.controlSelector).first();

  await expect(
    control,
    `the ${options.what} row has no approve control where this suite expects one. Set ADMIN_SELECTOR_STATUS to the right locator`,
  ).toBeAttached({ timeout: 30_000 });

  await control.selectOption(options.approveValue, { force: options.force });

  // The page acts on `change`; give it a moment to send and redraw.
  await page.waitForTimeout(3_000);

  options.record.push({
    method: "UI",
    url: options.listUrl,
    note: `approved the ${options.what} row this run created`,
  });
};

/** A browser context for the admin dashboard, never shared with the app's.
 *
 *  Two different identities; one cookie jar holding both is a way for a shopper
 *  request to go out carrying admin rights. */
const withAdminPage = async (
  browser: Browser,
  work: (page: Page) => Promise<void>,
): Promise<void> => {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(45_000);
  try {
    await signInToAdmin(page);
    await work(page);
  } finally {
    await context.close();
  }
};

/** Approve the vendor request Shopper B just submitted.
 *
 *  Narrowed by the screen's **own** filter — `?email=…&status=0` — so the first
 *  row is already the right one before any comparison happens. The e-mail is
 *  the identity: this run generated it, so no other row can carry it. */
export const approveQaSeller = async (
  browser: Browser,
  options: {
    email: string;
    phone: string;
    shopName: string;
    record: CallRecord[];
  },
): Promise<void> => {
  const base = new URL(envValue("ADMIN_DASHBOARD_BASE_URL")).origin;
  const path =
    envValue("ADMIN_VENDOR_REQUESTS_PATH") || `${base}/admin/vendor-requests`;

  await withAdminPage(browser, async (page) => {
    await approveOneRow(page, {
      what: "vendor request",
      listUrl: `${path}?email=${encodeURIComponent(options.email)}&status=0`,
      // A row that carries the control. The page draws two tables and the first
      // is empty, so "the first row on the page" is not good enough.
      rowSelector: selector(
        "ADMIN_SELECTOR_ROW",
        "table tbody tr:has(select.status-select:not([disabled]))",
      ),
      identityCell: selector("ADMIN_SELECTOR_VENDOR_IDENTITY", "td:nth-child(4)"),
      controlSelector: selector(
        "ADMIN_SELECTOR_STATUS",
        "select.status-select",
      ),
      approveValue: selector("ADMIN_SELECTOR_APPROVE_VALUE", "1"),
      force: false,
      identity: options.email,
      record: options.record,
    });
  });
};

/** Approve the boutique that seller then created.
 *
 *  **Matched on the shop NAME, not the slug** — the slug is not drawn on this
 *  screen. The name this seed gives the shop is marked and unique, and every
 *  write the seed makes to a backend is still bound by slug, so the mark is
 *  never the only thing holding the identity together. */
export const approveQaBoutique = async (
  browser: Browser,
  options: { shopSlug: string; shopName: string; record: CallRecord[] },
): Promise<void> => {
  const base = new URL(envValue("ADMIN_DASHBOARD_BASE_URL")).origin;
  const path =
    envValue("ADMIN_SELLER_BOUTIQUES_PATH") || `${base}/admin/boutique/seller`;

  await withAdminPage(browser, async (page) => {
    await approveOneRow(page, {
      what: "seller boutique",
      listUrl: `${path}?status=0`,
      rowSelector: selector("ADMIN_SELECTOR_BOUTIQUE_ROW", "table tbody tr"),
      identityCell: selector(
        "ADMIN_SELECTOR_BOUTIQUE_IDENTITY",
        "td:nth-child(4)",
      ),
      controlSelector: selector(
        "ADMIN_SELECTOR_BOUTIQUE_STATUS",
        "td:nth-child(14) select",
      ),
      approveValue: selector("ADMIN_SELECTOR_BOUTIQUE_APPROVE_VALUE", "1"),
      // select2 hides this one behind its own widget, so the underlying
      // element is not "visible" to Playwright. Forcing still dispatches
      // `change`, which is the event `updateRequestStatus` listens for.
      force: true,
      identity: options.shopName,
      record: options.record,
    });
  });
};
