import React from "react";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The bottom bar on a path the screen mount draws (UI-MIGRATION-PLAN.md,
// "The screen mount"): it follows the new screen's design.

const url = vi.hoisted(() => ({ pathname: "/sy-en/settings" }));
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => url.pathname,
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => router,
  useParams: () => ({ lang: url.pathname.split("/")[1] }),
}));
vi.mock("services/home", () => ({ default: { getNotificationPermissionStatus: vi.fn() } }));
vi.mock("next/dynamic", () => ({ default: () => () => null }));

// A table with two rows: the profile tab (a tab screen) and the profile menu
// (an inner screen). The real table is filled by each stage.
vi.mock("components/DemoApp1/appScreenPaths", async (importOriginal) => {
  const actual = await importOriginal<typeof import("components/DemoApp1/appScreenPaths")>();
  const rows = [
    { path: "settings", screen: "settings" },
    { path: "settings/profile", screen: "settings/profile" },
  ] as const;
  return {
    ...actual,
    appScreenFromPath: (pathname: string) => actual.appScreenFromPath(pathname, rows),
  };
});

import { useAppStore } from "store";
import AppShell from "components/DemoApp1/AppShell";

const dictionary = { Home: "Home", Search: "Search", Cart: "Cart", Chat: "Chat", Profile: "Profile", Main: "Main" };

const openOn = (pathname: string) => {
  url.pathname = pathname;
  return render(<AppShell dictionary={dictionary} />);
};

const bar = () => document.body.querySelector<HTMLElement>('[data-pw="demo-tab-bar"]');
/** The bar is shown when its pointer events are on (framer-motion animates the rest). */
const barShown = () => bar()?.style.pointerEvents === "auto";
const barRoom = () => document.documentElement.style.getPropertyValue("--app-bar-room");

beforeEach(() => {
  useAppStore.setState({
    localCart: [],
    data: [],
    userProfile: null,
    userChat: null,
    loginOpen: false,
    shouldAuthinticated: null,
    selectedStory: null,
    addStoryEnable: false,
    call: null,
    openPayIframe: false,
  } as any);
});

afterEach(() => {
  document.documentElement.style.removeProperty("--app-bar-room");
});

describe("the bottom bar on a new screen", () => {
  it("shows on a tab screen, and leaves the room under it to the screen", () => {
    openOn("/sy-en/settings");
    expect(bar(), "the profile tab should have the bar").not.toBeNull();
    expect(barShown(), "the bar should show on the profile tab (a tab screen)").toBe(true);
    expect(
      barRoom(),
      "the profile screen keeps its own room for the bar, so --app-bar-room must stay unset (no double room)",
    ).toBe("");
  });

  it("hides on an inner screen, as the design draws it", () => {
    openOn("/sy-en/settings/profile");
    expect(barShown(), "the profile menu (an inner screen) should have no bar").toBe(false);
    expect(barRoom(), "a hidden bar should take no room").toBe("");
  });

  it("keeps its room on an old page", () => {
    openOn("/sy-en/settings/orders");
    expect(barShown(), "an old page should still show the bar (D-20)").toBe(true);
    expect(barRoom(), "an old page should get the bar's room as before").not.toBe("");
  });
});
