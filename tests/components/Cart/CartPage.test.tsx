// The cart page /[lang]/cart (components/Cart/CartPage.tsx, Stage 3 S3-7).
//
// The old cart drawer is now a page. The page draws the same two steps the
// drawer drew (the cart, then checkout), fires the same checkout events, and
// holds `cart_enable` true while it is on screen. When anything closes the
// cart (`enableCart(false)`: the back arrow, a finished order, a product link)
// the page leaves: back to the page before it when this tab has shown a page
// of this site, else to the home page.
//
// The cart and checkout screens are stand-ins: each has its own test, and both
// reach the core backend on mount.
import { beforeEach, describe, expect, it, vi } from "vitest";

import CartPage, { noteSitePage } from "components/Cart/CartPage";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";

import { act, renderWithProviders, screen, userEvent } from "../../render";
import { routerSpies } from "../../mocks/nextNavigation";

const GAevent = vi.hoisted(() => vi.fn());
vi.mock("utils/gtag", () => ({ GAevent }));

const funnel = vi.hoisted(() => ({
  startOrderAttempt: vi.fn(),
  trackOrder: vi.fn(),
}));
vi.mock("utils/orderFunnel", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  ...funnel,
}));

vi.mock("components/Cart", () => ({
  default: ({ toOrders, close }: any) => (
    <div data-testid="cart-step">
      <button onClick={toOrders}>to-orders</button>
      <button onClick={close}>close-cart</button>
    </div>
  ),
}));
vi.mock("components/Cart/OrdersPage", () => ({
  default: ({ setStep }: any) => (
    <div data-testid="orders-step">
      <button onClick={setStep}>back-to-cart</button>
    </div>
  ),
}));
vi.mock("components/global/SlideNavigation", () => ({
  SlideWidget: ({ step, children }: any) => (
    <div data-testid="slider" data-step={step}>
      {children}
    </div>
  ),
}));

const CART = [
  { product_id: 1, name: "Shirt", offer_price: 10, quantity: 1, variant: "M" },
  { product_id: 2, name: "Hat", offer_price: 20, quantity: 1 },
];

async function openCartPage(store: Record<string, any> = {}) {
  return renderWithProviders(<CartPage />, {
    country: "sy",
    path: "/cart",
    store: { total_cash: 30, cart: CART, ...store },
  });
}

beforeEach(() => {
  GAevent.mockClear();
  funnel.startOrderAttempt.mockClear();
  funnel.trackOrder.mockClear();
  sessionStorage.clear();
});

describe("the cart page draws the old cart and its checkout", () => {
  it("draws the cart step first, in the page and not in a fixed drawer", async () => {
    await openCartPage();
    expect(await screen.findByTestId("cart-step"), "the cart step was not drawn").toBeInTheDocument();
    expect(screen.getByTestId("slider").dataset.step, "the page did not start on the cart step").toBe("0");
    const root = document.querySelector('[data-pw="cart-page"]');
    expect(root, "the cart page root (data-pw=cart-page) was not drawn").not.toBeNull();
    expect(
      root!.className.split(/\s+/),
      "the cart page is still a fixed full-screen drawer",
    ).not.toContain("fixed");
    expect(document.querySelector(".cart-provider"), "the old drawer box was drawn on the page").toBeNull();
  });

  it("'to orders' reports the checkout screen view", async () => {
    await openCartPage();
    await userEvent.click(await screen.findByText("to-orders"));
    const view = GAevent.mock.calls.find((c) => c[0].action === GA_EVENT_NAMES.SCREEN_VIEW)?.[0];
    expect(view, "no SCREEN_VIEW event was sent on the way to checkout").toBeDefined();
    expect(view.params.screen_name, "the screen view did not name the checkout screen").toBe(
      GA_GLOBAL_SCREEN.CHECKOUT_SCREEN,
    );
    expect(view.params.screen_path, "the screen view did not carry the cart page path").toBe("/sy-en/cart");
  });

  it("'to orders' reports begin_checkout with the value and each item", async () => {
    await openCartPage();
    await userEvent.click(await screen.findByText("to-orders"));
    const begin = GAevent.mock.calls.find((c) => c[0].action === GA_EVENT_NAMES.BEGIN_CHECKOUT)?.[0];
    expect(begin, "no BEGIN_CHECKOUT event was sent on the way to checkout").toBeDefined();
    expect(begin.params.value, "begin_checkout did not carry the cart total").toBe(30);
    expect(
      begin.params.items.map((i: any) => i.item_variant),
      "begin_checkout did not carry each item's variant",
    ).toEqual(["M", "N/A"]);
  });

  it("'to orders' starts an order attempt and tells the order funnel", async () => {
    await openCartPage();
    await userEvent.click(await screen.findByText("to-orders"));
    expect(funnel.startOrderAttempt, "no order attempt was started").toHaveBeenCalled();
    expect(funnel.trackOrder.mock.calls[0]?.[1], "the funnel did not get the value and count").toEqual({
      value: 30,
      item_count: 2,
    });
  });

  it("moves to checkout and comes back to the cart", async () => {
    await openCartPage();
    await userEvent.click(await screen.findByText("to-orders"));
    expect(screen.getByTestId("slider").dataset.step, "the page did not move to checkout").toBe("1");
    await userEvent.click(await screen.findByText("back-to-cart"));
    expect(screen.getByTestId("slider").dataset.step, "the page did not come back to the cart").toBe("0");
  });
});

describe("the cart page holds cart_enable", () => {
  it("sets cart_enable true while it is on screen and false when it goes", async () => {
    const { store, unmount } = await openCartPage({ cart_enable: false });
    expect(store.getState().cart_enable, "the page did not set cart_enable on mount").toBe(true);
    unmount();
    expect(store.getState().cart_enable, "the page left cart_enable true after it went").toBe(false);
  });

  it("does not leave again when it goes away on its own (unmount)", async () => {
    noteSitePage("/sy-en/products/x");
    const { unmount } = await openCartPage();
    unmount();
    expect(routerSpies.back, "the page went back while it was being taken down").not.toHaveBeenCalled();
    expect(routerSpies.replace, "the page moved home while it was being taken down").not.toHaveBeenCalled();
  });
});

describe("closing the cart leaves the page", () => {
  it("enableCart(false) while the page is on screen goes back to the page before it", async () => {
    noteSitePage("/sy-en/products/x");
    const { store } = await openCartPage();
    await act(async () => {
      store.getState().enableCart(false);
    });
    expect(routerSpies.back, "closing the cart (enableCart(false)) did not go back").toHaveBeenCalled();
    expect(routerSpies.replace, "closing the cart moved home although a site page was behind it").not.toHaveBeenCalled();
  });

  it("the cart's own close goes back to the page before it", async () => {
    noteSitePage("/sy-en/products/x");
    await openCartPage();
    await userEvent.click(await screen.findByText("close-cart"));
    expect(routerSpies.back, "the cart's close control did not go back").toHaveBeenCalled();
  });

  it("with no page of this site behind it, closing goes to the home page", async () => {
    const { store } = await openCartPage();
    await act(async () => {
      store.getState().enableCart(false);
    });
    expect(routerSpies.replace, "closing a cart opened straight from a link did not go home").toHaveBeenCalledWith(
      "/sy-en",
    );
    expect(routerSpies.back, "closing a cart opened straight from a link went back out of the site").not.toHaveBeenCalled();
  });

  it("the cart page itself does not count as a page behind it", async () => {
    noteSitePage("/sy-en/cart");
    const { store } = await openCartPage();
    await act(async () => {
      store.getState().enableCart(false);
    });
    expect(routerSpies.replace, "the cart page counted as a site page behind itself").toHaveBeenCalledWith("/sy-en");
  });

  it("a product link in the cart is left to move on its own (Review Focus 2)", async () => {
    // The product card in the cart (components/Cart/index.tsx) is a link that
    // marks the move (isNavigating) and then calls enableCart(false). Going
    // back as well would fight the link's own move.
    noteSitePage("/sy-en/products/x");
    const { store } = await openCartPage();
    await act(async () => {
      store.getState().setIsNavigating({ is_product: true });
      store.getState().enableCart(false);
    });
    expect(routerSpies.back, "the page went back while a product link was moving").not.toHaveBeenCalled();
    expect(routerSpies.replace, "the page moved home while a product link was moving").not.toHaveBeenCalled();
  });
});
