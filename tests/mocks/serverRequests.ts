// Stand-in for the cache layer (serverRequests/radis).
//
// WHY THIS MATTERS MORE THAN THE OTHERS
// `ioredis` opens a real TCP connection the moment the module loads — before
// anything calls it. Loading the shared store reaches this file, so *every*
// component test would quietly open a socket to a Redis server that is not
// there, and keep retrying while the test ran. Roadmap rule 5 says no test does
// real I/O; this is the way it would have happened without anyone asking for it.
//
// A stand-in stops it at the door: the real module is never loaded, so ioredis
// is never loaded either.
//
// WHAT THE FAKE CACHE DOES
// It behaves like a cache that is always empty and never stores anything —
// which is what a unit test wants. A read gives back nothing; a write is
// recorded and thrown away. Nothing here has to match how Redis really behaves,
// because a test that cares about the cache should be testing the cache, and
// that is not a component test.
//
//   import { cacheSpies } from "tests/mocks/serverRequests";
//   expect(cacheSpies.RedisSet).toHaveBeenCalledWith("currency:gb", "GBP");

/** Every call the cache layer offers, ready to check. */
export const cacheSpies = {
  storeProduct: vi.fn(async () => undefined),
  getProductFromCache: vi.fn(async () => null),
  getCurrencyFromCache: vi.fn(async () => null),
  StoreCurrency: vi.fn(async () => undefined),
  RedisGet: vi.fn(async () => null),
  RedisSet: vi.fn(async () => undefined),
  removeRedis: vi.fn(async () => undefined),
  getKeys: vi.fn(async () => [] as string[]),
  GetFromRedis: vi.fn(async () => null),
  fixedWindowRateLimit: vi.fn(async () => ({ allowed: true, remaining: 1 })),
  // Allowed by default, in the shape the real limiter actually returns:
  // { allowed, reason, lockSeconds }. It used to reply `{ blocked: false }`,
  // which the real code never returns — and the send action reads `allowed`, so
  // against the old reply it read `undefined`, took it as false, and refused
  // every send. Any test that let the real action run would have been proving
  // the opposite of what it looked like. A test about the limiter sets its own
  // reply; this default is only for the files that never touch it.
  otpRateLimit: vi.fn(async () => ({
    allowed: true,
    reason: "ok",
    lockSeconds: 60,
  })),
  flushOtpLimitsAction: vi.fn(async () => undefined),
};

/** Build the stand-in for serverRequests/radis. */
export function makeCacheMock() {
  return { ...cacheSpies };
}

/** Forget every recorded call. tests/setup.ts does this after each test. */
export function resetCacheSpies() {
  Object.values(cacheSpies).forEach((spy) => spy.mockClear());
}
