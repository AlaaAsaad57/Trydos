// @vitest-environment node
//
// The cache-flush route: it drops the OTP limits and every cached product.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { cacheSpies } from "../../../mocks/serverRequests";

vi.mock("utils/serverErrorReporter", () => ({ LogServerError: vi.fn() }));

import { GET } from "app/api/clearRedis/route";

const request = (method = "GET") =>
  new NextRequest("https://trydos.test/api/clearRedis", { method });

beforeEach(() => {
  cacheSpies.getKeys.mockResolvedValue([]);
  cacheSpies.flushOtpLimitsAction.mockResolvedValue(undefined);
});

describe("the clearRedis route", () => {
  it("answers a preflight with 204 and touches nothing", async () => {
    const response = await GET(request("OPTIONS"));

    expect(response.status, "the preflight did not answer 204").toBe(204);
    expect(
      cacheSpies.flushOtpLimitsAction,
      "a preflight flushed the OTP limits",
    ).not.toHaveBeenCalled();
  });

  it("says so when no product is cached", async () => {
    const response = await GET(request());

    expect(cacheSpies.flushOtpLimitsAction, "the OTP limits were not flushed").toHaveBeenCalled();
    await expect(response.json(), "an empty cache did not say no keys were found").resolves.toEqual({
      message: "No matching keys found",
    });
  });

  it("removes every cached product and lists them", async () => {
    cacheSpies.getKeys.mockResolvedValue(["product:1", "product:2"]);

    const response = await GET(request());

    expect(cacheSpies.getKeys, "the route did not look for product keys").toHaveBeenCalledWith("product*");
    expect(cacheSpies.removeRedis, "product:1 was not removed").toHaveBeenCalledWith("product:1");
    expect(cacheSpies.removeRedis, "product:2 was not removed").toHaveBeenCalledWith("product:2");
    await expect(response.json(), "the answer did not list the removed keys").resolves.toEqual({
      message: "Removed 2 keys",
      removedKeys: ["product:1", "product:2"],
    });
    expect(response.headers.get("cache-control"), "the answer may be cached").toBe("no-store");
  });

  it("answers 500 with the error text when the cache fails", async () => {
    cacheSpies.getKeys.mockRejectedValueOnce(new Error("redis down"));

    const response = await GET(request());

    expect(response.status, "a cache failure did not answer 500").toBe(500);
    await expect(response.json(), "the 500 did not carry the cache error").resolves.toEqual({
      error: "redis down",
    });
  });

  it("falls back to a plain message when the error carries none", async () => {
    cacheSpies.getKeys.mockRejectedValueOnce(new Error(""));

    const response = await GET(request());

    await expect(response.json(), "the 500 did not carry the fallback message").resolves.toEqual({
      error: "Failed to remove keys",
    });
  });
});
