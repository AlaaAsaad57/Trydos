import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { restoreLocation, stubLocation } from "../../mocks/location";

// The logout row of the new profile screen (D-22, D-23). It does the real
// logout the old account menu did (`components/Home/Menu.tsx`, removed with the
// old top nav in Stage 3, Task 9): clear the session through
// `clearAllUserData` (which calls /api/auth/logout and posthogReset), reset the
// store's auth state, and send the shopper to the storefront.

const url = vi.hoisted(() => ({ pathname: "/sy-en/demo/settings", search: "" }));
const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => url.pathname,
  useSearchParams: () => new URLSearchParams(url.search),
  useRouter: () => router,
  useParams: () => ({ lang: "sy-en" }),
}));

let finishClear: () => void = () => {};
const clearAllUserData = vi.fn(
  () => new Promise<void>((resolve) => (finishClear = resolve)),
);
vi.mock("utils/tinyUtils", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  clearAllUserData: () => clearAllUserData(),
}));

import Demo1Shell from "components/DemoApp1/Demo1Shell";
import { useAppStore } from "store";

if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

/** The profile screen's "logout" row: the last of its 8 menu rows. */
const logoutRow = (container: HTMLElement) => {
  const row = container.querySelector<HTMLElement>('[data-pw="demo-menu-7"]');
  expect(row, "the profile screen has no logout row (demo-menu-7)").not.toBeNull();
  expect(row!.textContent, "demo-menu-7 is not the logout row").toMatch(/logout/i);
  return row!;
};

const setLoggingOut = vi.fn();
const cancelAuth = vi.fn();

beforeEach(() => {
  clearAllUserData.mockClear();
  setLoggingOut.mockClear();
  cancelAuth.mockClear();
  useAppStore.setState({ setLoggingOut, cancelAuth, LoggingOut: false } as any);
});

afterEach(() => {
  restoreLocation();
});

describe("the new profile screen's logout row", () => {
  it("logs a signed-in shopper out once, resets the session and goes to the storefront", async () => {
    useAppStore.setState({ userProfile: { phone: "0999" } } as any);
    const location = stubLocation({ pathname: "/sy-en/settings" });
    const { container } = render(<Demo1Shell dictionary={{}}>{null}</Demo1Shell>);

    const row = logoutRow(container);
    await act(async () => fireEvent.click(row));
    expect(setLoggingOut, "the store was not told a logout started").toHaveBeenCalledWith(true);
    expect(
      clearAllUserData,
      "the logout row did not clear the session (clearAllUserData: /api/auth/logout + posthogReset)",
    ).toHaveBeenCalledTimes(1);

    useAppStore.setState({ LoggingOut: true } as any);
    await act(async () => fireEvent.click(row));
    expect(clearAllUserData, "a second tap started a second logout").toHaveBeenCalledTimes(1);

    await act(async () => finishClear());
    expect(cancelAuth, "the store auth state was not reset in full").toHaveBeenCalledWith();
    expect(location.href, "logout from the profile did not go to the storefront").toBe("/sy-en");
  });

  it.each([
    ["no profile yet", null],
    ["a guest (phone 0)", { phone: "0" }],
  ])("does nothing for %s: there is no account to sign out of", async (_name, userProfile) => {
    useAppStore.setState({ userProfile } as any);
    const location = stubLocation({ pathname: "/sy-en/settings" });
    const { container } = render(<Demo1Shell dictionary={{}}>{null}</Demo1Shell>);

    await act(async () => fireEvent.click(logoutRow(container)));
    expect(clearAllUserData, "a guest's tap on logout cleared the guest session").not.toHaveBeenCalled();
    expect(setLoggingOut, "a guest's tap on logout started a logout").not.toHaveBeenCalled();
    expect(location.href, "a guest's tap on logout left the page").toBeNull();
  });
});
