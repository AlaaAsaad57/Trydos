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

import { expect, type Locator, type Page } from "@playwright/test";

import { orders } from "../selectors";
import { type CallOutcome, watchCommentCall } from "./productComments";

/** How long an orders screen has to come back from staging.
 *
 *  The list is fetched client-side after the route renders, and the details
 *  screen fetches again on arrival. Both are ordinary staging calls, so this
 *  matches the navigation allowance the rest of the suite uses. */
const ORDERS_ANSWER_MS = 45_000;

/** How long the cancel call itself has. It is one write, then a full re-read of
 *  the order. */
const CANCEL_MS = 60_000;

/** A value made safe to put inside a regular expression. Group ids are digits
 *  today; escaping costs nothing and stops a stray character changing the
 *  match. */
const escapeForRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Text that is **exactly** this group id.
 *
 *  Not a substring. The shared account holds many orders, and a substring match
 *  would let id `12` find the row of order `1234` — and a case that writes to an
 *  order must never write to one it did not place. */
export const exactGroupId = (groupId: string): RegExp =>
  new RegExp(`^\\s*${escapeForRegExp(groupId)}\\s*$`);

/** This order's own page address, anchored so `…/orders/12` never matches
 *  `…/orders/1234`. */
export const orderPageAddress = (groupId: string): RegExp =>
  new RegExp(`/settings/orders/${escapeForRegExp(groupId)}(?:[/?#]|$)`);

/** Is the browser on this order's own page? Every write below asks first. */
export const onOrderPage = (page: Page, groupId: string): boolean =>
  orderPageAddress(groupId).test(page.url());

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
    const row = rows.filter({ hasText: exactGroupId(options.groupId) }).first();

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
    if (before === 0) break;

    // Scrolled by bringing the last row into view, not with the mouse wheel.
    // The list scrolls **inside its own container** (`overflow-y-auto` in
    // `OrdersListWrapper`), not the window, and a wheel event scrolls whatever
    // happens to be under the pointer — which, with the pointer where a fresh
    // page leaves it, is not this list. Bringing an element into view asks the
    // browser to scroll the right container.
    await rows
      .nth(before - 1)
      .scrollIntoViewIfNeeded()
      .catch(() => undefined);

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
  const row = orders
    .groupId(page)
    .filter({ hasText: exactGroupId(options.groupId) })
    .first();
  await expect(
    row,
    `order ${options.groupId} is not in the list, so there is nothing to open`,
  ).toBeVisible({ timeout: ORDERS_ANSWER_MS });
  await row.click();

  await expect(
    page,
    `pressing order ${options.groupId} did not open its own page`,
  ).toHaveURL(orderPageAddress(options.groupId), {
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

// ---------------------------------------------------------------------------
// Changing an order after it is placed (ORD-01)
//
// The same rules as the cancel above, and three more:
//
// **Every write checks it is on its own order first.** The shopper account is
// shared, and a write that lands on another order is worse than a failure. So
// each action below takes the run's group id and refuses to press anything when
// the page is not that order's own page.
//
// **Nothing here reads or returns address text.** Playwright prints the value it
// received when an assertion fails, and the run's output is public. So an
// address row is matched inside the page and only its index comes back, and a
// shown recipient is compared inside this file and only `true` / `false` leaves.
//
// **Each write is judged on its first answer that is not a 401**, through
// `watchCommentCall`, which also carries the proxy's own backend label.

/** How long a write has to be answered, including one token renewal. */
const WRITE_MS = 60_000;

/** An empty outcome for a write that was never sent, so a caller can always
 *  quote `write.said`. */
const notSent = (endpoint: string): CallOutcome => ({
  status: 0,
  refusedByProxy: false,
  label: "",
  said: `no call to ${endpoint} was made, because an earlier screen did not open`,
});

/** Does the list show at least one order that is not this one?
 *
 *  "This order is not listed" means nothing on a list that never loaded:
 *  `findOrderInList` answers `listed: false` for an empty page too. The shared
 *  account always holds earlier orders, so another row being drawn is the proof
 *  that the list is really there. Reads ids only — never row content. */
export const listShowsOtherOrders = async (
  page: Page,
  options: { groupId: string },
): Promise<boolean> => {
  const rows = orders.groupId(page);
  await rows
    .first()
    .waitFor({ state: "visible", timeout: ORDERS_ANSWER_MS })
    .catch(() => undefined);
  const ids = await rows.allTextContents().catch(() => [] as string[]);
  return ids.some((id) => id.trim() !== "" && id.trim() !== options.groupId);
};

/** What a change of delivery address did, step by step. */
export type AddressChangeAttempt = {
  onOwnOrder: boolean;
  /** Did the order's menu offer the change? `can_update_address` decides. */
  offered: boolean;
  /** Was the probe's row found in the sheet and pressed? */
  picked: boolean;
  /** Did the confirmation open after "Change Request"? */
  confirmationShown: boolean;
  write: CallOutcome;
};

/** Move the order this page shows to the saved address whose recipient is
 *  `recipient`, the way a shopper does.
 *
 *  The row is found **inside the page** and only its index comes back, so no
 *  address of the account can reach a failure line. */
export const attemptChangeAddress = async (
  page: Page,
  options: { groupId: string; recipient: string },
): Promise<AddressChangeAttempt> => {
  const endpoint = "/customer/order/change-address";
  const result: AddressChangeAttempt = {
    onOwnOrder: onOrderPage(page, options.groupId),
    offered: false,
    picked: false,
    confirmationShown: false,
    write: notSent(endpoint),
  };
  if (!result.onOwnOrder) return result;

  await orders.optionsButton(page).click();
  result.offered = await orders
    .changeAddressOption(page)
    .waitFor({ state: "visible", timeout: ORDERS_ANSWER_MS })
    .then(() => true)
    .catch(() => false);
  if (!result.offered) return result;

  await orders.changeAddressOption(page).click();

  // The sheet fetches the address list on arrival, so the probe's row may not
  // be drawn yet. Asked again until it is, or until the wait runs out.
  const findRow = async (): Promise<number> =>
    await page.evaluate(
      (wanted) =>
        [...document.querySelectorAll('[data-pw="Address"]')].findIndex(
          (row) => (row.textContent ?? "").includes(wanted),
        ),
      options.recipient,
    );
  const index = await expect
    .poll(findRow, { timeout: ORDERS_ANSWER_MS })
    .toBeGreaterThanOrEqual(0)
    .then(findRow)
    .catch(() => -1);
  if (index < 0) return result;

  // Pressed by position, and a failure is caught here: a click error can print
  // the element it hit, and every row here is one of the account's addresses.
  // The position keeps clear of the edit icon in the row's top corner.
  result.picked = await orders
    .changeAddressRow(page)
    .nth(index)
    .click({ position: { x: 20, y: 40 }, timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  if (!result.picked) return result;

  await orders.changeAddressSubmit(page).click();

  result.confirmationShown = await orders
    .changeAddressConfirm(page)
    .waitFor({ state: "visible", timeout: ORDERS_ANSWER_MS })
    .then(() => true)
    .catch(() => false);
  if (!result.confirmationShown) return result;

  // The confirmation has its own terms tick; the button does nothing until it
  // is ticked — no error, no request.
  await orders.changeAddressAgree(page).click();

  const answered = watchCommentCall(page, {
    endpoint,
    backend: "the market backend",
    timeout: WRITE_MS,
  });
  await orders.changeAddressConfirm(page).click();
  result.write = await answered;

  // The sheet closes itself once the change is answered and the order re-read.
  await orders
    .changeAddressSubmit(page)
    .waitFor({ state: "hidden", timeout: WRITE_MS })
    .catch(() => undefined);

  return result;
};

/** Does the order page show `recipient` as the delivery recipient?
 *
 *  A boolean on purpose: the card's text belongs to the account, so it is
 *  compared here and never handed to an assertion that could print it. */
export const pageShowsRecipient = async (
  page: Page,
  recipient: string,
): Promise<boolean> => {
  const shown = orders.addressRecipient(page).first();
  await shown
    .waitFor({ state: "visible", timeout: ORDERS_ANSWER_MS })
    .catch(() => undefined);
  const text = await shown.textContent().catch(() => null);
  return (text ?? "").trim() === recipient;
};

/** What hiding an order did. */
export type HideAttempt = {
  onOwnOrder: boolean;
  offered: boolean;
  confirmationShown: boolean;
  write: CallOutcome;
  /** Did the app leave the order page for the list, as it does after a hide? */
  leftForList: boolean;
};

/** Hide the order this page shows, the way a shopper does.
 *
 *  `packId` names the one visibility call to watch — the full path with the
 *  pack id, never `visibility` alone, which a line's hide call also ends in.
 *  The order page hides the pack it is showing, and this journey's order has
 *  one. */
export const attemptHideOrder = async (
  page: Page,
  options: { groupId: string; packId: number | string },
): Promise<HideAttempt> => {
  const endpoint = `/customer/order/${options.packId}/visibility`;
  const result: HideAttempt = {
    onOwnOrder: onOrderPage(page, options.groupId),
    offered: false,
    confirmationShown: false,
    write: notSent(endpoint),
    leftForList: false,
  };
  if (!result.onOwnOrder) return result;

  await orders.optionsButton(page).click();
  result.offered = await orders
    .hideOption(page)
    .waitFor({ state: "visible", timeout: ORDERS_ANSWER_MS })
    .then(() => true)
    .catch(() => false);
  if (!result.offered) return result;

  await orders.hideOption(page).click();
  result.confirmationShown = await orders
    .hideConfirm(page)
    .waitFor({ state: "visible", timeout: ORDERS_ANSWER_MS })
    .then(() => true)
    .catch(() => false);
  if (!result.confirmationShown) return result;

  const answered = watchCommentCall(page, {
    endpoint,
    backend: "the market backend",
    timeout: WRITE_MS,
  });
  await orders.hideConfirm(page).click();
  result.write = await answered;

  result.leftForList = await page
    .waitForURL(
      (url) =>
        /\/settings\/orders\/?$/.test(url.pathname) &&
        !orderPageAddress(options.groupId).test(url.href),
      { timeout: ORDERS_ANSWER_MS },
    )
    .then(() => true)
    .catch(() => false);

  return result;
};

/** Open the hidden-orders view from the order list, the way a shopper does.
 *  Returns whether the hidden screen is really showing. */
export const openHiddenOrders = async (page: Page): Promise<boolean> => {
  await orders.optionsButton(page).click();
  const offered = await orders
    .openHidden(page)
    .waitFor({ state: "visible", timeout: ORDERS_ANSWER_MS })
    .then(() => true)
    .catch(() => false);
  if (!offered) return false;

  await orders.openHidden(page).click();
  return await orders
    .hiddenScreenBack(page)
    .waitFor({ state: "visible", timeout: ORDERS_ANSWER_MS })
    .then(() => /[?&]view=hidden\b/.test(page.url()))
    .catch(() => false);
};

/** The hidden card for this group, and the wrapper it shares with its eye.
 *
 *  The eye is a **sibling** of the card, and the wrapper is the card's
 *  **direct** parent (`xpath=..`). A wider parent is the whole hidden list,
 *  where an eye could belong to another order and restore it. */
const hiddenCardOf = (
  page: Page,
  groupId: string,
): { card: Locator; wrapper: Locator } => {
  const card = orders.hiddenCard(page).filter({
    has: orders.groupId(page).filter({ hasText: exactGroupId(groupId) }),
  });
  return { card, wrapper: card.first().locator("xpath=..") };
};

/** Is this order on the hidden screen, and is it hidden as a whole?
 *
 *  `fullyHidden` is exactly one order-level eye in the card's own wrapper. A
 *  card with per-product eyes instead is a partly hidden order, which this
 *  journey never makes. */
export const findHiddenOrder = async (
  page: Page,
  options: { groupId: string },
): Promise<{ listed: boolean; fullyHidden: boolean }> => {
  const { card, wrapper } = hiddenCardOf(page, options.groupId);
  const listed = await card
    .first()
    .waitFor({ state: "visible", timeout: ORDERS_ANSWER_MS })
    .then(() => true)
    .catch(() => false);
  if (!listed) return { listed, fullyHidden: false };

  const eyes = await wrapper.getByTestId("restore-hidden-order").count();
  return { listed, fullyHidden: eyes === 1 };
};

/** Restore this whole hidden order from the hidden screen. */
export const attemptRestoreOrder = async (
  page: Page,
  options: { groupId: string; packId: number | string },
): Promise<{
  offered: boolean;
  confirmationShown: boolean;
  write: CallOutcome;
}> => {
  const endpoint = `/customer/order/${options.packId}/visibility`;
  const eye = hiddenCardOf(page, options.groupId).wrapper.getByTestId(
    "restore-hidden-order",
  );

  const result = {
    offered: (await eye.count()) === 1,
    confirmationShown: false,
    write: notSent(endpoint),
  };
  if (!result.offered) return result;

  await eye.click();
  result.confirmationShown = await orders
    .restoreConfirm(page)
    .waitFor({ state: "visible", timeout: ORDERS_ANSWER_MS })
    .then(() => true)
    .catch(() => false);
  if (!result.confirmationShown) return result;

  const answered = watchCommentCall(page, {
    endpoint,
    backend: "the market backend",
    timeout: WRITE_MS,
  });
  await orders.restoreConfirm(page).click();
  result.write = await answered;
  return result;
};

/** Leave the hidden screen for the order list, with its own back arrow.
 *
 *  The hidden view is swapped in over the list, and its cards carry the same id
 *  hook a list row does — so a list check made before leaving could read a
 *  hidden card. Returns whether the address no longer asks for the hidden
 *  view. */
export const leaveHiddenOrders = async (page: Page): Promise<boolean> => {
  await orders.hiddenScreenBack(page).click();
  return await page
    .waitForURL((url) => !/[?&]view=hidden\b/.test(url.search), {
      timeout: ORDERS_ANSWER_MS,
    })
    .then(() => true)
    .catch(() => false);
};

/** What cancelling the only line did. */
export type LineCancelAttempt = {
  onOwnOrder: boolean;
  /** Did the line's menu offer "Cancel This Product"? `can_cancele_order` and a
   *  quantity above zero decide. */
  offered: boolean;
  confirmationShown: boolean;
  write: CallOutcome;
  statusAfter: string | null;
};

/** Cancel the one product line of the order this page shows, the way a shopper
 *  does: the line's menu, "Cancel This Product", a reason, "Cancel Request",
 *  then a confirmation with its own terms tick. Only the last screen posts. */
export const attemptCancelLine = async (
  page: Page,
  options: { groupId: string },
): Promise<LineCancelAttempt> => {
  const endpoint = "/customer/order/cancel-item";
  const result: LineCancelAttempt = {
    onOwnOrder: onOrderPage(page, options.groupId),
    offered: false,
    confirmationShown: false,
    write: notSent(endpoint),
    statusAfter: null,
  };
  if (!result.onOwnOrder) return result;

  // **The lines are drawn only after the "Order Details" card is tapped.** The
  // card toggles, so it is tapped only when no line is showing yet — a second
  // tap would fold the lines away again.
  const line = orders.lineOptions(page).first();
  const alreadyOpen = await line
    .waitFor({ state: "visible", timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (!alreadyOpen) {
    const card = orders.productsCount(page).first();
    await expect(
      card,
      "the order page drew no \"Order Details\" card, so its product lines cannot be opened",
    ).toBeVisible({ timeout: ORDERS_ANSWER_MS });
    await card.click();
  }
  await expect(
    line,
    "the \"Order Details\" card was opened but drew no menu on its product line, so a shopper cannot reach cancelling a line at all",
  ).toBeVisible({ timeout: ORDERS_ANSWER_MS });
  await line.click();

  result.offered = await orders
    .cancelLineOption(page)
    .waitFor({ state: "visible", timeout: ORDERS_ANSWER_MS })
    .then(() => true)
    .catch(() => false);
  if (!result.offered) {
    result.statusAfter = await readOrderStatus(page);
    return result;
  }

  await orders.cancelLineOption(page).click();

  // A reason is compulsory: with none picked the button closes the screen and
  // posts nothing (`components/setting/orders/CancelOrderItemWrapper.tsx`).
  const reason = orders.cancelLineReason(page).first();
  await expect(
    reason,
    "the cancel-line screen offered no reason to pick, and it will not post without one",
  ).toBeVisible({ timeout: ORDERS_ANSWER_MS });
  await reason.click();
  await orders.cancelLineSubmit(page).click();

  const confirm = orders.cancelLineConfirm(page);
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
  await orders.cancelLineAgree(page).click();

  const answered = watchCommentCall(page, {
    endpoint,
    backend: "the market backend",
    timeout: WRITE_MS,
  });
  await confirm.click();
  result.write = await answered;

  // The window closes once the cancel is answered **and** the order re-read.
  await confirm
    .waitFor({ state: "hidden", timeout: WRITE_MS })
    .catch(() => undefined);

  result.statusAfter = await readOrderStatus(page);
  return result;
};
