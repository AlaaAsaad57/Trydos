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
