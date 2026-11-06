import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomeSections, {
  AddStoryCard,
  BrandCard,
  bandLogo,
  type HomeCard,
  type HomeStoryCard,
} from "components/DemoApp1/screens/HomeSections";
import type { DemoKey } from "components/DemoApp/demoKeys";
import { setRoute } from "../../mocks/nextNavigation";

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
    /** How many slides the slider has (Embla's snap list). */
    snaps: number;
    handlers: Record<string, Handler[]>;
    scrollTo: (i: number) => void;
    selectedScrollSnap: () => number;
    scrollSnapList: () => number[];
    rootNode: () => HTMLElement;
    on: (event: string, fn: Handler) => FakeApi;
    off: (event: string, fn: Handler) => FakeApi;
    emit: (event: string) => void;
  };
  const apis: FakeApi[] = [];
  const make = (): FakeApi => {
    const api: FakeApi = {
      snap: 0,
      snaps: 3,
      handlers: {},
      scrollTo(i) {
        api.snap = i;
        api.emit("select");
      },
      selectedScrollSnap: () => api.snap,
      scrollSnapList: () => Array.from({ length: api.snaps }, (_, i) => i),
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
  /** The options each slider gave Embla, in the order the page made them. */
  const options: any[] = [];
  return { apis, make, options };
});

vi.mock("embla-carousel-react", async () => {
  const { useState } = await import("react");
  return {
    default: (options: any) => {
      const [api] = useState(() => embla.make());
      embla.options.push(options);
      return [() => {}, api];
    },
  };
});

vi.mock("embla-carousel-autoplay", () => ({
  default: () => ({ play() {}, stop() {}, reset() {} }),
}));

/*
  The page under the Home header (XD `Home Page – 2`): the stories row, the
  brand-store carousel with its pager, and the store grid. It draws the data
  it is given: real data on the app (Stage 7), the file's own on /demo.

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

const logo = (slug: string) => ({ src: `/logos/${slug}.svg`, w: 100, h: 20, top: 65 });
const brand = (name: string, withLogo = true): HomeCard => ({
  slug: name.toLowerCase(),
  name,
  logo: withLogo ? logo(name.toLowerCase()) : undefined,
});

/** Nine brand stores: three carousel pages. */
const BRANDS = ["Zara", "Mango", "Vakko", "Lcw", "Defacto", "Koton", "Mavi", "Colins", "Ipekyol"].map(
  (n) => brand(n),
);

/** Six stores: two grid columns. Gratis has no logo. */
const STORES = [
  brand("Ebebek"),
  brand("Boyner"),
  brand("Sephora"),
  brand("Gratis", false),
  brand("Beymen"),
  brand("Rossmann"),
];

const story = (id: string, seen = false): HomeStoryCard => ({
  id,
  name: `Person ${id}`,
  cover: `/covers/${id}.jpg`,
  avatar: `/people/${id}.jpg`,
  seen,
});

const STORIES = [story("1"), story("2", true)];

type Props = Partial<React.ComponentProps<typeof HomeSections>>;

const page = (table: Partial<Record<DemoKey, string>>, props: Props = {}) =>
  render(
    <HomeSections
      t={(key) => table[key] ?? key}
      stories={STORIES}
      brands={BRANDS}
      stores={STORES}
      {...props}
    />,
  );

const slugsIn = (root: Element) =>
  Array.from(root.querySelectorAll('[data-pw^="demo-brand-"]')).map((c) =>
    c.getAttribute("data-pw")!.replace("demo-brand-", ""),
  );

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
    const name = within(zara as HTMLElement).getByText("Zara", {
      selector: "span.font-medium",
    });
    expect(
      name.closest("bdi")?.textContent,
      "the card line is not isolated in a <bdi>, so an Arabic line with a Latin brand name comes out in the wrong order",
    ).toBe("A Zara B !");
    const head = screen.getByText("Turkish Brands", { selector: "span.font-medium" });
    expect(
      head.closest("bdi")?.textContent,
      "the brand-stores line is not isolated in a <bdi>, so an Arabic line comes out in the wrong order",
    ).toBe("All Turkish Brands Collection Now !");
  });
});

describe("Home stories row", () => {
  it("draws one card for each person it is given, with the person's name", () => {
    page(ENGLISH);
    for (const name of ["Person 1", "Person 2"]) {
      expect(
        document.querySelector(`[data-pw="demo-story-${name}"]`),
        `the story card "${name}" is missing`,
      ).not.toBeNull();
    }
  });

  it("shows the story's own picture on its card", () => {
    page(ENGLISH);
    const cover = document.querySelector(
      '[data-pw="demo-story-Person 1"] div img',
    ) as HTMLImageElement | null;
    expect(cover?.getAttribute("src"), "the card does not show its story's picture").toBe(
      "/covers/1.jpg",
    );
  });

  it("crops the ring photo by its box, as the file does (offsetY 0.125)", () => {
    page(ENGLISH);
    const ring = document.querySelector(
      '[data-pw="demo-story-Person 1"] [data-pw="demo-story-ring"] img',
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

  it("shows the person's photo in the ring, and the default picture when there is none", () => {
    page(ENGLISH, { stories: [story("1"), { ...story("3"), avatar: null }] });
    const ringPhoto = (name: string) =>
      document
        .querySelector(`[data-pw="demo-story-${name}"] [data-pw="demo-story-ring"] img`)
        ?.getAttribute("src");
    expect(ringPhoto("Person 1"), "the ring does not show the person's photo").toBe(
      "/people/1.jpg",
    );
    expect(
      ringPhoto("Person 3"),
      "a person with no photo must show the default picture, as the live bar does",
    ).toBe("/images/profileNoSmall.png");
  });

  it("draws an orange ring for a person with a story not seen yet (S7-10)", () => {
    page(ENGLISH);
    const ring = document.querySelector(
      '[data-pw="demo-story-Person 1"] [data-pw="demo-story-ring"]',
    ) as HTMLElement;
    expect(ring.style.background, "an unseen person's ring is not the file's orange").toBe(
      "rgb(255, 171, 98)",
    );
  });

  it("draws a grey ring for a person whose stories are all seen (S7-10)", () => {
    page(ENGLISH);
    const ring = document.querySelector(
      '[data-pw="demo-story-Person 2"] [data-pw="demo-story-ring"]',
    ) as HTMLElement;
    expect(ring.style.background, "a person with every story seen must have the grey ring").toBe(
      "rgb(211, 211, 211)",
    );
  });

  it("gives every card the file's card 2 style (S7-9)", () => {
    page(ENGLISH);
    const box = document.querySelector('[data-pw="demo-story-Person 2"] > div') as HTMLElement;
    expect(
      [box.style.borderRadius, box.style.boxShadow],
      "a story card is not radius 20 with the 0 3 3 black-at-20% shadow",
    ).toEqual(["20px", "0 3px 3px rgba(0,0,0,0.2)"]);
  });

  it("opens the tapped person's stories", () => {
    const openStory = vi.fn();
    page(ENGLISH, { openStory });
    fireEvent.click(document.querySelector('[data-pw="demo-story-Person 2"]')!);
    expect(openStory, "a tap on person 2's card must open person 2's stories").toHaveBeenCalledWith(
      "2",
    );
  });

  it("shows grey cards and no person while the stories load", () => {
    page(ENGLISH, { stories: null });
    expect(
      document.querySelector('[data-pw="demo-story-skeleton"]'),
      "while the stories load the row must show its grey cards",
    ).not.toBeNull();
    expect(
      document.querySelector('[data-pw^="demo-story-Person"]'),
      "no person's card may show before the stories arrive",
    ).toBeNull();
  });

  it("draws the add-story card before the first person (S7-5)", () => {
    page(ENGLISH, {
      addStory: <AddStoryCard label="Add Story" busy={false} onAdd={() => {}} />,
    });
    const row = document.querySelector('[data-pw="demo-home-stories"]')!;
    expect(
      row.firstElementChild?.getAttribute("data-pw"),
      "the add-story card must be the first card of the row",
    ).toBe("Add-Story-Button");
  });

  it("draws the next-page loader after the last person", () => {
    page(ENGLISH, { storiesTail: <span data-pw="stories-more" /> });
    const row = document.querySelector('[data-pw="demo-home-stories"]')!;
    expect(
      row.lastElementChild?.getAttribute("data-pw"),
      "the next page's loader must come after the last card",
    ).toBe("stories-more");
  });
});

describe("AddStoryCard (S7-5)", () => {
  it("calls its action on a tap", () => {
    const onAdd = vi.fn();
    render(<AddStoryCard label="Add Story" busy={false} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Story" }));
    expect(onAdd, "a tap on the add-story card did not start adding a story").toHaveBeenCalled();
  });

  it("shows a spinner instead of the plus while a story uploads", () => {
    render(<AddStoryCard label="Add Story" busy onAdd={() => {}} />);
    expect(
      document.querySelector('[data-pw="add-story-spinner"]'),
      "the card shows no spinner while a new story uploads",
    ).not.toBeNull();
  });
});

describe("Home brand carousel", () => {
  it("puts the brands on pages of three, in order", () => {
    page(ENGLISH);
    const pageSlugs = [0, 1, 2].map((i) =>
      slugsIn(document.querySelector(`[data-pw="demo-home-brand-page-${i}"]`)!),
    );
    expect(pageSlugs, "the carousel pages do not hold the brands three by three, in order").toEqual([
      ["Zara", "Mango", "Vakko"],
      ["Lcw", "Defacto", "Koton"],
      ["Mavi", "Colins", "Ipekyol"],
    ]);
  });

  it("has a pager dot for each page and no more", () => {
    page(ENGLISH, { brands: BRANDS.slice(0, 4) });
    expect(
      document.querySelector('[data-pw="demo-home-pager-1"]'),
      "4 brands make 2 pages, so the second dot must be there",
    ).not.toBeNull();
    expect(
      document.querySelector('[data-pw="demo-home-pager-2"]'),
      "4 brands make 2 pages, so there must be no third dot",
    ).toBeNull();
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
});

describe("Home store grid", () => {
  it("fills the columns from the top, three to a column, in order", () => {
    page(ENGLISH);
    const columnSlugs = [0, 1].map((i) =>
      slugsIn(document.querySelector(`[data-pw="demo-home-store-column-${i}"]`)!),
    );
    expect(columnSlugs, "the grid columns do not hold the stores three by three, in order").toEqual([
      ["Ebebek", "Boyner", "Sephora"],
      ["Gratis", "Beymen", "Rossmann"],
    ]);
  });

  it("draws the logo of a store that has one", () => {
    page(ENGLISH);
    const grid = document.querySelector('[data-pw="demo-home-store-grid"]')!;
    expect(
      within(grid as HTMLElement).queryByAltText("Ebebek"),
      "the logo of Ebebek is missing from the store grid",
    ).not.toBeNull();
  });

  it("draws no logo for a store that has none", () => {
    page(ENGLISH);
    expect(
      within(
        document.querySelector('[data-pw="demo-brand-Gratis"]') as HTMLElement,
      ).queryByAltText("Gratis"),
      "Gratis has no logo, but the card draws one",
    ).toBeNull();
  });

  it("shows the name in the logo band for a store with no logo, when asked (S7-11)", () => {
    page(ENGLISH, { nameMark: true });
    const gratis = document.querySelector('[data-pw="demo-brand-Gratis"]') as HTMLElement;
    expect(
      gratis.querySelector("span.font-medium.whitespace-nowrap")?.textContent,
      "a store with no logo must show its name in the logo band",
    ).toBe("Gratis");
  });

  it("asks for more stores when the grid reaches its last columns (S7-7)", () => {
    embla.apis.length = 0;
    const onStoresEnd = vi.fn();
    page(ENGLISH, { onStoresEnd });
    const grid = embla.apis[1];
    onStoresEnd.mockClear();
    act(() => {
      grid.snaps = 6;
      grid.snap = 3;
      grid.emit("select");
    });
    expect(onStoresEnd, "column 4 of 6 is not near the end, so no read may start").not.toHaveBeenCalled();
    act(() => {
      grid.snap = 4;
      grid.emit("select");
    });
    expect(onStoresEnd, "column 5 of 6 is near the end, so the next stores must be asked for").toHaveBeenCalled();
  });
});

describe("BrandCard logo (S7-11)", () => {
  it("draws a boutique icon in the file's logo band: 20 high, its own width, inside the card", () => {
    render(
      <BrandCard t={(k) => k} brand="Shop" logo={bandLogo("/icons/shop.png")} />,
    );
    const img = screen.getByAltText("Shop") as HTMLImageElement;
    expect(
      [img.style.top, img.style.height, img.style.width, img.style.maxWidth],
      "the icon is not in the band at top 65, 20 high, with its own width and kept inside the card",
    ).toEqual(["65px", "20px", "auto", "calc(100% - 16px)"]);
  });

  it("keeps the file's own box for a /demo logo", () => {
    render(<BrandCard t={(k) => k} brand="Zara" logo={logo("zara")} />);
    const img = screen.getByAltText("Zara") as HTMLImageElement;
    expect(
      [img.getAttribute("width"), img.style.width],
      "a /demo logo must keep the file's width and no auto width",
    ).toEqual(["100", ""]);
  });
});

describe("Home body in Arabic and Kurdish (A-13, A-15)", () => {
  const arabic = () => setRoute({ params: { lang: "sy-ar" }, pathname: "/sy-ar" });

  it("runs both sliders from the right on an Arabic page, so a swipe works the other way", () => {
    arabic();
    embla.options.length = 0;
    page(ENGLISH);
    expect(
      embla.options.slice(0, 2).map((o) => o.direction),
      "the brand carousel and the store grid must both run right to left in Arabic",
    ).toEqual(["rtl", "rtl"]);
  });

  it("runs both sliders from the left on an English page", () => {
    embla.options.length = 0;
    page(ENGLISH);
    expect(
      embla.options.slice(0, 2).map((o) => o.direction),
      "the brand carousel and the store grid must run left to right in English",
    ).toEqual(["ltr", "ltr"]);
  });

  it("places the purple and blue bars on the start edge, not the physical left", () => {
    page(ENGLISH);
    for (const id of ["demo-home-brand-carousel", "demo-home-store-grid"]) {
      const bar = document.querySelector(`[data-pw="${id}"]`)!.nextElementSibling as HTMLElement;
      expect(
        [bar.style.left, bar.style.insetInlineStart],
        `the bar beside ${id} must sit on the start edge (inset-inline-start 0), not left 0`,
      ).toEqual(["", "0px"]);
    }
  });

  it("centres a card's contents from the start edge, with no left/translate that stays put in Arabic", () => {
    page(ENGLISH);
    const zara = document.querySelector('[data-pw="demo-brand-Zara"]')!;
    const column = zara.querySelector('[data-pw="brand-card-column"]') as HTMLElement;
    expect(
      [column.style.insetInlineStart, column.style.width],
      "a carousel card's contents must centre in a 218 px box from the start edge (x 109)",
    ).toEqual(["0px", "218px"]);
    expect(
      zara.innerHTML.includes("translateX"),
      "a card part is still moved by translateX, which does not mirror in Arabic",
    ).toBe(false);
  });

  it("places the block tabs, marks and title pills from the start edge", () => {
    page(ENGLISH);
    const pill = screen.getByText("Brand Stores", { selector: "span.absolute" }) as HTMLElement;
    expect(
      [pill.style.left, pill.style.insetInlineStart],
      "the title pill must sit 40 px from the start edge, not 40 px from the left",
    ).toEqual(["", "40px"]);
  });
});
