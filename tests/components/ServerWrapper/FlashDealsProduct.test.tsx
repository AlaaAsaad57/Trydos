// The flash-deal row wrapper on the home page: it waits for the request, reads
// the cached flash deals for the locale, and hands them to the row.
import { beforeEach, describe, expect, it, vi } from "vitest";

const connection = vi.fn(async () => undefined);
const getCachedFlashDeals = vi.fn();

vi.mock("next/server", () => ({ connection: () => connection() }));
vi.mock("serverRequests/cached/home", () => ({
  getCachedFlashDeals: (...args: any[]) => getCachedFlashDeals(...args),
}));
vi.mock("components/Server/FlashDealsProducts", () => ({ default: () => null }));

import { FlashProductWrapper } from "components/ServerWrapper/FlashDealsProduct";

describe("the flash-deal row wrapper", () => {
  beforeEach(() => {
    connection.mockClear();
    getCachedFlashDeals.mockReset();
  });

  it("reads the flash deals for the locale and category, and passes them with the currency", async () => {
    getCachedFlashDeals.mockResolvedValue([{ id: 2 }]);
    const element: any = await FlashProductWrapper({
      lang: "sy-en",
      currency: Promise.resolve({ symbol: "SYP" }),
      mainCategory: "women" as any,
    });
    expect(connection, "the row must wait for the request before rendering cards").toHaveBeenCalled();
    expect(getCachedFlashDeals, "the deals must be read for this country, language and category").toHaveBeenCalledWith(
      "sy",
      "en",
      "women",
    );
    expect(element.props.flashDealsProducts, "the deals should reach the row").toEqual({
      data: { products: [{ id: 2 }] },
    });
    expect(element.props.currencyData, "the resolved currency should reach the row").toEqual({ symbol: "SYP" });
  });

  it("reads the whole home page when no category is given", async () => {
    getCachedFlashDeals.mockResolvedValue([]);
    await FlashProductWrapper({ lang: "sy-en", currency: null });
    expect(getCachedFlashDeals, "no category should be read as null").toHaveBeenCalledWith("sy", "en", null);
  });
});
