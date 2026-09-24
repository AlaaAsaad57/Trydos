// `useDashboardDetailBack` — the Back behaviour shared by the dashboard's
// detail routes (product edit / create, boutique edit / create).
//
// There are two journeys, and they must not be treated the same:
//
//   1. The seller opened the editor FROM the dashboard list. Back must rewind
//      browser history, so the exact list and `?tab=` they were on comes back.
//      The hook says "I handled it" (returns true) and calls router.back().
//   2. The seller landed on the editor directly, or refreshed it. There is no
//      dashboard entry in history to rewind to, so the hook returns false and
//      BackBar does its own default instead.
//
// The two loader flags are part of the contract, not decoration:
// `is_seller_dashboard` picks the dashboard-shaped placeholder, and
// `no_overlay_scroll` stops the page being scrolled to the top on the way back.
import { describe, expect, it } from "vitest";

import { useDashboardDetailBack } from "components/SellerDashboard/useDashboardDetailBack";
import { useAppStore } from "store";
import { routerSpies } from "tests/mocks/nextNavigation";

import { act, renderWithProviders } from "../../render";

const SELLER_ID = "77";

/** Mount the hook and hand back the intercept the editor gives to BackBar. */
async function mountHook(lastPathname: string | null) {
  let onBackIntercept: (() => boolean) | null = null;

  function Probe() {
    onBackIntercept = useDashboardDetailBack(SELLER_ID);
    return null;
  }

  await renderWithProviders(<Probe />, {
    store: { lastPathname, isNavigating: { spinner: true } },
    path: `/sellerProfile/sellerDashboard/${SELLER_ID}/products/5`,
  });

  return () => onBackIntercept!();
}

describe("useDashboardDetailBack", () => {
  it("clears the forward loader as soon as the editor is on screen", async () => {
    await mountHook(null);
    expect(
      useAppStore.getState().isNavigating,
      "the loader started on the card click must be cleared when the editor mounts",
    ).toBeNull();
  });

  it("handles Back itself when the seller came from this dashboard", async () => {
    const back = await mountHook(
      `/gb-en/sellerProfile/sellerDashboard/${SELLER_ID}?tab=products`,
    );

    let handled = false;
    await act(async () => {
      handled = back();
    });

    expect(
      handled,
      "arriving from the dashboard list means the hook takes Back over",
    ).toBe(true);
    expect(
      routerSpies.back,
      "Back should rewind history, so the list and its ?tab= come back",
    ).toHaveBeenCalledTimes(1);
  });

  it("asks for the dashboard-shaped loader, with no scroll to the top", async () => {
    const back = await mountHook(
      `/gb-en/sellerProfile/sellerDashboard/${SELLER_ID}?tab=boutiques`,
    );

    await act(async () => {
      back();
    });

    const flags = useAppStore.getState().isNavigating;
    expect(
      flags?.is_seller_dashboard,
      "the placeholder during the Back trip must be the dashboard shape",
    ).toBe(true);
    expect(
      flags?.no_overlay_scroll,
      "going back to an ordinary page must not scroll it to the top",
    ).toBe(true);
  });

  it("leaves Back to BackBar on a direct landing", async () => {
    const back = await mountHook(null);

    let handled = true;
    await act(async () => {
      handled = back();
    });

    expect(
      handled,
      "with no previous page the hook must let BackBar do its own default",
    ).toBe(false);
    expect(
      routerSpies.back,
      "there is no dashboard entry in history to rewind to",
    ).not.toHaveBeenCalled();
  });

  it("leaves Back to BackBar when the seller came from somewhere else", async () => {
    const back = await mountHook("/gb-en/cart");

    let handled = true;
    await act(async () => {
      handled = back();
    });

    expect(
      handled,
      "arriving from the cart is not arriving from the dashboard",
    ).toBe(false);
    expect(
      routerSpies.back,
      "history must not be rewound to a page that is not the dashboard list",
    ).not.toHaveBeenCalled();
  });

  it("does not rewind for a different seller's dashboard", async () => {
    const back = await mountHook("/gb-en/sellerProfile/sellerDashboard/99");

    let handled = true;
    await act(async () => {
      handled = back();
    });

    expect(
      handled,
      `seller 99's dashboard is not seller ${SELLER_ID}'s, so Back must not be taken over`,
    ).toBe(false);
  });
});
