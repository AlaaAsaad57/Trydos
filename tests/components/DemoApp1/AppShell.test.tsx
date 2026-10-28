import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The URL the fake router reports, and the locale segment the page is on.
const url = vi.hoisted(() => ({ pathname: "/sy-en/products/x" }));
const page = vi.hoisted(() => ({ lang: "sy-en" }));
const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => url.pathname,
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => router,
  useParams: () => ({ lang: page.lang }),
}));

// The notification check of the chat gate. Each case sets its own answer.
const home = vi.hoisted(() => ({
  getNotificationPermissionStatus: vi.fn(),
  AllowNotifications: vi.fn(async () => {}),
}));
vi.mock("services/home", () => ({ default: home }));

import { useAppStore } from "store";
import AppShell from "components/DemoApp1/AppShell";
import { TAB_ROOM } from "components/DemoApp1/demo1Layout";

const dictionary = {
  Home: "Home",
  Search: "Search",
  Cart: "Cart",
  Chat: "Chat",
  Profile: "Profile",
  Main: "Main",
};

/** The page next to the shell, the way the [lang] layout mounts them. */
const openOn = (pathname: string) => {
  url.pathname = pathname;
  page.lang = pathname.split("/")[1];
  return render(
    <>
      <main>
        <p data-testid="page-child">the page</p>
      </main>
      <AppShell dictionary={dictionary} />
    </>,
  );
};

const bar = () => document.body.querySelector<HTMLElement>('[data-pw="demo-tab-bar"]');

const pressTab = (tab: string) => {
  // The tab bar lives on <body>, outside the page.
  const button = document.body.querySelector(`[data-pw="demo-tab-${tab}"]`);
  expect(button, `the bar has no "${tab}" tab`).not.toBeNull();
  fireEvent.keyDown(button!, { key: "Enter" });
};

/** The tab the bar shows as the page on show, or null when none is lit. */
const litTabName = () =>
  document.body
    .querySelector('[data-pw^="demo-tab-"][aria-current="page"]')
    ?.getAttribute("data-pw") ?? null;

/** The bar is shown when its pointer events are on (framer-motion animates the rest). */
const barShown = () => bar()?.style.pointerEvents === "auto";

const barRoom = () =>
  document.documentElement.style.getPropertyValue("--app-bar-room");

/** Every inline style name the document root carries. */
const htmlStyleNames = () => [...document.documentElement.style];

const enableCart = vi.fn();
const setLoginOpen = vi.fn();
const setShouldAuthinticated = vi.fn();

beforeEach(() => {
  router.push.mockClear();
  enableCart.mockClear();
  setLoginOpen.mockClear();
  setShouldAuthinticated.mockClear();
  home.getNotificationPermissionStatus.mockReset();
  window.history.scrollRestoration = "auto";
  useAppStore.setState({
    localCart: [],
    data: [],
    user: null,
    userProfile: null,
    userChat: null,
    loginOpen: false,
    shouldAuthinticated: null,
    selectedStory: null,
    addStoryEnable: false,
    call: null,
    openPayIframe: false,
    chatVar: false,
    enable_search: false,
    openSearchRequest: 0,
    enableCart,
    setLoginOpen,
    setShouldAuthinticated,
  } as any);
});

afterEach(() => {
  document.documentElement.removeAttribute("style");
});

describe("AppShell — the new bottom bar on every page", () => {
  it("on a product page puts the bar on <body> with no tab lit, and leaves the page as it is", () => {
    const { container } = openOn("/sy-en/products/x");

    expect(bar(), "the bar is not on the product page").not.toBeNull();
    expect(bar()!.parentElement, "the bar is not a direct child of <body>").toBe(document.body);
    expect(litTabName(), "a product page lit a tab, but it belongs to no tab").toBeNull();

    const child = container.querySelector('[data-testid="page-child"]');
    expect(child?.textContent, "the page's own child was changed").toBe("the page");
    expect(
      child?.closest("[data-demo-screen]"),
      "the page's own child was put inside a demo screen frame",
    ).toBeNull();
    expect(barRoom(), "the bar shows but --app-bar-room is not set to the bar's room").toBe(TAB_ROOM);
  });

  it.each(["/sy-en/demo", "/sy-en/loginDemo", "/sy-en/login"])(
    "on %s draws no bar and sets no --app-bar-room",
    (pathname) => {
      openOn(pathname);
      expect(bar(), `${pathname} draws its own bar, but the shell drew one too`).toBeNull();
      expect(barRoom(), `${pathname} has no shell bar, but --app-bar-room is set`).toBe("");
    },
  );

  it("sets no inline style on <html> but --app-bar-room, and leaves scroll restore to the browser", () => {
    openOn("/sy-en/products/x");
    expect(htmlStyleNames(), "the shell put an inline style other than --app-bar-room on <html>").toEqual([
      "--app-bar-room",
    ]);
    expect(
      window.history.scrollRestoration,
      "the shell took scroll restore away from the browser",
    ).toBe("auto");
  });

  it("Profile goes to the settings page", () => {
    openOn("/sy-en/products/x");
    pressTab("settings");
    expect(router.push, "the Profile tab did not open /sy-en/settings").toHaveBeenCalledWith("/sy-en/settings");
  });

  it("Home goes to the home page", () => {
    openOn("/sy-en/products/x");
    pressTab("home");
    expect(router.push, "the Home tab did not open /sy-en").toHaveBeenCalledWith("/sy-en");
  });

  it("Cart opens the cart through the store", () => {
    openOn("/sy-en/products/x");
    pressTab("cart");
    expect(enableCart, "the Cart tab did not call enableCart(true)").toHaveBeenCalledWith(true);
  });

  it("Search off the home page goes home and asks the store to open search", () => {
    openOn("/sy-en/cart");
    pressTab("search");
    expect(router.push, "the Search tab did not go to the home page /sy-en first").toHaveBeenCalledWith("/sy-en");
    expect(
      useAppStore.getState().openSearchRequest,
      "the Search tab did not bump openSearchRequest from 0 to 1",
    ).toBe(1);
  });

  it("Chat as a guest (phone \"0\") opens the sign-in", async () => {
    useAppStore.setState({ userProfile: { phone: "0" }, userChat: null } as any);
    openOn("/sy-en/products/x");
    await act(async () => pressTab("chat"));
    expect(setLoginOpen, "the Chat tab did not open the sign-in for a guest").toHaveBeenCalledWith(true);
    expect(setShouldAuthinticated, "the Chat tab asked a guest to confirm a phone").not.toHaveBeenCalled();
  });

  it("Chat with a phone on record but no chat account asks to confirm the phone", async () => {
    useAppStore.setState({ userProfile: { phone: "0999000111" }, userChat: null } as any);
    openOn("/sy-en/products/x");
    await act(async () => pressTab("chat"));
    expect(
      setShouldAuthinticated,
      "the Chat tab did not ask to confirm the phone before the chat",
    ).toHaveBeenCalledWith("open chat");
    expect(setLoginOpen, "the Chat tab opened the sign-in for a shopper with a phone").not.toHaveBeenCalled();
  });

  it("hides the bar and drops --app-bar-room while the sign-in covers the screen", () => {
    useAppStore.setState({ loginOpen: true } as any);
    openOn("/sy-en/products/x");
    expect(bar(), "the bar was not mounted at all, so its hiding cannot be checked").not.toBeNull();
    expect(barShown(), "the bar shows over the open sign-in").toBe(false);
    expect(barRoom(), "--app-bar-room is set while the bar is hidden").toBe("");
  });

  it("keeps the bar over an open chat, with Chat lit", () => {
    useAppStore.setState({ chatVar: true } as any);
    openOn("/sy-en/products/x");
    expect(barShown(), "the bar hid over the open chat").toBe(true);
    expect(litTabName(), "the Chat tab is not lit while the chat is open").toBe("demo-tab-chat");
  });

  it("on sy-ar the bar and the shell root are right-to-left", () => {
    const { container } = openOn("/sy-ar/products/x");
    expect(bar()?.getAttribute("dir"), "the bar on sy-ar is not right-to-left").toBe("rtl");
    expect(
      container.querySelector('[data-pw="app-shell"]')?.getAttribute("dir"),
      "the shell root on sy-ar is not right-to-left",
    ).toBe("rtl");
  });
});
