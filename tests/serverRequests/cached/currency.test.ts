// @vitest-environment node
//
// serverRequests/cached/currency.ts carries `import "server-only"`, so it can
// only be loaded from a server-like test environment. See tests/mocks/serverOnly.ts.
import { describe, it, expect, vi, beforeEach } from "vitest";

const getCurrency = vi.fn();

vi.mock("serverRequests/currency", () => ({ getCurrency }));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

describe("getCachedCurrency", () => {
  beforeEach(() => getCurrency.mockReset());

  it("passes the country and language straight through", async () => {
    getCurrency.mockResolvedValue({ exchange_rate: 12, symbol: "£" });

    const { getCachedCurrency } = await import("serverRequests/cached/currency");
    await getCachedCurrency("sy", "ar");

    expect(
      getCurrency.mock.calls[0],
      "the cached currency reader called the core currency reader with the wrong arguments, so a shopper in one country would see another country's prices",
    ).toEqual(["sy", "ar"]);
  });

  it("drops the timing fields, which differ on every call", async () => {
    getCurrency.mockResolvedValue({
      exchange_rate: 12,
      symbol: "£",
      redis: true,
      time: 3.14159,
    });

    const { getCachedCurrency } = await import("serverRequests/cached/currency");
    const currency = await getCachedCurrency("sy", "ar");

    expect(
      Object.keys(currency).sort(),
      "the cached currency still carries the per-call timing fields (`time`, `redis`); storing them freezes one request's measurement into every later response and makes cache entries differ for no reason",
    ).toEqual(["exchange_rate", "symbol"]);
  });

  it("keeps the empty answer empty rather than inventing a rate", async () => {
    getCurrency.mockResolvedValue({});

    const { getCachedCurrency } = await import("serverRequests/cached/currency");

    expect(
      await getCachedCurrency("sy", "ar"),
      "an empty currency answer was turned into something else; the wallet path treats {} as truthy and walks on, so changing that shape changes the wallet (finding 7)",
    ).toEqual({});
  });
});
