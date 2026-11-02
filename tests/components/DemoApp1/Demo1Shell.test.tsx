import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
// The device modal is the login's, tested with it.
vi.mock("NewLoginDesign/DemoDeviceInfoModal", () => ({ default: () => null }));

import Demo1Shell from "components/DemoApp1/Demo1Shell";
import { Sheet } from "components/DemoApp1/ui";
import { UNDER_BAR } from "components/DemoApp1/demo1Layout";
import {
  DEMO_SCREENS,
  hrefFor,
  type DemoScreen,
} from "components/DemoApp/demoRoutes";

/** Every screen on stage — the one leaving and the one coming in while a slide runs. */
const onStage = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-demo-screen]")].map((el) =>
    el.getAttribute("data-demo-screen"),
  );

const pressTab = (tab: string) => {
  // The tab bar lives on <body>, outside the page.
  const button = document.body.querySelector(`[data-pw="demo-tab-${tab}"]`);
  expect(button, `the tab bar has no "${tab}" tab`).not.toBeNull();
  fireEvent.keyDown(button!, { key: "Enter" });
};

/** The demo's own fixed boxes that Safari may keep reading: none of them is at the bottom edge. */
const NOT_AT_THE_BOTTOM = ["demo-top-tint", "demo-controls"];

/**
 * The fixed boxes on the page that Safari 26 could read at the bottom edge:
 * every fixed box, but for an anchor with no width. jsdom lays nothing out,
 * so the size is read from the box's own style.
 */
const readableAtTheBottom = () =>
  [...document.body.querySelectorAll<HTMLElement>("*")]
    .filter(
      (el) =>
        el.style.position === "fixed" ||
        String(el.getAttribute("class") ?? "")
          .split(/\s+/)
          .includes("fixed"),
    )
    .filter((el) => el.style.width !== "0px")
    .map(
      (el) =>
        el.getAttribute("data-pw") ??
        el.getAttribute("data-demo-screen") ??
        `${el.tagName} ${el.getAttribute("class") ?? ""}`,
    )
    .filter((name) => !NOT_AT_THE_BOTTOM.includes(name));

/** Opens the shell on a screen's URL. */
const openOn = (screen: DemoScreen) => {
  const [path, query = ""] = hrefFor("sy-en", screen).split("?");
  url.pathname = path;
  url.search = query;
  return render(<Demo1Shell dictionary={{}}>{null}</Demo1Shell>);
};

// jsdom has no ResizeObserver. The wallet and promo sliders measure the page
// column with one; here the column never changes size, so it never fires.
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// jsdom has no IntersectionObserver either. Home's two sliders (Embla, and
// their hint) watch themselves with one; nothing scrolls here, so it never
// fires. Without it every test that opens Home threw on mount.
if (!("IntersectionObserver" in globalThis)) {
  globalThis.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}

let scrollY = 0;
const scrollTo = vi.fn();

beforeEach(() => {
  url.pathname = "/sy-en/demo";
  url.search = "";
  router.push.mockClear();
  router.replace.mockClear();
  scrollY = 0;
  scrollTo.mockClear();
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    get: () => scrollY,
  });
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
});

afterEach(() => {
  document.documentElement.removeAttribute("style");
  document.body.removeAttribute("style");
});

describe("Demo1Shell — a web page, not a scaled canvas", () => {
  it("draws no scaled canvas and no fixed layer over the window", () => {
    const { container } = openOn("home");
    expect(
      document.getElementById("app-outer"),
      "/demo mounted AppScaler's #app-outer, the fixed box that stops the document scrolling",
    ).toBeNull();
    expect(
      document.getElementById("master-canvas"),
      "/demo mounted AppScaler's scaled #master-canvas",
    ).toBeNull();
    const app = container.querySelector<HTMLElement>('[data-pw="demo1-app"]');
    expect(app, "the /demo page column is missing").not.toBeNull();
    expect(
      getComputedStyle(app!).position,
      "the /demo page column is not in the document flow",
    ).not.toBe("fixed");
  });

  it("lets the document scroll: a scroll of the window is not pulled back to the top", () => {
    openOn("settings");
    scrollTo.mockClear();
    scrollY = 240;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(
      scrollTo,
      "the shell moved the window back after the shopper scrolled (the old scaled demo pin to 0)",
    ).not.toHaveBeenCalled();
  });

  it("paints the document in the screen's colour, which Safari 26 takes for its bars, and clears it when the demo closes", () => {
    const { unmount } = openOn("home");
    expect(
      document.documentElement.style.backgroundColor,
      "<html> is not the home page's #FCFCFC",
    ).toBe("rgb(252, 252, 252)");
    expect(
      document.body.style.getPropertyPriority("background-color"),
      "<body>'s colour is not important, so globals.css's `background: 0 0 !important` wins",
    ).toBe("important");
    unmount();
    expect(
      document.documentElement.style.backgroundColor,
      "the demo's colour stayed on <html> after the demo closed",
    ).toBe("");
  });

  it("puts the tab bar on <body>, fixed to the window, 22 px from the screen's edges", () => {
    const { container } = openOn("home");
    const bar = document.body.querySelector<HTMLElement>(
      '[data-pw="demo-tab-bar"]',
    );
    expect(bar, "the tab bar is missing").not.toBeNull();
    expect(
      container.contains(bar),
      "the tab bar is inside the page, so it would scroll away with it",
    ).toBe(false);
    expect(bar!.className, "the tab bar is not fixed to the window").toContain(
      "fixed",
    );
    const box = bar!.querySelector<HTMLElement>('[data-pw="demo-tab-box"]');
    expect(box, "the tab bar has no box for its tabs").not.toBeNull();
    expect(
      box!.style.width,
      "the tab bar does not keep the file's 22 px from both edges of the screen (44 px in all)",
    ).toContain("44px");
  });
});

describe("Demo1Shell — navigation, with URLs under /demo", () => {
  it("opens on the screen the URL names", () => {
    const { container } = openOn("settings/profile");
    expect(
      onStage(container),
      "a direct visit to /demo/settings/profile did not show the profile menu",
    ).toEqual(["settings/profile"]);
  });

  it("slides to search at once and moves the URL to /demo?search with no server call", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    const { container } = openOn("home");
    pressTab("search");
    expect(
      onStage(container),
      "search did not come on stage on the same render as the tap",
    ).toContain("search");
    expect(
      pushState,
      "the URL was not moved to /demo?search with history.pushState",
    ).toHaveBeenCalledWith(null, "", "/sy-en/demo?search");
    expect(
      router.push,
      "a search-param screen went through the router (a server round trip)",
    ).not.toHaveBeenCalled();
    pushState.mockRestore();
  });

  it("starts a new screen at its top, and opens the last one where it was left on the browser's back", () => {
    const { container, rerender } = openOn("home");
    scrollY = 300;
    scrollTo.mockClear();
    pressTab("search");
    expect(
      scrollTo,
      "search did not start at its top",
    ).toHaveBeenLastCalledWith(0, 0);

    // The pushState lands: the URL now names search.
    url.search = "search";
    rerender(<Demo1Shell dictionary={{}}>{null}</Demo1Shell>);

    // The browser's back lands on /demo again.
    url.search = "";
    scrollY = 0;
    rerender(<Demo1Shell dictionary={{}}>{null}</Demo1Shell>);
    expect(onStage(container), "back did not bring home on stage").toContain(
      "home",
    );
    expect(
      scrollTo,
      "home did not open where it was left (300 px down)",
    ).toHaveBeenLastCalledWith(0, 300);
  });
});

describe("Demo1Shell — a store's page (XD `Home Page – 47`)", () => {
  /** The tapped card's box, and the page column's, as the browser would measure them. */
  const CARD = { top: 300, bottom: 440, left: 0, right: 418 };
  const measureLikeABrowser = () =>
    vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: Element) {
        const isCard = (this.getAttribute("data-pw") ?? "").startsWith(
          "demo-brand-",
        );
        const box = isCard ? CARD : { top: 0, bottom: 932, left: 0, right: 430 };
        return {
          ...box,
          x: box.left,
          y: box.top,
          width: box.right - box.left,
          height: box.bottom - box.top,
          toJSON() {},
        } as DOMRect;
      });

  const zaraCard = () =>
    document.body.querySelector<HTMLAnchorElement>(
      '[data-pw="demo-home-brand-page-0"] [data-pw="demo-brand-Zara"]',
    );

  const frameOf = (container: HTMLElement, screen: string) =>
    container.querySelector<HTMLElement>(`[data-demo-screen="${screen}"]`);

  it("makes every Home store card a real link to its page, for search engines and new tabs", () => {
    openOn("home");
    expect(zaraCard(), "Home has no Zara card in the brand carousel").not.toBeNull();
    expect(
      zaraCard()!.tagName,
      "the Zara card is not a link, so a search engine cannot reach the store page",
    ).toBe("A");
    expect(
      zaraCard()!.getAttribute("href"),
      "the Zara card does not link to /sy-en/demo/store/zara",
    ).toBe("/sy-en/demo/store/zara");
    const koton = document.body.querySelector(
      '[data-pw="demo-home-store-grid"] [data-pw="demo-brand-Koton"]',
    );
    expect(
      koton?.getAttribute("href"),
      "a store card with no logo (Koton) does not link to its page",
    ).toBe("/sy-en/demo/store/koton");
  });

  it("opens the store on the tap and moves the URL to /demo/store/zara with no server call", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    try {
      const { container } = openOn("home");
      fireEvent.click(zaraCard()!);
      expect(
        onStage(container),
        "the store page did not come on stage on the same render as the tap",
      ).toContain("store/zara");
      expect(
        pushState,
        "the URL was not moved to the store page's path",
      ).toHaveBeenCalledWith(null, "", "/sy-en/demo/store/zara");
      expect(
        router.push,
        "the store was opened with the router; its server answer lands in the middle of the grow and stops it",
      ).not.toHaveBeenCalled();
    } finally {
      pushState.mockRestore();
    }
  });

  it("slides the store page in as one Home slide, with no fade and no grow, and slides Home back on back", async () => {
    // A card box the browser could measure: the page still must not grow from it.
    const measure = measureLikeABrowser();
    const { container, rerender } = openOn("home");
    fireEvent.click(zaraCard()!);

    const entering = frameOf(container, "store/zara");
    expect(entering, "the store page is not on stage after the tap").not.toBeNull();
    expect(
      entering!.style.clipPath,
      `the store page was cut to the card's box (it grows); clip: "${entering!.style.clipPath}"`,
    ).toBe("");
    expect(
      entering!.style.opacity,
      "the store page fades in; a Home slide does not fade",
    ).toBe("1");
    expect(
      entering!.style.transform,
      `the store page does not start one screen width to the right; transform: "${entering!.style.transform}"`,
    ).toMatch(/translateX\(100%\)/);
    expect(
      onStage(container),
      "Home left the stage at once; it must slide out beside the store page",
    ).toContain("home");

    // The router lands on the store's path.
    url.pathname = "/sy-en/demo/store/zara";
    rerender(<Demo1Shell dictionary={{}}>{null}</Demo1Shell>);
    // The slide ends, and Home leaves the stage.
    await waitFor(
      () =>
        expect(onStage(container), "Home is still on stage after the slide ended").toEqual([
          "store/zara",
        ]),
      { timeout: 3000 },
    );

    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    fireEvent.click(container.querySelector('[data-pw="demo-listing-back"]')!);
    expect(onStage(container), "back did not bring Home on stage").toContain("home");
    expect(back, "back did not go through the browser's history").toHaveBeenCalled();
    const home = frameOf(container, "home");
    expect(
      home!.style.transform,
      `Home does not come back from one screen width to the left; transform: "${home!.style.transform}"`,
    ).toMatch(/translateX\(-100%\)/);
    expect(
      home!.style.opacity,
      "Home fades in on back; a Home slide does not fade",
    ).toBe("1");
    const leaving = frameOf(container, "store/zara");
    expect(leaving, "the store page was removed at once instead of sliding out").not.toBeNull();
    expect(
      leaving!.parentElement!.style.zIndex,
      "the store page is put over Home on back, as if it shrank into its card",
    ).toBe("");
    back.mockRestore();
    measure.mockRestore();
  });

  it("puts nothing over the leaving screen when there is no card box either", () => {
    const { container } = openOn("home");
    // jsdom measures every box as 0 x 0: there is no card box to grow from.
    fireEvent.click(zaraCard()!);
    const entering = frameOf(container, "store/zara");
    expect(
      entering!.style.clipPath,
      "the store page was cut to a card box that could not be measured",
    ).toBe("");
    expect(
      entering!.parentElement!.style.zIndex,
      "a store page that slides in was put over the leaving screen",
    ).toBe("");
  });

  it("draws the file's page for the store the URL names", () => {
    const { container } = openOn("store/zara");
    const page = container.querySelector('[data-pw="demo-listing"]');
    expect(page, "/demo/store/zara did not draw the store page").not.toBeNull();
    expect(
      container.querySelector("h1 img")?.getAttribute("alt"),
      "the page's <h1> is not the store's logo named Zara",
    ).toBe("Zara");
    const banner = container.querySelector('[data-pw="demo-listing-banner"]');
    expect(
      banner?.textContent,
      "the banner does not read \"Shop Zara collection now !\"",
    ).toContain("Shop Zara collection now !");
    expect(
      banner?.querySelector("span.capitalize"),
      "the banner's line is not drawn with a capital on every word, as the file draws it",
    ).not.toBeNull();
    for (const name of [
      "T-Shirt",
      "Shoes",
      "Mont",
      "Craf",
      "Jacket",
      "Shirt",
      "Pajama",
      "Jeans",
      "Blouse",
    ]) {
      expect(
        container.querySelector(
          `[data-pw="demo-listing-category-${name}"]`,
        )?.textContent,
        `the category tile "${name}" is missing or has no name`,
      ).toBe(name);
    }
    const badges: Record<string, [string, string]> = {
      "shirt-1": ["bag", "1 item M in your bag"],
      "pajama-1": ["best", "! Best price last 3 days!"],
      "shirt-2": ["flash", "Flash Deal | 1d | 12:23:19"],
      "pajama-2": ["best", "! Best price last 3 days!"],
    };
    for (const [id, [kind, words]] of Object.entries(badges)) {
      const card = container.querySelector(
        `[data-pw="demo-listing-product-${id}"]`,
      );
      expect(card, `the product card ${id} is missing`).not.toBeNull();
      expect(
        card!.querySelector("h2")?.textContent,
        `the product card ${id} does not show the name "Women . Pajama . Pantaloon"`,
      ).toBe("Women . Pajama . Pantaloon");
      expect(
        card!.querySelector('[data-pw="demo-listing-price"]')?.textContent,
        `the product card ${id} does not show the price "90 USD"`,
      ).toBe("90 USD");
      expect(
        card!.querySelector(`[data-pw="demo-listing-badge-${kind}"]`)
          ?.textContent,
        `the product card ${id} does not show its ${kind} badge "${words}"`,
      ).toBe(words);
    }
  });

  it("makes the category row a slider like the ones on Home, which leaves the page free to scroll", () => {
    const { container } = openOn("store/zara");
    const row = container.querySelector<HTMLElement>(
      '[data-pw="demo-listing-categories"]',
    );
    expect(row, "the store page has no category row").not.toBeNull();
    expect(
      row!.style.touchAction,
      "the category row takes the up-and-down touch too, so the page cannot scroll over it",
    ).toBe("pan-y pinch-zoom");
    expect(
      row!.className,
      "the category row scrolls with the browser's own scroll, not with the Home slider (a mouse cannot drag it)",
    ).not.toMatch(/overflow-x-auto/);
  });

  it("moves each category tile whole during the slider's hint, with its frame, and leaves no white gap", () => {
    const { container } = openOn("store/zara");
    const tile = container.querySelector<HTMLElement>(
      '[data-pw="demo-listing-category-T-Shirt"]',
    );
    expect(tile, "the store page has no T-Shirt tile").not.toBeNull();
    // The hint moves what is inside each slide (see useSlider). A slide that
    // cuts off its own insides shows a white gap where the photo moved away.
    expect(
      tile!.className,
      "the tile cuts off its own photo, so the hint leaves a white gap at the right of every tile",
    ).not.toMatch(/overflow-hidden/);
    const moving = tile!.firstElementChild as HTMLElement | null;
    expect(
      moving?.querySelector("img"),
      "the tile's photo is not inside the part that the hint moves",
    ).not.toBeNull();
    expect(
      moving?.className,
      "the moving part of the tile does not cut its photo to the tile's box",
    ).toMatch(/overflow-hidden/);
    expect(
      tile!.lastElementChild,
      "the tile's frame line stays in place while the photo moves (it must move with the photo)",
    ).toBe(moving);
  });

  it("puts the back mark at the file's half-pixel place with a transform, not with layout", () => {
    const { container } = openOn("store/zara");
    const back = container.querySelector<HTMLElement>('[data-pw="demo-listing-back"]');
    expect(back, "the store page has no back button").not.toBeNull();
    // The file puts the mark's box at (14.5, 64.5). Chromium draws an image
    // box at a half-pixel layout place on the next whole pixel, so the mark
    // showed 0.5 px right of and under the file. The box sits on whole pixels,
    // and a transform (never snapped) moves it the last 0.5 px.
    expect(
      back!.style.padding,
      "the back mark's box is placed at a half pixel, so the browser draws it 0.5 px off",
    ).toBe("14px 0px 0px 14px");
    expect(
      back!.querySelector("img")?.style.transform,
      "the back mark is not moved the last 0.5 px to the file's (14.5, 64.5)",
    ).toBe("translate(0.5px, 0.5px)");
  });

  describe("the store's search field", () => {
    const parts = (container: HTMLElement) => ({
      mark: container.querySelector<HTMLElement>('[data-pw="demo-listing-search"]'),
      field: container.querySelector<HTMLElement>('[data-pw="demo-listing-search-field"]'),
      input: container.querySelector<HTMLInputElement>('[data-pw="demo-listing-search-input"]'),
      sort: container.querySelector<HTMLElement>('[data-pw="demo-listing-sort"]'),
      share: container.querySelector<HTMLElement>('[data-pw="demo-listing-share"]'),
    });

    it("opens in the header on a tap of the search mark: the field takes the focus, and the other marks step aside", () => {
      const { container } = openOn("store/zara");
      const { mark, field, input, sort, share } = parts(container);
      expect(mark, "the store page has no search mark").not.toBeNull();
      expect(field, "the store page has no search field in its header").not.toBeNull();
      expect(field!.dataset.open, "the search field is open before the tap").toBeUndefined();
      expect(field!.style.visibility, "the closed search field can be seen").toBe("hidden");

      fireEvent.click(mark!);

      expect(field!.dataset.open, "a tap on the search mark did not open the field").toBe("true");
      expect(field!.style.visibility, "the open search field is still hidden").toBe("visible");
      expect(
        field!.style.clipPath,
        "the open field is still cut to the search mark's box (it must grow to its full size)",
      ).toBe("inset(0px 0px 0px 0px round 12px)");
      expect(
        document.activeElement,
        "the field did not take the focus in the tap (iOS then shows no keyboard)",
      ).toBe(input);
      expect(
        [field!.style.left, field!.style.right],
        "the open search field does not fill the top bar, 10 px from each edge",
      ).toEqual(["10px", "10px"]);
      const back = container.querySelector<HTMLElement>('[data-pw="demo-listing-back"]');
      expect(back!.style.opacity, "the back mark still shows under the open search field").toBe("0");
      expect(back!.hasAttribute("inert"), "the hidden back mark can still be tapped or reached with the keys").toBe(true);
      expect(
        container.querySelector<HTMLElement>("header h1")?.style.opacity,
        "the store's logo still shows under the open search field",
      ).toBe("0");
      expect(sort!.style.opacity, "the sort mark still shows while the search field is open").toBe("0");
      expect(share!.style.opacity, "the share mark still shows while the search field is open").toBe("0");
      expect(
        sort!.closest("[inert]"),
        "the hidden sort mark can still be reached with the keys while the field is open",
      ).not.toBeNull();
      expect(onStage(container), "a tap on the search mark left the store page").toEqual(["store/zara"]);
      expect(router.push, "a tap on the search mark moved the URL").not.toHaveBeenCalled();
    });

    it("closes on a scroll of the page, and the header is as it was", () => {
      vi.useFakeTimers();
      try {
        const { container } = openOn("store/zara");
        const { mark, field, input, sort } = parts(container);
        fireEvent.click(mark!);
        fireEvent.change(input!, { target: { value: "shirt" } });

        // While the keyboard comes up, a page move (iOS) does not close it.
        scrollY = 60;
        fireEvent.scroll(window);
        expect(
          field!.dataset.open,
          "the field closed on the page move that comes with the keyboard",
        ).toBe("true");
        act(() => {
          vi.advanceTimersByTime(500);
        });

        // A small shake of the finger does not close it.
        scrollY = 70;
        fireEvent.scroll(window);
        expect(field!.dataset.open, "a 10 px move of the page closed the field").toBe("true");

        scrollY = 160;
        fireEvent.scroll(window);
        expect(field!.dataset.open, "a 100 px scroll of the page did not close the field").toBeUndefined();
        expect(input!.value, "the words stayed in the field after it closed").toBe("");
        expect(
          document.activeElement,
          "the field kept the focus after the scroll closed it (the keyboard stays up)",
        ).not.toBe(input);
        expect(sort!.style.opacity, "the sort mark did not come back after the field closed").toBe("1");
        expect(sort!.closest("[inert]"), "the sort mark cannot be reached after the field closed").toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });

    it("closes on its close mark and on Escape, and gives the focus back to the search mark", () => {
      const { container } = openOn("store/zara");
      const { mark, field, input } = parts(container);
      const close = container.querySelector<HTMLElement>('[data-pw="demo-listing-search-close"]');
      expect(close, "the search field has no close mark").not.toBeNull();

      fireEvent.click(mark!);
      fireEvent.click(close!);
      expect(field!.dataset.open, "the close mark did not close the search field").toBeUndefined();
      expect(document.activeElement, "the focus did not go back to the search mark after the close mark").toBe(mark);

      fireEvent.click(mark!);
      fireEvent.keyDown(input!, { key: "Escape" });
      expect(field!.dataset.open, "Escape did not close the search field").toBeUndefined();
      expect(document.activeElement, "the focus did not go back to the search mark after Escape").toBe(mark);
    });
  });

  it("on a tap, draws the cards the screen shows first and the rest of the first page after the grow", () => {
    vi.useFakeTimers();
    try {
      const { container } = openOn("store/zara");
      const fifth = () =>
        container.querySelector('[data-pw="demo-listing-product-shirt-front-1"]');
      expect(
        container.querySelector('[data-pw="demo-listing-product-pajama-2"]'),
        "the fourth card (second row) is not drawn on the tap",
      ).not.toBeNull();
      expect(
        fifth(),
        "the fifth card is drawn on the tap; it is under the screen and makes the tap's work longer",
      ).toBeNull();
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(fifth(), "the rest of the first page did not come in after the grow").not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("loads the next page when the end of the list comes near: grey cards first, then 12 more, and a last line at the end", () => {
    // An IntersectionObserver that the test fires by hand.
    const watchers: IntersectionObserverCallback[] = [];
    const Before = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = class {
      readonly root = null;
      readonly rootMargin = "";
      readonly thresholds = [];
      constructor(private readonly cb: IntersectionObserverCallback) {
        watchers.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {
        const at = watchers.indexOf(this.cb);
        if (at >= 0) watchers.splice(at, 1);
      }
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;
    vi.useFakeTimers();
    try {
      const { container } = openOn("store/zara");
      const card = (id: string) =>
        container.querySelector(`[data-pw="demo-listing-product-${id}"]`);
      // The rest of the first page comes in after the grow.
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(card("pajama-2"), "the first page lost the file's fourth card").not.toBeNull();
      expect(
        card("blouse-14"),
        "a card of the second page is on the page before the person scrolled",
      ).toBeNull();
      const nearTheEnd = () =>
        act(() => {
          for (const cb of [...watchers])
            cb(
              [{ isIntersecting: true } as IntersectionObserverEntry],
              {} as IntersectionObserver,
            );
        });
      nearTheEnd();
      expect(
        container.querySelector('[data-pw="demo-listing-skeleton"]'),
        "no grey cards show while the next page loads",
      ).not.toBeNull();
      expect(
        container.querySelector('[data-pw="demo-listing-products"]')?.getAttribute("aria-busy"),
        "the list does not tell screen readers that it is loading",
      ).toBe("true");
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(
        container.querySelector('[data-pw="demo-listing-skeleton"]'),
        "the grey cards stay after the next page came in",
      ).toBeNull();
      expect(card("blouse-14"), "the second page did not come in after the wait").not.toBeNull();
      expect(
        container.querySelector('[data-pw="demo-listing-end"]'),
        "the page says there are no more products after the second of three pages",
      ).toBeNull();
      nearTheEnd();
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(card("dress-32"), "the third page did not come in").not.toBeNull();
      expect(
        container.querySelector('[data-pw="demo-listing-end"]')?.textContent,
        "after the last page, the page does not say that there are no more products",
      ).toBe("You have seen all products");
    } finally {
      vi.useRealTimers();
      globalThis.IntersectionObserver = Before;
    }
  });

  it("keeps the sticky box at the top 0 px wide, so Safari 26 draws the page under its top bar", () => {
    // Safari 26 on the iPhone fills its top bar with the colour of the first
    // fixed or sticky box at the top edge that is 90 % as wide as the screen.
    // A full-width white sticky head made the top bar plain white.
    for (const screen of ["home", "store/zara"] as const) {
      const { container, unmount } = openOn(screen);
      const head = container.querySelector<HTMLElement>('[data-pw="demo1-head"]');
      expect(head, `the "${screen}" screen has no header`).not.toBeNull();
      let box: HTMLElement | null = head;
      while (box && !/\bsticky\b/.test(box.className)) box = box.parentElement;
      expect(box, `the header of the "${screen}" screen is not inside a sticky box`).not.toBeNull();
      expect(
        box!.style.width,
        `the sticky box of the header on the "${screen}" screen is not 0 px wide, so Safari paints its top bar in the header's solid colour`,
      ).toBe("0px");
      expect(
        head!.style.width,
        `the header on the "${screen}" screen does not take the page column's full width`,
      ).toBe("min(100vw, 500px)");
      unmount();
    }
  });

  it("hides the store page's header on a scroll down and shows it again on any scroll up", async () => {
    const tall = Object.getOwnPropertyDescriptor(Element.prototype, "scrollHeight");
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      get: () => 5000,
    });
    try {
      const { container } = openOn("store/zara");
      const head = container.querySelector<HTMLElement>('[data-pw="demo1-head"]');
      expect(head, "the store page has no header").not.toBeNull();
      const scrollTo = async (y: number) => {
        scrollY = y;
        fireEvent.scroll(window);
        // The page reads the scroll on the next frame.
        await act(() => new Promise((done) => requestAnimationFrame(() => done(null))));
      };
      await scrollTo(400);
      expect(
        head!.style.transform,
        "the header stays on screen after a scroll down of 400 px",
      ).toBe("translateY(-100%)");
      await scrollTo(398);
      expect(
        head!.style.transform,
        "the header does not come back after a short scroll up of 2 px",
      ).toBe("translateY(0)");
      await scrollTo(800);
      expect(head!.style.transform, "the header does not hide again on the next scroll down").toBe(
        "translateY(-100%)",
      );
      expect(
        head!.style.transition,
        "the header jumps away instead of moving out",
      ).toContain("transform");
    } finally {
      if (tall) Object.defineProperty(document.documentElement, "scrollHeight", tall);
      else delete (document.documentElement as unknown as Record<string, unknown>).scrollHeight;
    }
  });

  it("flips a card's labels over like a card when it has more than one, and keeps a single label still", () => {
    const { container } = openOn("store/zara");
    const labelsOf = (id: string) =>
      container.querySelector<HTMLElement>(
        `[data-pw="demo-listing-product-${id}"] [data-pw="demo-listing-labels"]`,
      );
    const flash = labelsOf("shirt-2");
    expect(flash, "the flash deal card (shirt-2) has no labels row").not.toBeNull();
    const track = flash!.querySelector<HTMLElement>(".demo-labels-2");
    expect(track, "the flash deal card's two labels do not take turns").not.toBeNull();
    expect(
      flash!.querySelector("style")?.textContent,
      "the labels do not turn over like a card (rotateX to -180deg)",
    ).toContain("rotateX(-180deg)");
    expect(
      flash!.style.perspective,
      "the labels' row has no perspective, so the flip looks flat",
    ).not.toBe("");
    const slots = [...track!.children] as HTMLElement[];
    expect(
      slots[0]?.textContent,
      "the flash deal is not the first label on its card",
    ).toBe("Flash Deal | 1d | 12:23:19");
    expect(
      slots[1]?.textContent,
      "the best-price label does not come after the flash deal",
    ).toBe("! Best price last 3 days!");
    expect(
      slots[1]?.style.backfaceVisibility,
      "the label waiting to come in shows its back during the flip",
    ).toBe("hidden");
    expect(
      slots[1]?.style.animationDelay,
      "the second label does not start one turn (2 s) behind the first",
    ).toBe("-2s");
    expect(
      labelsOf("shirt-1")?.querySelector(".demo-labels-2"),
      "the card in the bag (shirt-1) does not turn between its bag and best-price labels",
    ).not.toBeNull();
    const single = labelsOf("pajama-1");
    expect(single, "the best-price card (pajama-1) has no labels row").not.toBeNull();
    expect(
      single!.querySelector("[class*='demo-labels-']"),
      "a card with one label moves it",
    ).toBeNull();
  });

  it("flips the labels on the colour sheet's cards too, the same way as on the store page", () => {
    const { container } = openOn("store/zara");
    const dots = container.querySelector(
      '[data-pw="demo-listing-product-shirt-2"] [data-pw="demo-listing-colors"]',
    );
    expect(dots, "the flash deal card (shirt-2) has no colour dots to open the sheet").not.toBeNull();
    fireEvent.click(dots!);
    // The sheet may be drawn on <body>, outside the page.
    const labels = document.body.querySelector<HTMLElement>(
      '[data-pw="demo-color-card-0"] [data-pw="demo-color-labels"]',
    );
    expect(labels, "the colour sheet's first card has no labels row").not.toBeNull();
    const track = labels!.querySelector<HTMLElement>(".demo-labels-2");
    expect(track, "the colour sheet's card does not turn between its two labels").not.toBeNull();
    const slots = [...track!.children] as HTMLElement[];
    expect(
      slots[0]?.textContent,
      "the flash deal is not the first label on the colour sheet's card",
    ).toBe("Flash Deal | 1d | 12:23:19");
    expect(
      slots[1]?.textContent,
      "the best-price label does not come after the flash deal on the colour sheet's card",
    ).toBe("! Best price last 3 days!");
    expect(
      labels!.querySelector("style")?.textContent,
      "the colour sheet's labels do not turn over like a card (rotateX to -180deg)",
    ).toContain("rotateX(-180deg)");
  });

  it("shows the tab bar on the store page, with Home as the active tab", () => {
    openOn("store/zara");
    const bar = document.body.querySelector<HTMLElement>(
      '[data-pw="demo-tab-bar"]',
    );
    expect(bar, "the store page has no tab bar").not.toBeNull();
    expect(
      bar!.style.pointerEvents,
      "the tab bar is hidden or cannot be tapped on the store page",
    ).not.toBe("none");
    expect(
      bar!.querySelector('[data-pw="demo-tab-home"]')?.getAttribute("aria-current"),
      "the Home tab is not the active tab on a store page",
    ).toBe("page");
  });

  it("keeps the store page a fluid page that the document scrolls", () => {
    const { container } = openOn("store/zara");
    const own = [...container.querySelectorAll<HTMLElement>("*")].filter(
      (el) =>
        /\boverflow-y-(auto|scroll)\b/.test(el.className.toString()) ||
        ["auto", "scroll"].includes(el.style.overflowY),
    );
    expect(
      own.map((el) => el.getAttribute("data-pw") ?? el.tagName),
      "the store page scrolls a box of its own, so Safari's glass bar shows nothing under it",
    ).toEqual([]);
    const fixed = [...container.querySelectorAll<HTMLElement>("*")].filter(
      (el) => ["430px", "214px"].includes(el.style.width),
    );
    expect(
      fixed.map((el) => `${el.getAttribute("data-pw") ?? el.tagName} ${el.style.width}`),
      "the store page has boxes with the artboard's fixed width; they overflow a narrow phone",
    ).toEqual([]);
  });
});

describe("Demo1 screens — fluid pages that the document scrolls", () => {
  // The old scaled demo screens' artboard widths. On /demo a block that spans the
  // screen keeps its distance to the edges instead of one of these numbers.
  const ARTBOARD_WIDTHS = ["430px", "406px", "390px", "386px", "382px"];

  // The conversation is the one page whose body scrolls under a head that
  // stays put (asked for on 2026-10-20: "the chat container should be
  // scrollable, not all the screen"); ScreenPage's `scrollBody`.
  const SCROLLS_ITS_BODY = new Set(["chat/conversation"]);

  for (const screen of DEMO_SCREENS) {
    if (SCROLLS_ITS_BODY.has(screen)) continue;
    it(`${screen}: no box inside the page scrolls on its own`, () => {
      const { container } = openOn(screen);
      const boxes = [...container.querySelectorAll<HTMLElement>("*")].filter(
        (el) =>
          /\boverflow-y-(auto|scroll)\b/.test(el.className.toString()) ||
          ["auto", "scroll"].includes(el.style.overflowY) ||
          ["auto", "scroll"].includes(el.style.overflow),
      );
      expect(
        boxes.map((el) => el.getAttribute("data-pw") ?? el.tagName),
        `${screen} scrolls a box of its own, so the document does not scroll and Safari's glass bar shows nothing under it`,
      ).toEqual([]);
    });

    it(`${screen}: no block spans the screen with a fixed artboard width`, () => {
      const { container } = openOn(screen);
      const fixed = [...container.querySelectorAll<HTMLElement>("*")].filter(
        (el) =>
          ARTBOARD_WIDTHS.includes(el.style.width) &&
          // An invisible frame that keeps the map's pill and pin at the
          // file's x; it is centred on the map, and the map clips it.
          el.getAttribute("data-pw") !== "demo-address-map-frame",
      );
      expect(
        fixed.map(
          (el) =>
            `${el.getAttribute("data-pw") ?? el.tagName} ${el.style.width}`,
        ),
        `${screen} has blocks with the artboard's fixed width; they overflow a narrow phone`,
      ).toEqual([]);
    });
  }
});

describe("Demo1 layers — Safari's top bar follows an open sheet", () => {
  // Safari 26 keeps the colour it already shows when the box at the top is a
  // "dimming layer" (the sheet's see-through backdrop), so the bar never went
  // grey. A fixed strip of the demo's own, more than 10 px tall and opaque, is
  // what it reads; see components/DemoApp/topTint.ts.
  const strip = () =>
    document.body.querySelector<HTMLElement>('[data-pw="demo-top-tint"]');

  it("puts the sheet's grey at the top while it is open, and hides the strip again when it closes", () => {
    const { rerender } = render(
      <Sheet open onClose={() => {}} y={400} testId="sheet">
        <span>a</span>
      </Sheet>,
    );
    expect(
      strip(),
      "an open sheet put no strip at the top for Safari to read",
    ).not.toBeNull();
    expect(
      strip()!.style.position,
      "the top strip is not fixed, so Safari does not look at it",
    ).toBe("fixed");
    expect(
      Number(/(\d+)px/.exec(strip()!.style.height)?.[1] ?? 0),
      `the top strip is ${strip()!.style.height} tall; Safari ignores the colour of a box 10 px tall or less`,
    ).toBeGreaterThan(10);
    expect(
      strip()!.style.visibility,
      "the top strip is hidden while the sheet is open",
    ).toBe("visible");
    expect(
      strip()!.style.backgroundColor,
      "the top strip is not the dimmed page's grey",
    ).toBe("rgb(52, 52, 52)");

    rerender(
      <Sheet open={false} onClose={() => {}} y={400} testId="sheet">
        <span>a</span>
      </Sheet>,
    );
    expect(
      strip(),
      "the strip was taken away on close; Safari only looks again when a fixed layer repaints, so it must stay and change",
    ).not.toBeNull();
    expect(
      strip()!.style.visibility,
      "the strip still shows after the sheet closed, so the page's own header cannot colour the bar",
    ).toBe("hidden");
  });
});

describe("Demo1 bottom — like the old scaled demo, Safari's bottom bar lies over the app", () => {
  const innerHeight = window.innerHeight;
  afterEach(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: innerHeight,
    });
  });

  it("a sheet runs to the bottom of the window: its layer is as tall as innerHeight and keeps no room for the bottom inset", () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    render(
      <Sheet open onClose={() => {}} y={400} testId="sheet-h">
        <span>a</span>
      </Sheet>,
    );
    const layer = document.body.querySelector<HTMLElement>(
      '[data-pw="sheet-h"]',
    );
    expect(layer, "the open sheet was not drawn").not.toBeNull();
    expect(
      layer!.style.height,
      "the sheet's layer is not as tall as the window (innerHeight), so it ends above Safari's bar instead of under it as on the old scaled demo",
    ).toBe("800px");
    const inset = [layer!, ...layer!.querySelectorAll<HTMLElement>("*")].filter(
      (el) =>
        (el.getAttribute("style") ?? "").includes("safe-area-inset-bottom"),
    );
    expect(
      inset.map((el) => el.getAttribute("data-pw") ?? el.tagName),
      "the sheet keeps room for the device's bottom inset, so its last rows stop above Safari's bar",
    ).toEqual([]);
  });

  it("cash in: the sheet's steps keep no room for the bottom inset either", () => {
    const { container } = openOn("settings/wallet");
    const card = container.querySelector('[data-pw="demo-wallet-card-usd"]');
    expect(card, "the wallet has no dollar card").not.toBeNull();
    fireEvent.click(card!);
    const cashIn = container.querySelector(
      '[data-pw="demo-wallet-cash-in-usd"]',
    );
    expect(cashIn, "the grown dollar card has no Cash In").not.toBeNull();
    fireEvent.click(cashIn!);
    const sheet = document.body.querySelector<HTMLElement>(
      '[data-pw="demo-wallet-cash-in-sheet"]',
    );
    expect(sheet, "Cash In did not open its sheet").not.toBeNull();
    const inset = [...sheet!.querySelectorAll<HTMLElement>("*")].filter((el) =>
      (el.getAttribute("style") ?? "").includes("safe-area-inset-bottom"),
    );
    expect(
      inset.map((el) => el.getAttribute("data-pw") ?? el.tagName),
      "a cash-in step is cut short by the bottom inset, so its button sits above Safari's bar",
    ).toEqual([]);
  });

  // The form used to drop its height while the amount was typed, so the
  // button jumped from the file's place (y 835) to just under the field.
  /** Waits for a part of an open wallet sheet. */
  const pick = (testId: string) =>
    waitFor(() => {
      const found = document.body.querySelector<HTMLElement>(`[data-pw="${testId}"]`);
      expect(found, `the wallet sheet did not show "${testId}"`).not.toBeNull();
      return found!;
    });

  /** Opens a sheet of the dollar card on a phone-wide window. */
  const onPhone = async (
    open: "demo-wallet-cash-in-usd" | "demo-wallet-cash-out-usd",
    run: () => Promise<void>,
  ) => {
    const width = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 440 });
    try {
      const { container } = openOn("settings/wallet");
      fireEvent.click(container.querySelector('[data-pw="demo-wallet-card-usd"]')!);
      fireEvent.click(container.querySelector(`[data-pw="${open}"]`)!);
      await run();
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    }
  };

  it("cash in, via crypto: the form keeps its height while the amount is typed", () =>
    onPhone("demo-wallet-cash-in-usd", async () => {
      fireEvent.click(await pick("demo-wallet-cash-in-way-crypto"));
      await pick("demo-wallet-cash-in-crypto-under");
      const form = () =>
        document.body.querySelector<HTMLElement>(
          '[data-pw="demo-wallet-cash-in-crypto-under"] > div',
        )!;
      const resting = form().style.minHeight;
      expect(resting, "the crypto form is not as tall as the board before typing").not.toBe("");

      fireEvent.focus(await pick("demo-wallet-cash-in-amount-input"));
      await waitFor(() =>
        expect(
          document.body.querySelector('[data-pw="demo-wallet-cash-in-amount"][data-keyboard-anchor]'),
          "the crypto amount field did not go into use on focus",
        ).not.toBeNull(),
      );
      expect(
        form().style.minHeight,
        "the crypto form lost its height while typing, so what is at its bottom moved up",
      ).toBe(resting);
      // The room for the keyboard must not be inside the form's own box: there
      // it takes the free height, and the button block ends up under the field.
      expect(
        form().lastElementChild?.getAttribute("aria-hidden"),
        "an empty block sits after the button block inside the form, so the keyboard pushes the button up",
      ).not.toBe("true");
    }));

  // On a phone the empty amount field used to jump from y 515 to y 397 as the
  // keyboard came up.
  it("cash out: the empty amount field keeps its place when it goes into use on a phone", () =>
    onPhone("demo-wallet-cash-out-usd", async () => {
      fireEvent.click(await pick("demo-wallet-way-rdb"));
      const field = await pick("demo-wallet-amount");
      const resting = field.style.marginTop;
      expect(resting, "the amount field has no place of its own before typing").not.toBe("");

      fireEvent.focus(await pick("demo-wallet-amount-input"));
      await waitFor(() =>
        expect(
          document.body.querySelector('[data-pw="demo-wallet-amount"][data-keyboard-anchor]'),
          "the cash-out amount field did not go into use on focus",
        ).not.toBeNull(),
      );
      expect(
        (await pick("demo-wallet-amount")).style.marginTop,
        "the amount field moved when the keyboard came up",
      ).toBe(resting);
    }));

  it("cash in, From My rdb: the button keeps its place at the bottom while the amount is typed", async () => {
    const width = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 440 });
    try {
      const { container } = openOn("settings/wallet");
      fireEvent.click(container.querySelector('[data-pw="demo-wallet-card-usd"]')!);
      fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-in-usd"]')!);
      fireEvent.click(await pick("demo-wallet-way-rdb"));
      fireEvent.click(await pick("demo-wallet-cash-in-tab-bank"));
      const form = () =>
        document.body.querySelector<HTMLElement>(
          '[data-pw="demo-wallet-cash-in-rdb-under"] > div',
        )!;
      const resting = (await pick("demo-wallet-cash-in-rdb-under")) && form().style.minHeight;
      expect(resting, "the form is not as tall as the board before typing").not.toBe("");

      fireEvent.focus(await pick("demo-wallet-cash-in-amount-input"));
      await waitFor(() =>
        expect(
          document.body.querySelector('[data-pw="demo-wallet-cash-in-amount"][data-keyboard-anchor]'),
          "the amount field did not go into use on focus",
        ).not.toBeNull(),
      );
      expect(
        form().style.minHeight,
        "the form lost its height while typing, so the button moved up under the field",
      ).toBe(resting);
      // The room for the keyboard must not be inside the form's own box: there
      // it takes the free height, and the button block ends up under the field.
      expect(
        form().lastElementChild?.getAttribute("aria-hidden"),
        "an empty block sits after the button block inside the form, so the keyboard pushes the button up",
      ).not.toBe("true");
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    }
  });

  // Seen on the iPhone: Safari 26 draws nothing of a FIXED layer under the
  // window's end but a plain colour, so a fixed sheet was a solid white block
  // under Safari's bar and its rows were cut at the window's end. Only what
  // is in the document is drawn under the bar. So a layer is in the document:
  // `absolute` on <body>, at the place the page is scrolled to (the page is
  // held still while the layer is open).
  it("a sheet is in the document, at the place the page is scrolled to, and not fixed to the window", () => {
    scrollY = 300;
    render(
      <Sheet open onClose={() => {}} y={400} testId="sheet-doc">
        <span>a</span>
      </Sheet>,
    );
    const layer = document.body.querySelector<HTMLElement>(
      '[data-pw="sheet-doc"]',
    );
    expect(layer, "the open sheet was not drawn").not.toBeNull();
    const anchor = layer!.parentElement!;
    expect(
      anchor.parentElement,
      "the sheet's layer does not hang on <body>",
    ).toBe(document.body);
    expect(
      anchor.style.position,
      "the sheet's layer is fixed to the window; Safari draws only a plain colour for it under its bar",
    ).toBe("absolute");
    expect(
      anchor.style.top,
      "the sheet's layer is not at the place the page is scrolled to, so it is off the screen",
    ).toBe("300px");

    // The page moved all the same (a browser that does not hold it still).
    scrollY = 340;
    fireEvent.scroll(window);
    expect(
      anchor.style.top,
      "the sheet's layer did not follow the page when it scrolled under the open sheet",
    ).toBe("340px");
  });

  // Safari draws under its bar only what the DOCUMENT holds there. A sheet
  // opened on a page as tall as the window hung past the document's end, and
  // Safari showed the page's background colour there instead. So an open
  // layer keeps a block in the document's flow that makes the document reach
  // UNDER_BAR px past the window's end, where the sheet's tail lies.
  it("an open sheet makes the document itself reach under Safari's bar", () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    scrollY = 300;
    // A phone: the block is only for a device that can have Safari's bar.
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 5,
    });
    render(
      <Sheet open onClose={() => {}} y={400} testId="sheet-room">
        <span>a</span>
      </Sheet>,
    );
    const room = document.body.querySelector<HTMLElement>(
      '[data-pw="demo-doc-room"]',
    );
    expect(
      room,
      "the open sheet keeps no block in the document's flow, so the document ends above Safari's bar",
    ).not.toBeNull();
    expect(
      room!.parentElement,
      "the block is not in <body>'s own flow",
    ).toBe(document.body);
    expect(
      room!.style.position,
      "the block is taken out of the flow, so it does not make the document taller",
    ).toBe("");
    expect(
      room!.style.height,
      "the document does not reach the sheet's tail: the page's scroll + the window + the part under the bar",
    ).toBe(`${300 + 800 + UNDER_BAR}px`);
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });
  });

  it("with a mouse the document is left as it is: no block, so no scrollbar comes with an open sheet", () => {
    render(
      <Sheet open onClose={() => {}} y={400} testId="sheet-no-room">
        <span>a</span>
      </Sheet>,
    );
    expect(
      document.body.querySelector('[data-pw="sheet-no-room"]'),
      "the open sheet was not drawn",
    ).not.toBeNull();
    expect(
      document.body.querySelector('[data-pw="demo-doc-room"]'),
      "a device with no touch got the block; it makes a short page scroll and a scrollbar appear",
    ).toBeNull();
  });

  // The site's <html> carries `overflow-x: clip` (a class in the [lang]
  // layout). /demo does not need it: its page column clips itself. A clip
  // on the root is one more thing between the document and what Safari 26
  // draws under its bar, so the shell takes it off while the demo is open.
  it("takes the site's sideways clip off <html> while the demo is open, and gives it back", () => {
    const { unmount } = openOn("home");
    const html = document.documentElement;
    expect(
      html.style.getPropertyValue("overflow-x"),
      "<html> keeps the site's `overflow-x: clip` while the demo is open",
    ).toBe("visible");
    expect(
      html.style.getPropertyPriority("overflow-x"),
      "the site's class is `!important`, so the demo's value must be too",
    ).toBe("important");
    unmount();
    expect(
      html.style.getPropertyValue("overflow-x"),
      "the demo left its own value on <html> after it closed",
    ).toBe("");
  });

  // On the iPhone the window (innerHeight) ends ABOVE Safari 26's floating
  // bar. A sheet that ends with the window leaves the page showing under the
  // bar. So the sheet's white panel and its backdrop run UNDER_BAR px past the
  // window's end, and Safari's glass bar lies over the sheet.
  it("a sheet's panel and its backdrop run on past the window's end, under Safari's bar", () => {
    render(
      <Sheet open onClose={() => {}} y={400} testId="sheet-tail">
        <span>a</span>
      </Sheet>,
    );
    const layer = document.body.querySelector<HTMLElement>(
      '[data-pw="sheet-tail"]',
    );
    expect(layer, "the open sheet was not drawn").not.toBeNull();
    const panel = layer!.querySelector<HTMLElement>(
      '[data-pw="demo-sheet-panel"]',
    );
    expect(panel, "the sheet has no panel").not.toBeNull();
    expect(
      panel!.style.bottom,
      "the sheet's panel ends with the window, so the page shows under Safari's bar",
    ).toBe(`-${UNDER_BAR}px`);
    const backdrop = layer!.querySelector<HTMLElement>(
      '[data-pw="demo-sheet-backdrop"]',
    );
    expect(backdrop, "the sheet has no backdrop").not.toBeNull();
    expect(
      backdrop!.style.bottom,
      "the sheet's backdrop ends with the window, so the page under Safari's bar is not dimmed",
    ).toBe(`-${UNDER_BAR}px`);
  });

  it("cash in: the scrolling part of a step runs under Safari's bar and keeps room to scroll its end back over it", () => {
    const { container } = openOn("settings/wallet");
    fireEvent.click(
      container.querySelector('[data-pw="demo-wallet-card-usd"]')!,
    );
    fireEvent.click(
      container.querySelector('[data-pw="demo-wallet-cash-in-usd"]')!,
    );
    const step = document.body.querySelector<HTMLElement>(
      '[data-pw="demo-wallet-cash-in-ways"]',
    );
    expect(step, "Cash In did not open on its first step").not.toBeNull();
    expect(
      step!.style.height,
      "the step ends with the window, so nothing of it shows under Safari's bar",
    ).toContain(`${UNDER_BAR}px`);
    const room = step!.querySelector<HTMLElement>(
      '[data-pw="demo-under-bar-room"]',
    );
    expect(
      room,
      "the scrolling part has no room at its end, so its last rows stay under Safari's bar",
    ).not.toBeNull();
    expect(
      room!.style.height,
      "the room at the end of the scrolling part is not as tall as the part under the bar",
    ).toBe(`${UNDER_BAR}px`);
  });

  // Safari 26 hit-tests the middle of the bottom edge and walks up to the
  // first fixed or sticky box that is about as wide as the screen. When it
  // finds one, it covers the room under its own bar with one solid colour:
  // the box's colour, or the page's background colour when the box holds a
  // backdrop-filter. So glass on the way does NOT keep Safari's bar glass; an
  // older test here said it did, and it was wrong. Only "no such box" does
  // (WebKit LocalFrameView::fixedContainerEdges, Page::updateFixedContainerEdges
  // and WKWebView _updateFixedColorExtensionViews). Safari also keeps the last
  // box it found for as long as that box is on the page, so one bad moment
  // (a slide, a bar passing the edge) is enough.
  //
  // A fixed box with no width and no height is "too small" for Safari. The
  // demo hangs every layer on such an anchor.
  it("the tab bar hangs on a fixed anchor with no width, so Safari finds no bar at the bottom edge", () => {
    openOn("settings");
    expect(
      readableAtTheBottom(),
      "a fixed box as wide as the screen is on the page with the tab bar; Safari paints the room under its bar solid",
    ).toEqual([]);
  });

  it("an open sheet hangs on a fixed anchor with no size, and its backdrop is not fixed", () => {
    render(
      <Sheet open onClose={() => {}} y={400} testId="sheet-edge">
        <span>a</span>
      </Sheet>,
    );
    expect(
      document.body.querySelector('[data-pw="sheet-edge"]'),
      "the open sheet was not drawn",
    ).not.toBeNull();
    expect(
      readableAtTheBottom(),
      "the sheet's layer or its backdrop is a fixed box as wide as the screen; Safari paints the room under its bar solid",
    ).toEqual([]);
  });

  it("a screen that slides out hangs on a fixed anchor with no size", () => {
    const { container } = openOn("home");
    pressTab("search");
    expect(
      onStage(container),
      "the slide did not keep the old screen on stage, so this test saw no screen leaving",
    ).toEqual(expect.arrayContaining(["home", "search"]));
    expect(
      readableAtTheBottom(),
      "the screen that slides out is a fixed box the size of the screen; Safari paints the room under its bar in its colour, and keeps it",
    ).toEqual([]);
  });
});

describe("Demo1 layers — a sheet holds the page still", () => {
  /** True when the page was stopped from moving under this touch or wheel. */
  const held = (el: Element, type: "touchMove" | "wheel") =>
    !fireEvent[type](el);

  // The page was held still with `overflow: hidden` on <html>. Seen on the
  // iPhone: while that is set, Safari 26 draws nothing of the document under
  // its floating bar but the page's background colour, so the room under the
  // bar was a plain block whenever a sheet was open. The page is held still by
  // stopping the touch and the wheel instead, and <html> keeps its overflow.
  it("holds the page still by stopping the touch and the wheel, without `overflow: hidden` on <html>, until the last layer closes", async () => {
    const Two = ({ a, b }: { a: boolean; b: boolean }) => (
      <>
        <Sheet open={a} onClose={() => {}} y={400} testId="sheet-a">
          <span>a</span>
        </Sheet>
        <Sheet open={b} onClose={() => {}} y={400} testId="sheet-b">
          <span>b</span>
        </Sheet>
      </>
    );
    const { container, rerender } = render(<Two a b={false} />);
    const html = document.documentElement;
    const sheet = document.body.querySelector('[data-pw="sheet-a"]');
    expect(sheet, "the open sheet was not drawn").not.toBeNull();
    expect(
      container.contains(sheet),
      "the sheet is inside the page, so it would scroll away with it",
    ).toBe(false);
    expect(
      html.style.overflow,
      "<html> is `overflow: hidden` under an open sheet; Safari 26 then draws only a plain colour under its bar",
    ).toBe("");
    const backdrop = sheet!.querySelector('[data-pw="demo-sheet-backdrop"]');
    expect(backdrop, "the sheet has no backdrop").not.toBeNull();
    expect(
      held(backdrop!, "touchMove"),
      "a finger on the dimmed page scrolls the page under the open sheet",
    ).toBe(true);
    expect(
      held(backdrop!, "wheel"),
      "the wheel over the dimmed page scrolls the page under the open sheet",
    ).toBe(true);

    rerender(<Two a b />);
    rerender(<Two a={false} b />);
    expect(
      held(document.body, "touchMove"),
      "the page scrolled again while a second sheet was still open",
    ).toBe(true);

    rerender(<Two a={false} b={false} />);
    await waitFor(
      () =>
        expect(
          held(document.body, "touchMove"),
          "the page did not scroll again after the last sheet closed",
        ).toBe(false),
      { timeout: 3000 },
    );
  });

  it("lets a part of the sheet that scrolls on its own take the touch", () => {
    render(
      <Sheet open onClose={() => {}} y={400} testId="sheet-scroll">
        <div data-pw="own-scroll" style={{ overflowY: "auto" }}>
          <span data-pw="own-row">row</span>
        </div>
      </Sheet>,
    );
    const part = document.body.querySelector<HTMLElement>(
      '[data-pw="own-scroll"]',
    );
    expect(part, "the sheet's own scrolling part was not drawn").not.toBeNull();
    // jsdom lays nothing out: say the part holds more than it shows.
    Object.defineProperty(part!, "scrollHeight", { value: 900 });
    Object.defineProperty(part!, "clientHeight", { value: 300 });
    expect(
      held(part!.querySelector('[data-pw="own-row"]')!, "touchMove"),
      "a finger on the sheet's own scrolling part was stopped, so the sheet does not scroll",
    ).toBe(false);
  });

  it("holds the page when the sheet's own scrolling part is at its end and the wheel goes on", () => {
    render(
      <Sheet open onClose={() => {}} y={400} testId="sheet-end">
        <div data-pw="own-scroll-end" style={{ overflowY: "auto" }}>
          <span>row</span>
        </div>
      </Sheet>,
    );
    const part = document.body.querySelector<HTMLElement>(
      '[data-pw="own-scroll-end"]',
    );
    expect(part, "the sheet's own scrolling part was not drawn").not.toBeNull();
    Object.defineProperty(part!, "scrollHeight", { value: 900 });
    Object.defineProperty(part!, "clientHeight", { value: 300 });
    part!.scrollTop = 600;
    expect(
      !fireEvent.wheel(part!, { deltaY: 120 }),
      "the wheel at the end of the sheet's rows scrolled the page under the sheet",
    ).toBe(true);
    expect(
      !fireEvent.wheel(part!, { deltaY: -120 }),
      "the wheel back up from the end of the sheet's rows was stopped, so the rows do not scroll back",
    ).toBe(false);
  });
});
