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
    // Reads and counter writes for the cache helpers further down. They only
    // ever touch this object.
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
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

import {
  fixedWindowRateLimit,
  flushOtpLimitsAction,
  getCurrencyFromCache,
  GetFromRedis,
  getKeys,
  otpRateLimit,
  RedisGet,
  RedisSet,
  removeRedis,
  StoreCurrency,
} from "serverRequests/radis";

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

// ---------------------------------------------------------------------------
// The cache helpers around the OTP limiter: the currency and product cache,
// the key helpers, the generic limiter and the OTP key clean-up.
//
// removeRedis, getKeys and flushOtpLimitsAction must reach `del`, `scan` or
// `keys`, which the fake client refuses on purpose. For those cases only, the
// method is swapped for a harmless stand-in on the fake object and put back
// afterwards (`withStandIn`). The tripwires at the end of the file still watch
// the original refusing spies, which nothing here calls.
// ---------------------------------------------------------------------------

async function withStandIn(
  name: "del" | "scan" | "keys",
  standIn: ReturnType<typeof vi.fn>,
  run: () => Promise<void>,
) {
  const original = fake.client[name];
  (fake.client as any)[name] = standIn;
  try {
    await run();
  } finally {
    (fake.client as any)[name] = original;
  }
}

/** The `type` each reported failure was filed under. */
const reportedTypes = () => LogServerError.mock.calls.map((call: any[]) => call[0]?.type);

describe("the currency cache", () => {
  beforeEach(() => {
    fake.client.get.mockReset();
    fake.client.set.mockReset();
  });

  it("reads a stored currency and answers null when there is none", async () => {
    fake.client.get.mockResolvedValueOnce(JSON.stringify({ code: "SYP" })).mockResolvedValueOnce(null);

    expect(await getCurrencyFromCache("sy"), "the stored currency was not read back").toEqual({ code: "SYP" });
    expect(await getCurrencyFromCache("iq"), "a missing currency was not null").toBeNull();
    expect(fake.client.get.mock.calls[0][0], "the currency key is wrong").toBe("currency-sy");
  });

  it("reports and passes on a failed currency read", async () => {
    fake.client.get.mockRejectedValueOnce(new Error("down"));

    await expect(getCurrencyFromCache("sy"), "a failed currency read was hidden").rejects.toThrow("down");
    expect(reportedTypes(), "the failed currency read was not reported").toContain(
      "getting currency from redis",
    );
  });

  it("stores a currency for the configured time, and reports a failed write", async () => {
    vi.stubEnv("PRODUCT_REDIS_TTL_SECONDS", "120");
    fake.client.set.mockResolvedValueOnce("OK").mockRejectedValueOnce(new Error("down"));

    await StoreCurrency("sy", { code: "SYP" });
    await StoreCurrency("sy", { code: "SYP" });

    expect(fake.client.set.mock.calls[0], "the currency was not stored for 120 seconds").toEqual([
      "currency-sy",
      '{"code":"SYP"}',
      "EX",
      120,
    ]);
    expect(reportedTypes(), "the failed currency write was not reported").toContain(
      "storing currency in redis",
    );
  });
});

describe("the general cache helpers", () => {
  beforeEach(() => {
    fake.client.get.mockReset();
    fake.client.set.mockReset();
  });

  it("reads a stored value, and answers null for a missing or failed read", async () => {
    fake.client.get
      .mockResolvedValueOnce('{"a":1}')
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("down"));

    expect(await RedisGet("k"), "the stored value was not read back").toEqual({ a: 1 });
    expect(await RedisGet("k"), "a missing value was not null").toBeNull();
    expect(await RedisGet("k"), "a failed read was not null").toBeNull();
    expect(reportedTypes(), "the failed read was not reported").toContain("redis RedisGet failed");
  });

  it("stores a value for the time asked, or the configured time", async () => {
    vi.stubEnv("PRODUCT_REDIS_TTL_SECONDS", "90");
    fake.client.set.mockResolvedValue("OK");

    await RedisSet("k", { a: 1 }, 300);
    await RedisSet("k", { a: 1 });

    expect(
      fake.client.set.mock.calls.map((call) => call[3]),
      "the stored values did not get the asked or configured time",
    ).toEqual([300, 90]);
  });

  it(
    "BUG-data-3: a value stored with no time and no configured time lives for the 120-second default",
    async () => {
      vi.stubEnv("PRODUCT_REDIS_TTL_SECONDS", undefined as any);
      fake.client.set.mockResolvedValue("OK");

      await RedisSet("k", { a: 1 });

      expect(
        fake.client.set.mock.calls[0]?.[3],
        "with PRODUCT_REDIS_TTL_SECONDS unset, the time sent was not the 120-second default " +
          "(Number(undefined) is NaN, and `NaN ?? 120` is NaN, so Redis is asked for EX NaN and refuses the write)",
      ).toBe(120);
    },
  );

  it("reports a failed write", async () => {
    fake.client.set.mockRejectedValueOnce(new Error("down"));

    await RedisSet("k", 1, 10);

    expect(reportedTypes(), "the failed write was not reported").toContain("redis RedisSet failed");
  });

  it("deletes a key, and reports a failed delete", async () => {
    const del = vi.fn().mockResolvedValueOnce(1).mockRejectedValueOnce(new Error("down"));

    await withStandIn("del", del, async () => {
      await removeRedis("k");
      expect(await removeRedis("k"), "a failed delete threw").toBeUndefined();
    });

    expect(del.mock.calls[0], "the wrong key was deleted").toEqual(["k"]);
    expect(reportedTypes(), "the failed delete was not reported").toContain("redis removeRedis failed");
  });

  it("lists keys by pattern, and answers nothing for a failed list", async () => {
    const keys = vi.fn().mockResolvedValueOnce(["a", "b"]).mockRejectedValueOnce(new Error("down"));

    await withStandIn("keys", keys, async () => {
      expect(await getKeys("x*"), "the matching keys were not listed").toEqual(["a", "b"]);
      expect(await getKeys("x*"), "a failed list gave keys").toBeUndefined();
    });

    expect(reportedTypes(), "the failed list was not reported").toContain("redis getKeys failed");
  });

  it("reads a raw value, and passes on a failed raw read", async () => {
    fake.client.get.mockResolvedValueOnce("raw").mockRejectedValueOnce(new Error("down"));

    expect(await GetFromRedis("k"), "the raw value was not read").toBe("raw");
    await expect(GetFromRedis("k"), "a failed raw read was hidden").rejects.toThrow("down");
    expect(reportedTypes(), "the failed raw read was not reported").toContain("redis GetFromRedis failed");
  });
});

describe("the fixed-window limiter", () => {
  beforeEach(() => {
    fake.client.incr.mockReset();
    fake.client.expire.mockReset();
    fake.client.ttl.mockReset();
  });

  it("starts the window on the first call and counts down what is left", async () => {
    fake.client.incr.mockResolvedValueOnce(1);
    fake.client.ttl.mockResolvedValueOnce(60);

    expect(await fixedWindowRateLimit("rl", 3, 60), "the first call was not allowed").toEqual({
      allowed: true,
      remaining: 2,
      ttl: 60,
    });
    expect(fake.client.expire, "the window was not started on the first call").toHaveBeenCalledWith("rl", 60);
  });

  it("refuses past the limit and falls back to the window when no time is left", async () => {
    fake.client.incr.mockResolvedValueOnce(5);
    fake.client.ttl.mockResolvedValueOnce(-1);

    expect(await fixedWindowRateLimit("rl", 3, 60), "a call past the limit was allowed").toEqual({
      allowed: false,
      remaining: 0,
      ttl: 60,
    });
    expect(fake.client.expire, "the window was restarted mid-way").not.toHaveBeenCalled();
  });

  it("allows the call, and reports it, when the store fails", async () => {
    fake.client.incr.mockRejectedValueOnce(new Error("down"));

    expect(await fixedWindowRateLimit("rl", 3, 60), "a store failure refused the call").toEqual({
      allowed: true,
      remaining: 3,
      ttl: 0,
    });
    expect(reportedTypes(), "the store failure was not reported").toContain(
      "redis fixedWindowRateLimit failed",
    );
  });
});

describe("clearing the OTP counters (flushOtpLimitsAction)", () => {
  it("deletes every otp key page by page", async () => {
    const scan = vi
      .fn()
      .mockResolvedValueOnce(["7", ["otp:cd:a", "otp:sid:b"]])
      .mockResolvedValueOnce(["0", ["otp:ipc:a"]]);
    const del = vi.fn(async () => 1);

    await withStandIn("scan", scan, () =>
      withStandIn("del", del, async () => {
        expect(await flushOtpLimitsAction(), "the clean-up did not report success").toEqual({ success: true });
      }),
    );

    expect(scan.mock.calls[0], "the scan did not look for otp keys").toEqual(["0", "MATCH", "otp:*", "COUNT", 100]);
    expect(del.mock.calls, "not every otp key was deleted").toEqual([["otp:cd:a", "otp:sid:b"], ["otp:ipc:a"]]);
  });

  it("says so when there was nothing to delete", async () => {
    const scan = vi.fn().mockResolvedValueOnce(["0", []]);

    await withStandIn("scan", scan, async () => {
      expect(await flushOtpLimitsAction(), "an empty clean-up did not answer success").toEqual({
        success: true,
        message: "",
      });
    });
  });

  it("answers a failure, and reports it, when the scan fails", async () => {
    const scan = vi.fn().mockRejectedValueOnce(new Error("down"));

    await withStandIn("scan", scan, async () => {
      expect(await flushOtpLimitsAction(), "a failed clean-up answered success").toEqual({ success: false });
    });
    expect(
      LogServerError.mock.calls.map((call: any[]) => call[0]?.scenario),
      "the failed clean-up was not reported",
    ).toContain("clearing the OTP keys failed");
  });
});

describe("the helpers with no counter store (edge runtime)", () => {
  // Same reload as the AC-11 case above, and put back the same way.
  it("refuses the currency read, allows every limited call, and clears nothing", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    delete (globalThis as Record<string, unknown>)._redis;
    vi.resetModules();

    try {
      const edge = await import("serverRequests/radis");

      await expect(edge.getCurrencyFromCache("sy"), "a currency read on the edge did not fail").rejects.toThrow(
        "Redis is not available in Edge runtime",
      );
      expect(await edge.fixedWindowRateLimit("rl", 4, 60), "the edge limiter did not allow the call").toEqual({
        allowed: true,
        remaining: 4,
        ttl: 0,
      });
      expect(await edge.flushOtpLimitsAction(), "the edge clean-up claimed success").toEqual({
        success: false,
        message: "",
      });
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
      (globalThis as Record<string, unknown>)._redis = fake.client;
    }
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
