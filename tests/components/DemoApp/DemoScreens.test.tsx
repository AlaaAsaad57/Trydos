import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDevice, setDevice } from "../../mocks/device";

// framer-motion reads requestAnimationFrame once, when it loads, and jsdom
// has none. Without it an exit animation never ends, so one screen state can
// never replace another. A timer stands in, so fake timers can drive it.
vi.hoisted(() => {
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16) as unknown as number;
  (globalThis as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
});

// The screens read the URL through the shell, so they are rendered through it
// with the same fake router as DemoShell.test.tsx.
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
vi.mock("scaling/Page", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("NewLoginDesign/DemoDeviceInfoModal", () => ({ default: () => null }));

import DemoShell from "components/DemoApp/DemoShell";

const open = (pathname: string) => {
  url.pathname = pathname;
  return render(<DemoShell dictionary={{}}>{null}</DemoShell>).container;
};

/** Numbers read out of the XD file (Home Page – 9 and – 87). */
describe("Demo screens — numbers from the XD file", () => {
  beforeEach(() => {
    url.search = "";
  });

  it("profile tab: the photo box is 116 x 115 at (290, 136), as `Home Page – 9` draws it", () => {
    const container = open("/sy-en/demo/settings");
    const box = container.querySelector(
      '[data-pw="demo-profile-photo"]',
    ) as HTMLElement | null;
    expect(box, "the profile tab has no photo box").not.toBeNull();
    const card = box!.parentElement as HTMLElement;
    expect(
      card.getAttribute("data-pw"),
      "the photo box is not inside the client card (406 wide at x 12, y 124)",
    ).toBe("demo-profile-card");
    expect(
      card.style.padding,
      "the client card has no 12 px padding at the top and the right, so the photo box is not at (290, 136)",
    ).toBe("12px 12px 0px");
    expect(
      box!.className,
      "the photo box does not sit at the card's right edge",
    ).toContain("ml-auto");
    expect(box!.style.width, "the photo box is not 116 wide").toBe("116px");
    expect(
      box!.style.height,
      "the photo box is not 115 tall (the file draws 116 x 115, not a square)",
    ).toBe("115px");
  });

  it("client information: 'client since' shows the number Medium and the word 'days' Regular, as `Home Page – 87` draws it", () => {
    const container = open("/sy-en/demo/settings/profile/client-info");
    const value = [...container.querySelectorAll("span")].find(
      (el) => el.textContent?.replace(/\s+/g, " ").trim() === "23 days",
    ) as HTMLElement | undefined;
    expect(value, "the 'client since' value '23 days' is not on the screen").toBeDefined();
    const number = [...value!.querySelectorAll("span")].find(
      (el) => el.textContent?.trim() === "23",
    );
    expect(
      number,
      "the number of days is not its own span, so it cannot be Medium while 'days' stays Regular",
    ).toBeDefined();
    expect(
      number!.className,
      "the number of days is not Medium",
    ).toContain("font-medium");
    expect(
      value!.className,
      "the word 'days' is Medium; the file draws only the number Medium and the word Regular",
    ).not.toContain("font-medium");
  });

  it("profile photo: the 1.5 px white line is drawn over the picked photo, as `Home Page – 14` draws it", async () => {
    // jsdom has no object URLs.
    URL.createObjectURL = () => "blob:photo";
    const container = open("/sy-en/demo/settings/photo");
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    expect(input, "the photo screen has no file input").not.toBeNull();
    fireEvent.change(input!, {
      target: { files: [new File(["x"], "me.jpg", { type: "image/jpeg" })] },
    });
    // The "upload" takes 1.6 s, then the preview fades the photo in.
    const img = await waitFor(
      () => {
        const found = container.querySelector('img[src="blob:photo"]');
        if (!found) throw new Error("not yet");
        return found as HTMLElement;
      },
      { timeout: 4000 },
    ).catch(() => null);
    expect(img, "the picked photo is not shown after the upload").not.toBeNull();
    const line = container.querySelector<SVGElement>(
      'svg[data-stroke="#FFFFFF"]',
    );
    expect(line, "the photo box has no white line").not.toBeNull();
    expect(
      line!.querySelector("rect[stroke]")?.getAttribute("stroke-width"),
      "the white line is not 1.5 px inside the box (a 3 px stroke on the edge, the outer half clipped)",
    ).toBe("3");
    expect(
      !!(
        img!.compareDocumentPosition(line!) & Node.DOCUMENT_POSITION_FOLLOWING
      ) && !line!.contains(img!),
      "the white line is on a layer under the photo, so the photo covers it; the file draws it on top",
    ).toBe(true);
  }, 10000);

  it("text sits on the file's baseline: a 14 px line gets an 18 px line box and an 11 px one 14 px (line-height 1.25 drew them 1 px high)", () => {
    const container = open("/sy-en/demo/settings");
    const settings = [...container.querySelectorAll<HTMLElement>("span")].find(
      (el) => el.textContent === "Settings",
    );
    expect(settings, "the profile tab has no 'Settings' row").toBeDefined();
    expect(
      settings!.style.lineHeight,
      "the 14 px 'Settings' row text has no exact line box, so Chrome draws it 1 px above the file's baseline 521",
    ).toBe("18px");
    const orders = [...container.querySelectorAll<HTMLElement>("span")].find(
      (el) => el.textContent === "1 action",
    );
    expect(
      orders?.style.lineHeight,
      "the 11 px '1 action' text has no exact line box, so it sits 1 px above the file's baseline 461",
    ).toBe("14px");
  });

  it("profile tab: with no photo the dark 'Add photo' strip is not clipped, so it ends 1 px below the box as `Home Page – 9` draws it", () => {
    const container = open("/sy-en/demo/settings");
    const box = container.querySelector(
      '[data-pw="demo-profile-photo"]',
    ) as HTMLElement | null;
    expect(box, "the profile tab has no photo box").not.toBeNull();
    expect(
      box!.className,
      "the photo box clips its children, so the strip (230 .. 252) is cut at the box's edge (251) and loses its round corners",
    ).not.toContain("overflow-hidden");
  });

  it("home: the category chips are slots as wide as the file's step between chips (60, 116, 192, 271, 336)", () => {
    const container = open("/sy-en/demo");
    const widths = ["Man", "Women", "Children", "Home"].map(
      (name) =>
        (
          container.querySelector(
            `[data-pw="demo-category-${name}"]`,
          ) as HTMLElement | null
        )?.style.minWidth,
    );
    expect(
      widths,
      "the chips are not placed on the file's x: the slot widths should be 56, 76, 79 and 65 px",
    ).toEqual(["56px", "76px", "79px", "65px"]);
  });

  it("cart and chat: drawn like the empty address page (`Home Page – 96`) — white page, no shadow line, a 14 px Medium title on the crumb baseline, the same grey empty lines", () => {
    for (const tab of ["cart", "chat"] as const) {
      url.search = tab;
      const container = open("/sy-en/demo");
      const page = container.querySelector(
        `[data-pw="demo-${tab}"]`,
      ) as HTMLElement | null;
      expect(page, `the ${tab} screen did not open`).not.toBeNull();
      expect(
        page!.style.background,
        `the ${tab} page is not white; the address page is #FFFFFF`,
      ).toBe("rgb(255, 255, 255)");
      const header = page!.querySelector("header") as HTMLElement;
      expect(
        header.style.boxShadow,
        `the ${tab} header draws a shadow line; the address header has none`,
      ).toBe("");
      const title = header.querySelector("h1") as HTMLElement;
      expect(
        title.style.fontSize,
        `the ${tab} title is not 14 px like 'Profile | Address'`,
      ).toBe("14px");
      expect(
        title.className,
        `the ${tab} title is not Medium like 'Address'`,
      ).toContain("font-medium");
      // An 18 px line box centred on the 50 px strip starts 16 px down, so
      // the 14 px text sits on the crumb baseline, design y 80.
      expect(
        header.className,
        `the ${tab} header does not centre its title on its height, so the title is off the crumb baseline (design y 80)`,
      ).toContain("items-center");
      expect(
        title.style.lineHeight,
        `the ${tab} title's line box is not 18 px, so it is off the crumb baseline (design y 80)`,
      ).toBe("18px");
      const lines = [...page!.querySelectorAll("span, p, div")].filter(
        (e) => (e as HTMLElement).style.color === "rgb(195, 195, 195)",
      ) as HTMLElement[];
      expect(
        lines.map((e) => e.style.fontSize),
        `the ${tab} empty lines are not the address page's 13 px and 11 px`,
      ).toEqual(["13px", "11px"]);
      expect(
        lines[0].className,
        `the ${tab} first empty line is not Medium`,
      ).toContain("font-medium");
      document.body.innerHTML = "";
    }
  });

  // XD shows these gaps as 7 and 5, but it measures from its own text boxes
  // (lineHeight 12 and 20 in the file). In CSS line boxes the same pixels are
  // 7.5 under the mark (it ends at 451.5) and 6 between the lines (475 .. 481).
  // 7 and 5 drew the lines 0.5 and 1.5 px above the file's baselines.
  it("empty address, cart and chat: the grey lines sit on the file's baselines 472 and 492, as `Home Page – 96` draws them", () => {
    const screens = [
      { name: "address", path: "/sy-en/demo/settings/profile/address", search: "", testId: "demo-address-list" },
      { name: "cart", path: "/sy-en/demo", search: "cart", testId: "demo-cart" },
      { name: "chat", path: "/sy-en/demo", search: "chat", testId: "demo-chat" },
    ];
    for (const { name, path, search, testId } of screens) {
      url.search = search;
      const container = open(path);
      const page = container.querySelector(`[data-pw="${testId}"]`);
      expect(page, `the ${name} screen did not open`).not.toBeNull();
      const [message, hint] = [...page!.querySelectorAll<HTMLElement>("span, p, div")].filter(
        (e) => e.style.color === "rgb(195, 195, 195)",
      );
      expect(message, `the ${name} screen has no grey empty message`).toBeDefined();
      expect(hint, `the ${name} screen has no grey hint under the message`).toBeDefined();
      expect(
        message.style.marginTop,
        `the ${name} empty message is off the file's baseline 472 (needs 7.5 px under the mark's box end, 451.5)`,
      ).toBe("7.5px");
      expect(
        hint.style.marginTop,
        `the ${name} hint is off the file's baseline 492 (needs 6 px under the message's line box end, 475)`,
      ).toBe("6px");
      document.body.innerHTML = "";
    }
  });

  // Until the whole form is filled, every field is white with its line, filled
  // or not, as `– 94`, `– 95` and `– 97` draw it. The field in use (focused, or
  // its sheet open) only turns its line blue #388CFF and its label Medium — a
  // product rule. Once the
  // form is complete, every field is #FCFCFC with no line (`– 99`); the field in
  // use keeps its blue line.
  describe("address form: fields drop their line only when the whole form is filled; the field in use is blue", () => {
    const WHITE = "rgb(255, 255, 255)";
    const CARD = "rgb(252, 252, 252)";
    const box = (container: HTMLElement, id: string) => {
      const el = container.querySelector(`[data-pw="${id}"]`) as HTMLElement;
      return el.tagName === "INPUT" ? el.parentElement! : el;
    };
    // A box's line is its own SVG Stroke, faded out when the box has none.
    const lined = (el: HTMLElement) => {
      const stroke = el.querySelector<SVGElement>(":scope > svg[data-stroke]");
      return !!stroke && stroke.style.opacity !== "0";
    };
    const blue = (el: HTMLElement) =>
      lined(el) &&
      el.querySelector(":scope > svg[data-stroke]")!.getAttribute("data-stroke") === "#388CFF";
    // The label is the field's first line of text.
    const medium = (el: HTMLElement) =>
      el.querySelector(":scope > span")!.className.includes("font-medium");
    const type = (container: HTMLElement, id: string, text: string) => {
      const input = container.querySelector(`[data-pw="${id}"]`)!;
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: text } });
    };
    const pickPlace = async (container: HTMLElement) => {
      fireEvent.click(box(container, "demo-address-place"));
      // Province, district, town, street: each list slides in after the last one.
      for (const level of ["province", "district", "town", "street"]) {
        const row = await waitFor(
          () => {
            const found = container.ownerDocument.querySelector(
              '[data-pw="demo-place-0"]',
            );
            if (!found) throw new Error("not yet");
            return found;
          },
          { timeout: 2000 },
        ).catch(() => null);
        expect(row, `the place sheet shows no ${level} to pick`).not.toBeNull();
        fireEvent.click(row!);
        await new Promise((r) => setTimeout(r, 400));
      }
    };
    const FORM = "/sy-en/demo/settings/profile/address/new";

    it("a text field keeps white and its line while it has focus and after it is filled; focus only turns the line blue", () => {
      const container = open(FORM);
      const detail = box(container, "demo-address-detail");
      expect(detail.style.background, "the empty 'Detailed address' field is not white before it has focus").toBe(WHITE);
      expect(lined(detail), "the empty 'Detailed address' field has no line before it has focus").toBe(true);
      expect(blue(detail), "the empty 'Detailed address' field is blue before it has focus; its line is grey").toBe(false);
      expect(medium(detail), "the 'Detailed address' label is Medium before the field has focus").toBe(false);

      fireEvent.focus(container.querySelector('[data-pw="demo-address-detail"]')!);
      expect(
        detail.style.background,
        "the focused, empty 'Detailed address' field is not white; before the form is complete no field changes its background",
      ).toBe(WHITE);
      expect(blue(detail), "the focused, empty 'Detailed address' field has no blue #388CFF line").toBe(true);
      expect(medium(detail), "the focused 'Detailed address' field's label is not Medium").toBe(true);

      type(container, "demo-address-detail", "vadistanbul");
      expect(detail.style.background, "the focused 'Detailed address' field is not white while it is typed in").toBe(WHITE);
      expect(blue(detail), "the focused 'Detailed address' field lost its blue line while it is typed in").toBe(true);

      fireEvent.blur(container.querySelector('[data-pw="demo-address-detail"]')!);
      expect(
        detail.style.background,
        "the filled 'Detailed address' field changed its background after focus left, but the form is not complete yet",
      ).toBe(WHITE);
      expect(
        lined(detail),
        "the filled 'Detailed address' field lost its line after focus left, but the form is not complete yet",
      ).toBe(true);
      expect(blue(detail), "the 'Detailed address' field stayed blue after focus left").toBe(false);
      expect(medium(detail), "the 'Detailed address' label stayed Medium after focus left").toBe(false);
    });

    it("a sheet field with a value and no sheet open stays white with its line, before the form is complete", async () => {
      const container = open(FORM);
      const country = box(container, "demo-address-country");
      expect(
        country.style.background,
        "the country field, which always has a value, is not white before the form is complete",
      ).toBe(WHITE);
      expect(lined(country), "the country field lost its line before the form is complete").toBe(true);

      await pickPlace(container);
      const place = box(container, "demo-address-place");
      expect(
        place.style.background,
        "the picked place field changed its background after its sheet closed, but the form is not complete yet",
      ).toBe(WHITE);
      expect(
        lined(place),
        "the picked place field lost its line after its sheet closed, but the form is not complete yet",
      ).toBe(true);
      expect(blue(place), "the picked place field stayed blue after its sheet closed").toBe(false);
    }, 15000);

    it("the field whose sheet is open gets a blue line and a Medium label and stays white, like a focused text field", () => {
      const container = open(FORM);
      fireEvent.click(box(container, "demo-address-country"));
      const country = box(container, "demo-address-country");
      expect(country.style.background, "the country field is not white while its sheet is open").toBe(WHITE);
      expect(blue(country), "the country field has no blue line while its sheet is open").toBe(true);
      expect(medium(country), "the country field's label is not Medium while its sheet is open").toBe(true);
    });

    it("the place field gets a blue line and a Medium label and stays white while its sheet is open", () => {
      const container = open(FORM);
      fireEvent.click(box(container, "demo-address-place"));
      const place = box(container, "demo-address-place");
      expect(place.style.background, "the place field is not white while its sheet is open").toBe(WHITE);
      expect(blue(place), "the place field has no blue line while its sheet is open").toBe(true);
      expect(medium(place), "the place field's label is not Medium while its sheet is open").toBe(true);
    });

    it("the place sheet's search box turns its line blue while it has focus", () => {
      const container = open(FORM);
      fireEvent.click(box(container, "demo-address-place"));
      const input = container.ownerDocument.querySelector(
        '[data-pw="demo-place-search"]',
      ) as HTMLInputElement | null;
      expect(input, "the place sheet has no search box").not.toBeNull();
      const search = input!.parentElement!;
      expect(blue(search), "the search box is blue before it has focus; its line is grey").toBe(false);
      fireEvent.focus(input!);
      expect(blue(search), "the focused search box has no blue #388CFF line").toBe(true);
      fireEvent.blur(input!);
      expect(blue(search), "the search box stayed blue after focus left").toBe(false);
    });

    it("typing the last letter drops every other line at once, as on `Home Page – 99`; the field in use keeps its blue line", async () => {
      const container = open(FORM);
      await pickPlace(container);
      type(container, "demo-address-detail", "vadistanbul, ofisler");
      fireEvent.blur(container.querySelector('[data-pw="demo-address-detail"]')!);
      // The title keeps focus: the form is complete while the field is in use.
      type(container, "demo-address-title", "My home");

      for (const id of [
        "demo-address-country",
        "demo-address-place",
        "demo-address-detail",
      ]) {
        expect(
          lined(box(container, id)),
          `${id} still has a line on the complete form while 'Address title' has focus; \`Home Page – 99\` draws none`,
        ).toBe(false);
        expect(
          box(container, id).style.background,
          `${id} is not #FCFCFC on the complete form; \`Home Page – 99\` draws every field #FCFCFC`,
        ).toBe(CARD);
      }
      const title = box(container, "demo-address-title");
      expect(
        blue(title),
        "the focused 'Address title' field lost its blue line when the form became complete; the field in use always keeps it",
      ).toBe(true);
      expect(
        title.style.background,
        "the focused 'Address title' field is not #FCFCFC on the complete form",
      ).toBe(CARD);
      expect(
        medium(title),
        "the focused 'Address title' label is not Medium on the complete form",
      ).toBe(true);

      fireEvent.blur(container.querySelector('[data-pw="demo-address-title"]')!);
      expect(lined(title), "the 'Address title' field kept a line on the complete form after focus left").toBe(false);

      // A sheet opened on the complete form puts its field in use too.
      fireEvent.click(box(container, "demo-address-country"));
      expect(
        blue(box(container, "demo-address-country")),
        "the country field has no blue line while its sheet is open on the complete form",
      ).toBe(true);
      fireEvent.click(container.ownerDocument.querySelector('[data-pw="demo-country-tr"]')!);

      // Emptying one field makes the form incomplete: every field is white with its line again.
      type(container, "demo-address-title", "");
      fireEvent.blur(container.querySelector('[data-pw="demo-address-title"]')!);
      for (const id of ["demo-address-country", "demo-address-place", "demo-address-detail", "demo-address-title"]) {
        expect(box(container, id).style.background, `${id} is not white again after the form became incomplete`).toBe(WHITE);
        expect(lined(box(container, id)), `${id} did not get its line back after the form became incomplete`).toBe(true);
      }
    }, 15000);

    it("the map's 0.5 px line is drawn over the map picture, not under it, as `Home Page – 94` and `– 99` draw it", () => {
      const container = open(FORM);
      const img = container.querySelector(
        '[data-pw="demo-address-map"] img',
      ) as HTMLElement | null;
      expect(img, "the map card has no map picture").not.toBeNull();
      const line = img!.parentElement!.querySelector<SVGElement>(
        ':scope > svg[data-stroke="#D3D3D3"]',
      );
      expect(
        line,
        "the map box has no #D3D3D3 line of its own",
      ).not.toBeNull();
      expect(
        !!(img!.compareDocumentPosition(line!) & Node.DOCUMENT_POSITION_FOLLOWING),
        "the map's line is on a layer under the picture, so the picture covers it",
      ).toBe(true);
    });

    it("the map card keeps its line after 'Locate' until the form is complete, like the fields under it", async () => {
      const container = open(FORM);
      fireEvent.click(container.querySelector('[data-pw="demo-address-locate"]')!);
      await pickPlace(container);
      const card = box(container, "demo-address-map");
      expect(
        lined(card),
        "the map card lost its line on 'Locate' while the fields under it still have theirs",
      ).toBe(true);

      type(container, "demo-address-detail", "vadistanbul, ofisler");
      fireEvent.blur(container.querySelector('[data-pw="demo-address-detail"]')!);
      type(container, "demo-address-title", "My home");
      fireEvent.blur(container.querySelector('[data-pw="demo-address-title"]')!);
      const gone = await waitFor(
        () => {
          if (lined(card)) throw new Error("not yet");
          return true;
        },
        { timeout: 2000 },
      ).catch(() => false);
      expect(gone, "the map card still has a line on the complete form; `Home Page – 99` draws none").toBe(true);
    }, 15000);
  });

  it("search: the 'For you' chip is 70 wide, so the next chip starts at x 94 as `Home Page – 1` draws it", () => {
    url.search = "search";
    const container = open("/sy-en/demo");
    const chip = container.querySelector(
      '[data-pw="demo-search-chip-0"]',
    ) as HTMLElement | null;
    expect(chip, "the search screen has no 'For you' chip").not.toBeNull();
    expect(
      chip!.style.minWidth,
      "the 'For you' chip is only as wide as its word, so every chip after it starts 1 px left of the file",
    ).toBe("70px");
  });

  it("profile tab: the buttons in the 2nd and 3rd promo cards are 13 px in, the 1st 12, as `Home Page – 9` draws them", () => {
    const container = open("/sy-en/demo/settings");
    const slider = container.querySelector(
      '[data-pw="demo-profile-slider"]',
    ) as HTMLElement | null;
    expect(slider, "the profile tab has no promo slider").not.toBeNull();
    const buttons = [...slider!.querySelectorAll<HTMLElement>("button")];
    expect(
      buttons.map((b) => b.style.marginLeft),
      "the promo buttons are not at x 24, 435 and 845 (12, 13 and 13 px into their cards)",
    ).toEqual(["12px", "13px", "13px"]);
  });

  it("search: each chip's word starts 12 px in, not centred, as `Home Page – 1` draws it", () => {
    url.search = "search";
    const container = open("/sy-en/demo");
    const chip = container.querySelector(
      '[data-pw="demo-search-chip-1"]',
    ) as HTMLElement | null;
    expect(chip, "the search screen has no second chip").not.toBeNull();
    expect(
      chip!.className,
      "the 'Empty' chip centres its word; the file starts it 12 px from the chip's left edge",
    ).toContain("text-left");
  });
});

/**
 * Safari draws a 0.5 px `inset` box-shadow with thick, dark straight edges and
 * heavy corners (zoomedInScrenshot.jpeg, and a WebKit render beside the XD
 * file). The line has to be drawn some other way on every screen.
 *
 * And the screens are laid out the way a page is: blocks stacked with margins
 * and padding from the file, not each one pinned with `top` / `left`.
 */
describe("Demo screens — Safari lines and layout by margins", () => {
  const SCREENS: [string, string, string][] = [
    ["home", "/sy-en/demo", ""],
    ["search", "/sy-en/demo", "search"],
    ["cart", "/sy-en/demo", "cart"],
    ["profile tab", "/sy-en/demo/settings", ""],
    ["profile photo", "/sy-en/demo/settings/photo", ""],
    ["client ID", "/sy-en/demo/settings/client-id", ""],
    ["profile menu", "/sy-en/demo/settings/profile", ""],
    ["client information", "/sy-en/demo/settings/profile/client-info", ""],
    ["personal info", "/sy-en/demo/settings/profile/personal-info", ""],
    ["body measurements", "/sy-en/demo/settings/profile/body", ""],
    ["address list", "/sy-en/demo/settings/profile/address", ""],
    ["address form", "/sy-en/demo/settings/profile/address/new", ""],
    ["wallet", "/sy-en/demo/settings/wallet", ""],
    ["wallet in dollars", "/sy-en/demo/settings/wallet/usd", ""],
  ];

  const describeEl = (el: HTMLElement) =>
    el.getAttribute("data-pw") ??
    `<${el.tagName.toLowerCase()}> "${(el.textContent ?? "").trim().slice(0, 30)}"`;

  for (const [name, pathname, search] of SCREENS) {
    it(`${name}: no line is an inset box-shadow (Safari draws it thick on the straight edges)`, () => {
      url.search = search;
      const container = open(pathname);
      const shadowed = [...container.querySelectorAll<HTMLElement>("*")]
        // A line: an inset shadow with no offset and no blur. XD's inner
        // shadows (the tab bar's photo) have a blur and are not lines.
        .filter((el) => /inset\s+0(px)?\s+0(px)?\s+0(px)?\s/.test(el.style.boxShadow))
        .map(describeEl);
      expect(
        shadowed,
        `the ${name} screen draws these lines as an inset box-shadow`,
      ).toEqual([]);
      document.body.innerHTML = "";
    });

    it(`${name}: the header and the page are laid out with margins, nothing is placed with top / left`, () => {
      url.search = search;
      const container = open(pathname);
      const screen = container.querySelector("[data-demo-screen]") as HTMLElement;
      expect(screen, `the ${name} screen did not open`).not.toBeNull();
      const regions = [
        ...screen.querySelectorAll<HTMLElement>("header, .overflow-y-auto"),
      ];
      expect(regions.length, `the ${name} screen has no header or page`).toBeGreaterThan(0);
      const pinned = regions
        .flatMap((region) => [...region.querySelectorAll<HTMLElement>("*")])
        .filter((el) => el.style.top !== "" || el.style.left !== "")
        .map(describeEl);
      expect(
        pinned,
        `these blocks on the ${name} screen are pinned with top / left instead of spaced with margins`,
      ).toEqual([]);
      document.body.innerHTML = "";
    });
  }
});

/**
 * Every demo text field: while the shopper types in it, its label is Medium
 * and its line is the site's blue #388CFF. A field that cannot be typed in
 * (Personal Info before "Edit") does not react to a tap.
 */
describe("Demo fields — the focused field has a blue line and a Medium label", () => {
  const field = (container: HTMLElement, id: string) => {
    const input = container.querySelector(`[data-pw="${id}"]`) as HTMLInputElement | null;
    expect(input, `the screen has no ${id} input`).not.toBeNull();
    return { input: input!, box: input!.parentElement! };
  };
  const lineOf = (box: HTMLElement) => {
    const stroke = box.querySelector<SVGElement>(":scope > svg[data-stroke]");
    return stroke && stroke.style.opacity !== "0" ? stroke.getAttribute("data-stroke") : null;
  };
  const labelIsBold = (box: HTMLElement) =>
    box.querySelector(":scope > span")!.className.includes("font-medium");

  beforeEach(() => {
    url.search = "";
  });

  it("body measurements: the focused field turns blue with a Medium label, and back to grey when focus leaves", () => {
    const container = open("/sy-en/demo/settings/profile/body");
    const { input, box } = field(container, "demo-body-height");
    expect(lineOf(box), "the 'How tall are you?' field has no grey #D3D3D3 line before it has focus").toBe("#D3D3D3");
    expect(labelIsBold(box), "the 'How tall are you?' label is Medium before the field has focus").toBe(false);
    fireEvent.focus(input);
    expect(lineOf(box), "the focused 'How tall are you?' field has no blue #388CFF line").toBe("#388CFF");
    expect(labelIsBold(box), "the focused 'How tall are you?' field's label is not Medium").toBe(true);
    fireEvent.blur(input);
    expect(lineOf(box), "the 'How tall are you?' field did not go back to its grey line after focus left").toBe("#D3D3D3");
    expect(labelIsBold(box), "the 'How tall are you?' label stayed Medium after focus left").toBe(false);
  });

  it("personal info: a tap on a read-only field changes nothing; after 'Edit' the focused field is blue with a Medium label", async () => {
    const container = open("/sy-en/demo/settings/profile/personal-info");
    const { input, box } = field(container, "demo-personal-name");
    fireEvent.focus(input);
    expect(lineOf(box), "the read-only 'full Name' field got a line when tapped before 'Edit'").toBe(null);
    expect(labelIsBold(box), "the read-only 'full Name' label turned Medium when tapped before 'Edit'").toBe(false);
    fireEvent.blur(input);

    fireEvent.click(container.querySelector('[data-pw="demo-header-action"]')!);
    fireEvent.focus(input);
    expect(lineOf(box), "the focused 'full Name' field has no blue #388CFF line after 'Edit'").toBe("#388CFF");
    expect(labelIsBold(box), "the focused 'full Name' field's label is not Medium after 'Edit'").toBe(true);
    fireEvent.blur(input);
    expect(lineOf(box), "the 'full Name' field did not go back to its grey line after focus left").toBe("#D3D3D3");
  });
});

/** Numbers read out of the XD file (Home Page – 11, – 17, – 21 and – 19). */
describe("Demo wallet — numbers from the XD file", () => {
  beforeEach(() => {
    url.search = "";
    router.push.mockClear();
    document.body.innerHTML = "";
  });
  afterEach(() => resetDevice());

  const px = (
    el: Element | null | undefined,
    prop: "width" | "height" | "marginLeft" | "marginTop",
  ) => (el as HTMLElement | null | undefined)?.style[prop];

  const find = (
    container: HTMLElement,
    testId: string,
    timeout = 3000,
  ): Promise<HTMLElement | null> =>
    waitFor(
      () => {
        const found = container.querySelector(`[data-pw="${testId}"]`);
        if (!found) throw new Error("not yet");
        return found as HTMLElement;
      },
      { timeout },
    ).catch(() => null);

  it("every balance: two purple cards 200 x 103 with 6 px between them and four entries, as `Home Page – 11` draws them", () => {
    const container = open("/sy-en/demo/settings/wallet");
    const usd = container.querySelector<HTMLElement>('[data-pw="demo-wallet-card-usd"]');
    const syp = container.querySelector<HTMLElement>('[data-pw="demo-wallet-card-syp"]');
    expect(usd, "the wallet has no dollar card").not.toBeNull();
    expect(syp, "the wallet has no Syrian pound card").not.toBeNull();
    expect(px(usd, "width"), "the dollar card is not 200 wide").toBe("200px");
    expect(px(usd, "height"), "the dollar card is not 103 tall").toBe("103px");
    expect(px(syp, "width"), "the pound card is not 200 wide").toBe("200px");
    expect(px(syp, "marginLeft"), "the two cards are not 6 px apart (212 to 218)").toBe("6px");
    expect(usd!.style.borderRadius, "the card's corners are not 15").toBe("15px");
    expect(
      usd!.style.boxShadow,
      "the card does not carry the file's drop shadow (0, 3, blur 3, black 16%)",
    ).toContain("0.16");
    expect(
      usd!.style.boxShadow,
      "the card does not carry the file's inner shadow (0, 3, blur 3, white 50%)",
    ).toContain("inset");
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-out"]'),
      "Cash Out is on the card of every balance; the file has it only on the one-balance card",
    ).toBeNull();
    const shown = [...container.querySelectorAll('[data-pw^="demo-wallet-entry-"]')].map((el) =>
      el.getAttribute("data-pw"),
    );
    expect(shown, "the entries under 'All Transactions' are not the four of the file").toEqual([
      "demo-wallet-entry-deposit",
      "demo-wallet-entry-withdrawal",
      "demo-wallet-entry-order",
      "demo-wallet-entry-refund",
    ]);
  });

  it("every balance: a tap on the dollar card opens the dollar balance", () => {
    const container = open("/sy-en/demo/settings/wallet");
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-card-usd"]')!);
    expect(
      router.push,
      "the dollar card did not go to /demo/settings/wallet/usd",
    ).toHaveBeenCalledWith("/sy-en/demo/settings/wallet/usd", { scroll: false });
  });

  it("profile tab: a tap on the Trydos Wallet tile opens the wallet", () => {
    const container = open("/sy-en/demo/settings");
    const tile = container.querySelector('[data-pw="demo-profile-wallet"]');
    expect(tile, "the profile tab has no Trydos Wallet tile").not.toBeNull();
    fireEvent.click(tile!);
    expect(
      router.push,
      "the Trydos Wallet tile did not go to /demo/settings/wallet",
    ).toHaveBeenCalledWith("/sy-en/demo/settings/wallet", { scroll: false });
  });

  it("one balance: a 406 wide card with Cash In and Cash Out, and only the first entry has a line, as `Home Page – 17` draws it", () => {
    const container = open("/sy-en/demo/settings/wallet/usd");
    const card = container.querySelector('[data-pw="demo-wallet-card-usd"]');
    expect(px(card, "width"), "the dollar card is not 406 wide").toBe("406px");
    expect(
      container.querySelector('[data-pw="demo-wallet-card-syp"]'),
      "the pound card is on the dollar balance",
    ).toBeNull();
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-in"]'),
      "the card has no Cash In",
    ).not.toBeNull();
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-out"]'),
      "the card has no Cash Out",
    ).not.toBeNull();
    const rows = [...container.querySelectorAll<HTMLElement>('[data-pw^="demo-wallet-entry-"]')];
    expect(
      rows.map((row) => row.getAttribute("data-pw")),
      "the entries under 'All USD Transactions' are not the five of the file",
    ).toEqual([
      "demo-wallet-entry-deposit",
      "demo-wallet-entry-withdrawal",
      "demo-wallet-entry-order",
      "demo-wallet-entry-refund",
      "demo-wallet-entry-request",
    ]);
    expect(px(rows[0], "marginTop"), "the first entry is not 12 px under the list title (275 to 287)").toBe("12px");
    expect(px(rows[1], "marginTop"), "the entries are not 4 px apart").toBe("4px");
    expect(px(rows[0], "height"), "an entry is not 50 tall").toBe("50px");
    const lined = rows
      .filter((row) => row.querySelector("svg[data-stroke]"))
      .map((row) => row.getAttribute("data-pw"));
    expect(lined, "the 0.5 px line is not on the first entry alone").toEqual([
      "demo-wallet-entry-deposit",
    ]);
    const amount = [...rows[0].querySelectorAll("span")].find((el) => el.textContent === "1000");
    expect(amount?.className, "the first entry's amount is not Bold").toContain("font-bold");
    const next = [...rows[1].querySelectorAll("span")].find((el) => el.textContent === "10");
    expect(next?.className, "the second entry's amount is not Medium").toContain("font-medium");
  });

  it("cash out: the sheet has 50 px corners, opens on the ways to cash out and goes on to the form, as `Home Page – 21` and `– 19` draw it", async () => {
    const container = open("/sy-en/demo/settings/wallet/usd");
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-out"]')!);
    const sheet = await find(container, "demo-wallet-cash-out-sheet");
    expect(sheet, "a tap on Cash Out did not open the sheet").not.toBeNull();
    const panel = [...sheet!.querySelectorAll<HTMLElement>("div")].find((el) =>
      el.style.borderRadius.startsWith("50px"),
    );
    expect(panel, "the sheet has no panel with 50 px top corners").toBeDefined();
    expect(
      panel!.style.borderRadius,
      "the sheet's bottom corners are round; the file rounds only the top two",
    ).toMatch(/^50px 50px 0(px)? 0(px)?$/);
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-out-ways"]'),
      "the sheet did not open on the ways to cash out",
    ).not.toBeNull();

    const card = container.querySelector<HTMLElement>('[data-pw="demo-wallet-way-rdb"]');
    expect(card, "the sheet has no trydos | rdb card").not.toBeNull();
    // The card's own line, not the line of the small tag inside it.
    const line = card!.querySelector(':scope > div > svg[data-stroke="#4A31E7"]');
    expect(line, "the trydos | rdb card has no purple line").not.toBeNull();
    expect(
      line!.getAttribute("data-stroke-align"),
      "the card's line is inside the edge; the file draws it on the edge (centre stroke)",
    ).toBe("center");
    expect(
      line!.querySelector("rect[stroke]")?.getAttribute("stroke-width"),
      "the card's line is not 0.5 px",
    ).toBe("0.5");
    expect(
      card!.textContent,
      "the brand is not written 'trydos | rdb' as the file writes it",
    ).toContain("trydos | rdb");
    const tiles = ["sham", "syriatel", "irsal"].map((id) =>
      container.querySelector(`[data-pw="demo-wallet-way-${id}"]`),
    );
    expect(tiles[0], "the Sham Cash tile is missing").not.toBeNull();
    expect(px(tiles[1], "marginLeft"), "the second tile is not 8 px after the first (145 to 153)").toBe("8px");
    expect(px(tiles[2], "marginLeft"), "the third tile is not 7 px after the second (278 to 285)").toBe("7px");

    fireEvent.click(card!);
    const form = await find(container, "demo-wallet-cash-out-form");
    expect(form, "a tap on the trydos | rdb card did not open the form").not.toBeNull();
    const amount = container.querySelector<HTMLElement>('[data-pw="demo-wallet-amount"]');
    expect(amount, "the form has no amount field").not.toBeNull();
    expect(px(amount, "marginTop"), "the amount field is not at y 515, 122 under the add button").toBe("122px");
    expect(px(amount, "height"), "the amount field is not 55 tall").toBe("55px");
    const chosen = container.querySelector<HTMLElement>('[data-pw="demo-wallet-tab-cash"] div');
    expect(
      chosen?.style.background,
      "the chosen tab is not the file's green #79E9B3",
    ).toMatch(/#79E9B3|rgb\(121, 233, 179\)/i);
  }, 10000);

  it("cash out form: with a mouse and a keyboard the amount field turns its line blue while it is in use, and takes digits only", async () => {
    setDevice("pointer");
    const container = open("/sy-en/demo/settings/wallet/usd");
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-out"]')!);
    const card = await find(container, "demo-wallet-way-rdb");
    expect(card, "the sheet has no trydos | rdb card").not.toBeNull();
    fireEvent.click(card!);
    const input = (await find(container, "demo-wallet-amount-input")) as HTMLInputElement | null;
    expect(input, "the form has no amount input").not.toBeNull();
    const field = container.querySelector<HTMLElement>('[data-pw="demo-wallet-amount"]')!;
    fireEvent.focus(input!);
    expect(
      field.querySelector("svg[data-stroke]")?.getAttribute("data-stroke"),
      "the amount field in use has no blue #388CFF line",
    ).toBe("#388CFF");
    expect(
      field.textContent,
      "the empty amount field does not show the grey '0,00 USD'",
    ).toContain("0,00 USD");
    fireEvent.change(input!, { target: { value: "12a5" } });
    expect(input!.value, "the amount field kept a letter").toBe("125");
    expect(
      field.textContent,
      "the grey '0,00 USD' is still drawn under a typed amount",
    ).not.toContain("0,00");
    fireEvent.blur(input!);
    expect(
      field.querySelector("svg[data-stroke]")?.getAttribute("data-stroke"),
      "the amount field kept its blue line after focus left",
    ).toBe("#D3D3D3");
    expect(
      document.querySelector("[data-keyboard-overlay]"),
      "the app's keypad opened on a device with a mouse and a keyboard",
    ).toBeNull();
  }, 10000);

  it("cash out form: on a touch device the login's keypad types the amount, and the field asks the canvas to keep it above the keypad", async () => {
    setDevice("touch");
    const container = open("/sy-en/demo/settings/wallet/usd");
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-out"]')!);
    const card = await find(container, "demo-wallet-way-rdb");
    expect(card, "the sheet has no trydos | rdb card").not.toBeNull();
    fireEvent.click(card!);
    const field = await find(container, "demo-wallet-amount");
    expect(field, "the form has no amount field").not.toBeNull();
    // The keypad is a portal on <body>; it opens 350 ms after the form.
    const keypad = await waitFor(
      () => {
        const found = document.querySelector("[data-keyboard-overlay]");
        if (!found) throw new Error("not yet");
        return found as HTMLElement;
      },
      { timeout: 3000 },
    ).catch(() => null);
    expect(keypad, "the app's keypad did not open under the amount field").not.toBeNull();
    expect(
      field!.hasAttribute("data-keyboard-anchor"),
      "the amount field is not marked as the box to keep above the keypad",
    ).toBe(true);
    expect(
      field!.querySelector("svg[data-stroke]")?.getAttribute("data-stroke"),
      "the amount field has no blue #388CFF line while the keypad is up",
    ).toBe("#388CFF");
    const input = container.querySelector<HTMLInputElement>('[data-pw="demo-wallet-amount-input"]');
    expect(
      input?.readOnly,
      "the amount input can take focus on a touch device, so the phone's own keyboard would open over the keypad",
    ).toBe(true);
    for (const digit of ["1", "0", "0"]) {
      fireEvent.pointerDown(keypad!.querySelector(`[data-pw="keypad-digit-${digit}"]`)!);
    }
    await waitFor(() => expect(input!.value, "the keypad's digits did not reach the amount").toBe("100"));
    fireEvent.pointerDown(keypad!.querySelector('[data-pw="keypad-backspace"]')!);
    fireEvent.pointerUp(keypad!.querySelector('[data-pw="keypad-backspace"]')!);
    await waitFor(() => expect(input!.value, "the keypad's backspace did not take the last digit off").toBe("10"));
  }, 10000);

  it("wallet info: the QR mark on the card opens a sheet with 50 px corners, the 350.21 px code at x 39.93 and three fields, as `Home Page – 23` draws it", async () => {
    const container = open("/sy-en/demo/settings/wallet/usd");
    const mark = container.querySelector('[data-pw="demo-wallet-info"]');
    expect(mark, "the one-balance card has no QR mark to tap").not.toBeNull();
    fireEvent.click(mark!);
    const sheet = await find(container, "demo-wallet-info-sheet");
    expect(sheet, "a tap on the QR mark did not open the wallet info sheet").not.toBeNull();
    const panel = [...sheet!.querySelectorAll<HTMLElement>("div")].find((el) =>
      el.style.borderRadius.startsWith("50px"),
    );
    expect(panel, "the wallet info sheet has no panel with 50 px top corners").toBeDefined();
    const code = sheet!.querySelector<HTMLElement>('img[src$="/qrWallet.svg"]');
    expect(code, "the sheet has no QR code").not.toBeNull();
    expect(code!.style.width, "the QR code is not 350.21 wide").toBe("350.21px");
    expect(code!.style.marginLeft, "the QR code does not start at x 39.93").toBe("39.93px");
    const fields = ["name", "id", "phone"].map((id) =>
      sheet!.querySelector<HTMLElement>(`[data-pw="demo-wallet-info-${id}"]`),
    );
    expect(fields[0], "the sheet has no client name field").not.toBeNull();
    expect(fields[1]?.textContent, "the client ID field does not show the client's ID").toContain("1012-3456");
    expect(fields[2]?.textContent, "the phone field does not show the client's number").toContain("+90 552 800 2000");
    expect(px(fields[0], "marginTop"), "the first field is not at y 639, 30 under the 'trydos USD' line").toBe("30px");
    expect(px(fields[1], "marginTop"), "the fields are not 4 px apart").toBe("4px");
    expect(px(fields[0], "height"), "a field is not 55 tall").toBe("55px");
    expect(
      fields[0]!.querySelector('img[src$="/eyeGrey.svg"]'),
      "the name field has no grey eye mark",
    ).not.toBeNull();
    expect(
      fields[1]!.querySelector('img[src$="/eyeGrey.svg"]'),
      "the ID field has an eye mark; the file draws it on the name field only",
    ).toBeNull();
    const actions = ["request", "copy", "download", "share"].filter(
      (id) => !sheet!.querySelector(`[data-pw="demo-wallet-info-${id}"]`),
    );
    expect(actions, "these actions are missing under the fields").toEqual([]);
  }, 10000);

  it("receipt: a tap on the Cash Deposit entry opens the 406 x 568 card at y 149 over a blurred page, as `Home Page – 18` draws it", async () => {
    const container = open("/sy-en/demo/settings/wallet");
    expect(
      container.querySelector('[data-pw="demo-wallet-receipt"]'),
      "the receipt is open before any entry was tapped",
    ).toBeNull();
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-entry-deposit"]')!);
    const layer = await find(container, "demo-wallet-receipt");
    expect(layer, "a tap on the Cash Deposit entry did not open the receipt").not.toBeNull();
    expect(
      layer!.style.background,
      "the page behind the receipt is not covered with #1D1D1D at 50%",
    ).toMatch(/rgba\(29, 29, 29, 0\.5\)/);
    expect(
      layer!.style.backdropFilter,
      "the page behind the receipt is not blurred (the file's background blur is 15.37)",
    ).toContain("blur(15.37px)");
    const card = layer!.querySelector<HTMLElement>('[data-pw="demo-wallet-receipt-card"]');
    expect(card, "the receipt has no card").not.toBeNull();
    expect(px(card, "width"), "the receipt card is not 406 wide").toBe("406px");
    expect(px(card, "height"), "the receipt card is not 568 tall").toBe("568px");
    expect(px(card, "marginTop"), "the receipt card is not at y 149 (99 under the app's top)").toBe("99px");
    expect(card!.style.borderRadius, "the receipt card's corners are not 50").toBe("50px");
    const cell = (id: string) =>
      card!.querySelector<HTMLElement>(`[data-pw="demo-wallet-receipt-${id}"]`);
    expect(px(cell("date"), "width"), "the date cell is not 124 wide").toBe("124px");
    expect(px(cell("reference"), "width"), "the reference cell is not 124 wide").toBe("124px");
    expect(px(cell("amount"), "width"), "the amount cell is not 126 wide").toBe("126px");
    expect(px(cell("type"), "width"), "the type cell is not 252 wide").toBe("252px");
    expect(px(cell("sender"), "width"), "the sender cell is not 382 wide").toBe("382px");
    expect(cell("reference")?.textContent, "the reference is not the file's").toContain("TSCR10012");
    expect(cell("receiver")?.textContent, "the receiver line is not the file's").toContain("+963988222592");
    const amount = [...cell("amount")!.querySelectorAll("span")].find(
      (el) => el.textContent === "100,000",
    );
    expect(amount?.className, "the amount's number is not Medium").toContain("font-medium");
    expect(
      cell("status")!.querySelector('img[src$="/receiptDone.svg"]'),
      "the status cell has no blue done mark",
    ).not.toBeNull();

    fireEvent.click(card!);
    expect(
      container.querySelector('[data-pw="demo-wallet-receipt-card"]'),
      "a tap on the receipt itself closed it",
    ).not.toBeNull();
    fireEvent.click(layer!);
    await waitFor(
      () =>
        expect(
          container.querySelector('[data-pw="demo-wallet-receipt"]'),
          "a tap on the page behind the receipt did not close it",
        ).toBeNull(),
      { timeout: 3000 },
    );
  }, 10000);

  it("receipt: an entry with no receipt does not open one", () => {
    const container = open("/sy-en/demo/settings/wallet");
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-entry-refund"]')!);
    expect(
      container.querySelector('[data-pw="demo-wallet-receipt"]'),
      "the Refund Order entry opened a receipt; the file has one for the Cash Deposit only",
    ).toBeNull();
  });
});
