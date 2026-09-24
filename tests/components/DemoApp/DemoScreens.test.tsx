import React from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
});
