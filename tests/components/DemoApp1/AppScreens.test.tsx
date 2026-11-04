import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppScreenRow } from "components/DemoApp1/appScreenPaths";
import type { DemoDictionary } from "components/DemoApp/demoKeys";

// The URL the fake router reports.
const url = vi.hoisted(() => ({ pathname: "/sy-en/products/x" }));
const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => url.pathname,
  useRouter: () => router,
  useParams: () => ({ lang: url.pathname.split("/")[1] }),
}));

// A screen stands in for the real ones: it names itself and has buttons that
// use the shell, the way a real screen does.
vi.mock("components/DemoApp1/AppScreenView", async () => {
  const { useDemoNav } = await import("components/DemoApp1/screenNav");
  return {
    default: function FakeScreen({ screen }: { screen: string }) {
      const { navigate, back, t } = useDemoNav();
      return (
        <div data-testid={`screen-${screen}`}>
          <p>{t("Profile")}</p>
          <button onClick={() => navigate("settings/profile/personal-info")}>
            to personal info
          </button>
          <button onClick={() => navigate("settings/wallet")}>to wallet</button>
          <button onClick={back}>back</button>
        </div>
      );
    },
  };
});
vi.mock("components/DemoApp1/keyboard/DemoKeyboard", () => ({
  default: () => <div data-testid="drawn-keyboard" />,
}));

import AppScreens from "components/DemoApp1/AppScreens";

const ROWS: AppScreenRow[] = [
  { path: "settings", screen: "settings" },
  { path: "settings/profile", screen: "settings/profile" },
  { path: "settings/profile/info", screen: "settings/profile/personal-info" },
];

const words = { Profile: "الملف الشخصي" } as unknown as DemoDictionary;

const page = <p data-testid="old-page">the old page</p>;

const mount = (pathname: string) => {
  url.pathname = pathname;
  return render(
    <AppScreens dictionary={words} rows={ROWS}>
      {page}
    </AppScreens>,
  );
};

/** The router moved to a new URL: the layout draws the mount again. */
const moveTo = (view: ReturnType<typeof render>, pathname: string) => {
  url.pathname = pathname;
  view.rerender(
    <AppScreens dictionary={words} rows={ROWS}>
      {page}
    </AppScreens>,
  );
};

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  router.push.mockClear();
  router.replace.mockClear();
});

describe("the screen mount", () => {
  it("shows the old page on a path with no row, with no drawn keyboard", () => {
    mount("/sy-en/products/x");
    expect(
      screen.queryByTestId("old-page"),
      "a path with no row should show its old page",
    ).not.toBeNull();
    expect(
      document.querySelector('[data-pw="app-screens"]'),
      "no new screen should be drawn on an old page",
    ).toBeNull();
    expect(
      screen.queryByTestId("drawn-keyboard"),
      "old pages keep the phone's own keyboard (Stage 3 rules)",
    ).toBeNull();
  });

  it("draws the screen of a path with a row, in the page's words, instead of the page", () => {
    mount("/sy-ar/settings/profile");
    expect(
      screen.queryByTestId("screen-settings/profile"),
      "/settings/profile should draw the profile menu screen",
    ).not.toBeNull();
    expect(
      screen.queryByTestId("old-page")?.closest("[hidden]"),
      "the route's page should stay in the tree, hidden, so its guest redirect runs (S4-4)",
    ).not.toBeNull();
    expect(
      screen.queryByText("الملف الشخصي"),
      "the screen should get its words from the layout's dictionary",
    ).not.toBeNull();
    expect(
      document.querySelector('[data-pw="app-screens"]')?.getAttribute("dir"),
      "an Arabic page should draw the screen right to left (A-13)",
    ).toBe("rtl");
    expect(
      screen.queryByTestId("drawn-keyboard"),
      "the drawn keyboard should be there while a new screen shows",
    ).not.toBeNull();
  });

  it("draws the next screen on the tap and sends the router to its row's path", async () => {
    mount("/sy-en/settings/profile");
    fireEvent.click(screen.getByText("to personal info"));
    expect(
      screen.queryByTestId("screen-settings/profile/personal-info"),
      "personal info should show on the tap, before the URL moves",
    ).not.toBeNull();
    expect(
      router.push,
      "the URL should follow to personal info's old path (S4-1), with no scroll by the router",
    ).toHaveBeenCalledWith("/sy-en/settings/profile/info", { scroll: false });
  });

  it("leaves a screen that is off to the router, and shows the old page when the URL gets there", async () => {
    const view = mount("/sy-en/settings/profile");
    fireEvent.click(screen.getByText("to wallet"));
    expect(
      router.push,
      "the wallet (no row) should open its old page",
    ).toHaveBeenCalledWith("/sy-en/settings/wallet");
    expect(
      screen.queryByTestId("screen-settings/profile"),
      "the screen should stay until the old page is there, so nothing goes blank",
    ).not.toBeNull();
    act(() => moveTo(view, "/sy-en/settings/wallet"));
    await waitFor(() =>
      expect(
        screen.queryByTestId("old-page"),
        "the wallet's old page should show once the URL is there",
      ).not.toBeNull(),
    );
    expect(
      document.querySelector('[data-pw="app-screens"]'),
      "no new screen should be left over the old page",
    ).toBeNull();
  });

  it("goes up one level when a screen was opened straight, and to the old page when the level above is off", () => {
    mount("/sy-en/settings/profile/info");
    fireEvent.click(screen.getByText("back"));
    expect(
      router.replace,
      "back from personal info, opened by its link, should go to the profile menu's path",
    ).toHaveBeenCalledWith("/sy-en/settings/profile", { scroll: false });
    expect(
      screen.queryByTestId("screen-settings/profile"),
      "the profile menu should show at once",
    ).not.toBeNull();
  });

  it("opens the next screen when the URL moves without a tap (a bar tab, a link, the browser's back)", async () => {
    const view = mount("/sy-en/products/x");
    act(() => moveTo(view, "/sy-en/settings"));
    await waitFor(() =>
      expect(
        screen.queryByTestId("screen-settings"),
        "the Profile tab's push to /settings should draw the profile tab",
      ).not.toBeNull(),
    );
    expect(
      screen.queryByTestId("old-page")?.closest("[hidden]"),
      "the page should be hidden under the profile tab",
    ).not.toBeNull();
  });
});
