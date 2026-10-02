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
import { FileLines, useOuterBackdrop } from "components/DemoApp/ui";
import { NATIVE_WALLET_KEYBOARD } from "components/DemoApp/demoKeyboard";

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
      container.querySelector('[data-pw="demo-wallet-cash-out-usd"]'),
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

  /** The wallet with the dollar card grown, as a tap on the card leaves it. */
  const openDollars = async () => {
    const container = open("/sy-en/demo/settings/wallet");
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-card-usd"]')!);
    const grown = await find(container, "demo-wallet-cash-out-usd");
    expect(grown, "a tap on the dollar card did not bring Cash Out in").not.toBeNull();
    return container;
  };

  it("a tap on the dollar card grows it in place: no other page opens, the line above names the currency, and a tap on the grown card brings the two cards back", async () => {
    const container = open("/sy-en/demo/settings/wallet");
    const total = container.querySelector('[data-pw="demo-wallet-total"]');
    expect(total?.textContent, "the line above the cards is not the file's 'your total balance'").toBe(
      "your total balance",
    );
    const card = container.querySelector<HTMLElement>('[data-pw="demo-wallet-card-usd"]')!;
    fireEvent.click(card);
    expect(router.push, "the dollar card opened another page; it must grow where it is").not.toHaveBeenCalled();
    expect(
      container.querySelector('[data-pw="demo-wallet-card-usd"]'),
      "the dollar card was drawn again as a new card; the same card must grow",
    ).toBe(card);
    expect(total?.textContent, "the line above the cards does not name the currency").toBe(
      "your total USD balance",
    );
    expect(
      container.querySelector('[data-pw="demo-wallet-list-title"]')?.textContent,
      "the list title does not name the currency",
    ).toBe("All USD Transactions");
    await waitFor(
      () => expect(card.style.width, "the dollar card did not grow to 406 wide").toBe("406px"),
      { timeout: 3000 },
    );
    expect(
      container.querySelector('[data-pw="demo-wallet-dots"]'),
      "the page dots did not come in under the grown card",
    ).not.toBeNull();

    fireEvent.click(card);
    expect(total?.textContent, "a tap on the grown card did not bring 'your total balance' back").toBe(
      "your total balance",
    );
    await waitFor(
      () => expect(card.style.width, "the dollar card did not fold back to 200 wide").toBe("200px"),
      { timeout: 3000 },
    );
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-out-usd"]'),
      "Cash Out is still on the folded card",
    ).toBeNull();
    const shown = [...container.querySelectorAll('[data-pw^="demo-wallet-entry-"]')].map((el) =>
      el.getAttribute("data-pw"),
    );
    await waitFor(
      () =>
        expect(
          [...container.querySelectorAll('[data-pw^="demo-wallet-entry-"]')].map((el) =>
            el.getAttribute("data-pw"),
          ),
          "the list did not go back to the four entries of `Home Page – 11`",
        ).toEqual([
          "demo-wallet-entry-deposit",
          "demo-wallet-entry-withdrawal",
          "demo-wallet-entry-order",
          "demo-wallet-entry-refund",
        ]),
      { timeout: 3000 },
    );
    expect(shown.length, "the wallet lists no entries").toBeGreaterThan(0);
  }, 10000);

  it("a tap on the pound card grows that card: the row moves one screen to the left, and the lines name the pound", async () => {
    const container = open("/sy-en/demo/settings/wallet");
    const card = container.querySelector<HTMLElement>('[data-pw="demo-wallet-card-syp"]')!;
    fireEvent.click(card);
    expect(
      container.querySelector('[data-pw="demo-wallet-total"]')?.textContent,
      "the line above the cards does not name the pound",
    ).toBe("your total SYP balance");
    expect(
      container.querySelector('[data-pw="demo-wallet-list-title"]')?.textContent,
      "the list title does not name the pound",
    ).toBe("All SYP Transactions");
    await waitFor(
      () => expect(card.style.width, "the pound card did not grow to 406 wide").toBe("406px"),
      { timeout: 3000 },
    );
    expect(card.style.marginLeft, "the grown cards are not a screen's width apart (406 + 24)").toBe("24px");
    const row = container.querySelector<HTMLElement>('[data-pw="demo-wallet-cards"]')!;
    await waitFor(
      () =>
        expect(
          row.style.transform,
          "the row did not move one screen (430 px) to the left, so the grown pound card is not on show",
        ).toContain("-430px"),
      { timeout: 3000 },
    );
    const dots = [...container.querySelectorAll<HTMLImageElement>('[data-pw="demo-wallet-dots"] img')].map(
      (img) => img.getAttribute("src")?.split("/").pop(),
    );
    expect(dots, "the dots do not show the second card as the one on show").toEqual([
      "dotOff.svg",
      "dotOn.svg",
    ]);
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-out-syp"]'),
      "the grown pound card has no Cash Out",
    ).not.toBeNull();

    fireEvent.click(container.querySelector('[data-pw="demo-back"]')!);
    expect(
      router.back,
      "the back arrow left the wallet; with a card grown it must fold the card first",
    ).not.toHaveBeenCalled();
    await waitFor(
      () => expect(card.style.width, "the back arrow did not fold the pound card").toBe("200px"),
      { timeout: 3000 },
    );
  }, 10000);

  it("the grown cards are a slider: the row can be slid sideways only while a card is grown", async () => {
    const container = open("/sy-en/demo/settings/wallet");
    const row = container.querySelector<HTMLElement>('[data-pw="demo-wallet-cards"]')!;
    expect(
      row.style.touchAction,
      "the two small cards can be slid; the file's `Home Page – 11` has nothing to slide to",
    ).not.toBe("pan-y");
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-card-usd"]')!);
    await waitFor(
      () =>
        expect(
          row.style.touchAction,
          "the row of grown cards does not take a sideways slide",
        ).toBe("pan-y"),
      { timeout: 3000 },
    );
  });

  it("the list does not move when the card grows: the dots come in inside the 20 px between the cards and the list title", async () => {
    const container = open("/sy-en/demo/settings/wallet");
    const title = container.querySelector<HTMLElement>('[data-pw="demo-wallet-list-title"]')!;
    const gap = title.previousElementSibling as HTMLElement;
    expect(gap.style.height, "the gap between the cards and the list title is not 20 px (241 to 261)").toBe("20px");
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-card-usd"]')!);
    const dots = await find(container, "demo-wallet-dots");
    expect(dots, "the page dots did not come in").not.toBeNull();
    expect(dots!.parentElement, "the dots are not inside the gap above the list title").toBe(gap);
    expect(dots!.style.marginTop, "the dots are not 6 px under the card (241 to 247)").toBe("6px");
    expect(gap.style.height, "the gap changed when the dots came in, so the list moved").toBe("20px");
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

  it("one balance: a 406 wide card with Cash In and Cash Out, and only the first entry has a line, as `Home Page – 17` draws it", async () => {
    const container = await openDollars();
    const card = container.querySelector<HTMLElement>('[data-pw="demo-wallet-card-usd"]')!;
    await waitFor(
      () => expect(card.style.width, "the dollar card is not 406 wide").toBe("406px"),
      { timeout: 3000 },
    );
    expect(
      container.querySelector('[data-pw="demo-wallet-cards"]')?.getAttribute("style") ?? "",
      "the row moved; the grown dollar card is the first one and stays at x 12",
    ).not.toContain("-430px");
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-in-usd"]'),
      "the card has no Cash In",
    ).not.toBeNull();
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-out-usd"]'),
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
  }, 10000);

  it("cash out: the sheet has 50 px corners, opens on the ways to cash out and goes on to the form, as `Home Page – 21` and `– 19` draw it", async () => {
    const container = await openDollars();
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-out-usd"]')!);
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
    const container = await openDollars();
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-out-usd"]')!);
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

  it("cash out form: keyboard setup and movable amount field behavior", async () => {
    setDevice("touch");
    const container = await openDollars();
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-out-usd"]')!);
    const card = await find(container, "demo-wallet-way-rdb");
    expect(card, "the sheet has no trydos | rdb card").not.toBeNull();
    fireEvent.click(card!);
    const field = await find(container, "demo-wallet-amount");
    expect(field, "the form has no amount field").not.toBeNull();
    const sheet = container.querySelector('[data-pw="demo-wallet-cash-out-sheet"]');
    expect(sheet?.hasAttribute("data-no-keyboard-lift"), "the sheet must have data-no-keyboard-lift").toBe(true);

    const input = container.querySelector<HTMLInputElement>('[data-pw="demo-wallet-amount-input"]');
    if (!NATIVE_WALLET_KEYBOARD) {
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
    } else {
      expect(input?.readOnly, "the amount input must be editable with native keyboard").toBe(false);
      expect(input?.inputMode, "the amount input should specify decimal inputMode").toBe("decimal");
      fireEvent.focus(input!);
      expect(
        field!.querySelector("svg[data-stroke]")?.getAttribute("data-stroke"),
        "the amount field has no blue #388CFF line while focused",
      ).toBe("#388CFF");
      fireEvent.change(input!, { target: { value: "100" } });
      expect(input!.value).toBe("100");
    }
  }, 10000);

  it("sheet inputs on touch devices: inputs have pointer-events: none in CSS and clicking field delegates focus with preventScroll: true", async () => {
    setDevice("touch");
    const container = await openDollars();
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-out-usd"]')!);
    fireEvent.click((await find(container, "demo-wallet-way-rdb"))!);
    const sheet = (await find(container, "demo-wallet-cash-out-sheet"))!;
    expect(sheet.hasAttribute("data-no-keyboard-lift"), "sheet must have data-no-keyboard-lift").toBe(true);

    const style = sheet.querySelector("style");
    expect(style?.textContent, "touch device must inject pointer-events: none rule for sheet inputs").toContain(
      "pointer-events: none",
    );

    const input = (await find(container, "demo-wallet-amount-input")) as HTMLInputElement;
    const focusSpy = vi.spyOn(input, "focus");
    const fieldBox = container.querySelector<HTMLElement>('[data-pw="demo-wallet-amount"]')!;
    fireEvent.click(fieldBox);
    expect(focusSpy, "tapping field container must call focus({ preventScroll: true })").toHaveBeenCalledWith({
      preventScroll: true,
    });
  });

  describe("on a short screen the forms keep the file's spacing and scroll", () => {
    // A phone in Safari: the canvas is 150 design px shorter than the artboard.
    beforeEach(() => {
      setDevice("touch");
      document.documentElement.style.setProperty("--xd-flex-deficit", "150px");
    });
    afterEach(() => {
      document.documentElement.style.removeProperty("--xd-flex-deficit");
    });

    const panelOf = (sheet: HTMLElement) =>
      [...sheet.querySelectorAll<HTMLElement>("div")].find((el) =>
        el.style.borderRadius.startsWith("50px"),
      );

    it("cash out: with the amount typed, the form is as tall as the board (to y 930), so its buttons stay at y 767 and 835 and the sheet scrolls to them", async () => {
      const container = await openDollars();
      fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-out-usd"]')!);
      fireEvent.click((await find(container, "demo-wallet-way-rdb"))!);
      const input = (await find(container, "demo-wallet-amount-input")) as HTMLInputElement | null;
      expect(input, "the form has no amount input").not.toBeNull();
      if (NATIVE_WALLET_KEYBOARD) {
        fireEvent.focus(input!);
        fireEvent.change(input!, { target: { value: "100" } });
        fireEvent.blur(input!);
      } else {
        const keypad = await waitFor(
          () => {
            const found = document.querySelector("[data-keyboard-overlay]");
            if (!found) throw new Error("not yet");
            return found as HTMLElement;
          },
          { timeout: 3000 },
        );
        for (const digit of ["1", "0", "0"]) {
          fireEvent.pointerDown(keypad.querySelector(`[data-pw="keypad-digit-${digit}"]`)!);
        }
        // A tap outside the keypad puts it away.
        fireEvent.mouseDown(document.body);
      }
      const now = await find(container, "demo-wallet-withdraw-now");
      expect(now, "'Withdrawal Now' did not come in once the amount was typed").not.toBeNull();

      const form = container.querySelector<HTMLElement>('[data-pw="demo-wallet-cash-out-form"]');
      await waitFor(() =>
        expect(
          form?.style.minHeight,
          "the form ends where the short canvas ends, so its buttons moved up over the browser bar and the gap over them got smaller; it must reach y 930 (827 px under the handle) and scroll",
        ).toBe("827px"),
      );
      const sheet = container.querySelector<HTMLElement>('[data-pw="demo-wallet-cash-out-sheet"]')!;
      const panel = panelOf(sheet);
      expect(
        panel?.style.top,
        "the sheet left its design top (y 90) on the short canvas; the form must stay there and scroll",
      ).not.toContain("--xd-flex-deficit");
      expect(
        panel?.querySelector(":scope > .overflow-y-auto"),
        "the sheet's content does not scroll, so the buttons under the screen's end cannot be reached",
      ).not.toBeNull();
    }, 10000);

    it("cash in with crypto: with the keyboard away, the form is as tall as the board (to y 930), so 'Generate QR Code' stays at y 835", async () => {
      const container = await openDollars();
      fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-in-usd"]')!);
      const way = await find(container, "demo-wallet-cash-in-way-crypto");
      expect(way, "the ways to cash in have no crypto tile").not.toBeNull();
      fireEvent.click(way!);
      const form = await find(container, "demo-wallet-cash-in-crypto");
      expect(form, "a tap on the crypto tile did not open the form").not.toBeNull();
      await waitFor(() =>
        expect(
          form!.style.minHeight,
          "the crypto form ends where the short canvas ends, so its button moved up; it must reach y 930 (827 px under the handle) and scroll",
        ).toBe("827px"),
      );
      const sheet = container.querySelector<HTMLElement>('[data-pw="demo-wallet-cash-in-sheet"]')!;
      expect(
        panelOf(sheet)?.style.top,
        "the sheet left its design top (y 90) on the short canvas; the form must stay there and scroll",
      ).not.toContain("--xd-flex-deficit");
    }, 10000);

    it("cash in, 'From My rdb': with the keyboard away, the part under the tabs is as tall as the board (y 241 to 930), so the button stays at y 835 and that part scrolls", async () => {
      const container = await openDollars();
      fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-in-usd"]')!);
      fireEvent.click((await find(container, "demo-wallet-way-rdb"))!);
      const tab = await find(container, "demo-wallet-cash-in-tab-bank");
      expect(tab, "the trydos | rdb step has no 'From My rdb' tab").not.toBeNull();
      fireEvent.click(tab!);
      const button = await find(container, "demo-wallet-cash-in-connect");
      expect(button, "the 'From My rdb' tab has no button").not.toBeNull();
      const form = container.querySelector<HTMLElement>('[data-pw="demo-wallet-cash-in-bank-form"]');
      expect(
        form?.style.minHeight,
        "the 'From My rdb' form ends where the short canvas ends, so its button moved up; it must reach y 930 (689 px under the tabs) and scroll",
      ).toBe("689px");
      expect(
        form?.parentElement?.getAttribute("data-pw"),
        "the form is not inside the part that scrolls under the tabs",
      ).toBe("demo-wallet-cash-in-rdb-under");
    }, 10000);
  });

  it("wallet info: the QR mark on the card opens a sheet with 50 px corners, the 350.21 px code at x 39.93 and three fields, as `Home Page – 23` draws it", async () => {
    const container = await openDollars();
    const mark = container.querySelector('[data-pw="demo-wallet-info-usd"]');
    expect(mark, "the one-balance card has no QR mark to tap").not.toBeNull();
    fireEvent.click(mark!);
    const sheet = await find(container, "demo-wallet-info-sheet");
    expect(sheet, "a tap on the QR mark did not open the wallet info sheet").not.toBeNull();
    const panel = [...sheet!.querySelectorAll<HTMLElement>("div")].find((el) =>
      el.style.borderRadius.startsWith("50px"),
    );
    expect(panel, "the wallet info sheet has no panel with 50 px top corners").toBeDefined();
    expect(
      panel!.style.top,
      "the sheet is not at its design top (y 90, 40 px under the top of the app)",
    ).toContain("40px");
    expect(
      panel!.style.top,
      "the sheet starts higher on a short canvas; it must stay at its design top (y 90) and scroll what does not fit",
    ).not.toContain("--xd-flex-deficit");
    expect(
      sheet!.querySelector('[data-pw="demo-sheet-grip"]'),
      "the sheet has no strip to drag it by, so a finger on the content would drag the sheet and not scroll it",
    ).not.toBeNull();
    const body = panel!.querySelector<HTMLElement>(":scope > .overflow-y-auto");
    expect(
      body,
      "the sheet's content does not scroll, so on a short window its last rows cannot be reached",
    ).not.toBeNull();
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

  it("cash in: the Cash In action opens a sheet with 50 px corners on the ways to cash in: the trydos | rdb card, then five tiles in a row that slides sideways, as `Home Page – 22` draws it", async () => {
    const container = await openDollars();
    const action = container.querySelector('[data-pw="demo-wallet-cash-in-usd"]');
    expect(action, "the one-balance card has no Cash In action").not.toBeNull();
    fireEvent.click(action!);
    const sheet = await find(container, "demo-wallet-cash-in-sheet");
    expect(sheet, "a tap on Cash In did not open the cash-in sheet").not.toBeNull();
    const panel = [...sheet!.querySelectorAll<HTMLElement>("div")].find((el) =>
      el.style.borderRadius.startsWith("50px"),
    );
    expect(panel, "the cash-in sheet has no panel with 50 px top corners").toBeDefined();
    const ways = container.querySelector('[data-pw="demo-wallet-cash-in-ways"]');
    expect(ways, "the sheet did not open on the ways to cash in").not.toBeNull();
    expect(
      ways!.querySelector("h2")?.className,
      "the title is not Medium; the file draws 'Cash In' Medium on this board only",
    ).toContain("font-medium");
    expect(
      ways!.querySelector('[data-pw="demo-wallet-way-rdb"]')?.textContent,
      "the ways to cash in have no trydos | rdb card",
    ).toContain("trydos | rdb");

    const row = container.querySelector<HTMLElement>('[data-pw="demo-wallet-cash-in-ways-row"]');
    expect(row, "the ways to cash in have no row of tiles").not.toBeNull();
    expect(row!.className, "the row of tiles does not slide sideways, as the file's scroll group does").toContain(
      "overflow-x-auto",
    );
    const missing = ["cards", "crypto", "sham", "syriatel", "irsal"].filter(
      (id) => !row!.querySelector(`[data-pw="demo-wallet-cash-in-way-${id}"]`),
    );
    expect(missing, "these tiles are missing from the row").toEqual([]);
    const slots = [...row!.children] as HTMLElement[];
    expect(slots[0].style.marginLeft, "the first tile does not start at x 20").toBe("20px");
    expect(slots[1].style.marginLeft, "the tiles are not 8 px apart (145 to 153)").toBe("8px");
    const cards = row!.querySelector<HTMLButtonElement>('[data-pw="demo-wallet-cash-in-way-cards"]')!;
    expect(cards.disabled, "the cards tile can be tapped; the file marks it 'Soon Available'").toBe(true);
    expect(
      row!.querySelector('[data-pw="demo-wallet-cash-in-soon"]')?.textContent,
      "the cards tile has no 'Soon Available' tag",
    ).toBe("Soon available");
  }, 10000);

  it("cash in: the trydos | rdb card opens the deposit code under a yellow tab, and 'From My rdb' shows the client's rdb account, as `Home Page – 26` and `– 32` draw them", async () => {
    const container = await openDollars();
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-in-usd"]')!);
    const card = await find(container, "demo-wallet-way-rdb");
    expect(card, "the ways to cash in have no trydos | rdb card").not.toBeNull();
    fireEvent.click(card!);
    const step = await find(container, "demo-wallet-cash-in-rdb");
    expect(step, "a tap on the trydos | rdb card did not open the deposit code").not.toBeNull();

    const cashTab = container.querySelector<HTMLElement>('[data-pw="demo-wallet-cash-in-tab-cash"] div');
    expect(cashTab?.style.background, "the chosen 'Cash Deposit' tab is not the file's yellow #FAE26B").toMatch(
      /#FAE26B|rgb\(250, 226, 107\)/i,
    );
    const code = step!.querySelector<HTMLElement>('img[src$="/qrCashIn.svg"]');
    expect(code, "the deposit step has no QR code").not.toBeNull();
    expect(code!.style.width, "the deposit code is not 300.12 wide").toBe("300.12px");
    expect(code!.style.marginLeft, "the deposit code does not start at x 65").toBe("65px");
    const id = step!.querySelector('[data-pw="demo-wallet-cash-in-client-id"]');
    expect(id?.textContent, "the client ID field does not show the file's account 100-708").toContain("100-708");
    const actions = ["request", "copy", "download", "share"].filter(
      (a) => !step!.querySelector(`[data-pw="demo-wallet-cash-in-deposit-${a}"]`),
    );
    expect(actions, "these actions are missing under the deposit code").toEqual([]);

    fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-in-tab-bank"]')!);
    const bankId = await find(container, "demo-wallet-cash-in-bank-id");
    expect(bankId, "the 'From My rdb' tab does not show the client's rdb account").not.toBeNull();
    expect(
      container.querySelector('img[src$="/qrCashIn.svg"]'),
      "the deposit code stayed on the 'From My rdb' tab",
    ).toBeNull();
    const amount = container.querySelector<HTMLElement>('[data-pw="demo-wallet-cash-in-amount"]');
    expect(px(amount, "marginTop"), "the amount field is not at y 422, 4 px under the name field").toBe("4px");
    expect(
      amount!.querySelector("svg[data-stroke]")?.getAttribute("data-stroke"),
      "the amount field has no blue #388CFF line; the file draws it in use",
    ).toBe("#388CFF");
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-in-connect"]')?.textContent,
      "the 'From My rdb' tab has no 'Connect & Request From Your rdb' button",
    ).toContain("rdb");
  }, 10000);

  it("cash in: Download on the deposit code opens its picture on a white page, as `Home Page – 31` draws it", async () => {
    const container = await openDollars();
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-in-usd"]')!);
    fireEvent.click((await find(container, "demo-wallet-way-rdb"))!);
    const download = await find(container, "demo-wallet-cash-in-deposit-download");
    expect(download, "the deposit code has no Download action").not.toBeNull();
    fireEvent.click(download!);
    const picture = await find(container, "demo-wallet-cash-in-deposit-picture");
    expect(picture, "Download did not open the picture of the deposit code").not.toBeNull();
    expect(
      picture!.querySelector('img[src$="/qrCashInBig.svg"]'),
      "the picture has no 350.37 px code",
    ).not.toBeNull();
    expect(
      picture!.querySelector('[data-pw="demo-wallet-cash-in-deposit-note"]')?.textContent,
      "the picture has no 'Your Deposit Request Ready To Collect !' note",
    ).toContain("Your deposit request ready to collect !");
  }, 10000);

  it("cash in with crypto: 100 typed shows the 110 USDT charge, the summary card and Generate QR Code; the safety rules come first, and I Agree opens the code with the time left, as `Home Page – 33`, `– 34`, `– 39` and `– 37` draw them", async () => {
    setDevice("pointer");
    const container = await openDollars();
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-in-usd"]')!);
    const tile = await find(container, "demo-wallet-cash-in-way-crypto");
    expect(tile, "the ways to cash in have no crypto tile").not.toBeNull();
    fireEvent.click(tile!);
    const input = (await find(container, "demo-wallet-cash-in-amount-input")) as HTMLInputElement | null;
    expect(input, "the crypto form has no amount input").not.toBeNull();
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-in-generate"]'),
      "Generate QR Code is on show with no amount; the file draws it only once one is typed",
    ).toBeNull();

    fireEvent.change(input!, { target: { value: "100" } });
    const field = container.querySelector<HTMLElement>('[data-pw="demo-wallet-cash-in-amount"]')!;
    expect(px(field, "height"), "the amount field did not grow to 93 for the charge").toBe("93px");
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-in-charge"]')?.textContent,
      "the charge does not say 110 USDT for 100 USD (the file's 10% fee)",
    ).toBe("We will charge 110 USDT for topping up your balance 100 USD.");
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-in-summary"]')?.textContent,
      "the summary card does not say what is paid and what arrives",
    ).toContain("You will pay 110 USDT Tron TRC 20 to generated wallet");
    const generate = await find(container, "demo-wallet-cash-in-generate");
    expect(generate, "Generate QR Code did not come in once an amount was typed").not.toBeNull();

    fireEvent.click(generate!);
    const safe = await find(container, "demo-wallet-cash-in-safe");
    expect(safe, "Generate QR Code did not open the safety rules").not.toBeNull();
    expect(
      safe!.querySelector('svg[data-stroke="#707070"]'),
      "the safety sheet has no #707070 line round its edge",
    ).not.toBeNull();
    expect(
      safe!.querySelectorAll('svg[data-bullet="ok"]').length > 0 &&
        safe!.querySelectorAll('svg[data-bullet="care"]').length > 0,
      "the safety list does not have both the green and the amber dots",
    ).toBe(true);

    fireEvent.click(safe!.querySelector('[data-pw="demo-wallet-cash-in-agree"]')!);
    const code = await find(container, "demo-wallet-cash-in-code");
    expect(code, "I Agree did not open the crypto code").not.toBeNull();
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-in-deposit-row"]')?.textContent,
      "the code does not say '110 USDT deposit'",
    ).toBe("110 USDT deposit");
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-in-time-left"]')?.textContent,
      "the time left does not start at the file's 29:59",
    ).toBe("Within 29:59 minutes");
    const apps = ["trust", "metamask", "binance"].filter(
      (id) => !container.querySelector(`[data-pw="demo-wallet-cash-in-app-${id}"]`),
    );
    expect(apps, "these wallets are missing under 'Or Try Direct Link To'").toEqual([]);
  }, 15000);

  it("cash in with crypto: 'I Disagree & Cancel' puts the safety rules away and keeps the form", async () => {
    setDevice("pointer");
    const container = await openDollars();
    fireEvent.click(container.querySelector('[data-pw="demo-wallet-cash-in-usd"]')!);
    fireEvent.click((await find(container, "demo-wallet-cash-in-way-crypto"))!);
    const input = (await find(container, "demo-wallet-cash-in-amount-input")) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "100" } });
    fireEvent.click((await find(container, "demo-wallet-cash-in-generate"))!);
    const cancel = await find(container, "demo-wallet-cash-in-disagree");
    expect(cancel, "the safety rules have no 'I Disagree & Cancel'").not.toBeNull();
    fireEvent.click(cancel!);
    await waitFor(() =>
      expect(
        container.querySelector('[data-pw="demo-wallet-cash-in-safe"]'),
        "'I Disagree & Cancel' did not put the safety rules away",
      ).toBeNull(),
    );
    expect(
      container.querySelector('[data-pw="demo-wallet-cash-in-crypto"]'),
      "'I Disagree & Cancel' left the crypto form",
    ).not.toBeNull();
  }, 15000);

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
    // The page itself carries the blur. As the layer's backdrop-filter, Chrome
    // kept the purple cards strong at the canvas's edges in a short window.
    const page = container
      .querySelector('[data-pw="demo-wallet"] header')
      ?.closest<HTMLElement>("div");
    expect(
      page?.style.filter,
      "the page behind the receipt is not blurred (the file's background blur is 15.37)",
    ).toContain("blur(15.37px)");
    expect(
      layer!.style.backdropFilter,
      "the receipt's layer blurs its backdrop again; that is the blur Chrome draws wrong in a short window",
    ).toBeFalsy();
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

/**
 * A paragraph the file centres: XD stores every line's x, and the browser's
 * own centring landed 1 to 2 px off it (`Home Page – 21`, `– 22`).
 */
describe("Demo FileLines — the file's lines at the file's x", () => {
  const LINES = [
    { x: 61.11, text: "You Can Add Funds To An Account Through The " },
    { x: 92.1, text: "Following Options Easily And Securely." },
  ];

  it("draws each of the file's lines from its own x when the text is the file's", () => {
    const { container } = render(
      <FileLines
        text="You Can Add Funds To An Account Through The Following Options Easily And Securely."
        lines={LINES}
        left={32}
        width={366}
        size={14}
        lineHeight={18}
      />,
    );
    const lines = [...container.querySelectorAll<HTMLElement>("p > span")];
    expect(
      lines.map((line) => line.textContent),
      "the paragraph is not broken where the file breaks it",
    ).toEqual(["You Can Add Funds To An Account Through The", "Following Options Easily And Securely."]);
    expect(lines[0].style.marginLeft, "the first line does not start at the file's x 61.11").toBe("29.11px");
    expect(
      Number.parseFloat(lines[1].style.marginLeft),
      "the second line does not start at the file's x 92.1",
    ).toBeCloseTo(92.1 - 32, 2);
  });

  it("wraps and centres another language's text as one paragraph", () => {
    const { container } = render(
      <FileLines
        text="يمكنك إضافة الأموال إلى حسابك عبر الخيارات التالية بسهولة وأمان."
        lines={LINES}
        left={32}
        width={366}
        size={14}
        lineHeight={18}
      />,
    );
    const p = container.querySelector("p")!;
    expect(p.querySelectorAll("span").length, "another language was cut into the English lines").toBe(0);
    expect(p.className, "another language's paragraph is not centred").toContain("text-center");
  });

  it("Safari topbar tinting: useOuterBackdrop manages meta theme-color and body background", () => {
    function TestComponent({ open }: { open: boolean }) {
      useOuterBackdrop(open, "rgba(0,0,0,0.5)", "rgb(52, 52, 52)");
      return null;
    }
    const { rerender, unmount } = render(<TestComponent open={false} />);
    expect(document.querySelector('meta[name="theme-color"]')).toBeNull();

    rerender(<TestComponent open={true} />);
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    expect(meta, "theme-color meta tag must be created").not.toBeNull();
    expect(meta?.content, "theme-color content must match backdrop top color").toBe("rgb(52, 52, 52)");
    expect(document.body.style.backgroundColor).toBe("rgb(52, 52, 52)");
    expect(document.documentElement.style.backgroundColor).toBe("rgb(52, 52, 52)");

    const strip = document.querySelector<HTMLElement>('[data-pw="demo-top-tint"]');
    expect(strip, "top tint overlay must be rendered").not.toBeNull();
    expect(strip?.style.width).toBe("100vw");

    unmount();
    expect(document.querySelector('meta[name="theme-color"]'), "meta tag must be removed on unmount").toBeNull();
  });
});
