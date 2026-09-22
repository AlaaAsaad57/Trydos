// Signing in to the admin dashboard, and holding that session apart from the
// shopper's.
//
// This used to live inside `adminApprove.ts`, where the QA seed approves a
// seller and a boutique. A second caller now needs the same sign-in — the
// rating journey moves one order to `ready_to_shipping` — so the three pieces
// every admin screen needs are here instead of copied.
//
// ---------------------------------------------------------------------------
// The two rules this file exists to keep
//
// **The password never reaches output.** Not an assertion message, not a log
// line, not a screenshot name. What a failure reports is whether the sign-in
// landed, never what was typed. This repository is public and CI logs are
// readable.
//
// **The admin never shares a cookie jar with the shopper.** They are two
// different identities. One context holding both is a way for a shopper request
// to go out carrying admin rights, so every admin visit gets a context of its
// own and closes it when it is done.
//
// Every locator can be overridden from the environment, because these screens
// belong to a different product and can change without this repository hearing
// about it.

import { expect, type Browser, type Page } from "@playwright/test";

import { envValue } from "./env";
import { redact } from "./redact";

/** One write an admin helper made, recorded so a case can say the run stayed
 *  inside its own data. Method and URL only — never a body. */
export type CallRecord = { method: string; url: string; note?: string };

/** A selector with an environment override. */
export const adminSelector = (key: string, fallback: string): string =>
  envValue(key) || fallback;

/** The dashboard's own origin, with no path.
 *
 *  `ADMIN_DASHBOARD_BASE_URL` points at the **sign-in screen**, not at the
 *  root, so every other address is built from its origin rather than from the
 *  value itself. */
export const adminOrigin = (): string =>
  new URL(envValue("ADMIN_DASHBOARD_BASE_URL")).origin;

/** Open one screen of an external dashboard, and say so when the host is down.
 *
 *  **A host that did not answer must never read as a locator that needs
 *  changing.** Measured on 2026-09-22: `trydos_develop.ramaaz.dev` answered
 *  Cloudflare's `522 Connection timed out` in the middle of a run, and the
 *  sign-in step reported "the admin dashboard's sign-in screen has no e-mail
 *  field where this suite expects one. Set ADMIN_SELECTOR_EMAIL" — which sends
 *  the reader to change a selector that was perfectly correct.
 *
 *  So every navigation to one of these products goes through here, and the
 *  status is judged before anything on the page is looked for. */
export const openDashboardPage = async (
  page: Page,
  options: { url: string; product: string },
): Promise<void> => {
  const response = await page
    .goto(options.url, { waitUntil: "domcontentloaded" })
    .catch(() => null);

  const host = new URL(options.url).host;

  expect(
    response,
    `the ${options.product} at ${host} did not answer at all, so nothing on that screen can be read. The host is unreachable from this run — this is not a locator that needs changing`,
  ).not.toBeNull();

  const status = response?.status() ?? 0;

  expect(
    status < 400,
    `the ${options.product} at ${host} answered ${status} for ${options.url}, so the screen never loaded. A 5xx here is that product being down, not a locator that needs changing`,
  ).toBe(true);
};

/** Sign in to the admin dashboard. */
export const signInToAdmin = async (page: Page): Promise<void> => {
  const loginUrl = envValue("ADMIN_DASHBOARD_BASE_URL");

  await openDashboardPage(page, {
    url: loginUrl,
    product: "admin dashboard",
  });

  const email = page
    .locator(adminSelector("ADMIN_SELECTOR_EMAIL", 'input[name="email"]'))
    .first();
  const password = page
    .locator(adminSelector("ADMIN_SELECTOR_PASSWORD", 'input[type="password"]'))
    .first();

  await expect(
    email,
    "the admin dashboard's sign-in screen has no e-mail field where this suite expects one. Set ADMIN_SELECTOR_EMAIL to the right locator",
  ).toBeVisible({ timeout: 45_000 });

  await email.fill(envValue("ADMIN_DASHBOARD_EMAIL"));
  await password.fill(envValue("ADMIN_DASHBOARD_PASSWORD"));

  // **What the panel answered, recorded before the click.**
  //
  // "The sign-in was refused" is not a finding. It reads the same for a wrong
  // password, a panel that is down, and a changed form — and those are three
  // different mornings. This dashboard sits on the **same host as the core
  // backend** (`BACKEND_URL`), which has answered Cloudflare 520 and 522
  // mid-run more than once, so "the box is ill" is the likeliest of the three
  // and the one the old message hid completely.
  //
  // Statuses and paths only. No body, no header, and the password is never
  // read back out of the field.
  const answers: string[] = [];
  page.on("response", (response) => {
    if (response.request().method() !== "POST") return;
    try {
      const path = new URL(response.url()).pathname;
      // **The redirect target is the whole answer, not the status.** These
      // panels answer 302 to a sign-in whether it worked or not: back to the
      // sign-in screen when the credentials are refused, on to the dashboard
      // when they are taken. Without the target, "302 /admin/auth/login" reads
      // as both and settles nothing.
      const to = response.headers()["location"];
      const target = to ? ` -> ${new URL(to, response.url()).pathname}` : "";
      answers.push(`${response.status()} ${path}${target}`);
    } catch {
      // An unparseable address is not worth failing the sign-in over.
    }
  });

  await page
    .locator(adminSelector("ADMIN_SELECTOR_SUBMIT", 'button[type="submit"]'))
    .first()
    .click();

  // Landed, not "the click happened". A refused sign-in leaves the form on
  // screen and every step after would then fail as a missing table.
  const landed = await email
    .waitFor({ state: "hidden", timeout: 45_000 })
    .then(() => true)
    .catch(() => false);

  if (landed) return;

  // Whatever the panel put on the screen. Several shapes, because this is
  // somebody else's product and its markup is not ours to rely on.
  const shown = await page
    .locator('.alert, .invalid-feedback, [role="alert"], .text-danger')
    .filter({ hasText: /\S/ })
    .first()
    .innerText()
    .catch(() => "");

  const said = answers.length
    ? `The panel answered: ${answers.join(", ")}.`
    : "The panel answered nothing at all to the sign-in — no POST left the page, so the form never submitted.";

  const quoted = shown.trim()
    ? ` It showed: "${redact(shown.trim().replace(/\s+/g, " ").slice(0, 200))}".`
    : "";

  const sameHost = answers.some((answer) => answer.startsWith("5"))
    ? " A 5xx here is this host being unwell, not a wrong credential — it is the same host as the core backend, so check the health probe for that run."
    : "";

  // A redirect that lands back on the screen we came from is the panel saying
  // no. Naming it saves the reader from reading a 302 as success.
  const loginPath = new URL(loginUrl).pathname;
  const bouncedBack = answers.some((answer) => answer.endsWith(`-> ${loginPath}`))
    ? ` The panel sent the browser straight back to ${loginPath}, which is how it refuses a credential — so ADMIN_DASHBOARD_EMAIL / ADMIN_DASHBOARD_PASSWORD are not accepted by this panel, rather than the panel being down.`
    : "";

  expect(
    landed,
    `the admin dashboard kept its sign-in screen on display after the credentials were sent, so the sign-in did not complete. ${said}${quoted}${bouncedBack}${sameHost} The password is not printed here`,
  ).toBe(true);
};

/** A browser context for the admin dashboard, never shared with the app's.
 *
 *  The work runs with the admin already signed in, and the context closes
 *  whatever happens — a case that fails must not leave an admin session open. */
export const withAdminPage = async <T>(
  browser: Browser,
  work: (page: Page) => Promise<T>,
): Promise<T> => {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(45_000);
  try {
    await signInToAdmin(page);
    return await work(page);
  } finally {
    await context.close();
  }
};
