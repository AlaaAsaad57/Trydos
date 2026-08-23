// The prompt a verified shopper meets when their session could not be renewed.
//
// By the time it is on screen the dead session is already gone and a fresh
// guest has been registered, so the app behind it works. The widget's whole job
// is the two answers: sign in again, or carry on as a guest — and each one has
// to leave the store and the page in a state the rest of the app agrees with.
// Both are one click that no other test covers.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("utils/gtag", () => ({
  GAevent: vi.fn(),
  pageview: vi.fn(),
}));

import { useAppStore } from "store";
import SessionExpiredWidget from "components/Login/SessionExpiredWidget";

import { restoreLocation, stubLocation, type LocationStub } from "../../mocks/location";
import { renderWithProviders, screen, userEvent } from "../../render";

let location: LocationStub;

beforeEach(() => {
  location = stubLocation({ pathname: "/gb-en" });
});

afterEach(() => {
  restoreLocation();
  vi.clearAllMocks();
});

describe("choosing to sign in again", () => {
  it("opens the phone-verify flow, marked as a session that expired", async () => {
    const user = userEvent.setup();
    await renderWithProviders(<SessionExpiredWidget />);

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      useAppStore.getState().shouldAuthinticated,
      "the marker is what puts the verify flow up, and 'expired-login' is what " +
        "tells it to reuse the number the dead session was signed in with",
    ).toBe("expired-login");
  });

  it("marks a shopper on the seller dashboard as a seller instead", async () => {
    location = stubLocation({ pathname: "/gb-en/seller/products" });
    const user = userEvent.setup();
    await renderWithProviders(<SessionExpiredWidget />);

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      useAppStore.getState().shouldAuthinticated,
      "the dashboard has its own dismissal rules — a guest cannot stay on it, " +
        "so the flow has to know where it was opened",
    ).toBe("seller");
  });

  it("leaves the parked requests waiting rather than failing them", async () => {
    const user = userEvent.setup();
    // What the refresh flow leaves behind when it gives up and puts this
    // prompt on screen: requests that stopped on a 401 are still holding.
    await renderWithProviders(<SessionExpiredWidget />, {
      store: { reAuthResult: "pending" },
    });

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      useAppStore.getState().reAuthResult,
      "requests that stopped on a 401 are waiting on this answer — settling it " +
        "here would fail them while the shopper is still signing in",
    ).toBe("pending");
    expect(
      location.reload,
      "and the page must stay as it is, or the sign-in the shopper just chose " +
        "is thrown away before it starts",
    ).not.toHaveBeenCalled();
  });
});

describe("choosing to carry on as a guest", () => {
  it("settles the waiting requests as cancelled", async () => {
    const user = userEvent.setup();
    await renderWithProviders(<SessionExpiredWidget />);

    await user.click(screen.getByRole("button", { name: "Continue as Guest" }));

    expect(
      useAppStore.getState().reAuthResult,
      "anything parked on a 401 must be told the shopper is not signing in, or " +
        "it waits for an answer that will never come",
    ).toBe("cancelled");
    expect(
      useAppStore.getState().shouldAuthinticated,
      "and the prompt must come down",
    ).toBe(false);
  });

  it("reloads, so the page stops showing the account that is gone", async () => {
    const user = userEvent.setup();
    await renderWithProviders(<SessionExpiredWidget />);

    await user.click(screen.getByRole("button", { name: "Continue as Guest" }));

    expect(
      location.reload,
      "the server already moved to a fresh guest — without a reload the page " +
        "keeps rendering the old account's name, cart and orders",
    ).toHaveBeenCalledTimes(1);
    expect(
      location.href,
      "and it is a reload, not a trip to the home page: the shopper stays " +
        "where they were",
    ).toBeNull();
  });

  it("sends a guest off the seller dashboard instead of reloading it", async () => {
    location = stubLocation({ pathname: "/gb-en/seller/products" });
    const user = userEvent.setup();
    await renderWithProviders(<SessionExpiredWidget />);

    await user.click(screen.getByRole("button", { name: "Continue as Guest" }));

    expect(
      location.href,
      "a guest has no dashboard — reloading it would land them on a page that " +
        "cannot load anything",
    ).toBe("/");
    expect(
      location.reload,
      "and the reload must not also fire, or the redirect races it",
    ).not.toHaveBeenCalled();
  });
});

describe("what the prompt says", () => {
  it("tells the shopper why they are being asked", async () => {
    await renderWithProviders(<SessionExpiredWidget />);

    expect(
      screen.getByText("Your session has expired"),
      "the shopper did nothing wrong and needs to know that — an unexplained " +
        "sign-in prompt reads as the account being lost",
    ).toBeInTheDocument();
  });

  it("speaks the language the shopper is browsing in", async () => {
    const dictionary = (
      await import("public/translations/translations.ar.js")
    ).default as Record<string, string>;

    // `utils/functions` reads the language out of the address bar, so the
    // stand-in address has to be the one the render puts the browser on.
    stubLocation({ pathname: "/gb-ar" });
    await renderWithProviders(<SessionExpiredWidget />, { language: "ar" });

    expect(
      screen.getByText(dictionary["Your session has expired"]),
      "the widget reads the language off the store, not off its props — an " +
        "English prompt over an Arabic page is the one screen a shopper cannot " +
        "skip",
    ).toBeInTheDocument();
  });
});
