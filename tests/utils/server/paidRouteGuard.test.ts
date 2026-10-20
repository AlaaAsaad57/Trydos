// @vitest-environment node
//
// The guard in front of the paid API routes (image search, voice search):
// a caller needs a session cookie, the upload has a size cap, and each
// address gets a fixed number of calls per window. Redis is replaced.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({ rateLimit: vi.fn() }));
vi.mock("serverRequests/radis", () => ({ fixedWindowRateLimit: io.rateLimit }));

import { guardPaidCall, PAID_CALL_MESSAGES } from "utils/server/paidRouteGuard";

const request = (opts: { cookie?: string; ip?: string } = {}) =>
  new NextRequest("https://trydos.test/api/image-search", {
    method: "POST",
    headers: {
      ...(opts.cookie ? { cookie: opts.cookie } : {}),
      ...(opts.ip ? { "x-forwarded-for": opts.ip } : {}),
    },
  });

const file = (bytes: number) =>
  new File([new Uint8Array(bytes)], "a.png", { type: "image/png" });

const opts = { name: "image", maxBytes: 100, limit: 5, windowSeconds: 60 };

beforeEach(() => {
  vi.clearAllMocks();
  io.rateLimit.mockResolvedValue({ allowed: true, remaining: 4, ttl: 60 });
});

describe("the paid-call guard", () => {
  it("refuses a caller with no session cookie, before the limiter runs", async () => {
    const refusal = await guardPaidCall(request(), { ...opts, file: file(10) });

    expect(refusal, "a caller with no session was let through").toEqual({
      status: 401,
      message: PAID_CALL_MESSAGES.noSession,
    });
    expect(io.rateLimit, "the limiter was charged for a refused caller").not.toHaveBeenCalled();
  });

  it("refuses an upload over the size cap, before the limiter runs", async () => {
    const refusal = await guardPaidCall(request({ cookie: "MARKET-TOKEN=t" }), {
      ...opts,
      file: file(101),
    });

    expect(refusal, "an upload over the cap was let through").toEqual({
      status: 413,
      message: PAID_CALL_MESSAGES.tooLarge,
    });
    expect(io.rateLimit, "the limiter was charged for a refused upload").not.toHaveBeenCalled();
  });

  it("answers busy when the limiter is not available, so a paid call never runs uncapped", async () => {
    io.rateLimit.mockResolvedValue({ allowed: true, remaining: 5, ttl: 0 });

    const refusal = await guardPaidCall(request({ cookie: "MARKET-TOKEN=t" }), { ...opts, file: file(10) });

    expect(refusal, "a call ran with the limiter down").toEqual({
      status: 503,
      message: PAID_CALL_MESSAGES.busy,
    });
  });

  it("refuses a caller over the limit", async () => {
    io.rateLimit.mockResolvedValue({ allowed: false, remaining: 0, ttl: 30 });

    const refusal = await guardPaidCall(request({ cookie: "MARKET-TOKEN=t" }), { ...opts, file: file(10) });

    expect(refusal, "a caller over the limit was let through").toEqual({
      status: 429,
      message: PAID_CALL_MESSAGES.tooMany,
    });
  });

  it("lets a good call through and keys the limiter on a hashed address, per route", async () => {
    const refusal = await guardPaidCall(
      request({ cookie: "MARKET-TOKEN=t", ip: "203.0.113.7, 10.0.0.1" }),
      { ...opts, file: file(10) },
    );

    expect(refusal, "a good call was refused").toBeNull();
    const [key, limit, window] = io.rateLimit.mock.calls[0];
    expect(key, "the limiter key does not name the route").toMatch(/^paid:image:rl:[0-9a-f]{32}$/);
    expect(key, "the raw address was written into the limiter key").not.toContain("203.0.113.7");
    expect([limit, window], "the limit or the window is wrong").toEqual([5, 60]);
  });

  it("works for a call that carries no file", async () => {
    const refusal = await guardPaidCall(request({ cookie: "MARKET-TOKEN=t" }), { ...opts, file: null });

    expect(refusal, "a call with no file was refused").toBeNull();
  });
});
