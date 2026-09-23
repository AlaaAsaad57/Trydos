// The "More Options" panel on a product: notification topics (Firebase push
// through the market backend), the checklist (wishlist service) and compare
// (two cookies, f_p and s_p).
import { beforeEach, describe, expect, it, vi } from "vitest";

import MoreOptionsSection from "components/products/MoreOptionsSection";

import { fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const { home, wishlist, cookies } = vi.hoisted(() => ({
  home: {
    AllowNotifications: vi.fn(),
    UnsubscribeToTopicInventory: vi.fn(),
    subscribeToTopicInventory: vi.fn(),
    GetFireBaseSettings: vi.fn(),
  },
  wishlist: {
    isInWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
    addToWishlist: vi.fn(),
  },
  cookies: {} as Record<string, string | undefined>,
}));
vi.mock("services/home", () => ({ default: home }));

const getNotificationsTypes = vi.fn();
vi.mock("services/notifications", () => ({
  getNotificationsTypes: (...a: any[]) => getNotificationsTypes(...a),
}));

vi.mock("services/wishlist", () => ({ wishlistService: wishlist }));

const GAevent = vi.fn();
vi.mock("utils/gtag", () => ({ GAevent: (...a: any[]) => GAevent(...a) }));
vi.mock("services/auth", () => ({ default: { UserID: () => 77 } }));

vi.mock("utils/cookies/cookie-manager", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  getCookie: (name: string) => cookies[name],
}));

const addToCompare = vi.fn();
const removeFromCompare = vi.fn();
const logError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  addToCompare: (...a: any[]) => addToCompare(...a),
  removeFromCompare: (...a: any[]) => removeFromCompare(...a),
  LogError: (...a: any[]) => logError(...a),
}));

const showSuccessNotification = vi.fn();
const showErrorNotification = vi.fn();
vi.mock("@/store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showSuccessNotification: (...a: any[]) => showSuccessNotification(...a),
  showErrorNotification: (...a: any[]) => showErrorNotification(...a),
}));

const PRODUCT = {
  id: 5,
  slug: "shoe",
  name: "Shoe",
  price: 10,
  offer_price: 8,
  brand: { id: 1, name: "B" },
  category: { id: 2, name: "C" },
  categories: [{ id: 3, name: "C3" }],
};

const TYPES = [
  { topic: "price", showed_name: "Price drops" },
  { topic: "stock", showed_name: "Back in stock" },
];

function storeWith(extra: any = {}) {
  return {
    NotificationsType: TYPES,
    setNotificationsType: vi.fn(),
    enableNotification: vi.fn(),
    disableNotification: vi.fn(),
    firebaseSettings: { subscribed_topics: [{ topic: "stock_5" }] },
    ...extra,
  };
}

async function renderPanel(store: any = storeWith(), product: any = PRODUCT, language: any = "en") {
  const view = await renderWithProviders(<MoreOptionsSection product={product} />, {
    store,
    language,
  });
  // The panel ignores clicks while it loads the Firebase settings.
  await waitFor(() =>
    expect(document.querySelector(".extended-bar-top .ml-1"), "the panel never finished loading").toBeNull(),
  );
  return { ...view, store };
}

describe("MoreOptionsSection", () => {
  beforeEach(() => {
    for (const fn of Object.values(home)) fn.mockReset();
    for (const fn of Object.values(wishlist)) fn.mockReset();
    [getNotificationsTypes, GAevent, addToCompare, removeFromCompare, logError, showSuccessNotification, showErrorNotification].forEach((f) => f.mockReset());
    for (const k of Object.keys(cookies)) delete cookies[k];
    home.GetFireBaseSettings.mockResolvedValue({});
    wishlist.isInWishlist.mockResolvedValue(false);
  });

  it("loads the topic list from the notifications backend when the store has none", async () => {
    getNotificationsTypes.mockResolvedValue({ data: { notification_types: TYPES } });
    const { store } = await renderPanel(storeWith({ NotificationsType: [] }));
    await waitFor(() =>
      expect(store.setNotificationsType, "the loaded topics were not stored").toHaveBeenCalledWith(TYPES),
    );
    expect(document.querySelector('[data-pw="notify-type"]'), "topics showed before loading").toBeNull();
  });

  it("marks an already-subscribed topic and unsubscribes it on click", async () => {
    home.UnsubscribeToTopicInventory.mockResolvedValue({ success: true });
    const { store } = await renderPanel(storeWith(), PRODUCT, "ar");
    const stock = screen.getByText("Back in stock");
    expect(stock.className, "a subscribed topic is not shown green").toContain("bg-green-300");
    expect(screen.getByText("Price drops").className, "an unsubscribed topic is shown green").not.toContain(
      "bg-green-300",
    );
    fireEvent.click(stock);
    await waitFor(() =>
      expect(store.disableNotification, "the topic was not turned off locally").toHaveBeenCalledWith("stock_5"),
    );
    expect(home.UnsubscribeToTopicInventory, "the market backend was not told").toHaveBeenCalledWith({
      topic: "stock_5",
    });
  });

  it("shows the backend's reason when unsubscribing is refused", async () => {
    home.UnsubscribeToTopicInventory.mockResolvedValue({ success: false, message: "nope" });
    const { store } = await renderPanel();
    fireEvent.click(screen.getByText("Back in stock"));
    await waitFor(() =>
      expect(showErrorNotification, "a refused unsubscribe did not warn").toHaveBeenCalledWith("nope"),
    );
    expect(store.disableNotification, "a refused unsubscribe still turned the topic off").not.toHaveBeenCalled();
  });

  it("subscribes a new topic and records the analytics event", async () => {
    home.AllowNotifications.mockResolvedValue("fcm-token");
    home.subscribeToTopicInventory.mockResolvedValue({ success: true });
    const { store } = await renderPanel();
    fireEvent.click(screen.getByText("Price drops"));
    await waitFor(() =>
      expect(store.enableNotification, "the topic was not turned on").toHaveBeenCalledWith("price_5"),
    );
    expect(GAevent, "the notification event was not sent").toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ item_id: 5, category_id: 3, price: 8, user_id_custom: 77 }),
      }),
    );
  });

  it("refuses to subscribe without a push token", async () => {
    home.AllowNotifications.mockResolvedValue(undefined);
    const { store } = await renderPanel();
    fireEvent.click(screen.getByText("Price drops"));
    await waitFor(() =>
      expect(showErrorNotification, "no token did not warn").toHaveBeenCalledWith(
        "Notification Is Not Enabled! please Allow Notification Access",
      ),
    );
    expect(home.subscribeToTopicInventory, "a subscribe was sent without a token").not.toHaveBeenCalled();
    expect(store.enableNotification, "the topic turned on without a token").not.toHaveBeenCalled();
  });

  it("warns when subscribing is refused, and falls back to the default text", async () => {
    home.AllowNotifications.mockResolvedValue("t");
    home.subscribeToTopicInventory.mockResolvedValue({ success: false, message: "full" });
    await renderPanel();
    fireEvent.click(screen.getByText("Price drops"));
    await waitFor(() =>
      expect(showErrorNotification, "a refused subscribe did not warn").toHaveBeenCalledWith("full"),
    );

    showErrorNotification.mockReset();
    home.AllowNotifications.mockRejectedValue(null);
    fireEvent.click(screen.getByText("Price drops"));
    await waitFor(() =>
      expect(showErrorNotification, "an error with no message did not use the default text").toHaveBeenCalledWith(
        "Notification Is Not Enabled! please Allow Notification Access",
      ),
    );
  });

  it("ignores a second topic click while one is in flight", async () => {
    let finish: (v: any) => void = () => {};
    home.AllowNotifications.mockReturnValue(new Promise((r) => (finish = r)));
    await renderPanel();
    fireEvent.click(screen.getByText("Price drops"));
    fireEvent.click(screen.getByText("Price drops"));
    expect(home.AllowNotifications, "a second click started a second request").toHaveBeenCalledTimes(1);
    finish(undefined);
  });

  it("adds to and removes from the checklist", async () => {
    await renderPanel();
    const button = document.querySelector('[data-pw="add-checkList"]') as HTMLElement;
    fireEvent.click(button);
    await waitFor(() =>
      expect(showSuccessNotification, "adding did not confirm").toHaveBeenCalledWith("Added to checklist"),
    );
    expect(wishlist.addToWishlist, "the product was not added").toHaveBeenCalledWith(5);
    expect(button.className, "the checklist button is not green after adding").toContain("bg-green-300");
    expect(GAevent, "the favourite event was not sent").toHaveBeenCalled();

    wishlist.isInWishlist.mockResolvedValue(true);
    GAevent.mockReset();
    fireEvent.click(button);
    await waitFor(() =>
      expect(showSuccessNotification, "removing did not confirm").toHaveBeenCalledWith("Removed from checklist"),
    );
    expect(wishlist.removeFromWishlist, "the product was not removed").toHaveBeenCalledWith("5");
    expect(GAevent, "removing sent a favourite event").not.toHaveBeenCalled();
  });

  it("warns when the checklist fails, and logs a failed status read", async () => {
    wishlist.isInWishlist.mockRejectedValue(new Error("down"));
    await renderPanel();
    await waitFor(() => expect(logError, "a failed status read was not logged").toHaveBeenCalled());
    fireEvent.click(document.querySelector('[data-pw="add-checkList"]') as HTMLElement);
    await waitFor(() =>
      expect(showErrorNotification, "a failed checklist update did not warn").toHaveBeenCalledWith(
        "Failed to update checklist",
      ),
    );
  });

  it("does nothing on the checklist for a product without an id", async () => {
    await renderPanel(storeWith(), { slug: "x" });
    fireEvent.click(document.querySelector('[data-pw="add-checkList"]') as HTMLElement);
    expect(wishlist.isInWishlist, "a product with no id asked the wishlist").not.toHaveBeenCalled();
  });

  it("adds to compare, warns when it replaces the first product, and removes", async () => {
    cookies.f_p = "a";
    cookies.s_p = "b";
    await renderPanel();
    const compare = document.querySelector('[data-pw="add-compare"]') as HTMLElement;
    expect(compare.textContent, "compare did not start as not added").toBe("Add To Compare");
    fireEvent.click(compare);
    expect(addToCompare, "the slug was not added").toHaveBeenCalledWith("shoe");
    expect(showSuccessNotification, "a full compare did not say it replaced").toHaveBeenCalledWith(
      "Compare was full — replaced the first product. Click To Go To Compare Page",
      5000,
      "/gb-en/compare",
    );
    expect(compare.textContent, "compare does not say added").toBe("Added To Compare");

    fireEvent.click(compare);
    expect(removeFromCompare, "the slug was not removed").toHaveBeenCalledWith("shoe");
    expect(showSuccessNotification, "removing did not confirm").toHaveBeenCalledWith("Removed From Compare");
  });

  it("reads compare from the cookies on focus and on the compare event", async () => {
    await renderPanel();
    const compare = document.querySelector('[data-pw="add-compare"]') as HTMLElement;
    cookies.s_p = "shoe";
    fireEvent(window, new Event("focus"));
    await waitFor(() => expect(compare.textContent, "focus did not re-read compare").toBe("Added To Compare"));
    delete cookies.s_p;
    fireEvent(window, new Event("compare-changed"));
    await waitFor(() => expect(compare.textContent, "the compare event did not re-read").toBe("Add To Compare"));
    fireEvent.click(compare);
    expect(showSuccessNotification, "a free compare slot said it replaced").toHaveBeenCalledWith(
      "Added To Compare! Click To Go To Compare Page",
      5000,
      "/gb-en/compare",
    );
  });
});
