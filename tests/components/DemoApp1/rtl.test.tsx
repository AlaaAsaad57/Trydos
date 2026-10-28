import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const params = vi.hoisted(() => ({ value: { lang: "sy-en" } as Record<string, unknown> | null }));
vi.mock("next/navigation", () => ({ useParams: () => params.value }));

import { isRtlLocale, mirrorFor, usePageDir } from "components/DemoApp1/rtl";

describe("the new UI's page direction (D-3 in UI-MIGRATION-PLAN.md)", () => {
  it.each([
    ["sy-ar", true],
    ["iq-ku", true],
    ["sy-en", false],
    ["tr-tr", false],
    ["", false],
  ])("the locale %s is right to left: %s", (locale, rtl) => {
    expect(isRtlLocale(locale), `the locale "${locale}" got the wrong writing direction`).toBe(rtl);
  });

  it("reads the direction from the page's locale segment", () => {
    params.value = { lang: "sy-ar" };
    expect(renderHook(() => usePageDir()).result.current, "an Arabic page is not right to left").toBe("rtl");
    params.value = { lang: "iq-ku" };
    expect(renderHook(() => usePageDir()).result.current, "a Kurdish page is not right to left").toBe("rtl");
    params.value = { lang: "sy-en" };
    expect(renderHook(() => usePageDir()).result.current, "an English page is not left to right").toBe("ltr");
  });

  it("falls back to left to right where there is no locale segment", () => {
    params.value = null;
    expect(renderHook(() => usePageDir()).result.current, "a page with no route params is not left to right").toBe("ltr");
  });

  it("turns a pointing icon only on a right-to-left page", () => {
    expect(mirrorFor("rtl"), "a back arrow is not turned on a right-to-left page").toEqual({ transform: "scaleX(-1)" });
    expect(mirrorFor("ltr"), "a back arrow is turned on a left-to-right page").toBeUndefined();
  });
});
