// The seller shop list, on its very first paint (AC-9).
//
// WHAT WENT WRONG
// `loading` in SellerProfileContext started `false`. The page's fetch runs in an
// effect, and effects run AFTER the first paint — so for one frame the page
// rendered with `loading === false` and an empty `shopes` array, which is the
// "no shops" branch. The seller was told they had no shops at the exact moment
// their shops were being fetched.
//
// WHY THIS FILE RENDERS TO A STRING INSTEAD OF USING renderWithProviders
// Testing Library's `render` wraps the mount in `act`, so effects have already
// run by the time the first assertion can look — `getInitialData` has set
// `loading` to true and the placeholder is on screen either way. A test written
// that way passes against the broken code, which is exactly what happened to the
// first version of this file.
//
// `renderToStaticMarkup` never runs effects. What it returns IS the first paint,
// which is the frame this criterion is about.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderToStaticMarkup } from "react-dom/server";

import { act, renderWithProviders } from "../../render";

const getShopes = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getShopes: (...args: unknown[]) => getShopes(...args),
    leaveShop: vi.fn(),
  },
}));

import Page from "app/(client)/[lang]/sellerProfile/page";
import { SellerProfileProvider } from "app/(client)/[lang]/sellerProfile/SellerProfileContext";

const shopList = (
  <SellerProfileProvider>
    <Page />
  </SellerProfileProvider>
);

beforeEach(() => {
  getShopes.mockReset();
  getShopes.mockResolvedValue({
    success: true,
    data: [{ seller_id: 7, shop_name: "A Shop", permissions: ["SUPER_ADMIN"] }],
  });
});

describe("the seller shop list on first paint", () => {
  it("paints its placeholder, not an empty state, before any effect runs (AC-9)", () => {
    const firstPaint = renderToStaticMarkup(shopList);

    expect(
      firstPaint.includes("animate-pulse"),
      "the shop list's first paint has no placeholder in it, so the seller sees the page's empty state for a frame before the shops request has even been made",
    ).toBe(true);

    expect(
      /no shops/i.test(firstPaint),
      "the shop list's first paint told the seller they have no shops — before the shops request had been made, let alone answered",
    ).toBe(false);
  });

  it("replaces the placeholder with the shops once they arrive (AC-9)", async () => {
    const { container, findByText } = await renderWithProviders(shopList, {
      path: "/sellerProfile",
      params: { lang: "sy-en" },
    });

    expect(
      await findByText("A Shop"),
      "the shop list never showed the shop the backend returned",
    ).toBeTruthy();

    expect(
      container.querySelectorAll(".animate-pulse").length,
      "the placeholder was still on screen after the shops arrived",
    ).toBe(0);
  });

  it("asks the core backend for the seller's shops exactly once on mount", async () => {
    await renderWithProviders(shopList, {
      path: "/sellerProfile",
      params: { lang: "sy-en" },
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(
      getShopes.mock.calls.length,
      `the shop list called the core backend's shops endpoint ${getShopes.mock.calls.length} times on a single mount`,
    ).toBe(1);
  });
});
