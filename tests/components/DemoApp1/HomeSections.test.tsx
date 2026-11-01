import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("draws the named part of a card line Medium and the closing ! Bold", () => {
    page(ENGLISH);
    const zara = document.querySelector('[data-pw="demo-brand-Zara"]')!;
    const label = within(zara as HTMLElement).getByText("Zara", {
      selector: "span.font-medium",
    });
    expect(label.textContent, "the brand name is not the Medium part").toBe(
      "Zara",
    );
    const bold = zara.querySelector("span.font-bold");
    expect(bold?.textContent, "the closing ! of the card line is not Bold").toBe(
      "!",
    );
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
    const row = document.querySelector(
      '[data-pw="demo-home-brand-carousel"]',
    )!;
    expect(row.children.length, "the carousel does not have three pages").toBe(
      3,
    );
    expect(
      row.children[0].querySelectorAll('[data-pw^="demo-brand-"]').length,
      "a carousel page does not hold three brand cards",
    ).toBe(3);
    for (const i of [0, 1, 2]) {
      expect(
        document.querySelector(`[data-pw="demo-home-pager-${i}"]`),
        `pager dot ${i + 1} is missing`,
      ).not.toBeNull();
    }
  });

  it("moves the pager's pill with the carousel's scroll", () => {
    page(ENGLISH);
    const row = document.querySelector(
      '[data-pw="demo-home-brand-carousel"]',
    ) as HTMLElement;
    // jsdom has no layout: give a page the width the file gives it.
    Object.defineProperty(row.firstElementChild!, "offsetWidth", {
      value: 418,
    });
    const dot = (i: number) =>
      document.querySelector(
        `[data-pw="demo-home-pager-${i}"]`,
      ) as HTMLElement;
    expect(
      dot(0).getAttribute("aria-current"),
      "the first page is not the one on show at the start",
    ).toBe("true");
    row.scrollLeft = 840; // two pages and the gaps: 2 * (418 + 2)
    fireEvent.scroll(row);
    expect(
      dot(2).getAttribute("aria-current"),
      "scrolling the carousel to its third page did not move the pager",
    ).toBe("true");
    expect(
      dot(0).getAttribute("aria-current"),
      "the pager still shows the first page after the carousel scrolled away",
    ).toBe("false");
  });

  it("has four store columns of three; only the first two have logos", () => {
    page(ENGLISH);
    const grid = document.querySelector('[data-pw="demo-home-store-grid"]')!;
    expect(
      Array.from(grid.children).map((c) => c.children.length),
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
        grid.children[column].querySelectorAll("img[alt]:not([alt=''])").length,
        `store column ${column + 1} draws a logo the file does not`,
      ).toBe(0);
    }
  });
});
