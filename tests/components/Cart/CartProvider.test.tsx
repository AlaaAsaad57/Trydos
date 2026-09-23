// The cart host in the page layout (components/Cart/CartProvider.tsx).
//
// It is mounted once on every page. On mount it loads the client data and the
// currency, listens for the back button on popup history entries, and reads
// three query keys: `cart`, `coupon` and `selected`. It also draws the cart
// slider, the add-to-cart sheet and the external payment frame when the store
// asks for them.
//
// Every child it draws is replaced by a stand-in that shows what it was given:
// each has its own test, and several reach the core backend on mount.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CartProvider from "components/Cart/CartProvider";
import { useAppStore } from "store";

import { act, renderWithProviders, screen, userEvent, waitFor } from "../../render";
import { routerSpies } from "../../mocks/nextNavigation";

const home = vi.hoisted(() => ({ getClientData: vi.fn() }));
vi.mock("services/home", () => ({ default: home }));

vi.mock("services/auth", () => ({ default: { UserID: () => "user-1" } }));

const tiny = vi.hoisted(() => ({
  getCurrency: vi.fn(({ callback }: any) => callback({ currency: { code: "USD" } })),
  EnableScroll: vi.fn(),
  DisableScroll: vi.fn(),
  DetectScreen: vi.fn(() => "home"),
  getReferralSource: vi.fn(() => "direct"),
}));
vi.mock("utils/tinyUtils", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  ...tiny,
}));

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

const popup = vi.hoisted(() => ({
  takeSelfConsume: vi.fn(() => false),
  markBackClosing: vi.fn(),
}));
vi.mock("utils/popupHistory", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  ...popup,
}));

vi.mock("components/Cart", () => ({
  default: ({ toOrders, close }: any) => (
    <div data-testid="cart-page">
      <button onClick={toOrders}>to-orders</button>
      <button onClick={close}>close-cart</button>
    </div>
  ),
}));
vi.mock("components/Cart/OrdersPage", () => ({
  default: ({ setStep }: any) => (
    <div data-testid="orders-page">
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
vi.mock("components/global/ParamsUpdater", () => ({ default: () => null }));
vi.mock("components/Cart/AddToCart/AddToCartComponent", () => ({
  default: ({ color, slug }: any) => (
    <div data-testid="add-to-cart" data-color={String(color)} data-slug={slug} />
  ),
}));
vi.mock("components/Cart/ModalIframe", () => ({
  default: ({ openIframe, isLoading, handleIframeLoad, _closeIframe }: any) => (
    <div data-testid="pay-frame" data-url={openIframe.url} data-loading={String(isLoading)}>
      <button onClick={handleIframeLoad}>frame-loaded</button>
      <button onClick={_closeIframe}>close-frame</button>
    </div>
  ),
}));

async function mountProvider(
  options: { search?: string; store?: Record<string, any>; path?: string } = {},
) {
  return renderWithProviders(<CartProvider language="en" country="sy" />, {
    country: "sy",
    path: options.path ?? "/",
    search: options.search ?? "",
    store: options.store ?? {},
  });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  home.getClientData.mockClear();
  tiny.getCurrency.mockClear();
  tiny.EnableScroll.mockClear();
  GAevent.mockClear();
  funnel.startOrderAttempt.mockClear();
  funnel.trackOrder.mockClear();
  popup.takeSelfConsume.mockReset().mockReturnValue(false);
  popup.markBackClosing.mockClear();
  localStorage.clear();
  // Closing the login popup scrolls the page to the top
  // (store/homepage/reducer.ts, setLoginOpen); jsdom has no scrollTo.
  document.documentElement.scrollTo = vi.fn() as any;
  // Opening the cart shrinks the page behind it (store/Cart/reducer.ts,
  // openCart), which the layout provides and a bare test page does not.
  if (!document.querySelector(".site-container")) {
    const site = document.createElement("div");
    site.className = "site-container";
    document.body.appendChild(site);
  }
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the cart host on mount", () => {
  it("loads the client data and the currency, and stores the language and country", async () => {
    const { store } = await mountProvider();
    await act(async () => {
      vi.advanceTimersByTime(20);
    });
    expect(home.getClientData, "the client data was not loaded on mount").toHaveBeenCalled();
    expect(
      (store.getState() as any).currency,
      "the currency the helper returned was not stored",
    ).toEqual({ code: "USD" });
    expect(store.getState().language, "the page language was not stored").toBe("en");
    expect(store.getState().country, "the page country was not stored").toBe("sy");
  });

  it.each(["changed-country=1", "no-country=1"])(
    "does not load the client data right after a country change (%s)",
    async (search) => {
      await mountProvider({ search });
      await act(async () => {
        vi.advanceTimersByTime(20);
      });
      expect(home.getClientData, "the client data was loaded during a country change").not.toHaveBeenCalled();
    },
  );

  it("opens the cart when the address has ?cart", async () => {
    const { store } = await mountProvider({ search: "cart=true" });
    expect(store.getState().cart_enable, "?cart did not open the cart").toBe(true);
    expect(await screen.findByTestId("cart-page"), "the cart page was not drawn").toBeInTheDocument();
  });

  it("keeps a coupon from the address, reports it, and takes it out of the address", async () => {
    await mountProvider({ path: "/offers", search: "coupon=SAVE10&x=1" });
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    expect(localStorage.getItem("coupon-number"), "the coupon was not kept").toBe("SAVE10");
    expect(
      GAevent.mock.calls.find((c) => c[0].params?.coupon_code)?.[0].params.coupon_code,
      "the coupon view was not reported with its code",
    ).toBe("SAVE10");
    expect(routerSpies.replace, "the coupon was not taken out of the address").toHaveBeenCalledWith(
      "/sy-en/offers?x=1",
    );
  });

  it("drops the whole query when the coupon or the selection was the only key", async () => {
    await mountProvider({ path: "/offers", search: "coupon=SAVE10" });
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    expect(routerSpies.replace, "a coupon-only address kept a '?'").toHaveBeenCalledWith("/sy-en/offers");
  });

  it("takes ?selected out of the address, keeping the other keys", async () => {
    await mountProvider({ path: "/p", search: "selected=3&y=2" });
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    expect(routerSpies.replace, "?selected was not removed").toHaveBeenCalledWith("/sy-en/p?y=2");
  });

  it("takes a lone ?selected out and leaves the bare path", async () => {
    await mountProvider({ path: "/p", search: "selected=3" });
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    expect(routerSpies.replace, "a lone ?selected left a '?'").toHaveBeenCalledWith("/sy-en/p");
  });
});

describe("the back button over a popup", () => {
  const popState = (state: any) =>
    act(async () => {
      window.dispatchEvent(new PopStateEvent("popstate", { state }));
    });

  it("ignores a back-press on a normal history entry", async () => {
    await mountProvider();
    await popState({});
    expect(popup.markBackClosing, "a normal back-press was treated as closing a popup").not.toHaveBeenCalled();
  });

  it("leaves the popup below alone when a popup closed itself", async () => {
    popup.takeSelfConsume.mockReturnValue(true);
    await mountProvider();
    await popState({ isPopup: true });
    expect(popup.markBackClosing, "a self-closed popup was handled as a user back-press").not.toHaveBeenCalled();
  });

  it("closes every popup and strips the popup keys from the live address", async () => {
    const { store } = await mountProvider({ store: { cart_enable: true } });
    window.history.pushState({}, "", "/sy-en/settings?cart=true&modal=1&story=2&search=x&keep=1");
    await popState({ isPopup: true });
    expect(popup.markBackClosing, "the back-press was not marked as a popup close").toHaveBeenCalled();
    expect(routerSpies.push, "the popup keys were not stripped from the live address").toHaveBeenCalledWith(
      "/sy-en/settings?keep=1",
      { shallow: true },
    );
    expect(store.getState().cart_enable, "the cart stayed open after back").toBe(false);
    expect(tiny.EnableScroll, "the page scroll was not given back").toHaveBeenCalled();
    expect(
      store.getState().selected_product_for_add_to_cart,
      "the add-to-cart sheet stayed open after back",
    ).toBeNull();
  });

  it("goes to the bare path when only popup keys were in the address", async () => {
    await mountProvider();
    window.history.pushState({}, "", "/sy-en/settings?cart=true");
    await popState({ isPopup: true });
    expect(routerSpies.push, "a popup-only address kept a '?'").toHaveBeenCalledWith("/sy-en/settings", {
      shallow: true,
    });
  });

  it("stops listening once it is unmounted", async () => {
    const { unmount } = await mountProvider();
    unmount();
    await popState({ isPopup: true });
    expect(popup.markBackClosing, "the listener outlived the provider").not.toHaveBeenCalled();
  });
});

describe("the cart slider", () => {
  it("moves on to checkout, reports it, and comes back to the cart", async () => {
    await mountProvider({
      store: {
        cart_enable: true,
        total_cash: 30,
        cart: [
          { product_id: 1, name: "Shirt", offer_price: 10, quantity: 1, variant: "M" },
          { product_id: 2, name: "Hat", offer_price: 20, quantity: 1 },
        ],
      },
    });
    await userEvent.click(await screen.findByText("to-orders"));
    expect(screen.getByTestId("slider").dataset.step, "the slider did not move to checkout").toBe("1");
    const checkout = GAevent.mock.calls.find((c) => c[0].params?.items)?.[0];
    expect(
      checkout?.params.items.map((i: any) => i.item_variant),
      "begin_checkout did not carry each item's variant",
    ).toEqual(["M", "N/A"]);
    expect(funnel.startOrderAttempt, "no order attempt was started").toHaveBeenCalled();
    expect(funnel.trackOrder.mock.calls[0]?.[1], "the funnel did not get the value and count").toEqual({
      value: 30,
      item_count: 2,
    });

    await userEvent.click(await screen.findByText("back-to-cart"));
    expect(screen.getByTestId("slider").dataset.step, "the slider did not come back to the cart").toBe("0");
  });

  it("closes the cart from inside the cart page", async () => {
    const { store } = await mountProvider({ store: { cart_enable: true } });
    await userEvent.click(await screen.findByText("close-cart"));
    expect(store.getState().cart_enable, "closing from the cart page left the cart open").toBe(false);
    expect(screen.queryByTestId("slider"), "the slider stayed on screen").toBeNull();
  });
});

describe("the add-to-cart sheet", () => {
  it.each([
    [{ slug: "s", active_color: "red" }, "", "red"],
    [{ slug: "s" }, "color=blue", "blue"],
    [{ slug: "s", sync_color_images: [{ color_option: "green" }] }, "", "green"],
    [{ slug: "s", sync_color_images: [{ color_name: "pink" }] }, "", "pink"],
  ])("opens for %j with the colour %s → %s", async (product, search, expected) => {
    await mountProvider({ search, store: { selected_product_for_add_to_cart: product } });
    const sheet = screen.getByTestId("add-to-cart");
    expect(sheet.dataset.color, "the sheet opened on the wrong colour").toBe(expected);
    expect(sheet.dataset.slug, "the sheet was not given the product slug").toBe("s");
  });
});

describe("the external payment frame", () => {
  it("opens on the URL the store gives, stops loading when the frame loads, and closes", async () => {
    await mountProvider();
    expect(screen.queryByTestId("pay-frame"), "the frame showed before it was asked for").toBeNull();
    await act(async () => {
      useAppStore.getState().setCryptoCardPayment({ url: "https://pay.example/x" });
    });
    const frame = screen.getByTestId("pay-frame");
    expect(frame.dataset.url, "the frame did not open on the payment URL").toBe("https://pay.example/x");
    expect(frame.dataset.loading, "the frame did not start in its loading state").toBe("true");
    await userEvent.click(screen.getByText("frame-loaded"));
    expect(
      screen.getByTestId("pay-frame").dataset.loading,
      "the frame kept loading after it loaded",
    ).toBe("false");
    await userEvent.click(screen.getByText("close-frame"));
    await waitFor(() =>
      expect(screen.queryByTestId("pay-frame"), "the frame did not close").toBeNull(),
    );
  });
});
