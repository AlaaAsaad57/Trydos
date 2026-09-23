// The two product pages of the seller dashboard: open one product, and add a
// new one. Each page reads the route, sets the text direction, builds the back
// link to the dashboard, and hands the ids to the product editor.
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "../../../render";

const back = vi.hoisted(() => vi.fn());

vi.mock("components/setting/BackBar", () => ({
  default: (p: any) => (
    <div
      data-testid="backbar"
      data-name={p.name}
      data-prev={p.preivous_page}
      data-rtl={String(p.isRtl)}
      data-intercept={String(p.onBackIntercept === back)}
    />
  ),
}));

vi.mock("components/SellerDashboard/productEdit/ProductEditor", () => ({
  default: (p: any) => <div data-testid="editor">{JSON.stringify(p)}</div>,
}));

vi.mock("components/SellerDashboard/useDashboardDetailBack", () => ({
  useDashboardDetailBack: () => back,
}));

import EditPage from "app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/products/[productId]/page";
import NewPage from "app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/products/new/page";

describe("seller product pages", () => {
  it("the edit page passes the product and seller ids and links back to the dashboard", async () => {
    const { container } = await renderWithProviders(<EditPage />, {
      country: "sy",
      params: { sellerId: "77", productId: "9001" },
    });
    const bar = screen.getByTestId("backbar");
    expect(bar.dataset.name, "the edit page title is wrong").toBe("Product");
    expect(bar.dataset.prev, "the back link must go to the seller's dashboard").toBe(
      "/sy-en/sellerProfile/sellerDashboard/77",
    );
    expect(bar.dataset.intercept, "the dashboard back handler was not passed to the back bar").toBe("true");
    expect(JSON.parse(screen.getByTestId("editor").textContent!), "the editor got the wrong ids").toEqual({
      sellerId: "77",
      productId: "9001",
      local: "sy-en",
    });
    expect(container.querySelector("[dir]")?.getAttribute("dir"), "an English page must be left-to-right").toBe("ltr");
  });

  it("the new page opens the editor in create mode, right-to-left in Arabic", async () => {
    const { container } = await renderWithProviders(<NewPage />, {
      country: "sy",
      language: "ar",
      params: { sellerId: "77" },
    });
    const bar = screen.getByTestId("backbar");
    expect(bar.dataset.rtl, "an Arabic page must tell the back bar it is right-to-left").toBe("true");
    expect(JSON.parse(screen.getByTestId("editor").textContent!), "the editor was not opened in create mode").toEqual({
      sellerId: "77",
      local: "sy-ar",
      mode: "create",
    });
    expect(container.querySelector("[dir]")?.getAttribute("dir"), "an Arabic page must be right-to-left").toBe("rtl");
  });

  it.each([
    ["edit", EditPage],
    ["new", NewPage],
  ])("the %s page survives a route with no language segment", async (_l, Page) => {
    await renderWithProviders(<Page />, { params: { sellerId: "77", lang: "" as any } });
    expect(screen.getByTestId("backbar").dataset.prev, "a missing locale must still build a dashboard link").toBe(
      "//sellerProfile/sellerDashboard/77",
    );
  });

  it("the edit page in Kurdish is right-to-left", async () => {
    const { container } = await renderWithProviders(<EditPage />, {
      country: "iq",
      language: "ku",
      params: { sellerId: "1", productId: "2" },
    });
    expect(container.querySelector("[dir]")?.getAttribute("dir"), "a Kurdish page must be right-to-left").toBe("rtl");
  });
});
