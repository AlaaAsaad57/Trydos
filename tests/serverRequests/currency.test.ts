// @vitest-environment node
//
// Which backend the currency reader asks, and — the point of this file — whether
// it reads a cookie to decide. A `use cache` scope has no cookies: a read there
// throws and the whole prerender of /[lang] fails. See
// serverRequests/cached/currency.ts.
import { describe, it, expect, vi, beforeEach } from "vitest";

const getMarketFetchBase = vi.fn(async () => "https://core.example.test");
const fetchServerData = vi.fn();
const getCurrencyFromCache = vi.fn(async () => null);
const StoreCurrency = vi.fn();

vi.mock("utils/server/tokenManager", () => ({ getMarketFetchBase }));
vi.mock("serverRequests/ServerFetch", () => ({ fetchServerData }));
vi.mock("serverRequests/radis", () => ({ getCurrencyFromCache, StoreCurrency }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: vi.fn() }));

import { LogServerError } from "utils/serverErrorReporter";

const CURRENCY_ANSWER = {
  isError: false,
  status: 200,
  data: { data: { currency: { exchange_rate: 12, symbol: "£" } } },
};

describe("the currency readers and the backend they ask", () => {
  beforeEach(() => {
    getMarketFetchBase.mockClear();
    fetchServerData.mockReset();
    fetchServerData.mockResolvedValue(CURRENCY_ANSWER);
    process.env.GO_BACKEND_URL = "https://gateway.example.test";
  });

  it("sends the ordinary reader to whichever backend the shopper's cookie chose", async () => {
    const { getCurrency } = await import("serverRequests/currency");
    await getCurrency("sy", "ar");

    // The positive control. Without it, a reader that asked nobody at all would
    // pass the gateway test below and prove nothing.
    expect(
      getMarketFetchBase.mock.calls.length,
      "getCurrency stopped choosing its backend from the User-Data cookie, so a verified shopper is no longer routed to the core backend",
    ).toBe(1);
    expect(
      fetchServerData.mock.calls[0]?.[0]?.url,
      "getCurrency did not send its request to the base the cookie chose",
    ).toContain("https://core.example.test");
  });

  it("keeps the gateway reader away from the cookie", async () => {
    const { getGatewayCurrency } = await import("serverRequests/currency");
    await getGatewayCurrency("sy", "ar");

    expect(
      getMarketFetchBase.mock.calls.length,
      "the gateway currency reader still asks getMarketFetchBase, which reads the User-Data cookie; inside `use cache` that read throws and the prerender of /[lang] fails",
    ).toBe(0);
  });

  it("sends the gateway reader to the gateway base", async () => {
    const { getGatewayCurrency } = await import("serverRequests/currency");
    await getGatewayCurrency("sy", "ar");

    expect(
      fetchServerData.mock.calls[0]?.[0]?.url,
      "the gateway currency reader did not ask the gateway (D-11), so a cached document would carry the wrong backend's answer",
    ).toContain("https://gateway.example.test");
  });

  it("asks the gateway for the country and language it was given", async () => {
    const { getGatewayCurrency } = await import("serverRequests/currency");
    await getGatewayCurrency("lb", "tr");

    const url = fetchServerData.mock.calls[0]?.[0]?.url ?? "";
    expect(
      url,
      `the gateway currency request carried the wrong country, so Lebanon would be priced as somewhere else (${url})`,
    ).toContain("country=lb");
    expect(
      url,
      `the gateway currency request carried the wrong language (${url})`,
    ).toContain("lang=tr");
  });

  it("returns the same shape from both readers", async () => {
    const { getCurrency, getGatewayCurrency } = await import(
      "serverRequests/currency"
    );
    const viaCookie = await getCurrency("sy", "ar");
    const viaGateway = await getGatewayCurrency("sy", "ar");

    expect(
      Object.keys(viaGateway).sort(),
      "the two currency readers answer with different fields, so swapping one for the other in a cached render would change what the page shows",
    ).toEqual(Object.keys(viaCookie).sort());
  });
});

describe("the cache, the refusals and the direct reader", () => {
  beforeEach(() => {
    fetchServerData.mockReset();
    fetchServerData.mockResolvedValue(CURRENCY_ANSWER);
    getCurrencyFromCache.mockReset();
    getCurrencyFromCache.mockResolvedValue(null);
    StoreCurrency.mockClear();
    vi.mocked(LogServerError).mockClear();
  });

  it("answers a cached currency stored as text or as an object, without asking a backend", async () => {
    const { getCurrency } = await import("serverRequests/currency");
    getCurrencyFromCache
      .mockResolvedValueOnce(JSON.stringify({ exchange_rate: 3, symbol: "$" }) as any)
      .mockResolvedValueOnce({ exchange_rate: 4, symbol: "€" } as any);

    const fromText: any = await getCurrency("sy", "ar");
    const fromObject: any = await getCurrency("sy", "ar");

    expect([fromText.exchange_rate, fromText.redis], "the cached text currency was not used").toEqual([3, true]);
    expect([fromObject.exchange_rate, fromObject.redis], "the cached object currency was not used").toEqual([4, true]);
    expect(fetchServerData, "a backend was asked despite the cache").not.toHaveBeenCalled();
  });

  it("stores a fresh currency, and reads the old flat answer shape too", async () => {
    const { getCurrency } = await import("serverRequests/currency");
    fetchServerData.mockResolvedValueOnce({ isError: false, status: 200, data: { data: { exchange_rate: 7 } } });

    const fresh: any = await getCurrency("iq", "en");

    expect([fresh.exchange_rate, fresh.redis], "the flat currency answer was not read").toEqual([7, false]);
    expect(StoreCurrency, "the fresh currency was not stored").toHaveBeenCalledWith("iq", { exchange_rate: 7 });
  });

  it("answers no currency, and reports it, when the backend refuses", async () => {
    const { getCurrency } = await import("serverRequests/currency");
    fetchServerData
      .mockResolvedValueOnce({ isError: true, status: 503 })
      .mockResolvedValueOnce({ isError: true, status: 400, error: "bad country" });

    expect(await getCurrency("sy", "ar"), "a refused currency read gave a currency").toEqual({});
    expect(await getCurrency("sy", "ar"), "a refused currency read gave a currency").toEqual({});
    expect(
      vi.mocked(LogServerError).mock.calls.map((call: any[]) => call[0]?.error),
      "the refusals were not reported with their status",
    ).toContain("Currency Error: 503");
  });

  it("reads the currency directly from the shopper's backend (fetchCurrency)", async () => {
    const { fetchCurrency } = await import("serverRequests/currency");

    const result = await fetchCurrency("ar", "sy");

    expect(result.data, "the direct reader did not flatten the currency").toEqual({ exchange_rate: 12, symbol: "£" });
  });

  it(
    "BUG-data-4: a currency read that throws is reported as the currency failure it is",
    async () => {
      const { getCurrency } = await import("serverRequests/currency");
      fetchServerData.mockRejectedValueOnce(new Error("socket hang up"));

      await getCurrency("sy", "ar");

      expect(
        vi.mocked(LogServerError).mock.calls.map((call: any[]) => call[0]?.source),
        "the currency failure report was lost: the catch in fetchCurrencyFrom reads `response.status` while " +
          "`response` is still undefined, so it throws a TypeError before it can report",
      ).toContain("currency");
    },
  );
});
