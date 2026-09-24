import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";
import { routerSpies } from "../../mocks/nextNavigation";

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<any>) => {
    loader();
    return () => <div data-testid="name-modal" />;
  },
}));
vi.mock("components/global/NameModal", () => ({ default: () => null }));

const showErrorNotification = vi.fn();
vi.mock("@/store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: (...a: any[]) => showErrorNotification(...a),
}));

const deleteCookie = vi.fn();
vi.mock("utils/cookies/cookie-manager", async () => {
  const { makeCookieManagerMock } = await import("../../mocks/cookieManager");
  return { ...makeCookieManagerMock(), deleteCookie: (...a: any[]) => deleteCookie(...a) };
});

const EnableScroll = vi.fn();
vi.mock("utils/tinyUtils", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  EnableScroll: () => EnableScroll(),
}));

const getUserStories = vi.fn();
vi.mock("services/story", () => ({ default: { getUserStories: () => getUserStories() } }));

const cookieSet = vi.fn();
vi.mock("js-cookie", () => ({ default: { set: (...a: any[]) => cookieSet(...a) } }));

import Home from "components/Home";

describe("Home", () => {
  beforeEach(() => {
    showErrorNotification.mockReset();
    deleteCookie.mockReset();
    getUserStories.mockReset();
    cookieSet.mockReset();
  });

  it("resets navigation state on mount and stores the stories token for a stories user", async () => {
    getUserStories.mockReturnValue({ id: 5, access_token: "stories-token" });
    const setIsNavigating = vi.fn();
    const setIsProductPage = vi.fn();
    await renderWithProviders(<Home />, { store: { setIsNavigating, setIsProductPage } });
    expect(deleteCookie, "the last-page cookie was not cleared").toHaveBeenCalledWith("last-page");
    expect(setIsNavigating, "the navigating flag was not reset").toHaveBeenCalledWith(null);
    expect(setIsProductPage, "the product-page flag was not reset").toHaveBeenCalledWith(false);
    expect(EnableScroll, "scrolling was not turned back on").toHaveBeenCalled();
    await waitFor(() => expect(cookieSet.mock.calls[0]?.[0], "the stories token was not stored").toBe("token"));
    expect(routerSpies.push, "the address changed with no message in it").not.toHaveBeenCalled();
  });

  it("does not store a stories token for a shopper with no stories account", async () => {
    getUserStories.mockReturnValue(null);
    await renderWithProviders(<Home />);
    await new Promise((r) => setTimeout(r, 0));
    expect(cookieSet, "a token was stored with no stories account").not.toHaveBeenCalled();
  });

  it("shows 'Product not found' and strips only the message from the address", async () => {
    await renderWithProviders(<Home />, { search: "message=product_not_found&tab=2" });
    expect(showErrorNotification, "the missing-product message was not shown").toHaveBeenCalledWith("Product not found");
    expect(routerSpies.push, "the message was not stripped from the address").toHaveBeenCalledWith("/gb-en?tab=2", { shallow: true });
  });

  it("shows 'Boutique not found' and leaves a clean address", async () => {
    await renderWithProviders(<Home />, { search: "message=boutique_not_found" });
    expect(showErrorNotification, "the missing-boutique message was not shown").toHaveBeenCalledWith("Boutique not found");
    expect(routerSpies.push, "the address was not cleaned").toHaveBeenCalledWith("/gb-en", { shallow: true });
  });

  it("strips an unknown message without a toast", async () => {
    await renderWithProviders(<Home />, { search: "message=other" });
    expect(showErrorNotification, "an unknown message showed a toast").not.toHaveBeenCalled();
    expect(routerSpies.push, "the unknown message was not stripped").toHaveBeenCalled();
  });

  it("asks a chat and stories user with no name for one", async () => {
    await renderWithProviders(<Home />, {
      store: { nameModal: true, userChat: { id: 1 }, userStories: { id: 2 }, userProfile: { name: "" } },
    });
    expect(screen.getByTestId("name-modal"), "the name prompt did not open").toBeInTheDocument();
  });

  it("does not ask a named shopper for a name", async () => {
    await renderWithProviders(<Home />, {
      store: { nameModal: true, userChat: { id: 1 }, userStories: { id: 2 }, userProfile: { name: "Sara" } },
    });
    expect(screen.queryByTestId("name-modal"), "a named shopper was asked for a name").toBeNull();
  });
});
