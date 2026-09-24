// The back bar on a product page, with the small cart summary
// (ProductCartHeader) on the other side. Back closes an intercepted modal with
// router.back(), otherwise it goes to the last page the shopper came from and
// tells the loader which kind of page that is.
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProductBackButton from "components/products/ProductBackButton";

import { routerSpies } from "../../mocks/nextNavigation";
import { fireEvent, renderWithProviders, screen } from "../../render";

const back = () => document.querySelector('[data-pw="backIcon_productPage"]') as HTMLElement;

async function renderBar(store: any = {}, opts: any = {}) {
  const enableCart = vi.fn();
  const view = await renderWithProviders(<ProductBackButton lang={opts.lang ?? "gb-en"} />, {
    store: { localCart: [], enableCart, ...store },
    ...opts,
  });
  return { ...view, enableCart };
}

describe("ProductBackButton", () => {
  beforeEach(() => {
    routerSpies.back.mockClear();
    routerSpies.push.mockClear();
  });

  it("closes an intercepted product modal with router.back()", async () => {
    await renderBar({}, { isModalRoute: true });
    fireEvent.click(back());
    expect(routerSpies.back, "the modal was not closed with back()").toHaveBeenCalled();
    expect(routerSpies.push, "the modal pushed a page").not.toHaveBeenCalled();
  });

  it("goes back to a boutique listing with the boutique loader", async () => {
    const { store } = await renderBar({ lastPathname: "/gb-en/boutiques/nike" });
    expect(store.getState().isNavigating, "the navigation state was not cleared on mount").toBeNull();
    fireEvent.click(back());
    expect(routerSpies.push, "back did not go to the last page").toHaveBeenCalledWith("/gb-en/boutiques/nike");
    expect(store.getState().isNavigating, "the boutique loader was not chosen").toEqual({ is_boutique: true });
  });

  it("goes to another last page with the home loader", async () => {
    const { store } = await renderBar({ lastPathname: "/gb-en/cart" });
    fireEvent.click(back());
    expect(store.getState().isNavigating, "the home loader was not chosen").toEqual({ is_full_home: true });
    expect(routerSpies.push, "back did not go to the last page").toHaveBeenCalledWith("/gb-en/cart");
  });

  it("goes home when there is no last page (direct entry)", async () => {
    await renderBar({ lastPathname: null });
    fireEvent.click(back());
    expect(routerSpies.push, "a direct entry did not go home").toHaveBeenCalledWith("/gb-en");
  });

  it("flips in Arabic and shows the cart count and total, opening the cart", async () => {
    const { enableCart } = await renderBar(
      {
        localCart: [
          { offer_price: 10, quantity: 2 },
          { offer_price: 5, quantity: 1 },
        ],
        currency: { symbol: "$", exchange_rate: 1 },
      },
      { lang: "sy-ar", language: "ar" },
    );
    expect(document.querySelector(".back-bar")!.className, "the Arabic bar is not flipped").toContain(
      "flex-row-reverse",
    );
    const summary = screen.getByText("$").parentElement as HTMLElement;
    expect(summary.textContent, "the cart summary does not show 2 items and 25").toMatch(/^2.*25\$$/);
    fireEvent.click(summary);
    expect(enableCart, "the cart summary did not open the cart").toHaveBeenCalledWith(true);
  });
});
