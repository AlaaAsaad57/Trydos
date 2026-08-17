// @vitest-environment node
//
// The wrapper around the OTP counter script. AC-11 to AC-16.
//
// WHY THIS FILE IS BUILT THE WAY IT IS
// The module under test builds its cache client **while it is being evaluated**
// (`global._redis ?? new Redis({ host: process.env.REDIS_URL, … })`), not on the
// first call. That single line decides everything below:
//
//   1. The client stand-in is registered in `vi.hoisted`, which runs before any
//      import, so it cannot arrive late.
//   2. The same hoisted block seeds `global._redis` with the fake client. The
//      module reads that cache first, so with it seeded no client is ever
//      constructed — a second, independent line of defence that does not depend
//      on the stand-in being wired correctly.
//   3. The same block unsets REDIS_URL / REDIS_USERNAME / REDIS_PASS. Vitest's
//      `env` setting only ADDS keys; it does not clear the process environment.
//      So on a machine that exports real cache credentials, a mistake in 1 or 2
//      would not merely hang — it would build a real client with real
//      credentials and run the script for real against live `otp:*` counters.
//      The fake network cannot catch that: it is raw TCP, not HTTP.
//
// The two "never happened" assertions at the end are tripwires, not guards. The
// three measures above are what actually prevent a connection; the assertions
// only tell you if one of them broke.
//
// WHAT ELSE COMES WITH THE MODULE
// Loading it for real also loads `flushOtpLimitsAction`, which scans for every
// `otp:*` key and deletes them, and the generic fixed-window limiter. Neither is
// this ticket's subject and neither may be called. The fake client's `del`,
// `scan` and `keys` throw if anything reaches them — and because the module
// wraps its own body in try/catch and would swallow that throw, the end of the
// file also asserts they were never called at all.
//
// The counter script itself is NOT tested here. Its counting, its fixed windows
// and its behaviour under two callers at once need a real store, and they belong
// to the live suite (see docs/testing/LIVE_TEST_ROADMAP.md, phase 6). This file
// covers only the code around it: fail-open, the reason names, the lock-time
// fallback, and the limits read from configuration.
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => {
  // Every operation that could change or read real data. They throw, and the
  // end of the file also proves they were never reached.
  const destructive = (name: string) =>
    vi.fn(async () => {
      throw new Error(
        `the fake cache client was asked to ${name}. No test in this file may ` +
          `reach a destructive operation — the module it loads also owns the ` +
          `key-clearing maintenance call.`,
      );
    });

  const client = {
    eval: vi.fn(),
    del: destructive("del"),
    scan: destructive("scan"),
    keys: destructive("keys"),
    connect: vi.fn(async () => {
      throw new Error("the fake cache client was asked to open a connection");
    }),
    quit: vi.fn(async () => undefined),
  };

  const built = { count: 0, options: [] as unknown[] };

  class FakeRedis {
    constructor(options?: unknown) {
      built.count += 1;
      built.options.push(options);
      Object.assign(this, client);
    }
  }

  // Seed the module's own client cache before it is ever evaluated.
  (globalThis as Record<string, unknown>)._redis = client;

  // Take the cache credentials out of the process for the whole file, and keep
  // the originals so they go back afterwards.
  const savedEnv = {
    REDIS_URL: process.env.REDIS_URL,
    REDIS_USERNAME: process.env.REDIS_USERNAME,
    REDIS_PASS: process.env.REDIS_PASS,
  };
  delete process.env.REDIS_URL;
  delete process.env.REDIS_USERNAME;
  delete process.env.REDIS_PASS;

  return { client, built, FakeRedis, savedEnv };
});

vi.mock("ioredis", () => ({ default: fake.FakeRedis }));

// tests/setup.ts replaces this module for the whole suite, which is exactly why
// it has never been executed. Lifted here, and here only — every other test file
// keeps the stand-in.
vi.unmock("serverRequests/radis");

// AC-12 drives the module's own catch block, which calls the real reporter. That
// one reads cookies and awaits an outbound request, so it is stood in and the
// assertion is made against the spy.
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...args: unknown[]) => LogServerError(...(args as [])),
  default: vi.fn(async () => undefined),
}));

import { otpRateLimit } from "serverRequests/radis";

/** Opaque, already-hashed identity keys. The wrapper never interprets them. */
const SID = "session-key-fixture";
const IP = "address-key-fixture";
/** A reserved, non-routable number. Never a real one, and never a real shape. */
const PHONE = "+999000000001";

/** The four limit values the module reads from the environment on every call. */
const LIMIT_KEYS = [
  "OTP_SESSION_MAX",
  "OTP_IP_MAX",
  "OTP_WINDOW_SECONDS",
  "OTP_COOLDOWN_SECONDS",
] as const;

/** Remove the four limits so the module's own defaults are what answer. */
function clearLimits() {
  const saved: Record<string, string | undefined> = {};
  for (const key of LIMIT_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  return () => {
    for (const key of LIMIT_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  };
}

/** The arguments the module handed to the script on its last call. */
function lastScriptCall() {
  const call = fake.client.eval.mock.calls.at(-1);
  if (!call) throw new Error("the module never called the script");
  // eval(script, numberOfKeys, cd, sid, ipc, phone, sessionMax, ipMax, window, cooldown)
  const [, keyCount, cooldownKey, sessionKey, ipCountKey, phone, ...limits] =
    call as unknown[];
  return {
    keyCount,
    keys: { cooldownKey, sessionKey, ipCountKey },
    phone,
    limits: limits.map(String),
  };
}

beforeEach(() => {
  fake.client.eval.mockReset();
  LogServerError.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

afterAll(() => {
  // Nothing this file put on the global object stays reachable, and the
  // credentials go back exactly as they were.
  delete (globalThis as Record<string, unknown>)._redis;
  for (const [key, value] of Object.entries(fake.savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("the real module is what is under test", () => {
  // The lift above is the only reason this file tests anything. If it ever stops
  // working, every assertion below would be made against the stand-in and would
  // pass while proving nothing — so this is checked first, on purpose.
  it("loaded the real limiter, not the run-wide stand-in", () => {
    expect(vi.isMockFunction(otpRateLimit)).toBe(false);
  });
});

describe("when there is no counter store", () => {
  // AC-11. The module leaves its client unset only when the runtime marker reads
  // "edge" AT LOAD TIME, so this is the one case that has to load the module
  // again. Everything it changes is put back before the next test: the marker,
  // the module registry, and the seeded client cache — without the last one, a
  // later load could build a client for real.
  it("allows the send and says so", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    delete (globalThis as Record<string, unknown>)._redis;
    vi.resetModules();

    try {
      const { otpRateLimit: onEdge } = await import("serverRequests/radis");

      await expect(onEdge({ sid: SID, ip: IP, phone: PHONE })).resolves.toEqual({
        allowed: true,
        reason: "no-redis",
        lockSeconds: 0,
      });
      // Nothing was asked of a store, because there is no store to ask.
      expect(fake.client.eval).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
      (globalThis as Record<string, unknown>)._redis = fake.client;
    }
  });
});

describe("when the counter store fails", () => {
  // AC-12. Fail OPEN: a store that is down must never stop a real person signing
  // in. What is left protecting the endpoint when this happens is the platform
  // edge, the refusal of a direct send at the proxy, and the backend's own
  // per-number throttle — and, today, one of those counters can be reset through
  // an unauthenticated maintenance endpoint (see the `secure-clear-redis-route`
  // ticket). That is the real cost of failing open, and it is worth knowing
  // before anyone treats this green test as "the boundary holds".
  it("allows the send", async () => {
    fake.client.eval.mockRejectedValueOnce(new Error("store is down"));

    await expect(
      otpRateLimit({ sid: SID, ip: IP, phone: PHONE }),
    ).resolves.toEqual({ allowed: true, reason: "error", lockSeconds: 0 });
  });

  it("reports the failure instead of swallowing it", async () => {
    fake.client.eval.mockRejectedValueOnce(new Error("store is down"));

    await otpRateLimit({ sid: SID, ip: IP, phone: PHONE });

    expect(LogServerError).toHaveBeenCalledTimes(1);
  });
});

describe("what the store's answer is turned into", () => {
  it("passes an allowed send through with the lock time it was given", async () => {
    fake.client.eval.mockResolvedValueOnce([0, 45]);

    await expect(
      otpRateLimit({ sid: SID, ip: IP, phone: PHONE }),
    ).resolves.toEqual({ allowed: true, reason: "ok", lockSeconds: 45 });
  });

  // AC-13. The names come from the module's own result type and the script's
  // status codes — not from the comments above the script, which disagree with
  // the code (one calls the cooldown per-number while the script keys it per
  // address). The drift is recorded as a finding; the code is what is pinned.
  it.each([
    [1, "cooldown"],
    [2, "session_cap"],
    [3, "ip_cap"],
  ])("turns status %i into %s", async (status, reason) => {
    fake.client.eval.mockResolvedValueOnce([status, 30]);

    await expect(
      otpRateLimit({ sid: SID, ip: IP, phone: PHONE }),
    ).resolves.toEqual({ allowed: false, reason, lockSeconds: 30 });
  });

  // AC-14. A refusal with no time left on it must still tell the caller how long
  // to wait, or the user is shown a lock of zero seconds. The cooldown is passed
  // as an argument here rather than left to the environment: what this proves is
  // the fallback, not the reading, and reading it from the machine would make
  // the assertion depend on the shell.
  it("falls back to the configured cooldown when no lock time comes back", async () => {
    fake.client.eval.mockResolvedValueOnce([1, 0]);

    await expect(
      otpRateLimit({ sid: SID, ip: IP, phone: PHONE, cooldownSeconds: 90 }),
    ).resolves.toEqual({ allowed: false, reason: "cooldown", lockSeconds: 90 });
  });
});

describe("the identity it asks about", () => {
  it("keys the cooldown and the counter on the address, and the set on the session", async () => {
    fake.client.eval.mockResolvedValueOnce([0, 60]);

    await otpRateLimit({ sid: SID, ip: IP, phone: PHONE });

    const call = lastScriptCall();
    expect(call.keyCount).toBe(3);
    expect(call.keys).toEqual({
      cooldownKey: `otp:cd:${IP}`,
      sessionKey: `otp:sid:${SID}`,
      ipCountKey: `otp:ipc:${IP}`,
    });
    expect(call.phone).toBe(PHONE);
  });
});

describe("the limits it applies", () => {
  // AC-15. These four are read inside the function on every call, not at load
  // time, so no module reload is needed here — but the defaults only mean
  // anything if the values are ABSENT, so the case removes them rather than
  // setting numbers of its own.
  it("uses the documented defaults when nothing is configured", async () => {
    const restore = clearLimits();
    fake.client.eval.mockResolvedValueOnce([0, 60]);

    try {
      await otpRateLimit({ sid: SID, ip: IP, phone: PHONE });

      // sessionMax, ipMax, windowSeconds, cooldown
      expect(lastScriptCall().limits).toEqual(["2", "4", "3600", "60"]);
    } finally {
      restore();
    }
  });

  it("uses the configured values when they are set", async () => {
    vi.stubEnv("OTP_SESSION_MAX", "5");
    vi.stubEnv("OTP_IP_MAX", "9");
    vi.stubEnv("OTP_WINDOW_SECONDS", "600");
    vi.stubEnv("OTP_COOLDOWN_SECONDS", "120");
    fake.client.eval.mockResolvedValueOnce([0, 60]);

    await otpRateLimit({ sid: SID, ip: IP, phone: PHONE });

    expect(lastScriptCall().limits).toEqual(["5", "9", "600", "120"]);
  });

  it("lets the caller override them", async () => {
    fake.client.eval.mockResolvedValueOnce([0, 60]);

    await otpRateLimit({
      sid: SID,
      ip: IP,
      phone: PHONE,
      sessionMax: 1,
      ipMax: 2,
      windowSeconds: 30,
      cooldownSeconds: 15,
    });

    expect(lastScriptCall().limits).toEqual(["1", "2", "30", "15"]);
  });
});

describe("nothing real was touched", () => {
  // AC-16. Tripwires. If any of these fires, one of the three measures at the
  // top of this file stopped working — and the run may already have opened a
  // socket by the time the assertion is read.
  it("never built a cache client", () => {
    expect(fake.built.count).toBe(0);
  });

  it("never asked to open a connection", () => {
    expect(fake.client.connect).not.toHaveBeenCalled();
  });

  it("never reached a destructive operation", () => {
    expect(fake.client.del).not.toHaveBeenCalled();
    expect(fake.client.scan).not.toHaveBeenCalled();
    expect(fake.client.keys).not.toHaveBeenCalled();
  });

  it("has no cache credentials in the environment", () => {
    expect(process.env.REDIS_URL).toBeUndefined();
    expect(process.env.REDIS_USERNAME).toBeUndefined();
    expect(process.env.REDIS_PASS).toBeUndefined();
  });
});
