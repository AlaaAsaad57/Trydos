// The "Free Return" block on a product page (a server component). The backend
// says "no returns" with 0 days, and then the block is hidden.
import { describe, expect, it, vi } from "vitest";

import FreeReturnBadge from "components/products/FreeReturnBadge";

import { render, screen } from "../../render";

vi.mock("utils/server", () => ({
  translateFunction: (key: string, language: string) => `${language}:${key}`,
}));

describe("FreeReturnBadge", () => {
  it("shows the return days for a returnable product", async () => {
    render(
      await FreeReturnBadge({
        qtyPricePromise: Promise.resolve({ allow_return_in_days: "14" }),
        language: "ar",
        isRtl: true,
      }),
    );
    expect(screen.getByText("ar:Free Return"), "the block title is missing").toBeInTheDocument();
    expect(screen.getByText("14"), "the 14 return days are not shown").toBeInTheDocument();
    expect(
      document.querySelector('[data-pw="FreeReturn"]')!.className,
      "the Arabic block is not aligned right",
    ).toContain("items-end");
  });

  it.each([[{ allow_return_in_days: 0 }], [{}], [null]])("shows nothing for %j", async (data) => {
    const result = await FreeReturnBadge({ qtyPricePromise: Promise.resolve(data), language: "en", isRtl: false });
    expect(result, "a product with no returns still got a block").toBeNull();
  });
});
