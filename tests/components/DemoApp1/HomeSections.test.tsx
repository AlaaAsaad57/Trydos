import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomeSections from "components/DemoApp1/screens/HomeSections";
import type { DemoKey } from "components/DemoApp/demoKeys";

// jsdom has no IntersectionObserver or ResizeObserver; the carousel (embla)
// asks for both.
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("IntersectionObserver", ObserverStub);
vi.stubGlobal("ResizeObserver", ObserverStub);

// jsdom has no layout, so a real Embla finds no slides and no pages. The page
// only asks Embla two things: "which slide are you on?" (the pager follows it)
// and "go to slide i" (a pager tap). This stand-in answers both, so the tests
// check what the page does with the answers. One stand-in is made for each
// slider, in the order the page makes them: the brand carousel, then the store
// grid.
const embla = vi.hoisted(() => {
  type Handler = () => void;
  type FakeApi = {
    snap: number;
    handlers: Record<string, Handler[]>;
    scrollTo: (i: number) => void;
    selectedScrollSnap: () => number;
    rootNode: () => HTMLElement;
    on: (event: string, fn: Handler) => FakeApi;
    off: (event: string, fn: Handler) => FakeApi;
    emit: (event: string) => void;
  };
  const apis: FakeApi[] = [];
  const make = (): FakeApi => {
    const api: FakeApi = {
      snap: 0,
      handlers: {},
      scrollTo(i) {
        api.snap = i;
        api.emit("select");
      },
      selectedScrollSnap: () => api.snap,
      rootNode: () => document.createElement("div"),
      on(event, fn) {
        (api.handlers[event] ??= []).push(fn);
        return api;
      },
      off(event, fn) {
        api.handlers[event] = (api.handlers[event] ?? []).filter((f) => f !== fn);
        return api;
      },
      emit(event) {
        (api.handlers[event] ?? []).forEach((fn) => fn());
      },
    };
    apis.push(api);
    return api;
  };
  return { apis, make };
});

vi.mock("embla-carousel-react", async () => {
  const { useState } = await import("react");
  return {
    default: () => {
      const [api] = useState(() => embla.make());
      return [() => {}, api];
    },
  };
});

vi.mock("embla-carousel-autoplay", () => ({
  default: () => ({ play() {}, stop() {}, reset() {} }),
}));

/*
  The page under the Home header (XD `Home Page – 2`): the stories row, the
  brand-store carousel with its pager, and the store grid.

  The words come from the translation tables, so the named part of a sentence
  ("Turkish Brands", "Zara") is not at a fixed place: Arabic puts it in the
  middle. These tests give the page a table of its own and read where the
  Medium and Bold parts end up.
*/

const ENGLISH: Partial<Record<DemoKey, string>> = {
  "Trydos Stories": "Trydos Stories",
  "Brand Stores": "Brand Stores",
  Stores: "Stores",
  "Turkish brands": "Turkish Brands",
  "Watch. Shop. Share. See it. Tag It !": "Watch. Shop. Share. See It. Tag It !",
  "all {name} collection now !": "All {name} Collection Now !",
  "Shop {brand} collection now !": "Shop {brand} Collection Now !",
};

/** A sentence whose named part sits in the middle, as in the Arabic table. */
const MIDDLE: Partial<Record<DemoKey, string>> = {
  ...ENGLISH,
  "Shop {brand} collection now !": "A {brand} B !",
};

const page = (table: Partial<Record<DemoKey, string>>) =>
  render(<HomeSections t={(key) => table[key] ?? key} />);

describe("Home page sections", () => {
  it("shows the three blocks with their titles and lines", () => {
    page(ENGLISH);
    for (const title of ["Trydos Stories", "Brand Stores", "Stores"]) {
      expect(
        screen.getAllByText(title).length,
        `the title "${title}" is missing from the home page`,
      ).toBeGreaterThan(0);
    }
    expect(
      screen.getByText("Watch. Shop. Share. See It. Tag It", { exact: false }),
      "the stories line is missing",
    ).toBeInTheDocument();
  });

  it("draws the closing ! of a block line Bold", () => {
    page(ENGLISH);
    const head = screen.getByText("Turkish Brands", { selector: "span.font-medium" });
    expect(
      head.closest("bdi")?.querySelector("span.font-bold")?.textContent,
      "the closing ! of the brand-stores line is not Bold",
    ).toBe("!");
  });

  it("draws the named part of a card line Medium and its closing ! Regular", () => {
    page(ENGLISH);
    const zara = document.querySelector('[data-pw="demo-brand-Zara"]')!;
    const label = within(zara as HTMLElement).getByText("Zara", {
      selector: "span.font-medium",
    });
    expect(label.textContent, "the brand name is not the Medium part").toBe(
      "Zara",
    );
    // The file draws the closing ! Regular on a card and Bold in a block line.
    expect(
      zara.querySelector("span.font-bold"),
      "the closing ! of a card line is Bold, but the file draws it Regular",
    ).toBeNull();
    expect(
      zara.textContent,
      "the card line does not read 'Shop Zara Collection Now !'",
    ).toContain("Shop Zara Collection Now !");
  });

  it("puts the named part where the translation puts it", () => {
    page(MIDDLE);
    const zara = document.querySelector('[data-pw="demo-brand-Zara"]')!;
    expect(
      zara.textContent,
      "a translation with the brand in the middle was not kept in its order",
    ).toContain("A Zara B !");
  });

  // jsdom has no layout, so these two read the markup that decides the layout.
  // The screenshots in the change that added them show the result on a phone.
  it("lets a long card line wrap inside its card instead of running past the edge", () => {
    page(ENGLISH);
    const ebebek = document.querySelector('[data-pw="demo-brand-Ebebek"]')!;
    // The line is the card's only positioned <span> (the awning and the logo are <img>s).
    const line = ebebek.querySelector<HTMLElement>("span.absolute");
    expect(line?.textContent, "the store card has no line under its logo").toContain(
      "Ebebek",
    );
    expect(
      line!.className,
      "the card line is kept on one line, so a long translation (Turkish) runs into the next card",
    ).not.toContain("whitespace-nowrap");
    expect(
      line!.style.maxWidth,
      "the card line has no width limit, so it can grow wider than its card",
    ).not.toBe("");
  });

  it("gives each translated line its own text direction, so Arabic reads in order", () => {
    page(MIDDLE);
    const zara = document.querySelector('[data-pw="demo-brand-Zara"]')!;
    const brand = within(zara as HTMLElement).getByText("Zara", {
      selector: "span.font-medium",
    });
    expect(
      brand.closest("bdi")?.textContent,
      "the card line is not isolated in a <bdi>, so an Arabic line with a Latin brand name comes out in the wrong order",
    ).toBe("A Zara B !");
    const head = screen.getByText("Turkish Brands", { selector: "span.font-medium" });
    expect(
      head.closest("bdi")?.textContent,
      "the brand-stores line is not isolated in a <bdi>, so an Arabic line comes out in the wrong order",
    ).toBe("All Turkish Brands Collection Now !");
  });

  it("crops the ring photo by its box, as the file does (offsetY 0.125)", () => {
    page(ENGLISH);
    const ring = document.querySelector(
      '[data-pw="demo-story-Jon Plus"] span img',
    ) as HTMLImageElement | null;
    expect(ring, "the first story card has no ring photo").not.toBeNull();
    // public/styles/globals.css sets `img { object-position: center !important }`
    // for the whole app, so an object-position here is silently dropped and the
    // photo shows centred, 3.5 px higher than the file.
    expect(
      ring!.style.objectPosition,
      "the ring photo relies on object-position, which the app-wide img rule overrides",
    ).toBe("");
    expect(
      [ring!.style.width, ring!.style.height, ring!.style.top],
      "the ring photo is not the 28 x 42 photo at top -3.5 that the file's crop gives",
    ).toEqual(["28px", "42px", "-3.5px"]);
  });

  it("draws the four stories, each with its own name", () => {
    page(ENGLISH);
    for (const name of ["Jon Plus", "Eda Love", "Ella", "Secret"]) {
      expect(
        document.querySelector(`[data-pw="demo-story-${name}"]`),
        `the story card "${name}" is missing`,
      ).not.toBeNull();
    }
  });

  it("has three carousel pages of three brands, and a pager of three", () => {
    page(ENGLISH);
    const pages = document.querySelectorAll(
      '[data-pw^="demo-home-brand-page-"]',
    );
    expect(pages.length, "the carousel does not have three pages").toBe(3);
    expect(
      pages[0].querySelectorAll('[data-pw^="demo-brand-"]').length,
      "a carousel page does not hold three brand cards",
    ).toBe(3);
    for (const i of [0, 1, 2]) {
      expect(
        document.querySelector(`[data-pw="demo-home-pager-${i}"]`),
        `pager dot ${i + 1} is missing`,
      ).not.toBeNull();
    }
  });

  it("moves the pager's pill when the carousel changes page, and a tap on a dot goes to that page", () => {
    embla.apis.length = 0;
    page(ENGLISH);
    const brandCarousel = embla.apis[0];
    const dot = (i: number) =>
      document.querySelector(
        `[data-pw="demo-home-pager-${i}"]`,
      ) as HTMLElement;
    expect(
      dot(0).getAttribute("aria-current"),
      "the first page is not the one on show at the start",
    ).toBe("true");

    // The carousel moves by itself (a swipe or the auto slide).
    act(() => {
      brandCarousel.snap = 2;
      brandCarousel.emit("select");
    });
    expect(
      dot(2).getAttribute("aria-current"),
      "the carousel moved to its third page but the pager did not follow",
    ).toBe("true");
    expect(
      dot(0).getAttribute("aria-current"),
      "the pager still shows the first page after the carousel moved away",
    ).toBe("false");

    // A tap on a dot.
    fireEvent.click(dot(1));
    expect(
      brandCarousel.snap,
      "a tap on the second dot did not send the carousel to its second page",
    ).toBe(1);
    expect(
      dot(1).getAttribute("aria-current"),
      "the pager did not show the page it was tapped to",
    ).toBe("true");
  });

  it("has four store columns of three; only the first two have logos", () => {
    page(ENGLISH);
    const grid = document.querySelector('[data-pw="demo-home-store-grid"]')!;
    // grid > the sliding track > one slide for each column > its stack of cards
    const columns = Array.from(grid.firstElementChild!.children);
    expect(
      columns.map((c) => c.firstElementChild!.children.length),
      "a store column does not hold three cards",
    ).toEqual([3, 3, 3, 3]);
    for (const brand of ["Ebebek", "Boyner", "Sephora", "Gratis", "Beymen", "Rossmann"]) {
      expect(
        within(grid as HTMLElement).queryByAltText(brand),
        `the logo of ${brand} is missing from the store grid`,
      ).not.toBeNull();
    }
    // `Home Page – 2` names these cards but draws no logo on them.
    for (const column of [2, 3]) {
      expect(
        columns[column].querySelectorAll("img[alt]:not([alt=''])").length,
        `store column ${column + 1} draws a logo the file does not`,
      ).toBe(0);
    }
  });
});
