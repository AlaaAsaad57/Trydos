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

// The real slider (Embla) still runs. This wrapper only notes which options
// each slider was made with, by the box it moves, so a test can ask how a row
// on the page behaves under a swipe (jsdom cannot swipe).
const sliderOptions = vi.hoisted(() => new WeakMap<Element, Record<string, unknown>>());
vi.mock("embla-carousel-react", async (importOriginal) => {
  const real = (await importOriginal<typeof import("embla-carousel-react")>()).default;
  const { useCallback, useRef } = await import("react");
  const useNotedSlider = (...args: Parameters<typeof real>) => {
    const [ref, api] = real(...args);
    const options = useRef<Record<string, unknown>>({});
    options.current = (args[0] ?? {}) as Record<string, unknown>;
    const noted = useCallback(
      (node: HTMLElement | null) => {
        if (node) sliderOptions.set(node, options.current);
        ref(node);
      },
      [ref],
    );
    return [noted, api];
  };
  return { default: useNotedSlider };
});

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

  it("slides a product's page in from the store page as one Home slide, the same as the store page, and slides the store page back on back", async () => {
    // A product card box the browser could measure: the page still must not
    // grow from it. The move must be the one between Home and a store's page.
    const measure = vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: Element) {
        const isCard = (this.getAttribute("data-pw") ?? "").startsWith("demo-listing-product-");
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
    try {
      const { container, rerender } = openOn("store/zara");
      const card = container.querySelector<HTMLElement>('[data-pw="demo-listing-product-shirt-1"]');
      expect(card, "the store page has no shirt-1 card to open").not.toBeNull();
      fireEvent.click(card!);

      const entering = frameOf(container, "store/zara/shirt-1");
      expect(entering, "the product page is not on stage after the tap on its card").not.toBeNull();
      expect(
        entering!.style.clipPath,
        `the product page was cut to the card's box (it grows); clip: "${entering!.style.clipPath}"`,
      ).toBe("");
      expect(entering!.style.opacity, "the product page fades in; a Home slide does not fade").toBe("1");
      expect(
        entering!.style.transform,
        `the product page does not start one screen width to the right; transform: "${entering!.style.transform}"`,
      ).toMatch(/translateX\(100%\)/);
      expect(
        onStage(container),
        "the store page left the stage at once; it must slide out beside the product page",
      ).toContain("store/zara");
      expect(
        frameOf(container, "store/zara")!.parentElement!.style.zIndex,
        "the store page is kept under the product page, as if the product page grew over it",
      ).toBe("");

      // The router lands on the product's path.
      url.pathname = "/sy-en/demo/store/zara/shirt-1";
      rerender(<Demo1Shell dictionary={{}}>{null}</Demo1Shell>);
      await waitFor(
        () =>
          expect(onStage(container), "the store page is still on stage after the slide ended").toEqual([
            "store/zara/shirt-1",
          ]),
        { timeout: 3000 },
      );

      const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
      fireEvent.click(container.querySelector('[data-pw="demo-product-back"]')!);
      expect(onStage(container), "back did not bring the store page on stage").toContain("store/zara");
      expect(back, "back did not go through the browser's history").toHaveBeenCalled();
      const store = frameOf(container, "store/zara");
      expect(
        store!.style.transform,
        `the store page does not come back from one screen width to the left; transform: "${store!.style.transform}"`,
      ).toMatch(/translateX\(-100%\)/);
      expect(store!.style.opacity, "the store page fades in on back; a Home slide does not fade").toBe("1");
      const leaving = frameOf(container, "store/zara/shirt-1");
      expect(leaving, "the product page was removed at once instead of sliding out").not.toBeNull();
      expect(
        leaving!.parentElement!.style.zIndex,
        "the product page is put over the store page on back, as if it shrank into its card",
      ).toBe("");
      back.mockRestore();
    } finally {
      measure.mockRestore();
    }
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
      "the banner does not read \"Shop Zara Collection Now !\"",
    ).toContain("Shop Zara Collection Now !");
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
      "shirt-1": ["bag", "1 Item M in Your Bag"],
      "pajama-1": ["best", "! Best Price Last 3 Days!"],
      "shirt-2": ["flash", "Flash Deal | 1d | 12:23:19"],
      "pajama-2": ["best", "! Best Price Last 3 Days!"],
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

  it("lets a swipe on the category row go as far as the finger throws it, not one tile at a time", () => {
    const { container } = openOn("store/zara");
    const row = container.querySelector<HTMLElement>('[data-pw="demo-listing-categories"]');
    expect(row, "the store page has no category row").not.toBeNull();
    const options = sliderOptions.get(row!);
    expect(options, "the category row is not moved by the slider (Embla)").toBeDefined();
    expect(
      options!.dragFree,
      "the category row stops on the next tile after every swipe; it should keep the swipe's speed and stop where it slows down (free scroll)",
    ).toBe(true);
  });

  it("keeps the product photos on the store page one photo per swipe", () => {
    const { container } = openOn("store/zara");
    const photos = container.querySelector<HTMLElement>('[data-pw="demo-listing-photos"]');
    expect(photos, "no product card on the store page has a photo slider").not.toBeNull();
    expect(
      sliderOptions.get(photos!)?.dragFree,
      "a product's photos scroll freely; a swipe should show exactly the next photo",
    ).not.toBe(true);
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

  /**
   * Runs `body` on a phone-width window: the top strip is only put on a touch
   * device (on a desktop it showed as a band across the whole window).
   */
  const onAPhone = async (body: () => Promise<void> | void) => {
    const wide = Object.getOwnPropertyDescriptor(window, "innerWidth");
    const tall = Object.getOwnPropertyDescriptor(Element.prototype, "scrollHeight");
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      get: () => 5000,
    });
    try {
      await body();
    } finally {
      if (wide) Object.defineProperty(window, "innerWidth", wide);
      if (tall) Object.defineProperty(document.documentElement, "scrollHeight", tall);
      else delete (document.documentElement as unknown as Record<string, unknown>).scrollHeight;
    }
  };
  const topStrip = () =>
    document.body.querySelector<HTMLElement>('[data-pw="demo-top-tint"]');
  const WHITE = /^rgba?\(255, 255, 255(, 1)?\)$/;

  it("paints Safari's top bar white while a screen's header is shown, so no page shows above the header", async () => {
    // Seen on the iPhone: Safari 26 draws the page under its top bar, and
    // the header starts under that bar, so photos showed in a band above the
    // white header. A box above the top of the page is cut off by Safari, so
    // the demo's own top strip (topTint.ts) carries the header's white.
    await onAPhone(async () => {
      for (const screen of ["home", "store/zara"] as const) {
        const { unmount } = openOn(screen);
        await waitFor(() =>
          expect(topStrip(), `the "${screen}" screen put no strip at the top for Safari to read`).not.toBeNull(),
        );
        expect(
          topStrip()!.style.visibility,
          `the top strip is hidden while the header of the "${screen}" screen is shown`,
        ).toBe("visible");
        expect(
          topStrip()!.style.backgroundColor,
          `the top strip is not the white of the header on the "${screen}" screen`,
        ).toMatch(WHITE);
        unmount();
        expect(
          topStrip()!.style.visibility,
          `the top strip stays white after the "${screen}" screen is closed`,
        ).toBe("hidden");
      }
    });
  });

  /**
   * Opens the store page on a phone, with a clock the test moves: each scroll
   * step is one frame (about 17 ms) later than the one before.
   */
  const onTheStorePage = async (
    body: (page: {
      container: HTMLElement;
      head: HTMLElement;
      /** Scrolls the window to `y` one frame later, and waits for the page to read it. */
      scrollTo: (y: number) => Promise<void>;
      finger: (down: boolean) => void;
    }) => Promise<void>,
    screen: DemoScreen = "store/zara",
  ) => {
    let clock = 1000;
    const now = vi.spyOn(performance, "now").mockImplementation(() => clock);
    try {
      await onAPhone(async () => {
        const { container } = openOn(screen);
        const head = container.querySelector<HTMLElement>('[data-pw="demo1-head"]');
        expect(head, `the "${screen}" page has no header`).not.toBeNull();
        Object.defineProperty(head!, "offsetHeight", { configurable: true, value: 50 });
        await body({
          container,
          head: head!,
          scrollTo: async (y) => {
            clock += 17;
            scrollY = y;
            fireEvent.scroll(window);
            // The page reads the scroll on the next frame.
            await act(() => new Promise((done) => requestAnimationFrame(() => done(null))));
          },
          finger: (down) => fireEvent(document, new Event(down ? "touchstart" : "touchend")),
        });
      });
    } finally {
      now.mockRestore();
    }
  };

  it("lets the page itself carry the store page's header out on a scroll down, so the header cannot shake", async () => {
    // Seen on the iPhone: the header shook while it moved out. A script set
    // its place on each frame, but Safari scrolls the page on a thread of its
    // own, so the place a script sets is always a frame behind the page. Now
    // the header's sticky box ends where the scroll down began, and Safari
    // itself carries the header out, 1:1 with the page, the way the Facebook
    // app does (measured in its recording: out 1:1, faded from 10 px to 30 px).
    await onTheStorePage(async ({ container, head, scrollTo, finger }) => {
      const strip: string[] = [];
      new MutationObserver(() => strip.push(topStrip()!.style.backgroundColor)).observe(topStrip()!, {
        attributes: true,
        attributeFilter: ["style"],
      });
      const before = head.style.transform;

      finger(true);
      await scrollTo(5);
      expect(
        head.style.transform,
        "a script moved the header on a 5 px scroll down; a move set by script is a frame behind Safari's own scroll, so the header shakes",
      ).toBe(before);
      const limit = container.querySelector<HTMLElement>('[data-pw="demo1-head-limit"]');
      expect(
        limit?.style.height,
        "the header's sticky box does not end where the scroll down began (0 px), so the page does not carry the header out",
      ).toBe("0px");
      expect(head.style.opacity, "the header faded before 10 px of scroll").toBe("1");

      await scrollTo(20);
      expect(head.style.transform, "a script moved the header on a 20 px scroll down").toBe(before);
      expect(head.style.opacity, "the header is not half faded at 20 px, halfway from 10 px to 30 px").toBe("0.5");
      expect(
        topStrip()!.style.backgroundColor,
        "Safari's top bar is no longer white while the header is still half shown",
      ).toMatch(WHITE);

      await scrollTo(25);
      expect(head.style.opacity, "the header is not mostly faded 25 px into a scroll down").toBe("0.25");
      expect(
        topStrip()!.style.visibility,
        "Safari's top bar stays white while the header is mostly faded out",
      ).toBe("hidden");
      expect(
        strip.filter((color) => /rgba\(255, 255, 255, 0\.\d+\)/.test(color)),
        "Safari's top bar was given a part-white colour on a frame of the fade, so Safari changes its bar on every frame",
      ).toEqual([]);

      await scrollTo(400);
      expect(head.dataset.hidden, "the header is not out after a long scroll down").toBe("true");
      expect(head.style.transform, "the hidden header is still in the screen").toBe("translateY(-100%)");
    });
  });

  it("brings the store page's header back on a fast scroll up only, as the Facebook app does", async () => {
    // Measured in the Facebook app's recording: a slow scroll up (3 to 10 px a
    // frame, 250 to 300 px long) leaves the bar out; it comes back once the
    // page moved up about 120 px within 100 ms, with a fade in (120 ms) and a
    // short slide down (170 ms).
    await onTheStorePage(async ({ container, head, scrollTo }) => {
      await scrollTo(2000);
      expect(head.dataset.hidden, "the header is not out after a long scroll down").toBe("true");

      let y = 2000;
      for (let i = 0; i < 50; i += 1) await scrollTo((y -= 6));
      expect(
        head.dataset.hidden,
        "a slow scroll up of 300 px (6 px a frame) brought the header back; the Facebook app keeps it out",
      ).toBe("true");

      await scrollTo((y -= 40));
      await scrollTo((y -= 40));
      expect(head.dataset.hidden, "the header came back on 80 px of a fast scroll up, before 120 px").toBe("true");
      await scrollTo((y -= 40));
      expect(head.dataset.hidden, "a fast scroll up (40 px a frame) did not bring the header back").toBeUndefined();
      expect(head.style.transform, "the header did not slide back into the screen").toBe("translateY(0)");
      expect(head.style.opacity, "the header came back but stays faded").toBe("1");
      expect(head.style.transition, "the header jumped back instead of fading in over 120 ms").toContain(
        "opacity 120ms",
      );
      expect(head.style.transition, "the header jumped back instead of sliding down over 170 ms").toContain(
        "transform 170ms",
      );
      expect(
        container.querySelector<HTMLElement>('[data-pw="demo1-head-limit"]')?.style.height,
        `the header's sticky box does not reach the place it came back at (${y} px), so the page carries it out again`,
      ).toBe(`${y}px`);
      expect(
        topStrip()!.style.backgroundColor,
        "Safari's top bar did not turn white again with the header",
      ).toMatch(WHITE);
    });
  });

  it("runs the product page's header the same way as the store page's: carried out by the page, back on a fast scroll up only", async () => {
    await onTheStorePage(async ({ container, head, scrollTo }) => {
      const before = head.style.transform;
      await scrollTo(5);
      expect(
        head.style.transform,
        "a script moved the product page's header on a 5 px scroll down, so it shakes",
      ).toBe(before);
      expect(
        container.querySelector<HTMLElement>('[data-pw="demo1-head-limit"]')?.style.height,
        "the product page's header has no sticky box that ends where the scroll down began",
      ).toBe("0px");
      await scrollTo(2000);
      expect(head.dataset.hidden, "the product page's header is not out after a long scroll down").toBe("true");
      let y = 2000;
      for (let i = 0; i < 50; i += 1) await scrollTo((y -= 6));
      expect(
        head.dataset.hidden,
        "a slow scroll up of 300 px brought the product page's header back; the store page's stays out",
      ).toBe("true");
      for (let i = 0; i < 3; i += 1) await scrollTo((y -= 40));
      expect(
        head.dataset.hidden,
        "a fast scroll up (40 px a frame) did not bring the product page's header back",
      ).toBeUndefined();
    }, "store/zara/shirt-1");
  });

  it("runs Home's header the same way as the store page's: carried out by the page, back on a fast scroll up only", async () => {
    await onTheStorePage(async ({ container, head, scrollTo }) => {
      const before = head.style.transform;
      await scrollTo(5);
      expect(head.style.transform, "a script moved Home's header on a 5 px scroll down, so it shakes").toBe(before);
      expect(
        container.querySelector<HTMLElement>('[data-pw="demo1-head-limit"]')?.style.height,
        "Home's header has no sticky box that ends where the scroll down began, so the page does not carry it out",
      ).toBe("0px");
      await scrollTo(2000);
      expect(head.dataset.hidden, "Home's header is not out after a long scroll down").toBe("true");
      let y = 2000;
      for (let i = 0; i < 50; i += 1) await scrollTo((y -= 6));
      expect(
        head.dataset.hidden,
        "a slow scroll up of 300 px brought Home's header back; the store page's stays out",
      ).toBe("true");
      for (let i = 0; i < 3; i += 1) await scrollTo((y -= 40));
      expect(head.dataset.hidden, "a fast scroll up (40 px a frame) did not bring Home's header back").toBeUndefined();
    }, "home");
  });

  it("shows the header through Safari's white top strip, so the strip does not cut off the top of Home's picked chip", async () => {
    // Seen on a phone: the strip (12 px, on top of everything) covered the
    // top 3 px of Home's picked chip, which starts 9 px from the top. White
    // multiplied by a colour is that colour, so the strip cannot be seen
    // over the header, and its own colour, which Safari reads, stays white.
    await onAPhone(async () => {
      for (const screen of ["home", "store/zara"] as const) {
        const { unmount } = openOn(screen);
        await waitFor(() =>
          expect(topStrip(), `the "${screen}" screen put no strip at the top for Safari to read`).not.toBeNull(),
        );
        expect(
          topStrip()!.style.mixBlendMode,
          `the white top strip lies over the "${screen}" screen's header as a plain white band, so it hides what the header draws in its top 12 px`,
        ).toBe("multiply");
        expect(
          topStrip()!.style.backgroundColor,
          `the top strip is not plain white on the "${screen}" screen, so Safari does not paint its bar white`,
        ).toMatch(WHITE);
        unmount();
        expect(
          topStrip()!.style.mixBlendMode,
          `the top strip keeps the header's blend after the "${screen}" screen closed`,
        ).toBe("");
      }
    });
  });

  it("brings the store page's header back near the top of the page at any speed", async () => {
    await onTheStorePage(async ({ head, scrollTo }) => {
      await scrollTo(400);
      expect(head.dataset.hidden, "the header is not out after a long scroll down").toBe("true");
      let y = 400;
      while (y > 50) await scrollTo((y -= 6));
      expect(
        head.dataset.hidden,
        "a slow scroll up to the header's height from the top of the page left the header out",
      ).toBeUndefined();
    });
  });

  it("moves a part-way header to the nearer end when the finger lifts, not before", async () => {
    // Our own rule (the recording has no stop part-way): under half of 30 px
    // it comes back, over half it goes out.
    await onTheStorePage(async ({ container, head, scrollTo, finger }) => {
      const limit = () =>
        container.querySelector<HTMLElement>('[data-pw="demo1-head-limit"]')?.style.height;
      finger(true);
      await scrollTo(12);
      await new Promise((done) => setTimeout(done, 300));
      expect(head.style.opacity, "the header snapped while the finger was still on the screen").toBe("0.9");
      expect(limit(), "the header's sticky box moved while the finger was still on the screen").toBe("0px");
      finger(false);
      await waitFor(() =>
        expect(
          limit(),
          "a header 12 px out (under half of 30 px) did not go back to the top of the screen when the finger lifted",
        ).toBe("12px"),
      );
      expect(head.style.opacity, "a header that snapped back in stays faded").toBe("1");
      expect(head.style.transform, "a header that snapped back in is not at the top").toBe("translateY(0)");

      finger(true);
      await scrollTo(37);
      expect(head.style.opacity, "the header is not mostly faded 25 px into a scroll down").toBe("0.25");
      finger(false);
      await waitFor(() =>
        expect(
          head.style.transform,
          "a header 25 px out (over half of 30 px) did not go out when the finger lifted",
        ).toBe("translateY(-100%)"),
      );
      expect(head.dataset.hidden, "a header that went out is not marked hidden").toBe("true");
    });
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
    ).toBe("! Best Price Last 3 Days!");
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
    ).toBe("! Best Price Last 3 Days!");
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
    expect(
      strip()!.style.mixBlendMode,
      "the sheet's grey strip blends with the page under it, so its grey is not the grey Safari's bar shows",
    ).toBe("");

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

describe("Demo1 product page — likes and the rows of cards (XD `Home Page – 49`)", () => {
  /** Opens the product page and waits for the part under the first view (reviews, questions). */
  const openProduct = async () => {
    const view = openOn("store/zara/shirt-1");
    await waitFor(
      () =>
        expect(
          view.container.querySelector('[data-pw="demo-product-reviews"]'),
          "the product page drew no reviews row after the grow",
        ).not.toBeNull(),
      { timeout: 3000 },
    );
    return view;
  };

  const filledOf = (button: Element) => button.querySelector<HTMLElement>('[data-pw="demo-like-filled"]');
  const burstOf = (button: Element) => button.querySelector('[data-pw="demo-like-burst"]');

  it("likes the product on a tap of the heart, with the pop and the burst, and takes the like back on a second tap", async () => {
    const { container } = await openProduct();
    const heart = container.querySelector('[data-pw="demo-product-like"]');
    expect(heart, "the product page has no heart button").not.toBeNull();
    expect(heart!.getAttribute("aria-pressed"), "the product's heart starts liked").toBe("false");
    expect(burstOf(heart!), "the product's heart plays the burst before any tap").toBeNull();

    fireEvent.click(heart!);
    expect(heart!.getAttribute("aria-pressed"), "a tap on the product's heart did not like the product").toBe("true");
    expect(filledOf(heart!)?.style.animation, "the liked product heart does not pop (demo-like-pop)").toContain("demo-like-pop");
    expect(burstOf(heart!), "the liked product heart plays no ring and dots").not.toBeNull();

    fireEvent.click(heart!);
    expect(heart!.getAttribute("aria-pressed"), "a second tap did not take the product's like back").toBe("false");
    expect(filledOf(heart!)?.style.transform, "the filled heart does not shrink away when the like is taken back").toBe("scale(0)");
    expect(burstOf(heart!), "taking the like back plays the burst again").toBeNull();
  });

  it("draws a liked heart in the like red of social apps (#FF3040), not in the dark ink", async () => {
    const { readFileSync } = await import("node:fs");
    for (const file of ["productHeartFilled", "productLoveFilled"]) {
      const svg = readFileSync(`public/assets/demo/xd/${file}.svg`, "utf8");
      expect(svg, `the liked heart ${file}.svg is not filled red (rgb(255,48,64))`).toContain('fill="rgb(255,48,64)"');
      expect(svg, `the liked heart ${file}.svg still has the dark fill (rgb(29,29,29))`).not.toContain("rgb(29,29,29)");
    }

    const { container } = await openProduct();
    const heart = container.querySelector('[data-pw="demo-product-like"]')!;
    fireEvent.click(heart);
    const burst = burstOf(heart)!;
    const ring = burst.firstElementChild as HTMLElement;
    expect(ring.style.border, "the ring of a like is not red").toContain("rgb(255, 48, 64)");
    const dots = [...burst.children].slice(1) as HTMLElement[];
    expect(
      dots.filter((dot) => !dot.style.background.includes("rgb(255, 48, 64)")).map((dot) => dot.style.background),
      "some dots of a like are not red",
    ).toEqual([]);
    const outline = heart.querySelector<HTMLElement>('[data-pw="demo-like-outline"]');
    expect(outline?.style.opacity, "the dark outline still shows around the red liked heart").toBe("0");
  });

  it("likes one review or question card on a tap of its heart, and leaves the other cards as they were", async () => {
    const { container } = await openProduct();
    const likes = [...container.querySelectorAll('[data-pw="demo-product-card-like"]')];
    const first = likes[0];
    expect(first, "the reviews have no like button on their cards").toBeDefined();
    expect(first.closest('[data-pw="demo-product-reviews"]'), "the first card like is not in the reviews row").not.toBeNull();
    expect(
      container.querySelector('[data-pw="demo-product-questions"] [data-pw="demo-product-card-like"]'),
      "the question cards have no like button",
    ).not.toBeNull();
    expect(first.getAttribute("aria-label"), 'the card like has no "Like" label').toBe("Like");

    fireEvent.click(first);
    expect(first.getAttribute("aria-pressed"), "a tap on a review's heart did not like the review").toBe("true");
    expect(filledOf(first)?.style.animation, "the liked review heart does not pop (demo-like-pop)").toContain("demo-like-pop");
    expect(
      likes.slice(1).filter((like) => like.getAttribute("aria-pressed") === "true"),
      "a tap on the first review's heart also liked other cards",
    ).toEqual([]);

    fireEvent.click(first);
    expect(first.getAttribute("aria-pressed"), "a second tap did not take the review's like back").toBe("false");
  });

  it("gives the label rows and the reviews and questions rows no slider hint, and keeps it on the colours", async () => {
    const { container } = await openProduct();
    const HINT = "--row-hint";
    for (const name of ["rating", "trust", "badges", "shipping-pills", "reviews", "questions"]) {
      const row = container.querySelector<HTMLElement>(`[data-pw="demo-product-${name}"]`);
      expect(row, `the product page has no ${name} row`).not.toBeNull();
      expect(row!.className, `the ${name} row still moves its items for the slider hint`).not.toContain(HINT);
    }
    expect(
      container.querySelector<HTMLElement>('[data-pw="demo-product-colors"]')?.className,
      "the colours row lost its slider hint",
    ).toContain(HINT);
  });

  it("makes the photo gallery and the reviews and questions rows the same slider as the store's category row", async () => {
    const { container } = await openProduct();
    for (const name of ["gallery", "reviews", "questions"]) {
      const row = container.querySelector<HTMLElement>(`[data-pw="demo-product-${name}"]`);
      expect(row, `the product page has no ${name} row`).not.toBeNull();
      const options = sliderOptions.get(row!);
      expect(options, `the ${name} row is not moved by the slider (Embla), as the store's category row is`).toBeDefined();
      expect(options!.dragFree, `the ${name} row stops on each item; it should scroll freely like the category row`).toBe(true);
      expect(
        row!.style.touchAction,
        `the ${name} row takes the up-and-down touch too, so the page cannot scroll over it`,
      ).toBe("pan-y pinch-zoom");
    }
  });

  it("writes Home's titles and store lines in Apple's title style, with each brand's name capitalised", () => {
    const { container } = openOn("home");
    const text = container.textContent ?? "";
    for (const words of [
      "Watch. Shop. Share. See It. Tag It !",
      "All Turkish Brands Collection Now !",
      "All Stores Collection Now !",
      "Shop Zara Collection Now !",
      "Shop Boyner Collection Now !",
      "Shop Stradivarius Collection Now !",
    ]) {
      expect(text, `Home does not show "${words}"`).toContain(words);
    }
  });

  it("writes the product page in Apple's title style, and its body text in sentence style", async () => {
    const { container } = await openProduct();
    const page = container.querySelector('[data-pw="demo-product"]');
    expect(page, "the product page is not on screen").not.toBeNull();
    const text = page!.textContent ?? "";
    // Labels: a capital on every word but the small ones in the middle
    // (in, by, of, a); names keep theirs (Turkey, Lebanon, Jun, Feb).
    for (const words of [
      "Made in Turkey",
      "Recommend It by",
      "Buyer Rate",
      "! Best Price",
      "Last 3 Days!",
      "Just 3 Days in Your Hands",
      "In 6 Hours Shipping If Buy in 30 Minute",
      "2.Jun in Lebanon",
      "Pattern | Fit Slim",
      "Material | Polyester 97%",
      "Expected Shipping & Delivery Date",
      "AI Analysis & Summary of All Reviews",
      "Comment . Video . Photo . May Help You !",
      "Buyers Reviews on Product Sizing",
      "Don’t Recommend It",
      "A Zara",
      "18 Feb",
      "13 Minute Answered",
      "Need Help ? Start Chat About This Product !",
    ]) {
      expect(text, `the product page does not show the label "${words}" in title style`).toContain(words);
    }
    // Body text: a capital only at the start of a sentence.
    for (const words of [
      "Stay cool and chic in this airy women’s summer top",
      "Get a 25% cash refund to your wallet",
      "Shipping is completely free without any extras",
      "with complete ease and \nget the amount back to your wallet",
    ]) {
      expect(text, `the product page does not show the body text "${words}" in sentence style`).toContain(words);
    }
  });
});
