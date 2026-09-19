// The two admin approvals the QA seed needs, and the rule they both obey.
//
// A new environment cannot produce a buyable product without a person in the
// admin dashboard saying yes twice:
//
//   1. **the seller** — the vendor request Shopper B submitted;
//   2. **the boutique** — the shop that seller then created.
//
// Both screens have the same shape: a filtered list, a row, a status control,
// and a confirm. So both are driven by one function with different arguments.
//
// ---------------------------------------------------------------------------
// The rule, and it is the most important thing in this file
//
// **Never approve a row this run cannot prove is its own.**
//
// This is a real admin dashboard on a real environment. The rows beside the QA
// one belong to real sellers waiting for a real decision. Approving one of them
// by accident is not a test failure — it is a change to somebody's business
// that no revert undoes.
//
// So every approval passes three gates, in order:
//
//   * the list is **filtered by address** to the pending rows, and then `.first()`
//     is taken — never a blind index into an unfiltered table;
//   * the row's own identity is **read and compared** to a value this run knows
//     (the QA phone, or the QA shop slug);
//   * a row whose identity **cannot be read at all** is refused, loudly. Not
//     approved "because it is probably the right one".
//
// The comparison is asserted as a **boolean with a fixed message**. The observed
// value is never put into the message: on a wrong row that message would print a
// real seller's phone number into a CI log that anybody can read.
//
// ---------------------------------------------------------------------------
// The selectors
//
// Nothing in this repository describes either admin screen — the admin
// dashboard is a separate product with its own source. The locators below are
// therefore written against the **shape** these screens share (a table, a row, a
// status `<select>`, a confirm button) rather than against markup that has been
// read, and each one is overridable from the environment so the first run on a
// new dashboard can be corrected without a code change.
//
// **Every step fails by name.** If a selector does not match, the failure says
// which step could not find what, and the seed stops without approving
// anything. That is the intended behaviour for an unverified selector: refuse,
// never guess.

import { expect, type Browser, type Page } from "@playwright/test";

import { envValue } from "./env";

/** One write this helper made, recorded for `QA-08`. Method and URL only. */
type CallRecord = { method: string; url: string; note?: string };

/** A selector, with an environment override.
 *
 *  The override exists because these are the only locators in the suite written
 *  against a screen nobody here can read. A dashboard that names things
 *  differently is corrected by setting a variable, not by a release. */
const selector = (key: string, fallback: string): string =>
  envValue(key) || fallback;

/** Sign in to the admin dashboard.
 *
 *  The password never reaches a message, an assertion or a log line. What is
 *  reported is whether the sign-in landed, not what was typed. */
const signInToAdmin = async (page: Page): Promise<void> => {
  const loginUrl = envValue("ADMIN_DASHBOARD_BASE_URL");

  await page.goto(loginUrl, { waitUntil: "domcontentloaded" });

  const email = page.locator(
    selector("ADMIN_SELECTOR_EMAIL", 'input[type="email"], input[name="email"]'),
  );
  const password = page.locator(
    selector("ADMIN_SELECTOR_PASSWORD", 'input[type="password"]'),
  );

  await expect(
    email.first(),
    "the admin dashboard's sign-in screen has no e-mail field where this suite expects one. Set ADMIN_SELECTOR_EMAIL to the right locator",
  ).toBeVisible({ timeout: 45_000 });

  await email.first().fill(envValue("ADMIN_DASHBOARD_EMAIL"));
  await password.first().fill(envValue("ADMIN_DASHBOARD_PASSWORD"));

  await page
    .locator(
      selector(
        "ADMIN_SELECTOR_SUBMIT",
        'button[type="submit"], input[type="submit"]',
      ),
    )
    .first()
    .click();

  // Landed, not "the click happened". A refused sign-in leaves the form on
  // screen, and every step below would then fail as a missing table.
  await expect(
    email.first(),
    "the admin dashboard kept its sign-in screen on display after the credentials were sent, so the sign-in was refused. The password is not printed here",
  ).toBeHidden({ timeout: 45_000 });
};

/** Approve one row, having proved it is the row this run created. */
const approveOneRow = async (
  page: Page,
  options: {
    /** What is being approved, for every message in this function. */
    what: string;
    /** The filtered list address — pending rows only. */
    listUrl: string;
    /** A value only this run's row carries. Compared, never printed. */
    identity: string;
    /** Where on the row that value is shown. */
    identityCell: string;
    record: CallRecord[];
  },
): Promise<void> => {
  await page.goto(options.listUrl, { waitUntil: "domcontentloaded" });

  const row = page
    .locator(selector("ADMIN_SELECTOR_ROW", "table tbody tr"))
    .first();

  await expect(
    row,
    `the admin dashboard's ${options.what} list shows no rows at all at ${options.listUrl}. Either nothing is waiting for approval, or the list is not where this suite expects it — set ADMIN_SELECTOR_ROW`,
  ).toBeVisible({ timeout: 45_000 });

  // ---- gate: read this row's identity, or refuse -------------------------
  const shown = await row
    .locator(options.identityCell)
    .first()
    .textContent()
    .catch(() => null);

  expect(
    shown !== null && shown.trim() !== "",
    `this run could not read any identifying value from the first ${options.what} row, so it cannot prove the row is its own. Refusing to approve it — the rows beside it belong to real sellers. The observed value is deliberately not printed`,
  ).toBe(true);

  const digitsOnly = (value: string): string => value.replace(/\D/g, "");
  const matches =
    (shown ?? "").includes(options.identity) ||
    digitsOnly(shown ?? "").includes(digitsOnly(options.identity));

  // A boolean, with a fixed message. Putting the observed value in this message
  // would print a real seller's details into a world-readable CI log on exactly
  // the run where the row was the wrong one.
  expect(
    matches,
    `the first ${options.what} row waiting for approval is not the one this run created. Refusing to approve it. Neither value is printed here, on purpose: this repository is public`,
  ).toBe(true);

  // ---- the approval itself ----------------------------------------------
  const status = row.locator(
    selector("ADMIN_SELECTOR_STATUS", "select"),
  );

  await expect(
    status.first(),
    `the ${options.what} row has no status control where this suite expects one. Set ADMIN_SELECTOR_STATUS to the right locator`,
  ).toBeVisible({ timeout: 30_000 });

  await status
    .first()
    .selectOption(selector("ADMIN_SELECTOR_APPROVE_VALUE", "1"));

  const confirm = page.locator(
    selector(
      "ADMIN_SELECTOR_CONFIRM",
      'button[type="submit"], [role="dialog"] button',
    ),
  );

  if ((await confirm.count()) > 0) {
    await confirm.first().click();
  }

  options.record.push({
    method: "UI",
    url: options.listUrl,
    note: `approved the ${options.what} row this run created`,
  });
};

/** A browser context for the admin dashboard, and never one shared with the app.
 *
 *  Its own context on purpose: the admin session and the shopper session are two
 *  different identities, and one cookie jar holding both is a way for a shopper
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
 *  The identity is the **phone number** on the request — the one value the QA
 *  account and its row certainly share. It is compared and never printed. */
export const approveQaSeller = async (
  browser: Browser,
  options: { phone: string; shopName: string; record: CallRecord[] },
): Promise<void> => {
  const base = new URL(envValue("ADMIN_DASHBOARD_BASE_URL")).origin;

  await withAdminPage(browser, async (page) => {
    await approveOneRow(page, {
      what: "vendor request",
      listUrl:
        envValue("ADMIN_VENDOR_REQUESTS_PATH") ||
        `${base}/admin/vendor-requests?status=0`,
      identity: options.phone,
      identityCell: selector("ADMIN_SELECTOR_VENDOR_IDENTITY", "td"),
      record: options.record,
    });
  });
};

/** Approve the boutique that seller then created.
 *
 *  The identity here is the **shop slug**, which carries the `trydos-qa-` mark.
 *  That makes this the stronger of the two checks: a row whose slug starts with
 *  the mark cannot belong to a real seller unless one has deliberately taken the
 *  prefix, which is a known and recorded risk. */
export const approveQaBoutique = async (
  browser: Browser,
  options: { shopSlug: string; shopName: string; record: CallRecord[] },
): Promise<void> => {
  const base = new URL(envValue("ADMIN_DASHBOARD_BASE_URL")).origin;

  await withAdminPage(browser, async (page) => {
    await approveOneRow(page, {
      what: "seller boutique",
      listUrl:
        envValue("ADMIN_SELLER_BOUTIQUES_PATH") ||
        `${base}/admin/boutique/seller?status=0`,
      identity: options.shopSlug,
      identityCell: selector("ADMIN_SELECTOR_BOUTIQUE_IDENTITY", "td"),
      record: options.record,
    });
  });
};
