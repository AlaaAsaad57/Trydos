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
    expect(
      bar!.style.left,
      "the tab bar does not keep the file's 22 px from the left edge",
    ).toContain("22px");
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
