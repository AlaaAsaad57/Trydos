import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";
import { restoreLocation, stubLocation } from "../../mocks/location";

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<any>, options: any) => {
    loader();
    return (props: any) => (
      <div data-testid="notifications">
        {options.loading()}
        <button onClick={props.onClose}>close panel</button>
        <button onClick={props.closeWindow}>close window</button>
      </div>
    );
  },
}));
vi.mock("components/Notifications/NotificationsPanel", () => ({ default: () => null }));
vi.mock("components/skeleton/NotificationSkeleton", () => ({
  default: () => <div data-testid="notifications-skeleton" />,
}));
vi.mock("components/global/NextLink", () => ({
  default: ({ href, onClick, children, ...rest }: any) => (
    <a href={href} data-pw={rest["data-pw"]} onClick={(e) => { e.preventDefault(); onClick(); }}>
      {children}
    </a>
  ),
}));

let finishClear: () => void = () => {};
const clearAllUserData = vi.fn(() => new Promise<void>((resolve) => (finishClear = resolve)));
vi.mock("utils/tinyUtils", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  clearAllUserData: () => clearAllUserData(),
}));

import Menu from "components/Home/Menu";

describe("Menu", () => {
  beforeEach(() => {
    clearAllUserData.mockClear();
  });
  afterEach(() => {
    restoreLocation();
  });

  it("links to settings and compare, and each link closes the menu", async () => {
    const setMenuOpen = vi.fn();
    const { container } = await renderWithProviders(<Menu user={null} setMenuOpen={setMenuOpen} isRtl={false} />);
    const settings = container.querySelector('[data-pw="Settings-Icon"]')!;
    expect(settings.getAttribute("href"), "Settings links to the wrong page").toBe("/gb-en/settings");
    fireEvent.click(settings);
    fireEvent.click(container.querySelector('[data-pw="Compare-Icon"]')!);
    expect(setMenuOpen.mock.calls, "each link should close the menu").toEqual([[false], [false]]);
    expect(container.querySelector('[data-pw="logout"]'), "a guest was offered Logout").toBeNull();
    expect((container.querySelector("svg") as SVGElement).style.marginRight, "an English icon sits on the wrong side").toBe("8px");
  });

  it("shows the current page as a plain item, not a link, in Arabic", async () => {
    const { container } = await renderWithProviders(<Menu user={null} setMenuOpen={() => {}} isRtl />, {
      path: "/settings",
    });
    expect(container.querySelector('[data-pw="Settings-Icon"]')!.tagName, "the current page should not be a link").toBe("DIV");
    expect((container.querySelector("svg") as SVGElement).style.marginLeft, "an Arabic icon sits on the wrong side").toBe("8px");
  });

  it("opens and closes the notifications panel, and closes the menu from inside it", async () => {
    const setMenuOpen = vi.fn();
    const { container } = await renderWithProviders(<Menu user={null} setMenuOpen={setMenuOpen} isRtl={false} />);
    fireEvent.click(container.querySelector('[data-pw="Notifications-Icon"]')!);
    expect(screen.getByTestId("notifications"), "the notifications panel did not open").toBeInTheDocument();
    expect(screen.getByTestId("notifications-skeleton"), "the panel shows no skeleton while it loads").toBeInTheDocument();
    fireEvent.click(screen.getByText("close window"));
    expect(setMenuOpen, "the panel could not close the menu").toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByText("close panel"));
    expect(screen.queryByTestId("notifications"), "the panel did not close").toBeNull();
  });

  it("closes when the backdrop is tapped", async () => {
    const setMenuOpen = vi.fn();
    const { container } = await renderWithProviders(<Menu user={null} setMenuOpen={setMenuOpen} isRtl={false} />);
    fireEvent.click(container.querySelector(".fixed")!);
    expect(setMenuOpen, "tapping outside did not close the menu").toHaveBeenCalledWith(false);
  });

  it("hides Logout for a shopper with no phone or phone 0", async () => {
    const a = await renderWithProviders(<Menu user={{}} setMenuOpen={() => {}} isRtl={false} />);
    expect(a.container.querySelector('[data-pw="logout"]'), "Logout showed without a phone").toBeNull();
    a.unmount();
    const b = await renderWithProviders(<Menu user={{ phone: "0" }} setMenuOpen={() => {}} isRtl={false} />);
    expect(b.container.querySelector('[data-pw="logout"]'), "Logout showed for phone 0").toBeNull();
  });

  it("logs out once, resets the session and reloads the page", async () => {
    const setLoggingOut = vi.fn();
    const cancelAuth = vi.fn();
    const { container } = await renderWithProviders(
      <Menu user={{ phone: "0999" }} setMenuOpen={() => {}} isRtl={false} />,
      { store: { setLoggingOut, cancelAuth } },
    );
    const location = stubLocation({ pathname: "/gb-en/products/x" });
    const logout = container.querySelector('[data-pw="logout"]')!;
    fireEvent.click(logout);
    await waitFor(() => expect(container.querySelector('[data-pw="logout"] .spinner, [data-pw="logout"] div'), "no spinner while logging out").not.toBeNull());
    fireEvent.click(logout);
    expect(clearAllUserData, "a second tap started a second logout").toHaveBeenCalledTimes(1);
    expect(setLoggingOut, "the store was not told a logout started").toHaveBeenCalledWith(true);
    await act(async () => finishClear());
    expect(cancelAuth, "the store auth state was not reset in full").toHaveBeenCalledWith();
    expect(location.reload, "the page did not reload after logout").toHaveBeenCalled();
  });

  it.each(["/gb-en/seller/1", "/gb-en/settings"])("sends the shopper to the storefront after logout from %s", async (path) => {
    const { container } = await renderWithProviders(
      <Menu user={{ phone: "0999" }} setMenuOpen={() => {}} isRtl={false} />,
      { store: { setLoggingOut: vi.fn(), cancelAuth: vi.fn() } },
    );
    const location = stubLocation({ pathname: path });
    fireEvent.click(container.querySelector('[data-pw="logout"]')!);
    await act(async () => finishClear());
    expect(location.href, "logout from a private page did not go to the storefront").toBe("/gb-en");
    expect(location.reload, "logout from a private page reloaded it instead").not.toHaveBeenCalled();
  });
});
