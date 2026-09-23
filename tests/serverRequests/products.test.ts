// @vitest-environment node
//
// The add-to-cart product read (serverRequests/products.ts).
//
// getProductDataForAddToCart asks the market backend three things at once: the
// product's global details, its prices and stock per variation, and the
// shopper's "notify me" settings per variation (which needs the shopper's
// MARKET-TOKEN). It merges the three into one product, with each variation's
// notify flag joined onto its price row.
//
// The backend fetch, the cookie reader and the market base address are replaced.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", async () => (await import("../mocks/nextHeaders")).makeNextHeadersMock());
/** The stand-in built above, read back so a case can set its cookies. */
const headers: any = await import("next/headers");

const io = vi.hoisted(() => ({
  fetchServerData: vi.fn(),
  marketBase: vi.fn(),
  logServerError: vi.fn(),
}));
vi.mock("serverRequests/ServerFetch", () => ({ fetchServerData: io.fetchServerData }));
vi.mock("utils/server/tokenManager", () => ({ getMarketFetchBase: io.marketBase }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: io.logServerError }));

import { getProductDataForAddToCart, resolveMarketFetchBase } from "serverRequests/products";

/** Answer the three reads by the path they ask for. */
function answer({ global = {}, prices = {}, notify = {} }: { global?: any; prices?: any; notify?: any }) {
  io.fetchServerData.mockImplementation(async ({ url }: { url: string }) => {
    if (url.includes("/globalDetails/")) return global;
    if (url.includes("/qtyPriceDetails/")) return prices;
    return notify;
  });
}

const ask = () => getProductDataForAddToCart({ language: "ar", country: "sy", slug: "red-dress" });

beforeEach(() => {
  vi.clearAllMocks();
  headers.__reset({ cookies: { "MARKET-TOKEN": "market-session" } });
  io.marketBase.mockResolvedValue("https://market.test");
});

describe("the market base address", () => {
  it("passes on the address the shopper's session is routed to", async () => {
    expect(await resolveMarketFetchBase(), "the routed market address was not passed on").toBe(
      "https://market.test",
    );
  });
});

describe("the add-to-cart product read (getProductDataForAddToCart)", () => {
  it("asks the three reads on the routed market address, the notify read with the shopper's token", async () => {
    answer({});

    await ask();

    const calls = io.fetchServerData.mock.calls.map((call) => call[0]);
    expect(calls.map((c) => c.url), "the three reads went to the wrong addresses").toEqual([
      "https://market.test/web/product/globalDetails/red-dress",
      "https://market.test/web/product/qtyPriceDetails/red-dress",
      "https://market.test/web/product/likesDetails/red-dress",
    ]);
    expect(calls[2].headers.Authorization, "the notify read did not carry the shopper's token").toBe(
      "Bearer market-session",
    );
    expect(calls[0].headers, "the reads did not carry the page's language and country").toMatchObject({
      language: "ar",
      lang: "ar",
      country: "sy",
    });
  });

  it("joins each variation's notify flag onto its price row", async () => {
    answer({
      global: { data: { data: { name: "Red dress" } } },
      prices: {
        data: {
          data: {
            price: 10,
            variations: [
              { product_variation_id: "v1", qty: 3 },
              { id: "v2", qty: 0 },
            ],
          },
        },
      },
      notify: {
        data: {
          data: {
            variation: [
              { id: "v1", variant_notify_for_user: false },
              { product_variation_id: "v2", variant_notify_for_user: true },
              { id: "v9", variant_notify_for_user: true },
            ],
          },
        },
      },
    });

    const product: any = await ask();

    expect([product.name, product.price], "the details and prices were not merged").toEqual(["Red dress", 10]);
    expect(product.variation, "the notify flags were not joined onto the price rows").toEqual([
      { id: "v1", variant_notify_for_user: false, product_variation_id: "v1", qty: 3 },
      { product_variation_id: "v2", variant_notify_for_user: true, id: "v2", qty: 0 },
      { id: "v9", variant_notify_for_user: true },
    ]);
    expect(io.logServerError, "a working notify read was reported").not.toHaveBeenCalled();
  });

  it("uses the price rows as they are, under either name, when there are no notify settings", async () => {
    answer({ prices: { data: { data: { variation: [{ id: "v1" }] } } } });
    expect((await ask() as any).variation, "the `variation` price rows were not used").toEqual([{ id: "v1" }]);

    answer({ prices: { data: { data: {} } } });
    expect((await ask() as any).variation, "no price rows did not give an empty list").toEqual([]);
  });

  it("reports a failed notify read, and still answers the product", async () => {
    headers.__reset();
    answer({
      global: { data: { data: { name: "Red dress" } } },
      notify: { isError: true, status: 502, error: "bad gateway", url: "https://market.test/x" },
    });

    const product: any = await ask();

    expect(product.name, "a failed notify read lost the product").toBe("Red dress");
    expect(
      io.fetchServerData.mock.calls[2][0].headers.Authorization,
      "a shopper with no session did not send an empty token",
    ).toBe("Bearer ");
    expect(io.logServerError.mock.calls[0]?.[0], "the failed notify read was not reported").toMatchObject({
      scenario: "likesDetails go service failed in getProductDataForAddToCart",
      slug: "red-dress",
      status: 502,
    });
  });
});
