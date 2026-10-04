import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The URL the fake router reports. A test changes it and re-renders, which is
// what Next does when a navigation lands or the browser goes back.
const url = vi.hoisted(() => ({ pathname: "/sy-en/demo1", search: "" }));
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
import { DEMO_SCREENS, hrefFor } from "components/DemoApp/demoRoutes";
import { DEBUG_COLORS, resetDemoDebug } from "components/DemoApp/demoDebug";

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
const openOn = (screen: (typeof DEMO_SCREENS)[number]) => {
  const [path, query = ""] = hrefFor("sy-en", screen, "demo1").split("?");
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

let scrollY = 0;
const scrollTo = vi.fn();

beforeEach(() => {
  url.pathname = "/sy-en/demo1";
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
      "/demo1 mounted AppScaler's #app-outer, the fixed box that stops the document scrolling",
    ).toBeNull();
    expect(
      document.getElementById("master-canvas"),
      "/demo1 mounted AppScaler's scaled #master-canvas",
    ).toBeNull();
    const app = container.querySelector<HTMLElement>('[data-pw="demo1-app"]');
    expect(app, "the /demo1 page column is missing").not.toBeNull();
    expect(
      getComputedStyle(app!).position,
      "the /demo1 page column is not in the document flow",
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
      "the shell moved the window back after the shopper scrolled (the /demo pin to 0)",
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

describe("Demo1Shell — navigation, with URLs under /demo1", () => {
  it("opens on the screen the URL names", () => {
    const { container } = openOn("settings/profile");
    expect(
      onStage(container),
      "a direct visit to /demo1/settings/profile did not show the profile menu",
    ).toEqual(["settings/profile"]);
  });

  it("slides to search at once and moves the URL to /demo1?search with no server call", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    const { container } = openOn("home");
    pressTab("search");
    expect(
      onStage(container),
      "search did not come on stage on the same render as the tap",
    ).toContain("search");
    expect(
      pushState,
      "the URL was not moved to /demo1?search with history.pushState",
    ).toHaveBeenCalledWith(null, "", "/sy-en/demo1?search");
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

    // The browser's back lands on /demo1 again.
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

describe("Demo1 screens — fluid pages that the document scrolls", () => {
  // The /demo screens' artboard widths. On /demo1 a block that spans the
  // screen keeps its distance to the edges instead of one of these numbers.
  const ARTBOARD_WIDTHS = ["430px", "406px", "390px", "386px", "382px"];

  for (const screen of DEMO_SCREENS) {
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

describe("Demo1 bottom — like /demo, Safari's bottom bar lies over the app", () => {
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
      "the sheet's layer is not as tall as the window (innerHeight), so it ends above Safari's bar instead of under it as on /demo",
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
  it("draws the sheet on <body> and stops the page scrolling until the last layer closes", async () => {
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
      "the page still scrolls under an open sheet",
    ).toBe("hidden");

    rerender(<Two a b />);
    rerender(<Two a={false} b />);
    expect(
      html.style.overflow,
      "the page scrolled again while a second sheet was still open",
    ).toBe("hidden");

    rerender(<Two a={false} b={false} />);
    await waitFor(
      () =>
        expect(
          html.style.overflow,
          "the page did not scroll again after the last sheet closed",
        ).toBe(""),
      { timeout: 3000 },
    );
  });
});

describe("Demo1 debug buttons — page colour and test pictures", () => {
  afterEach(() => resetDemoDebug());

  const button = (container: HTMLElement, testId: string) => {
    const found = container.querySelector<HTMLElement>(
      `[data-pw="demo-controls"] [data-pw="${testId}"]`,
    );
    expect(found, `the demo's switches have no "${testId}" button`).not.toBeNull();
    return found!;
  };

  it("the colour button paints the document, which Safari 26 takes for its bars, and gives the design's colour back after the last one", () => {
    const { container } = openOn("settings/wallet");
    fireEvent.click(button(container, "demo-debug-color"));
    expect(
      document.documentElement.style.backgroundColor,
      "the first tap did not paint <html> red",
    ).toBe("rgb(255, 59, 48)");
    expect(
      document.body.style.backgroundColor,
      "the first tap did not paint <body> red",
    ).toBe("rgb(255, 59, 48)");

    for (let i = 1; i <= DEBUG_COLORS.length; i++)
      fireEvent.click(button(container, "demo-debug-color"));
    expect(
      document.documentElement.style.backgroundColor,
      "after the last colour <html> did not go back to the wallet's white",
    ).toBe("rgb(255, 255, 255)");
  });

  it("the pictures button puts the test pictures under the wallet's transactions, and takes them away again", () => {
    const { container } = openOn("settings/wallet");
    const pictures = () =>
      container.querySelector('[data-pw="demo-debug-pictures"]');
    expect(pictures(), "test pictures show before the button was tapped").toBeNull();

    fireEvent.click(button(container, "demo-debug-pictures-toggle"));
    expect(
      pictures()?.querySelectorAll("img").length,
      "the pictures button did not put any picture under the wallet",
    ).toBeGreaterThan(0);

    fireEvent.click(button(container, "demo-debug-pictures-toggle"));
    expect(pictures(), "a second tap did not take the pictures away").toBeNull();
  });
});
