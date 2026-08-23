// @vitest-environment node
//
// The stateless Redis driver used on runtimes that forbid a shared TCP client.
//
// WHY THIS FILE EXISTS
// On Node the app talks to Redis through ioredis, which has been carrying these
// commands correctly for years. On Cloudflare Workers a pooled client is
// illegal, so the same calls go out over HTTP instead — and every command has to
// be re-encoded by hand. A wrong argument order here does not fail loudly: it
// returns a plausible value and quietly breaks caching, or worse, quietly breaks
// the OTP limiter's fixed windows.
//
// The commands covered are exactly the ones `serverRequests/radis/index.ts`
// issues. The Lua script for OTP limiting goes out through `eval`, so its
// argument order is checked here too: KEYS then ARGV, with the key count between
// them. Get that wrong and the limiter reads the wrong counters.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { jsonReply, makeMockFetch } from "../../mocks/mockFetch";
import {
  createRestRedis,
  hasRestRedis,
  type RedisLike,
} from "serverRequests/radis/rest-client";

const REST_URL = "https://redis.invalid";

let net: ReturnType<typeof makeMockFetch>;
let redis: RedisLike;

beforeEach(() => {
  process.env.REDIS_REST_URL = REST_URL;
  process.env.REDIS_REST_TOKEN = "rest-token";
  redis = createRestRedis();
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.REDIS_REST_URL;
  delete process.env.REDIS_REST_TOKEN;
});

function reply(result: unknown, status = 200) {
  net = makeMockFetch([jsonReply({ result }, status)]);
  vi.stubGlobal("fetch", net.fetch);
  return net;
}

/** The command array the driver put on the wire. */
function sentCommand(): unknown[] {
  const call = net.calls[0];
  expect(
    call,
    "the Redis REST backend was never called, so the command never left the app",
  ).toBeTruthy();
  return call.body as unknown[];
}

describe("configuration", () => {
  it("reports itself unconfigured when the REST address is missing", () => {
    delete process.env.REDIS_REST_URL;
    expect(
      hasRestRedis(),
      "the driver claimed to be configured with no REDIS_REST_URL; callers would build it and every command would throw instead of degrading to no cache",
    ).toBe(false);
  });

  it("reports itself unconfigured when the token is missing", () => {
    delete process.env.REDIS_REST_TOKEN;
    expect(
      hasRestRedis(),
      "the driver claimed to be configured with no REDIS_REST_TOKEN; every command would come back 401 from the Redis REST backend",
    ).toBe(false);
  });

  it("authenticates as a bearer token", async () => {
    reply("value");
    await redis.get("k");
    expect(
      net.calls[0].headers.authorization,
      "the Redis REST backend was called without a bearer token and will refuse the command",
    ).toBe("Bearer rest-token");
  });
});

describe("the commands the app actually issues", () => {
  it("reads a key with GET", async () => {
    reply("cached");
    const value = await redis.get("product:1:en:gb");

    expect(sentCommand(), "GET was not encoded as [GET, key]").toEqual([
      "GET",
      "product:1:en:gb",
    ]);
    expect(
      value,
      "the Redis REST backend returned a value but the driver did not pass it back, so every cache read would look like a miss",
    ).toBe("cached");
  });

  it("writes a key with an expiry, in ioredis' positional form", async () => {
    reply("OK");
    await redis.set("currency-gb", '{"rate":1}', "EX", 1800);

    expect(
      sentCommand(),
      "SET did not carry the EX mode and TTL, so cached values would never expire",
    ).toEqual(["SET", "currency-gb", '{"rate":1}', "EX", "1800"]);
  });

  it("writes without an expiry when none was asked for", async () => {
    reply("OK");
    await redis.set("k", "v");

    expect(
      sentCommand(),
      "SET invented an expiry mode that the caller never asked for",
    ).toEqual(["SET", "k", "v"]);
  });

  it("increments a counter with INCR", async () => {
    reply(3);
    const count = await redis.incr("otp:ipc:1.2.3.4");

    expect(sentCommand(), "INCR was not encoded as [INCR, key]").toEqual([
      "INCR",
      "otp:ipc:1.2.3.4",
    ]);
    expect(
      count,
      "the counter value from the Redis REST backend was not returned, so the OTP limiter cannot tell how many sends happened",
    ).toBe(3);
  });

  it("sets a window with EXPIRE", async () => {
    reply(1);
    await redis.expire("otp:sid:abc", 3600);

    expect(
      sentCommand(),
      "EXPIRE did not carry the window length, so an OTP window would never close",
    ).toEqual(["EXPIRE", "otp:sid:abc", "3600"]);
  });

  it("reads the remaining window with TTL", async () => {
    reply(42);
    const ttl = await redis.ttl("otp:cd:1.2.3.4");

    expect(sentCommand(), "TTL was not encoded as [TTL, key]").toEqual([
      "TTL",
      "otp:cd:1.2.3.4",
    ]);
    expect(
      ttl,
      "the remaining lock time was not returned, so the app would tell the shopper the wrong wait",
    ).toBe(42);
  });

  it("deletes several keys in one command", async () => {
    reply(2);
    await redis.del("otp:a", "otp:b");

    expect(
      sentCommand(),
      "DEL did not pass every key, so the OTP flush would leave counters behind",
    ).toEqual(["DEL", "otp:a", "otp:b"]);
  });

  it("does not call the backend at all when asked to delete nothing", async () => {
    reply(0);
    const deleted = await redis.del();

    expect(
      net.calls.length,
      "an empty DEL was still sent; Redis rejects DEL with no keys, so this would throw during an OTP flush",
    ).toBe(0);
    expect(deleted, "an empty DEL did not report zero deletions").toBe(0);
  });

  it("passes SCAN its cursor and its MATCH/COUNT arguments", async () => {
    reply(["17", ["otp:a", "otp:b"]]);
    const [cursor, keys] = await redis.scan("0", "MATCH", "otp:*", "COUNT", 100);

    expect(
      sentCommand(),
      "SCAN lost its MATCH pattern or COUNT, so the OTP flush would walk the wrong keys",
    ).toEqual(["SCAN", "0", "MATCH", "otp:*", "COUNT", "100"]);
    expect(
      cursor,
      "the next cursor was not returned as a string, so the flush loop would never terminate",
    ).toBe("17");
    expect(keys, "SCAN returned no keys from a non-empty page").toEqual([
      "otp:a",
      "otp:b",
    ]);
  });

  it("normalises a numeric cursor, because the loop compares it to a string", async () => {
    reply([0, []]);
    const [cursor] = await redis.scan("17", "MATCH", "otp:*");

    expect(
      cursor,
      "a numeric cursor was passed through as a number; `while (cursor !== \"0\")` would never end and the OTP flush would loop forever",
    ).toBe("0");
  });

  it("sends the OTP script with its key count between KEYS and ARGV", async () => {
    reply([0, 60]);
    await redis.eval(
      "return 1",
      3,
      "otp:cd:ip",
      "otp:sid:s",
      "otp:ipc:ip",
      "+9999",
      2,
      4,
      3600,
      60,
    );

    expect(
      sentCommand(),
      "EVAL did not put the key count between the script and the keys; Redis would read ARGV entries as KEYS and the limiter would count the wrong things",
    ).toEqual([
      "EVAL",
      "return 1",
      "3",
      "otp:cd:ip",
      "otp:sid:s",
      "otp:ipc:ip",
      "+9999",
      "2",
      "4",
      "3600",
      "60",
    ]);
  });
});

describe("when the backend refuses", () => {
  it("names the Redis REST backend and the command, never the arguments", async () => {
    net = makeMockFetch([jsonReply({ error: "WRONGTYPE" }, 500)]);
    vi.stubGlobal("fetch", net.fetch);

    const failure = await redis
      .get("otp:cd:203.0.113.7")
      .then(() => null)
      .catch((error: Error) => error);

    expect(
      failure,
      "a refused command did not raise an error, so a Redis outage would look like a cache miss forever",
    ).toBeInstanceOf(Error);
    expect(
      (failure as Error).message,
      "the failure did not name the Redis REST backend, so a reader cannot tell which backend broke",
    ).toMatch(/Redis REST backend refused GET.*500.*WRONGTYPE/);
    expect(
      (failure as Error).message,
      "the failure quoted the key, which carries IP addresses and phone numbers in the OTP paths",
    ).not.toContain("203.0.113.7");
  });

  it("refuses to run at all when nothing is configured", async () => {
    delete process.env.REDIS_REST_URL;
    net = makeMockFetch([]);
    vi.stubGlobal("fetch", net.fetch);

    await expect(
      createRestRedis().get("k"),
      "an unconfigured driver silently did nothing instead of saying it has no address",
    ).rejects.toThrow(/REDIS_REST_URL/);
  });
});
