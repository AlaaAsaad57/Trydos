// Moving one order through the admin dashboard, and proving the row is ours.
//
// The rating journey needs a **delivered** order, because the storefront draws
// the rating stars only for one (`components/settings/cards/OrderItemsList.tsx`,
// `isDelevired`). Nothing in this repository can deliver an order. Two other
// products do it, and this file drives the first of them.
//
// ---------------------------------------------------------------------------
// The rule, and it is the same one `adminApprove.ts` obeys
//
// **Never change a row this run cannot prove is its own.**
//
// This is a real admin dashboard on a shared environment. The orders beside
// ours belong to real shoppers waiting for real deliveries. Moving one of them
// to "ready to shipping" is not a test failure — it is a change to somebody's
// order that no revert undoes.
//
// So the order is found in two steps and the second one is the gate:
//
//   1. the list is narrowed by the screen's **own** filter,
//      `?searchByOrderGroupID=`, which gives a details address;
//   2. that details screen is opened and its **own** "Order Group ID" is read
//      and compared with the group this run placed. Only then is the status
//      control touched.
//
// Step 2 is what makes step 1 safe. A filter that silently ignored a value it
// did not understand would hand back the whole list, and the first row of the
// whole list is a stranger's order.
//
// ---------------------------------------------------------------------------
// The screens, read on 2026-09-22 against staging
//
// **`/admin/orders/list/<status>`** — the order list. Its filter form is a plain
// GET and carries `searchByOrderGroupID`, so `list/all?searchByOrderGroupID=…`
// narrows to one order. The `Order` column holds the admin's own order id, and
// every row links to `/admin/orders/details/<orderId>`.
//
// **`/admin/orders/details/<orderId>`** — the order page.
//
//   control   `select[name="order_status"][data-id="<orderId>"]`, whose
//             `onchange` is the page's own `order_status(value)`
//   note      the page prints `Order Group ID: <id>`, which is the identity
//             this file gates on
//
// **Choosing `ready_to_shipping` is not one click.** Every other status opens a
// plain "are you sure" and sends. This one runs `setMetaDataBeforeStatusChange`
// instead, which asks the backend for the order's lines and opens
// `#weightModal` — a form wanting a location, length, width, height, a weight
// per line and a packaging weight. `saveMetaData()` posts them to
// `/admin/orders/save-meta-data`, and only when that answers does the page call
// the ordinary "are you sure" and change the status. So the leg is: choose,
// fill, save, confirm — and a step that stops early changes nothing at all.

import { expect, type Browser, type Page, type Locator } from "@playwright/test";

import {
  adminOrigin,
  adminSelector,
  openDashboardPage,
  withAdminPage,
  type CallRecord,
} from "./adminSession";
import { envValue } from "./env";

/** How long an admin screen has to come back. These are server-rendered pages
 *  on a shared staging host, and the meta-data form makes a call of its own
 *  before it draws. */
const ADMIN_SCREEN_MS = 45_000;

/** One order, as the admin dashboard knows it. */
export type AdminOrder = {
  /** The admin's own order id — the number in the `Order` column, and the one
   *  the fleet dashboard calls "Original order id". */
  orderId: string;
  detailsUrl: string;
};

/** The order list, narrowed by the shopper's order group id. */
const listUrl = (groupId: string): string => {
  const base = adminOrigin();
  const path =
    envValue("ADMIN_ORDERS_LIST_PATH") || `${base}/admin/orders/list/all`;
  return `${path}?searchByOrderGroupID=${encodeURIComponent(groupId)}`;
};

/** The group id this details screen says it is showing.
 *
 *  Read from the screen's own text, because it is the only identity both sides
 *  share: the shopper never sees the admin's order id, and the admin list never
 *  shows the group id. `null` means the page does not print it at all, which is
 *  a refusal to act rather than a mismatch. */
const shownGroupId = async (page: Page): Promise<string | null> =>
  await page.evaluate(() => {
    // **Only elements that carry a value count.** The screen draws the field as
    //
    //     <label><strong>Order Group ID: </strong> SA35609J4T3ZCV13</label>
    //
    // so two elements begin with those words and only the outer one holds the
    // id. An earlier version of this took the *shortest* match, which is always
    // the `<strong>` — label text and nothing else — and so read every order
    // page as having no group id at all. The run that found it refused a
    // perfectly good order of its own.
    //
    // Matching on "captures an id" rather than on the element keeps that from
    // coming back if the markup is rearranged again.
    const seen: { length: number; id: string }[] = [];

    for (const element of document.querySelectorAll("*")) {
      const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
      // An ancestor carries its whole branch, and the anchor rules those out:
      // the id's own label is the only thing that *starts* with these words.
      if (text.length > 200) continue;

      const found = text.match(/^Order Group ID\s*:\s*([A-Za-z0-9_-]+)/i);
      if (found) seen.push({ length: text.length, id: found[1] });
    }

    if (seen.length === 0) return null;

    // The innermost element that still holds the value.
    seen.sort((first, second) => first.length - second.length);
    return seen[0].id;
  });

/** Find the admin's order for one storefront order group, and prove it.
 *
 *  Leaves the page **on that order's details screen**, so a caller does not
 *  navigate again and risk landing somewhere else. */
export const findAdminOrderForGroup = async (
  page: Page,
  options: { groupId: string },
): Promise<AdminOrder> => {
  await openDashboardPage(page, {
    url: listUrl(options.groupId),
    product: "admin dashboard",
  });

  const link = page
    .locator(
      adminSelector(
        "ADMIN_SELECTOR_ORDER_DETAILS_LINK",
        'table tbody tr a[href*="/orders/details/"]',
      ),
    )
    .first();

  await expect(
    link,
    `the admin dashboard lists no order for group ${options.groupId}. Either the order never reached the admin, or its list no longer takes searchByOrderGroupID — set ADMIN_ORDERS_LIST_PATH or ADMIN_SELECTOR_ORDER_DETAILS_LINK`,
  ).toBeVisible({ timeout: ADMIN_SCREEN_MS });

  const href = await link.getAttribute("href");
  expect(
    href,
    `the admin row for group ${options.groupId} carries no link to the order, so this run cannot open it`,
  ).toBeTruthy();

  const detailsUrl = new URL(href as string, page.url()).href;
  const orderId = (detailsUrl.match(/\/details\/(\d+)/) ?? [])[1] ?? "";

  expect(
    orderId,
    `the admin link for group ${options.groupId} is "${detailsUrl}", which carries no order id this run can read`,
  ).not.toBe("");

  await openDashboardPage(page, { url: detailsUrl, product: "admin dashboard" });

  // ---- the gate ---------------------------------------------------------
  const shown = await shownGroupId(page);

  expect(
    shown,
    `the admin order page ${detailsUrl} does not print an order group id, so this run cannot prove the order is its own. Refusing to change it — the orders beside it belong to real shoppers`,
  ).not.toBeNull();

  expect(
    shown,
    `the admin opened order ${orderId} for group ${options.groupId}, but that order page says it belongs to a different group. Refusing to change it`,
  ).toBe(options.groupId);

  return { orderId, detailsUrl };
};

/** The status control on the order details screen. */
const statusSelect = (page: Page, orderId: string): Locator =>
  page
    .locator(
      adminSelector(
        "ADMIN_SELECTOR_ORDER_STATUS",
        `select[name="order_status"][data-id="${orderId}"]`,
      ),
    )
    .first();

/** Whatever the dashboard's toast is saying, or `""`.
 *
 *  It reports a refused save this way and nothing else on screen changes.
 *  Without reading it, a failed meta-data save looks exactly like a status that
 *  simply did not move. */
const toastText = async (page: Page): Promise<string> =>
  (
    await page
      .locator("#toast-container, .toast-error, .toast-message")
      .first()
      .textContent()
      .catch(() => "")
  )
    ?.replace(/\s+/g, " ")
    .trim() ?? "";

/** Fill one number field only when it is empty, and leave a real value alone.
 *
 *  The dashboard prefills what it already knows — a product that carries a
 *  weight arrives with the weight in the box. Overwriting that would make this
 *  run change the shop's own data. */
const fillIfEmpty = async (
  within: Locator,
  selector: string,
  value: string,
): Promise<void> => {
  const boxes = within.locator(selector);
  const count = await boxes.count();
  for (let index = 0; index < count; index += 1) {
    const box = boxes.nth(index);
    const current = (await box.inputValue().catch(() => "")) ?? "";
    if (current.trim() === "" || Number(current) <= 0) {
      await box.fill(value);
    }
  }
};

/** The meta-data form the dashboard opens before `ready_to_shipping`.
 *
 *  Every figure filled in here is a shipping measurement for one test order on
 *  staging. They are deliberately small and plainly artificial. */
const completeWeightForm = async (page: Page): Promise<void> => {
  const modal = page.locator(
    adminSelector("ADMIN_SELECTOR_WEIGHT_MODAL", "#weightModal"),
  );

  await expect(
    modal,
    "choosing 'ready to shipping' did not open the admin's weight and dimensions form. The dashboard asks for it before this status, so without the form the status can never change — it may also have failed to read the order's lines",
  ).toBeVisible({ timeout: ADMIN_SCREEN_MS });

  // The location list is built from the shop's own locations and the first is
  // pre-chosen. An empty one means the shop has no location to ship from, which
  // is a real finding and not something to invent a value for.
  const location = modal.locator("#order_location").first();
  const chosen = (await location.inputValue().catch(() => "")) ?? "";
  expect(
    chosen,
    "the admin's weight form offers no shipping location for this order, so the shop it was bought from has none the dashboard can use",
  ).not.toBe("");

  await fillIfEmpty(modal, "#order_length", "10");
  await fillIfEmpty(modal, "#order_width", "10");
  await fillIfEmpty(modal, "#order_height", "10");
  await fillIfEmpty(modal, ".weight-input", "100");
  await fillIfEmpty(modal, "#order_packaging_weight", "50");

  const save = modal
    .locator(
      adminSelector(
        "ADMIN_SELECTOR_WEIGHT_SAVE",
        'button[onclick="saveMetaData()"]',
      ),
    )
    .first();

  await expect(
    save,
    "the admin's weight form has no save control where this suite expects one. Set ADMIN_SELECTOR_WEIGHT_SAVE",
  ).toBeVisible({ timeout: ADMIN_SCREEN_MS });

  await save.click();

  // The form hides itself once the save is accepted, and only then does the
  // page go on to change the status. A form still on screen is a refused save,
  // and the dashboard says why in a toast.
  const closed = await modal
    .waitFor({ state: "hidden", timeout: ADMIN_SCREEN_MS })
    .then(() => true)
    .catch(() => false);

  expect(
    closed,
    `the admin refused to save the order's weight and dimensions, so the status was never asked to change. The dashboard said: "${await toastText(page)}"`,
  ).toBe(true);
};

/** Press the dashboard's own "are you sure" box.
 *
 *  Both paths end at one. Nothing is sent until it is pressed, so a step that
 *  stops here has changed nothing — which is why its absence is asserted rather
 *  than waited out. */
const pressConfirmBox = async (page: Page): Promise<void> => {
  const confirm = page
    .locator(adminSelector("ADMIN_SELECTOR_CONFIRM", ".swal2-confirm"))
    .first();

  await expect(
    confirm,
    "the admin dashboard did not ask this run to confirm the status change, so nothing was sent. Its confirmation box is where the change is actually made",
  ).toBeVisible({ timeout: ADMIN_SCREEN_MS });

  await confirm.click();
};

/** Move one order to a status, and prove the dashboard kept it.
 *
 *  The page must already be on that order's details screen, and the caller must
 *  already have proved the order is its own — `findAdminOrderForGroup` does
 *  both. */
export const setAdminOrderStatus = async (
  page: Page,
  options: { order: AdminOrder; status: string; record?: CallRecord[] },
): Promise<void> => {
  const control = statusSelect(page, options.order.orderId);

  await expect(
    control,
    `the admin order page for order ${options.order.orderId} has no status control where this suite expects one. Set ADMIN_SELECTOR_ORDER_STATUS`,
  ).toBeVisible({ timeout: ADMIN_SCREEN_MS });

  const before = (await control.inputValue().catch(() => "")) ?? "";

  if (before === options.status) {
    // Already there. The page's own handler does nothing in this case, so
    // waiting for a confirmation box would wait for one that never opens.
    return;
  }

  await control.selectOption(options.status);

  if (options.status === "ready_to_shipping") {
    await completeWeightForm(page);
  }

  await pressConfirmBox(page);

  // **Check that it took.** Choosing an option is not the same as the order
  // moving. Re-read the control from a fresh copy of the page rather than
  // trusting the click.
  const held = await expect
    .poll(
      async () => {
        await page
          .goto(options.order.detailsUrl, { waitUntil: "domcontentloaded" })
          .catch(() => undefined);
        return (
          (await statusSelect(page, options.order.orderId)
            .inputValue()
            .catch(() => "")) ?? ""
        );
      },
      { timeout: 90_000, intervals: [5_000, 5_000, 10_000, 10_000, 15_000] },
    )
    .toBe(options.status)
    .then(() => true)
    .catch(() => false);

  if (!held) {
    const stuck =
      (await statusSelect(page, options.order.orderId)
        .inputValue()
        .catch(() => "unreadable")) ?? "unreadable";

    expect(
      held,
      `the admin order ${options.order.orderId} was set to "${options.status}", but after a reload its own page still shows "${stuck}". The change did not reach the server. The dashboard said: "${await toastText(page)}"`,
    ).toBe(true);
  }

  options.record?.push({
    method: "UI",
    url: options.order.detailsUrl,
    note: `moved this run's own order from "${before}" to "${options.status}"`,
  });
};

/** The whole admin leg: sign in, find this run's order, move it on.
 *
 *  Returns the admin's order id, which is what the fleet dashboard searches by. */
export const markOrderStatusInAdmin = async (
  browser: Browser,
  options: { groupId: string; status: string; record?: CallRecord[] },
): Promise<AdminOrder> =>
  await withAdminPage(browser, async (page) => {
    const order = await findAdminOrderForGroup(page, {
      groupId: options.groupId,
    });
    await setAdminOrderStatus(page, {
      order,
      status: options.status,
      record: options.record,
    });
    return order;
  });
