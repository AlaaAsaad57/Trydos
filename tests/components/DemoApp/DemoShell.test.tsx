import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The URL the fake router reports. A test changes it and re-renders, which is
// what Next does when a navigation lands or the browser goes back.
const url = vi.hoisted(() => ({ pathname: "/sy-en/demo", search: "" }));
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
// The scaled canvas and the device modal are the login's, tested with it.
vi.mock("scaling/Page", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("NewLoginDesign/DemoDeviceInfoModal", () => ({ default: () => null }));

import DemoShell from "components/DemoApp/DemoShell";

/** Every screen on stage — the one leaving and the one coming in while a slide runs. */
const onStage = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-demo-screen]")].map((el) =>
    el.getAttribute("data-demo-screen"),
  );

const pressTab = (container: HTMLElement, tab: string) => {
  const button = container.querySelector(`[data-pw="demo-tab-${tab}"]`);
  expect(button, `the tab bar has no "${tab}" tab`).not.toBeNull();
  fireEvent.keyDown(button!, { key: "Enter" });
};

describe("DemoShell — navigation", () => {
  beforeEach(() => {
    url.pathname = "/sy-en/demo";
    url.search = "";
    router.push.mockClear();
    router.replace.mockClear();
  });

  it("opens on the screen the URL names", () => {
    url.pathname = "/sy-en/demo/settings/profile";
    const { container } = render(<DemoShell dictionary={{}}>{null}</DemoShell>);
    expect(
      onStage(container),
      "a direct visit to /demo/settings/profile did not show the profile menu",
    ).toEqual(["settings/profile"]);
  });

  it("slides to search at once and changes only the search param, with no server call", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    const { container } = render(<DemoShell dictionary={{}}>{null}</DemoShell>);
    pressTab(container, "search");
    expect(
      onStage(container),
      "search did not come on stage on the same render as the tap",
    ).toContain("search");
    expect(
      pushState,
      "the URL was not moved to ?search with history.pushState",
    ).toHaveBeenCalledWith(null, "", "/sy-en/demo?search");
    expect(
      router.push,
      "a search-param screen went through the router (a server round trip)",
    ).not.toHaveBeenCalled();
    pushState.mockRestore();
  });

  it("slides to a settings path before the router answers, and does not move again when the URL lands", () => {
    const { container, rerender } = render(
      <DemoShell dictionary={{}}>{null}</DemoShell>,
    );
    pressTab(container, "settings");
    expect(
      onStage(container),
      "the profile tab did not come on stage before the router answered",
    ).toContain("settings");
    expect(
      router.push,
      "the profile tab was not pushed as a real path",
    ).toHaveBeenCalledWith("/sy-en/demo/settings", {
      scroll: false,
    });

    url.pathname = "/sy-en/demo/settings";
    rerender(<DemoShell dictionary={{}}>{null}</DemoShell>);
    const current = onStage(container).filter((key) => key === "settings");
    expect(
      current,
      "the landing URL put a second copy of the profile tab on stage",
    ).toHaveLength(1);
  });

  it("follows the browser's back button to the screen the URL names", () => {
    const { container, rerender } = render(
      <DemoShell dictionary={{}}>{null}</DemoShell>,
    );
    pressTab(container, "settings");
    url.pathname = "/sy-en/demo/settings";
    rerender(<DemoShell dictionary={{}}>{null}</DemoShell>);

    // The browser went back: Next reports the old URL.
    url.pathname = "/sy-en/demo";
    act(() => {
      rerender(<DemoShell dictionary={{}}>{null}</DemoShell>);
    });
    expect(
      onStage(container),
      "the browser's back did not bring the home screen back",
    ).toContain("home");
  });

  it("shows the tab bar on tab screens and hides it on inner screens", () => {
    const { container, rerender } = render(
      <DemoShell dictionary={{}}>{null}</DemoShell>,
    );
    const bar = () =>
      container.querySelector('[data-pw="demo-tab-bar"]') as HTMLElement;
    expect(
      bar().style.pointerEvents,
      "the tab bar does not take taps on home",
    ).toBe("auto");

    url.pathname = "/sy-en/demo/settings/profile/body";
    rerender(<DemoShell dictionary={{}}>{null}</DemoShell>);
    expect(
      bar().style.pointerEvents,
      "the tab bar still takes taps on an inner screen",
    ).toBe("none");
  });
});
