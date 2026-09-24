// Delivering one order through the fleet dashboard.
//
// The fleet is the delivery product. It is a separate application with its own
// host and its own sign-in, and it is the only thing that can put an order into
// `delivered` — which is the state the storefront needs before it draws the
// rating stars. The roadmap calls this "phase 19"; this file is the first thing
// in the suite that actually signs in to it.
//
// ---------------------------------------------------------------------------
// The rule, the same one every external dashboard in this folder obeys
//
// **Never change a row this run cannot prove is its own.**
//
// The rows beside ours are real deliveries for real shoppers. So a row is only
// ever acted on after its **"Original order id" cell** has been read and
// compared with the order this run placed. Filtering is how the row is found;
// reading the cell is what makes acting on it safe.
//
// ---------------------------------------------------------------------------
// The screen, read on 2026-09-22 against staging
//
// **`/admin/journey-orders`** — the delivery list, ten rows to a page.
//
//   filter    a GET form to `/admin/journey-orders/index-filtering` whose
//             `id_filter` box matches the **original order id**, not the
//             journey's own id. Measured: `id_filter=901` returns the row whose
//             journey id is 565; `id_filter=565` returns nothing at all.
//   columns   ID | Shipment Number | Original order id | … | Order status |
//             Change Status | …
//   control   a `Change Status` button opening `#changeStatusModal<journeyId>`,
//             holding `form.change-status-form` — a plain POST to
//             `/admin/journey-orders/<journeyId>/update-status` with a
//             `select.status-select[name="status"]` and an `Update` button.
//
// **`delivered` needs nothing else.** The form's own submit handler asks for a
// return location only for `failed` and `returned_to_location`, and for a
// delivery worker only for `out_for_delivery` and `out_for_return`. So this
// file fills the status and nothing more — and if that ever changes, the check
// at the end of `setJourneyOrderStatus` is what will say so.
//
// Column positions are read from the table's own headings rather than counted,
// because this table is wide and belongs to a product that can add a column
// without telling this repository.

import { expect, type Browser, type Page, type Locator } from "@playwright/test";

import { openDashboardPage, type CallRecord } from "./adminSession";
import { envValue } from "./env";

/** How long a fleet screen has to come back. A server-rendered page on a
 *  shared staging host. */
const FLEET_SCREEN_MS = 45_000;

/** A selector with an environment override. */
const fleetSelector = (key: string, fallback: string): string =>
  envValue(key) || fallback;

/** The fleet's own origin, with no path.
 *
 *  `FLEET_BASE_URL` points into the dashboard (`…/admin`), so every address is
 *  built from its origin rather than from the value itself. */
const fleetOrigin = (): string => new URL(envValue("FLEET_BASE_URL")).origin;

/** One delivery, as the fleet dashboard knows it. */
export type JourneyOrder = {
  /** The fleet's own id for the delivery. Names the row's modal and the address
   *  its form posts to. */
  journeyId: string;
  /** The admin's order id, which the fleet calls "Original order id". */
  orderId: string;
  /** The status the list shows, by its machine value. */
  status: string;
};

/** Sign in to the fleet dashboard.
 *
 *  The password never reaches a message, an assertion or a log line. What is
 *  reported is whether the sign-in landed, not what was typed. */
const signInToFleet = async (page: Page): Promise<void> => {
  const loginUrl =
    envValue("FLEET_LOGIN_PATH") || `${fleetOrigin()}/login`;

  await openDashboardPage(page, { url: loginUrl, product: "fleet dashboard" });

  const email = page
    .locator(fleetSelector("FLEET_SELECTOR_EMAIL", 'input[name="email"]'))
    .first();
  const password = page
    .locator(fleetSelector("FLEET_SELECTOR_PASSWORD", 'input[type="password"]'))
    .first();

  await expect(
    email,
    "the fleet dashboard's sign-in screen has no e-mail field where this suite expects one. Set FLEET_LOGIN_PATH or FLEET_SELECTOR_EMAIL",
  ).toBeVisible({ timeout: FLEET_SCREEN_MS });

  await email.fill(envValue("FLEET_EMAIL"));
  await password.fill(envValue("FLEET_PASSWORD"));
  await page
    .locator(fleetSelector("FLEET_SELECTOR_SUBMIT", 'button[type="submit"]'))
    .first()
    .click();

  // Landed, not "the click happened". A refused sign-in leaves the form on
  // screen and every step after would fail as a missing table.
  await expect(
    email,
    "the fleet dashboard kept its sign-in screen on display after the credentials were sent, so the sign-in was refused. The password is not printed here",
  ).toBeHidden({ timeout: FLEET_SCREEN_MS });
};

/** A browser context for the fleet, never shared with the shopper's or the
 *  admin's. Three identities; one cookie jar holding them all is a way for a
 *  shopper request to go out carrying somebody else's rights. */
export const withFleetPage = async <T>(
  browser: Browser,
  work: (page: Page) => Promise<T>,
): Promise<T> => {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(FLEET_SCREEN_MS);
  try {
    await signInToFleet(page);
    return await work(page);
  } finally {
    await context.close();
  }
};

/** Which column carries this heading, counting from 1.
 *
 *  `0` means the table has no such heading, which is reported rather than
 *  guessed around: reading the wrong column is how a run ends up acting on a
 *  row it never identified. */
const columnIndex = async (page: Page, heading: string): Promise<number> =>
  await page.evaluate((wanted) => {
    const table = document.querySelector("table");
    if (!table) return 0;
    const heads = [...table.querySelectorAll("thead th, thead td")];
    const found = heads.findIndex(
      (cell) =>
        (cell.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase() ===
        wanted.toLowerCase(),
    );
    return found === -1 ? 0 : found + 1;
  }, heading);

/** The list, narrowed to one original order id. */
const filteredListUrl = (orderId: string): string =>
  `${fleetOrigin()}/admin/journey-orders/index-filtering?id_filter=${encodeURIComponent(
    orderId,
  )}`;

/** Look for this run's delivery once. `null` means the fleet does not have it
 *  **yet**, which is an answer rather than a failure — the order only reaches
 *  the fleet once the admin has moved it on. */
export const findJourneyOrder = async (
  page: Page,
  options: { orderId: string },
): Promise<JourneyOrder | null> => {
  await openDashboardPage(page, {
    url: filteredListUrl(options.orderId),
    product: "fleet dashboard",
  });

  const originalColumn = await columnIndex(page, "Original order id");
  const idColumn = await columnIndex(page, "ID");
  const statusColumn = await columnIndex(page, "Order status");

  expect(
    originalColumn > 0 && idColumn > 0 && statusColumn > 0,
    `the fleet's delivery list no longer has the "ID", "Original order id" and "Order status" headings this suite reads its rows by, so this run cannot tell which row is its own and refuses to change any of them`,
  ).toBe(true);

  // **The gate.** The row is taken by what its own cell says, not by being
  // first. A filter that ignored a value it did not understand would hand back
  // the whole list, and the first row of the whole list is a stranger's.
  const row = page
    .locator("table tbody tr")
    .filter({
      has: page.locator(
        `td:nth-child(${originalColumn}):text-is("${options.orderId}")`,
      ),
    })
    .first();

  if (!(await row.isVisible().catch(() => false))) return null;

  const cell = async (index: number): Promise<string> =>
    (
      (await row
        .locator(`td:nth-child(${index})`)
        .first()
        .textContent()
        .catch(() => "")) ?? ""
    )
      .replace(/\s+/g, " ")
      .trim();

  return {
    journeyId: await cell(idColumn),
    orderId: await cell(originalColumn),
    status: await cell(statusColumn),
  };
};

/** Wait for this run's order to reach the fleet at all.
 *
 *  The order arrives only once the admin has moved it on, and that hand-over is
 *  a backend step this repository has no view of. So this waits, bounded, and
 *  says plainly which side is silent when it runs out. */
export const waitForJourneyOrder = async (
  page: Page,
  options: { orderId: string; timeoutMs?: number },
): Promise<JourneyOrder> => {
  const budget = options.timeoutMs ?? 120_000;
  const deadline = Date.now() + budget;
  let found: JourneyOrder | null = null;

  while (Date.now() < deadline) {
    found = await findJourneyOrder(page, { orderId: options.orderId });
    if (found) return found;
    await page.waitForTimeout(10_000);
  }

  expect(
    found,
    `order ${options.orderId} never appeared in the fleet's delivery list within ${Math.round(
      budget / 1000,
    )} seconds of the admin marking it ready to ship. The hand-over from the admin to the fleet did not happen, so the order cannot be delivered and nothing here can rate it`,
  ).not.toBeNull();

  return found as JourneyOrder;
};

/** Move one delivery to a status, and prove the fleet kept it. */
export const setJourneyOrderStatus = async (
  page: Page,
  options: { journey: JourneyOrder; status: string; record?: CallRecord[] },
): Promise<void> => {
  const { journeyId, orderId } = options.journey;

  if (options.journey.status === options.status) return;

  const open = page
    .locator(
      fleetSelector(
        "FLEET_SELECTOR_CHANGE_STATUS",
        `button[data-target="#changeStatusModal${journeyId}"]`,
      ),
    )
    .first();

  await expect(
    open,
    `the fleet row for order ${orderId} has no "Change Status" control where this suite expects one. Set FLEET_SELECTOR_CHANGE_STATUS`,
  ).toBeVisible({ timeout: FLEET_SCREEN_MS });

  await open.click();

  const form: Locator = page
    .locator(`form.change-status-form[action*="/${journeyId}/update-status"]`)
    .first();

  await expect(
    form,
    `pressing "Change Status" on the fleet row for order ${orderId} did not open its own form, so nothing can be changed`,
  ).toBeVisible({ timeout: FLEET_SCREEN_MS });

  await form.locator('select[name="status"]').first().selectOption(options.status);

  await form.locator('button[type="submit"]').first().click();

  // The form is a plain POST, so the page reloads itself. Re-read the row from
  // the list rather than trusting the click: the dashboard refuses some changes
  // in its own submit handler and simply stays where it is.
  const held = await expect
    .poll(
      async () =>
        (await findJourneyOrder(page, { orderId }))?.status ?? "not listed",
      { timeout: 90_000, intervals: [5_000, 5_000, 10_000, 10_000, 15_000] },
    )
    .toBe(options.status)
    .then(() => true)
    .catch(() => false);

  if (!held) {
    const stuck =
      (await findJourneyOrder(page, { orderId }))?.status ?? "not listed";

    expect(
      held,
      `the fleet was asked to move order ${orderId} to "${options.status}", but its list still shows "${stuck}". The change did not reach the fleet's server — its form refuses some statuses unless a delivery worker or a return location is chosen first`,
    ).toBe(true);
  }

  options.record?.push({
    method: "UI",
    url: `${fleetOrigin()}/admin/journey-orders/${journeyId}/update-status`,
    note: `moved this run's own delivery to "${options.status}"`,
  });
};

/** The whole fleet leg: sign in, wait for the delivery, mark it delivered. */
export const markOrderDeliveredInFleet = async (
  browser: Browser,
  options: { orderId: string; record?: CallRecord[] },
): Promise<JourneyOrder> =>
  await withFleetPage(browser, async (page) => {
    const journey = await waitForJourneyOrder(page, {
      orderId: options.orderId,
    });
    await setJourneyOrderStatus(page, {
      journey,
      status: "delivered",
      record: options.record,
    });
    return { ...journey, status: "delivered" };
  });
