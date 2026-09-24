import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";
import { routerSpies } from "../../mocks/nextNavigation";

const home = vi.hoisted(() => ({ CheckLogin: vi.fn(), AllowNotifications: vi.fn() }));
vi.mock("services/home", () => ({ default: home }));

const GetCountries = vi.fn();
vi.mock("serverRequests/product", () => ({ GetCountries: (...a: any[]) => GetCountries(...a) }));

const installGlobalErrorListeners = vi.fn();
vi.mock("utils/globalErrorListeners", () => ({
  installGlobalErrorListeners: () => installGlobalErrorListeners(),
}));

const posthog = vi.hoisted(() => ({ posthogInit: vi.fn(), posthogIdentify: vi.fn() }));
vi.mock("utils/posthog", () => posthog);

let userId: string | null = null;
vi.mock("services/auth", () => ({ default: { UserID: () => userId } }));

const showErrorNotification = vi.fn();
vi.mock("@/store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: (...a: any[]) => showErrorNotification(...a),
}));

const LogError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => LogError(...a),
}));

vi.mock("utils/PopupCountry", () => ({
  default: (p: any) => (
    <div
      data-testid="country-popup"
      data-changed={String(p.forChanged)}
      data-no-country={String(p.noCountry)}
      data-options={JSON.stringify(p.options)}
    />
  ),
}));
vi.mock("components/global/NotificationWidget", () => ({
  default: ({ onAllow, onDismiss }: any) => (
    <div data-testid="notification-widget">
      <button onClick={onAllow}>allow</button>
      <button onClick={onDismiss}>dismiss</button>
    </div>
  ),
}));

import Init from "components/Home/Init";

const flush = () => act(async () => {
  await new Promise((r) => setTimeout(r, 0));
});

describe("Init", () => {
  beforeEach(() => {
    userId = null;
    home.CheckLogin.mockReset();
    home.AllowNotifications.mockReset();
    GetCountries.mockReset();
    posthog.posthogInit.mockReset();
    posthog.posthogIdentify.mockReset();
    showErrorNotification.mockReset();
    LogError.mockReset();
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window.navigator as any).cookieEnabled;
  });

  it("checks the session on start, refreshes the page after a token rotation, and installs the error listeners", async () => {
    home.CheckLogin.mockResolvedValue(true);
    await renderWithProviders(<Init />, { country: "sy" });
    await flush();
    expect(routerSpies.refresh, "a rotated session did not refetch the server parts").toHaveBeenCalled();
    expect(installGlobalErrorListeners, "the global error listeners were not installed").toHaveBeenCalled();
    expect(screen.queryByTestId("country-popup"), "a known country still got the country picker").toBeNull();
    expect(posthog.posthogInit, "the session recorder did not start for a guest").toHaveBeenCalled();
    expect(posthog.posthogIdentify, "a guest was identified").not.toHaveBeenCalled();
  });

  it("does not refresh when the session was not rotated", async () => {
    home.CheckLogin.mockResolvedValue(false);
    await renderWithProviders(<Init />, { country: "sy" });
    await flush();
    expect(routerSpies.refresh, "the page refreshed without a token rotation").not.toHaveBeenCalled();
  });

  it("offers the country picker on the gb placeholder and reads the countries from the server once", async () => {
    GetCountries.mockResolvedValue([{ iso: "sy", name: "Syria" }]);
    await renderWithProviders(<Init />);
    await flush();
    expect(GetCountries, "the country list was asked for the wrong locale").toHaveBeenCalledWith({ country: "gb", language: "en" });
    const popup = screen.getByTestId("country-popup");
    expect(popup.dataset.noCountry, "the gb placeholder is not treated as no country").toBe("true");
    expect(JSON.parse(popup.dataset.options!), "the picker got the wrong options").toEqual([{ label: "Syria", value: "sy" }]);
    expect(sessionStorage.getItem("countries-gb-en"), "the country list was not kept for the session").toBe(
      JSON.stringify([{ iso: "sy", name: "Syria" }]),
    );
  });

  it("uses the country list kept for the session instead of asking again", async () => {
    sessionStorage.setItem("countries-gb-en", JSON.stringify([{ iso: "iq", name: "Iraq" }]));
    await renderWithProviders(<Init />);
    await flush();
    expect(GetCountries, "the server was asked again for a kept list").not.toHaveBeenCalled();
    expect(JSON.parse(screen.getByTestId("country-popup").dataset.options!), "the kept list was not used").toEqual([
      { label: "Iraq", value: "iq" },
    ]);
  });

  it("logs a country list that cannot be read", async () => {
    GetCountries.mockRejectedValue(new Error("core down"));
    await renderWithProviders(<Init />);
    await flush();
    expect(LogError.mock.calls[0]?.[0].scenario, "a failed country read was not logged").toBe("Init: the country list could not be read");
  });

  it("offers the picker after a country change and strips the cart flag from the address", async () => {
    GetCountries.mockResolvedValue([]);
    await renderWithProviders(<Init />, { country: "sy", search: "changed-country=1&cart=1&x=2" });
    await flush();
    expect(screen.getByTestId("country-popup").dataset.changed, "a country change did not reach the picker").toBe("1");
    expect(window.location.search, "the cart flag was not stripped").toBe("?changed-country=1&x=2");
  });

  it("offers the picker for no-country, leaving an address with no cart flag alone", async () => {
    GetCountries.mockResolvedValue([]);
    const replace = vi.spyOn(window.history, "replaceState");
    await renderWithProviders(<Init />, { country: "sy", search: "no-country=1" });
    await flush();
    expect(screen.getByTestId("country-popup").dataset.noCountry, "no-country did not reach the picker").toBe("1");
    expect(replace, "an address with nothing to strip was rewritten").not.toHaveBeenCalled();
    replace.mockRestore();
  });

  it("drops the address down to its path when the cart flag was the only one", async () => {
    GetCountries.mockResolvedValue([]);
    await renderWithProviders(<Init />, { search: "cart=1" });
    await flush();
    expect(window.location.search, "the lone cart flag was not stripped").toBe("");
  });

  it("strips the navigation flags from the address", async () => {
    await renderWithProviders(<Init />, { country: "sy", search: "_bypass=1&_t=2&keep=3" });
    await flush();
    expect(window.location.search, "the navigation flags were not stripped").toBe("?keep=3");
    await renderWithProviders(<Init />, { country: "sy", search: "_t=2" });
    await flush();
    expect(window.location.search, "a lone navigation flag was not stripped").toBe("");
  });

  it("warns when cookies are turned off", async () => {
    Object.defineProperty(window.navigator, "cookieEnabled", { value: false, configurable: true });
    await renderWithProviders(<Init />, { country: "sy" });
    expect(showErrorNotification, "no warning with cookies off").toHaveBeenCalledWith("Cookies Is Not Enabled");
  });

  it("identifies a signed-in shopper and turns notifications on when they are already granted", async () => {
    userId = "u-1";
    vi.stubGlobal("Notification", { permission: "granted" });
    home.AllowNotifications.mockResolvedValue(undefined);
    await renderWithProviders(<Init />, { country: "sy", store: { userProfile: { id: 7, name: "", mobilePhone: "" } } });
    await flush();
    expect(posthog.posthogIdentify, "the signed-in shopper was not identified").toHaveBeenCalledWith(7, { name: "Guest", phone: "null" });
    expect(home.AllowNotifications, "granted notifications were not turned on").toHaveBeenCalled();
  });

  it("identifies a named shopper, and logs a failed notification start", async () => {
    userId = "u-1";
    vi.stubGlobal("Notification", { permission: "granted" });
    home.AllowNotifications.mockRejectedValue(new Error("fcm down"));
    await renderWithProviders(<Init />, { country: "sy", store: { userProfile: { id: 7, name: "Sara", mobilePhone: "x" } } });
    await flush();
    expect(posthog.posthogIdentify, "the shopper's name was not sent").toHaveBeenCalledWith(7, { name: "Sara", phone: "x" });
    expect(LogError.mock.calls.map((c) => c[0].scenario), "a failed notification start was not logged").toContain("initPageLoad in Init");
  });

  it("does not turn notifications on without permission, nor on the country picker", async () => {
    userId = "u-1";
    vi.stubGlobal("Notification", { permission: "default" });
    await renderWithProviders(<Init />, { country: "sy" });
    await flush();
    vi.stubGlobal("Notification", { permission: "granted" });
    GetCountries.mockResolvedValue([]);
    await renderWithProviders(<Init />);
    await flush();
    expect(home.AllowNotifications, "notifications were turned on without permission or over the picker").not.toHaveBeenCalled();
  });

  it("skips identify for a signed-in id with no profile and no Notification API", async () => {
    userId = "u-1";
    await renderWithProviders(<Init />, { country: "sy", store: { userProfile: null } });
    await flush();
    expect(posthog.posthogIdentify, "identify ran with no profile").not.toHaveBeenCalled();
  });

  it("turns notifications on from the prompt, logs a failure, and closes the prompt", async () => {
    const setNotificationModal = vi.fn();
    home.AllowNotifications.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("fcm down"));
    await renderWithProviders(<Init />, { country: "sy", store: { isNotificationModal: true, setNotificationModal } });
    await act(async () => fireEvent.click(screen.getByText("allow")));
    expect(home.AllowNotifications, "Allow did not turn notifications on").toHaveBeenCalledTimes(1);
    await act(async () => fireEvent.click(screen.getByText("allow")));
    await waitFor(() =>
      expect(LogError.mock.calls.map((c) => c[0].scenario), "a failed Allow was not logged").toContain("onAllow in Init"),
    );
    fireEvent.click(screen.getByText("dismiss"));
    expect(setNotificationModal, "Dismiss did not close the prompt").toHaveBeenCalledWith(false);
  });

  // BUG-home-1: Init.tsx wraps `void (async () => { await posthogInit(...) … })()`
  // in a try/catch (lines 124-154). A try/catch cannot see the rejection of a
  // promise it does not await, so a failed PostHog start never reaches LogError
  // — it becomes an unhandled rejection instead.
  it("BUG-home-1: a failed PostHog start is logged", async () => {
    // Keep the rejection this bug produces out of the runner's own error count,
    // then put the runner's listeners back.
    const saved = process.listeners("unhandledRejection");
    process.removeAllListeners("unhandledRejection");
    const escaped: unknown[] = [];
    process.on("unhandledRejection", (reason) => escaped.push(reason));
    try {
      posthog.posthogInit.mockRejectedValue(new Error("posthog down"));
      await renderWithProviders(<Init />, { country: "sy" });
      await flush();
      await new Promise((r) => setTimeout(r, 10));
      expect(
        LogError.mock.calls.map((c) => c[0].scenario),
        "a PostHog start failure should be logged as 'Init PostHog in Init'",
      ).toContain("Init PostHog in Init");
    } finally {
      process.removeAllListeners("unhandledRejection");
      saved.forEach((l) => process.on("unhandledRejection", l as any));
    }
  });
});
