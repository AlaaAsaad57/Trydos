// The shopper's own orders: finding one, reading its state, and cancelling it.
//
// The rules every action in this folder follows are at the top of
// `actions/nav.ts`. Three things specific to this file:
//
// **A status is read from `data-status`, never from what it says.** The label
// next to it arrives from the backend already translated, so matching the words
// would tie a case to one language and to the backend's current wording. The
// attribute carries the machine value the app itself branches on.
//
// **Cancelling is four screens, and stopping early cancels nothing.** Options
// menu, "Cancel This Pack", a reason, then a confirmation with its own terms
// tick. Only the last screen posts. Each is a separate step here so a failure
// names the one that did not open.
//
// **The backend decides whether an order may be cancelled at all.** The option
// is drawn only when the order answers `can_cancele_order`
// (`components/setting/orders/OrderOptionsMenu.tsx`). Its absence is an answer,
// not a slow render, so it comes back as an outcome instead of a timeout.

import { expect, type Page } from "@playwright/test";

import { orders } from "../selectors";

/** How long an orders screen has to come back from staging.
 *
 *  The list is fetched client-side after the route renders, and the details
 *  screen fetches again on arrival. Both are ordinary staging calls, so this
 *  matches the navigation allowance the rest of the suite uses. */
const ORDERS_ANSWER_MS = 45_000;

/** How long the cancel call itself has. It is one write, then a full re-read of
 *  the order. */
const CANCEL_MS = 60_000;

/** Open the shopper's order list from the settings page.
 *
 *  Through the card a shopper presses rather than by address: the card is
 *  rendered as a link only for a visitor the app considers signed in, so going
 *  straight to the address would hide a lost session behind an empty list. */
export const gotoOrdersFromSettings = async (page: Page): Promise<void> => {
  const card = orders.settingsCard(page);
  await expect(
    card,
    "the settings page shows no Orders card, so this visitor is not signed in",
  ).toBeVisible({ timeout: ORDERS_ANSWER_MS });
  await card.click();

  await expect(page, "the Orders card did not open the order list").toHaveURL(
    /\/settings\/orders/,
    { timeout: ORDERS_ANSWER_MS },
  );
};

/** Is this order group in the list, and what state does the list show for it?
 *
 *  The list pages as it scrolls, so this looks through what is loaded and asks
 *  for more while there is more to load. A run's own order is the newest, so it
 *  is normally on the first page — the paging is there so a busy shared account
 *  does not make this answer "not listed" for an order that is simply further
 *  down.
 *
 *  Returns the status by its machine value. `listed: true` with a `null` status
 *  is a real and separate answer: the row is there but says nothing about the
 *  order's state, which is a partial success and therefore a failure. */
export const findOrderInList = async (
  page: Page,
  options: { groupId: string; maxScrolls?: number },
): Promise<{ listed: boolean; status: string | null }> => {
  const rows = orders.groupId(page);

  await rows
    .first()
    .waitFor({ state: "visible", timeout: ORDERS_ANSWER_MS })
    .catch(() => undefined);

  const scrolls = options.maxScrolls ?? 5;
  for (let round = 0; round <= scrolls; round += 1) {
    const row = rows.filter({ hasText: options.groupId }).first();

    if (await row.isVisible().catch(() => false)) {
      // The status sits in the same card as the id. Walk up to the card rather
      // than taking the first status on the page, which would be another order's.
      const card = row.locator(
        'xpath=ancestor::a[contains(@href,"/settings/orders/")][1]',
      );
      const status = card.locator('[data-pw="order-status"]').first();
      const value = await status.getAttribute("data-status").catch(() => null);
      return { listed: true, status: value };
    }

    const before = await rows.count();
    await page.mouse.wheel(0, 2000);
    const grew = await expect
      .poll(async () => await rows.count(), { timeout: 8_000 })
      .toBeGreaterThan(before)
      .then(() => true)
      .catch(() => false);
    if (!grew) break;
  }

  return { listed: false, status: null };
};

/** Open one order from the list.
 *
 *  By its row, not by building the address: a row that does not link where it
 *  says it does is a real fault, and a case that navigates by hand can never see
 *  it. */
export const openOrderFromList = async (
  page: Page,
  options: { groupId: string },
): Promise<void> => {
  const row = orders.groupId(page).filter({ hasText: options.groupId }).first();
  await expect(
    row,
    `order ${options.groupId} is not in the list, so there is nothing to open`,
  ).toBeVisible({ timeout: ORDERS_ANSWER_MS });
  await row.click();

  await expect(
    page,
    `pressing order ${options.groupId} did not open its own page`,
  ).toHaveURL(new RegExp(`/settings/orders/${options.groupId}`), {
    timeout: ORDERS_ANSWER_MS,
  });

  await expect(
    orders.status(page).first(),
    "the order page opened without drawing the order's state",
  ).toBeVisible({ timeout: ORDERS_ANSWER_MS });
};

/** The state the order page shows, by its machine value. */
export const readOrderStatus = async (page: Page): Promise<string | null> =>
  await orders
    .status(page)
    .first()
    .getAttribute("data-status")
    .catch(() => null);

/** What a cancel attempt did, step by step.
 *
 *  Separate flags rather than one boolean, because each is a different next
 *  move for whoever reads the failure: an option that was never offered is the
 *  backend refusing, a confirmation that never opened is the app, and a status
 *  that never changed is the cancel call itself. */
export type CancelAttempt = {
  /** Did the order's own menu offer to cancel it? */
  offered: boolean;
  /** Did the confirmation screen open after a reason was picked? */
  confirmationShown: boolean;
  /** Did the order's state change after confirming? */
  statusAfter: string | null;
};

/** Cancel the order this page is showing, the way a shopper does.
 *
 *  Never throws on a refusal. Each step reports what it found so the case can
 *  name the step that stopped — a cancel that silently did nothing is exactly
 *  the failure this journey exists to catch. */
export const attemptCancelOrder = async (
  page: Page,
): Promise<CancelAttempt> => {
  const result: CancelAttempt = {
    offered: false,
    confirmationShown: false,
    statusAfter: null,
  };

  const menu = orders.optionsButton(page);
  await expect(
    menu,
    "the order page drew no options control, so a shopper cannot reach cancelling at all",
  ).toBeVisible({ timeout: ORDERS_ANSWER_MS });
  await menu.click();

  const cancelOption = orders.cancelOption(page);
  result.offered = await cancelOption
    .waitFor({ state: "visible", timeout: ORDERS_ANSWER_MS })
    .then(() => true)
    .catch(() => false);

  if (!result.offered) {
    result.statusAfter = await readOrderStatus(page);
    return result;
  }

  await cancelOption.click();

  // A reason is compulsory: with none picked the submit shows an error and
  // posts nothing (`components/setting/orders/CancelOrderWrapper.tsx`).
  const reason = orders.cancelReason(page).first();
  await expect(
    reason,
    "the cancel screen offered no reason to pick, and it will not submit without one",
  ).toBeVisible({ timeout: ORDERS_ANSWER_MS });
  await reason.click();

  await orders.cancelSubmit(page).click();

  const confirm = orders.cancelConfirm(page);
  result.confirmationShown = await confirm
    .waitFor({ state: "visible", timeout: ORDERS_ANSWER_MS })
    .then(() => true)
    .catch(() => false);

  if (!result.confirmationShown) {
    result.statusAfter = await readOrderStatus(page);
    return result;
  }

  // The confirmation has its own terms tick, and the button does nothing until
  // it is ticked — no error, no request.
  await orders.cancelAgree(page).click();
  await confirm.click();

  // The window closes itself once the cancel has been answered **and** the order
  // has been read back. Waiting for it to go is waiting for the whole thing to
  // settle, which is what makes the status below worth reading.
  await confirm
    .waitFor({ state: "hidden", timeout: CANCEL_MS })
    .catch(() => undefined);

  result.statusAfter = await readOrderStatus(page);
  return result;
};
