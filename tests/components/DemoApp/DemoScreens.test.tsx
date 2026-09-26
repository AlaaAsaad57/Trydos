import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    expect(box!.style.left, "the photo box is not at x 290").toBe("290px");
    expect(box!.style.top, "the photo box is not at y 136").toBe("136px");
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
    const line = [...container.querySelectorAll<HTMLElement>("*")].find((el) =>
      el.style.boxShadow.includes("inset 0 0 0 1.5px"),
    );
    expect(line, "the photo box has no 1.5 px white line").toBeDefined();
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
      expect(
        title.style.top,
        `the ${tab} title is not on the crumb baseline (design y 80, so 16 px into the header)`,
      ).toBe("16px");
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
