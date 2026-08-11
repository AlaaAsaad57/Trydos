// @vitest-environment node
//
// The transport layer: what gets retried, what does not, and what is reported
// when a call fails. AC-11.
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "../msw/server";

// Both limits, not just the test one: a hook that hangs would otherwise idle on
// its own longer default. Both sit below the 15-second request abort, so a
// mis-wired reply fails fast instead of ageing out.
vi.setConfig({ testTimeout: 5000, hookTimeout: 5000 });

// The reporter fires its own outbound request, and two catch blocks swallow the
// failure — so the fake network cannot fail a test on it. Standing it in is what
// keeps this file offline, and it is also how the report is read back.
const LogServerError = vi.fn(async (_report: Record<string, any>) => undefined);
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (report: Record<string, any>) => LogServerError(report),
  default: (report: Record<string, any>) => LogServerError(report),
}));

// A reserved name that cannot resolve anywhere.
const BASE = "https://core.invalid";

/** Every delay the code asked for, without ever waiting for one. */
let delays: number[] = [];

beforeEach(() => {
  delays = [];
  LogServerError.mockClear();

  // The backoff helper is a private closure, so the only place to watch is the
  // timer itself. Recording the delay and running the callback straight away
  // proves the schedule without spending any of it.
  vi.spyOn(globalThis, "setTimeout").mockImplementation(((
    fn: () => void,
    ms?: number,
  ) => {
    delays.push(ms ?? 0);
    fn();
    return 0 as unknown as NodeJS.Timeout;
  }) as typeof setTimeout);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("a call that works (AC-11)", () => {
  it("returns the body and the status, and never retries", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/ok`, () => {
        calls += 1;
        return HttpResponse.json({ hello: "world" });
      }),
    );

    const { fetchServerData } = await import("serverRequests/ServerFetch");
    const result = await fetchServerData({ url: `${BASE}/ok` });

    expect(result).toMatchObject({
      data: { hello: "world" },
      error: null,
      status: 200,
    });
    expect(calls).toBe(1);
    expect(delays).toEqual([]);
    expect(LogServerError).not.toHaveBeenCalled();
  });

  it("passes the country and the language on, taken apart from one setting", async () => {
    let seen: Headers | undefined;
    server.use(
      http.get(`${BASE}/locale`, ({ request }) => {
        seen = request.headers;
        return HttpResponse.json({});
      }),
    );

    const { fetchServerData } = await import("serverRequests/ServerFetch");
    await fetchServerData({ url: `${BASE}/locale`, local: "tr-ar" });

    expect(seen?.get("country")).toBe("tr");
    expect(seen?.get("lang")).toBe("ar");
  });

  it("drops the content type when the body is a file upload", async () => {
    let seen: Headers | undefined;
    server.use(
      http.post(`${BASE}/upload`, ({ request }) => {
        seen = request.headers;
        return HttpResponse.json({});
      }),
    );

    const { fetchServerData } = await import("serverRequests/ServerFetch");
    await fetchServerData({
      url: `${BASE}/upload`,
      method: "POST",
      headers: { ContentType: "MULTIPART" },
    });

    // Left to the runtime to set, boundary and all.
    expect(seen?.get("content-type")).not.toBe("application/json");
  });
});

describe("a call that fails for good (AC-11)", () => {
  it("gives up at once on a status that will not improve", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/gone`, () => {
        calls += 1;
        return new HttpResponse("not here", { status: 404 });
      }),
    );

    const { fetchServerData } = await import("serverRequests/ServerFetch");
    const result = await fetchServerData({ url: `${BASE}/gone` });

    expect(calls).toBe(1);
    expect(delays).toEqual([]);
    expect(result).toMatchObject({ data: null, status: 404, isError: true });
  });

  it("reports the failure with its status and address", async () => {
    server.use(
      http.get(`${BASE}/gone`, () => new HttpResponse("nope", { status: 404 })),
    );

    const { fetchServerData } = await import("serverRequests/ServerFetch");
    await fetchServerData({ url: `${BASE}/gone` });

    expect(LogServerError).toHaveBeenCalledTimes(1);
    expect(LogServerError.mock.calls[0][0]).toMatchObject({
      status: 404,
      url: `${BASE}/gone`,
    });
  });

  it("keeps the reported body short even when the server is talkative", async () => {
    server.use(
      http.get(
        `${BASE}/verbose`,
        () => new HttpResponse("x".repeat(5000), { status: 500 }),
      ),
    );

    const { fetchServerData } = await import("serverRequests/ServerFetch");
    await fetchServerData({ url: `${BASE}/verbose` });

    const reported = LogServerError.mock.calls[0][0].message as string;
    // The address and the status share the line, so the cap is on the body.
    expect(reported.length).toBeLessThan(700);
    expect(reported).toContain("HTTP 500");
  });
});

describe("a call worth trying again (AC-11)", () => {
  it.each([502, 503, 504, 429])(
    "retries a %i up to the limit, then reports it",
    async (status) => {
      let calls = 0;
      server.use(
        http.get(`${BASE}/flaky`, () => {
          calls += 1;
          return new HttpResponse("busy", { status });
        }),
      );

      const { fetchServerData } = await import("serverRequests/ServerFetch");
      const result = await fetchServerData({
        url: `${BASE}/flaky`,
        retryAttempts: 3,
        retryDelay: 100,
      });

      expect(calls).toBe(3);
      expect(result).toMatchObject({ status, isError: true });
    },
  );

  it("stops retrying as soon as one attempt works", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/recovers`, () => {
        calls += 1;
        return calls < 3
          ? new HttpResponse("busy", { status: 503 })
          : HttpResponse.json({ ok: true });
      }),
    );

    const { fetchServerData } = await import("serverRequests/ServerFetch");
    const result = await fetchServerData({
      url: `${BASE}/recovers`,
      retryAttempts: 3,
      retryDelay: 100,
    });

    expect(calls).toBe(3);
    expect(result).toMatchObject({ data: { ok: true }, status: 200 });
  });

  it("backs off further each time, and never past one second", async () => {
    server.use(
      http.get(
        `${BASE}/slow`,
        () => new HttpResponse("busy", { status: 503 }),
      ),
    );

    const { fetchServerData } = await import("serverRequests/ServerFetch");
    await fetchServerData({
      url: `${BASE}/slow`,
      retryAttempts: 5,
      // Large enough that the ceiling has to clamp the later waits.
      retryDelay: 400,
    });

    // 400, 800, then held at the 1000 ceiling — asked for, never waited out.
    expect(delays).toEqual([400, 800, 1000, 1000]);
    expect(Math.max(...delays)).toBeLessThanOrEqual(1000);
  });

  it("retries when the connection itself fails, then gives a zero status", async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/down`, () => {
        calls += 1;
        return HttpResponse.error();
      }),
    );

    const { fetchServerData } = await import("serverRequests/ServerFetch");
    const result = await fetchServerData({
      url: `${BASE}/down`,
      retryAttempts: 2,
      retryDelay: 100,
    });

    expect(calls).toBe(2);
    expect(result).toMatchObject({ data: null, status: 0, isError: true });
    expect(LogServerError).toHaveBeenCalled();
  });
});
