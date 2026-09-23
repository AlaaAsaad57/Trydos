// @vitest-environment node
//
// The colours-and-sizes list the search analyser uses (serverRequests/analyticsUtility.ts).
//
// It reads the list from Redis first, and asks the market backend only on a
// miss. It never throws: a failure gives empty lists, so the search only loses
// its colour and size hints. Redis (the suite-wide stand-in), the market base
// address, global fetch and the error reporter are replaced.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cacheSpies } from "tests/mocks/serverRequests";

const io = vi.hoisted(() => ({ marketBase: vi.fn(), logServerError: vi.fn() }));

vi.mock("serverRequests/products", () => ({ resolveMarketFetchBase: io.marketBase }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: io.logServerError }));

import { GetColorAndSizes } from "serverRequests/analyticsUtility";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  cacheSpies.RedisGet.mockReset();
  cacheSpies.RedisGet.mockResolvedValue(null);
  io.marketBase.mockResolvedValue("https://market.test");
});

afterEach(() => vi.unstubAllGlobals());

describe("the colours-and-sizes list (GetColorAndSizes)", () => {
  it("answers the cached list without asking the market backend", async () => {
    cacheSpies.RedisGet.mockResolvedValueOnce({ colors: "#fff", sizes: "M", redis: true } as any);

    expect(await GetColorAndSizes(), "the cached list was not used").toEqual({ colors: "#fff", sizes: "M", redis: true });
    expect(fetchMock, "the market backend was asked despite the cache").not.toHaveBeenCalled();
  });

  it("asks the routed market backend on a miss, and caches the answer", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ data: { colors: [{ code: "#ff0000" }, { code: "#0000ff" }], sizes: ["S", "M"] } }),
    });

    const result = await GetColorAndSizes();

    expect(fetchMock.mock.calls[0][0], "the list was not asked from the routed market backend").toBe(
      "https://market.test/web/get-colors-and-sizes",
    );
    expect(result, "the list is wrong").toEqual({ colors: "#ff0000, #0000ff", sizes: "S, M", redis: false });
    expect(cacheSpies.RedisSet, "the list was not cached").toHaveBeenCalledWith("colors-sizes", {
      colors: "#ff0000, #0000ff",
      sizes: "S, M",
      redis: true,
    });
  });

  it("answers empty lists, and reports it, when the read fails", async () => {
    fetchMock.mockRejectedValue(new Error("timeout"));

    const result: any = await GetColorAndSizes();

    expect([result.colors, result.sizes], "a failed read did not give empty lists").toEqual(["", ""]);
    expect(io.logServerError.mock.calls[0]?.[0]?.scenario, "the failed read was not reported").toBe(
      "getting color and sizes for analyzing search",
    );
  });
});
