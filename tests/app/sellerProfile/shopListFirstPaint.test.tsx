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

import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const getShopes = vi.fn();
const leaveShop = vi.fn();
const LogError = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getShopes: (...args: unknown[]) => getShopes(...args),
    leaveShop: (...args: unknown[]) => leaveShop(...args),
  },
}));

vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("utils/functions")>()),
  LogError: (...args: unknown[]) => LogError(...args),
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
  leaveShop.mockReset();
  LogError.mockReset();
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

/* ---------------- the shop list after the core backend answers ---------------- */

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

const mount = async (language: "en" | "ar" = "en") => {
  const result = await renderWithProviders(shopList, {
    language,
    country: "sy",
    path: "/sellerProfile",
    params: { lang: `sy-${language}` },
  });
  await settle();
  return result;
};

const threeShops = [
  { seller_id: 1, shop_name: "Admin Shop", permissions: ["SUPER_ADMIN"], is_master: 1 },
  { seller_id: 2, shop_name: "Role Shop", shop_role: "Editor", permissions: ["READ_PRODUCTS", "READ_ORDERS"] },
  { seller_id: 3, shop_name: "Bare Shop" },
];

/** The red confirm button inside the leave dialog. */
const confirmButton = () =>
  document.querySelector("button.bg-\\[\\#f85555\\]") as HTMLButtonElement;
const leaveButtons = () =>
  Array.from(document.querySelectorAll("button[aria-label]")) as HTMLButtonElement[];

describe("the seller shop list when the shops call fails", () => {
  it("logs a refused answer and shows the empty state", async () => {
    getShopes.mockResolvedValue({ success: false, message: "core said no" });

    await mount();

    expect(screen.queryByText("No shops available"), "a refused shops call should end on the empty state").not.toBeNull();
    expect(LogError.mock.calls[0]?.[0], "the refused shops call was not logged with the core backend's message").toEqual({
      scenario: "sellerProfile.getInitialData",
      error: "core said no",
    });
  });

  it("logs a generic message when the refusal carries none", async () => {
    getShopes.mockResolvedValue(undefined);

    await mount();

    expect(LogError.mock.calls[0]?.[0]?.error, "a shops call with no answer should log the generic failure").toBe(
      "Failed to fetch seller shops",
    );
  });

  it("logs a thrown non-Error value as a string", async () => {
    getShopes.mockRejectedValue("network down");

    await mount();

    expect(LogError.mock.calls[0]?.[0]?.error, "a thrown string was not logged as that string").toBe("network down");
  });

  it("treats a success with no data as no shops", async () => {
    getShopes.mockResolvedValue({ success: true });

    await mount();

    expect(screen.queryByText("No shops available"), "a success with no data should show the empty state").not.toBeNull();
  });
});

describe("the seller shop cards", () => {
  beforeEach(() => {
    getShopes.mockResolvedValue({ success: true, data: threeShops });
  });

  it("labels each shop by its role and permission count", async () => {
    await mount();

    expect(screen.queryByText("Super Admin"), "the Super Admin shop is not labelled Super Admin").not.toBeNull();
    expect(screen.queryByText("Editor"), "the shop's own role name is missing").not.toBeNull();
    expect(screen.queryByText("Member"), "a shop with no role should fall back to 'Member'").not.toBeNull();
    expect(screen.queryByText(/2\s+permissions/), "the non-admin shop's permission count is missing").not.toBeNull();
    expect(leaveButtons()[0].disabled, "the master shop's leave button should be disabled").toBe(true);
  });

  it("links each card to its dashboard and shows the loader on click", async () => {
    await mount();

    const link = document.querySelector(
      'a[href="/sy-en/sellerProfile/sellerDashboard/2"]',
    ) as HTMLAnchorElement;
    expect(link, "there is no Enter Dashboard link for shop 2").not.toBeNull();
    fireEvent.click(link);

    await waitFor(() =>
      expect(
        document.querySelectorAll(".animate-pulse").length > 0,
        "clicking Enter Dashboard did not put the list back into its loading placeholder",
      ).toBe(true),
    );
  });

  it("closes the leave dialog from the backdrop and from Cancel", async () => {
    await mount();

    fireEvent.click(leaveButtons()[1]);
    expect(screen.queryByText(/Role Shop\s*\?/), "the leave dialog did not name the shop").not.toBeNull();
    fireEvent.click(document.querySelector(".bg-black\\/45")!);
    expect(screen.queryByText(/Role Shop\s*\?/), "clicking the backdrop did not close the leave dialog").toBeNull();

    fireEvent.click(leaveButtons()[1]);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText(/Role Shop\s*\?/), "Cancel did not close the leave dialog").toBeNull();
  });

  it("removes the shop from the list after the core backend accepts the leave (ar)", async () => {
    leaveShop.mockResolvedValue({ success: true });
    await mount("ar");

    fireEvent.click(leaveButtons()[1]);
    await act(async () => {
      fireEvent.click(confirmButton());
    });
    await settle();

    expect(leaveShop.mock.calls[0]?.[0], "the leave call was not sent for the chosen shop").toBe("2");
    expect(screen.queryByText("Role Shop"), "the shop the seller left is still on the list").toBeNull();
    expect(document.querySelector(".bg-black\\/45"), "the leave dialog stayed open after a successful leave").toBeNull();
  });

  it("shows the core backend's refusal message and keeps the shop", async () => {
    leaveShop.mockResolvedValue({ success: false, message: "you are the owner" });
    await mount();

    fireEvent.click(leaveButtons()[2]);
    await act(async () => {
      fireEvent.click(confirmButton());
    });
    await settle();

    expect(screen.queryByText("you are the owner"), "the leave refusal message is not shown").not.toBeNull();
    expect(screen.queryAllByText("Bare Shop").length > 0, "the shop disappeared although the leave was refused").toBe(true);
    expect(LogError.mock.calls.at(-1)?.[0]?.scenario, "the refused leave was not logged").toBe("sellerProfile.confirmLeaveShop");
  });

  it("uses the generic messages when the leave refusal has none", async () => {
    leaveShop.mockResolvedValueOnce({ success: false });
    await mount();

    fireEvent.click(leaveButtons()[2]);
    await act(async () => {
      fireEvent.click(confirmButton());
    });
    await settle();
    expect(screen.queryByText("Failed to leave shop"), "a refusal with no message should show the generic error").not.toBeNull();

    leaveShop.mockRejectedValueOnce("socket closed");
    await act(async () => {
      fireEvent.click(confirmButton());
    });
    await settle();
    expect(LogError.mock.calls.at(-1)?.[0]?.error, "a thrown string was not logged as that string").toBe("socket closed");
    expect(screen.queryByText("Failed to leave shop"), "a thrown value with no message should show the generic error").not.toBeNull();
  });
});
