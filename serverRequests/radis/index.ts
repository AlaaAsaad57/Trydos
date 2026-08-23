import Redis from "ioredis";
import { now } from "utils/runtime/timing";
import { isWorkerRuntime } from "utils/runtime/platform";
import { createRestRedis, hasRestRedis, type RedisLike } from "./rest-client";
import { LogServerError } from "utils/serverErrorReporter";

declare global {
  // Ensure global redis persists between hot reloads in dev
  // @ts-ignore
  var _redis: Redis | undefined;
}

const DEFAULT_TTL = 1800;

// The client used to be built once at module load and shared by every request.
// That is right on Node -- one pooled TCP socket, reused -- and illegal on the
// Cloudflare Workers runtime, which refuses I/O created during another request
// ("Cannot perform I/O on behalf of a different request").
//
// So the driver is chosen by runtime, behind one accessor:
//   Node    -> the same pooled ioredis client as before, built on first use.
//   Workers -> a stateless REST client, built per call. It holds no connection,
//              so there is nothing to share and nothing to leak between
//              requests. Needs REDIS_REST_URL / REDIS_REST_TOKEN.
//   Edge    -> none, as before.
//
// Every caller already treats a null client as "cache unavailable" and carries
// on, so a runtime with no Redis degrades instead of failing.
let nodeClient: Redis | null = null;

function getNodeClient(): Redis {
  if (nodeClient) return nodeClient;
  // @ts-ignore
  nodeClient =
    global._redis ??
    new Redis({
      host: process.env.REDIS_URL,
      port: 6379,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASS,
    });
  if (process.env.NODE_ENV !== "production") {
    // @ts-ignore
    global._redis = nodeClient;
  }
  return nodeClient;
}

function getRedis(): RedisLike | null {
  if (process.env.NEXT_RUNTIME === "edge") return null;
  if (isWorkerRuntime()) {
    return hasRestRedis() ? createRestRedis() : null;
  }
  return getNodeClient() as unknown as RedisLike;
}

/** Drop the cached Node client. Exported for tests only. */
export function __resetRedisClient() {
  nodeClient = null;
  global._redis = undefined;
}

// Store product in Redis
export async function storeProduct(product, slug, lang, country) {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis is not available in Edge runtime");
  }
  if (!product?.id || !product?.name || !product.images) {
    throw new Error("Invalid product object, missing product data");
  }

  const start = now();
  const ttl = Number(process.env.PRODUCT_REDIS_TTL_SECONDS) || DEFAULT_TTL;

  // Force everything into safe strings
  const productKey = `product:${String(product.id)}:${String(lang)}:${String(
    country,
  )}`;
  const slugKey = `slug:${String(slug)}:${String(lang)}:${String(country)}`;

  try {
    await redis.set(productKey, JSON.stringify(product), "EX", ttl);
    await redis.set(slugKey, String(product.id), "EX", ttl);

    const end = now();
    return { success: true, timeMs: end - start };
  } catch (err) {
    console.error("Redis SET failed", { productKey, slugKey, err });
    LogServerError(
      { error: err, type: "redis storeProduct failed", productKey, slugKey },
      "/",
    );
  }
}

// Get product from Redis
export async function getProductFromCache(slug, lang, country) {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis is not available in Edge runtime");
  }
  const start = now();
  const slugKey = `slug:${String(slug)}:${String(lang)}:${String(country)}`;

  try {
    const productId = await redis.get(slugKey);

    if (!productId) {
      const end = now();
      return { product: null, timeMs: end - start };
    }

    const productKey = `product:${String(productId)}:${String(lang)}:${String(
      country,
    )}`;

    const cachedProduct = await redis.get(productKey);

    const end = now();
    let product = cachedProduct ? JSON.parse(cachedProduct) : null;

    return {
      product: { ...product, redis: true },
      timeMs: end - start,
    };
  } catch (err) {
    console.error("Redis GET failed", { slugKey, err });
    LogServerError({ error: err, type: "redis getProductFromCache failed", slugKey }, "/");
    throw err;
  }
}
// Get Currency from Redis
export async function getCurrencyFromCache(country) {
  const redis = getRedis();
  try {
    if (!redis) {
      throw new Error("Redis is not available in Edge runtime");
    }
    const cachedValue = await redis.get(`currency-${country}`);
    if (!cachedValue) {
      return null;
    }
    return cachedValue ? JSON.parse(cachedValue) : {};
  } catch (error) {
    LogServerError({ error, type: "getting currency from redis" }, `/`);
    throw error;
  }
}
export async function StoreCurrency(country, value) {
  const redis = getRedis();
  try {
    await redis.set(
      `currency-${country}`,
      JSON.stringify(value),
      "EX",
      Number(process.env.PRODUCT_REDIS_TTL_SECONDS),
    );
  } catch (error) {
    LogServerError({ error, type: "storing currency in redis" }, `/`);
  }
}

export async function RedisGet(key) {
  const redis = getRedis();
  try {
    const cachedProduct = await redis.get(key);
    return cachedProduct ? JSON.parse(cachedProduct) : null;
  } catch (e) {
    LogServerError({ error: e, type: "redis RedisGet failed", key }, "/");
    return null;
  }
}
export async function RedisSet(key, value, ttl?: number) {
  const redis = getRedis();
  try {
    const effectiveTtl =
      ttl ?? Number(process.env.PRODUCT_REDIS_TTL_SECONDS) ?? 120;
    await redis.set(key, JSON.stringify(value), "EX", effectiveTtl);
  } catch (error) {
    LogServerError({ error, type: "redis RedisSet failed", key }, "/");
  }
}
export async function removeRedis(key) {
  const redis = getRedis();
  try {
    await redis.del(key);
  } catch (error) {
    console.error(error);
    LogServerError({ error, type: "redis removeRedis failed", key }, "/");
    return;
  }
}
export async function getKeys(keyword) {
  const redis = getRedis();
  try {
    let keys = await redis.keys(keyword);
    return keys;
  } catch (error) {
    LogServerError({ error, type: "redis getKeys failed", keyword }, "/");
  }
}

export async function GetFromRedis(key) {
  const redis = getRedis();
  try {
    let result = await redis.get(key);
    return result;
  } catch (error) {
    LogServerError({ error, type: "redis GetFromRedis failed", key }, "/");
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Generic fixed-window rate limiter (Node runtime only).
// ---------------------------------------------------------------------------
// Atomic-enough counter: INCR the key, set its TTL only on first hit so the
// window is fixed (not sliding). Used to throttle authenticated server actions
// such as the seller-dashboard comment replies. FAILS OPEN — if Redis is down,
// a transient outage must never lock legitimate sellers out of replying; the
// per-action permission check is still the real security boundary.
export async function fixedWindowRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; ttl: number }> {
  const redis = getRedis();
  try {
    if (!redis) return { allowed: true, remaining: limit, ttl: 0 };

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    const ttl = await redis.ttl(key);

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      ttl: ttl > 0 ? ttl : windowSeconds,
    };
  } catch (error) {
    LogServerError({ error, type: "redis fixedWindowRateLimit failed", key }, "/");
    return { allowed: true, remaining: limit, ttl: 0 };
  }
}

// ---------------------------------------------------------------------------
// OTP abuse protection
// ---------------------------------------------------------------------------
// Atomic, single-round-trip rate limiter for the "send OTP" flow. Enforces
// three independent rules in one Lua script (no check-then-act race):
//   1. Per-IP cooldown   — at most ONE OTP per IP per `cooldownSeconds`,
//                          regardless of the number (one OTP per 60s).
//   2. Per-session cap   — at most `sessionMax` DISTINCT numbers per session
//                          (device/market token) within `windowSeconds`. A
//                          legit user can verify a couple of phones; resends to
//                          an already-seen number don't consume a slot.
//   3. Per-IP cap        — at most `ipMax` TOTAL sends per IP within the window,
//                          counting EVERY send (new number OR resend). This is
//                          the hard backstop: it survives cookie-clear session
//                          resets (the "1000 random numbers" attack) because it
//                          counts sends, not distinct numbers.
// Windows are FIXED, not sliding: the TTL is set only when a key is first
// created, never refreshed on subsequent sends.
//
// KEYS: [1]=otp:cd:<ip> (cooldown)  [2]=otp:sid:<sid> (session set)
//       [3]=otp:ipc:<ip> (ip send counter)
// ARGV: [1]=phone [2]=sessionMax [3]=ipMax [4]=windowSeconds [5]=cooldownSeconds
// Return status: 0 allowed, 1 cooldown, 2 session cap hit, 3 ip cap hit.
const OTP_RATE_LIMIT_SCRIPT = `
local cd = redis.call('TTL', KEYS[1])
if cd and cd > 0 then
  return {1, cd}
end
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 0 then
  if redis.call('SCARD', KEYS[2]) >= tonumber(ARGV[2]) then
    return {2, redis.call('TTL', KEYS[2])}
  end
end
local count = tonumber(redis.call('GET', KEYS[3]) or '0')
if count >= tonumber(ARGV[3]) then
  return {3, redis.call('TTL', KEYS[3])}
end
local wasEmpty = redis.call('SCARD', KEYS[2]) == 0
redis.call('SADD', KEYS[2], ARGV[1])
if wasEmpty then
  redis.call('EXPIRE', KEYS[2], tonumber(ARGV[4]))
end
local n = redis.call('INCR', KEYS[3])
if n == 1 then
  redis.call('EXPIRE', KEYS[3], tonumber(ARGV[4]))
end
redis.call('SET', KEYS[1], '1', 'EX', tonumber(ARGV[5]))
return {0, tonumber(ARGV[5])}
`;

export type OtpRateLimitResult = {
  allowed: boolean;
  reason: "ok" | "cooldown" | "session_cap" | "ip_cap" | "no-redis" | "error";
  lockSeconds: number;
};

export async function otpRateLimit(params: {
  sid: string;
  ip: string;
  phone: string;
  sessionMax?: number;
  ipMax?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
}): Promise<OtpRateLimitResult> {
  const redis = getRedis();
  const { sid, ip, phone } = params;
  const cooldown = Number(
    params.cooldownSeconds ?? process.env.OTP_COOLDOWN_SECONDS ?? 60,
  );
  try {
    // Fail OPEN if Redis is unavailable: the Go backend keeps its own
    // per-number throttle, so a Redis outage must not block legitimate logins.
    if (!redis) return { allowed: true, reason: "no-redis", lockSeconds: 0 };

    const sessionMax = Number(
      params.sessionMax ?? process.env.OTP_SESSION_MAX ?? 2,
    );
    const ipMax = Number(params.ipMax ?? process.env.OTP_IP_MAX ?? 4);
    const windowSeconds = Number(
      params.windowSeconds ?? process.env.OTP_WINDOW_SECONDS ?? 3600,
    );

    const res = (await redis.eval(
      OTP_RATE_LIMIT_SCRIPT,
      3,
      `otp:cd:${ip}`,
      `otp:sid:${sid}`,
      `otp:ipc:${ip}`,
      phone,
      String(sessionMax),
      String(ipMax),
      String(windowSeconds),
      String(cooldown),
    )) as [number, number];

    const status = Array.isArray(res) ? Number(res[0]) : 0;
    const ttl = Array.isArray(res) ? Number(res[1]) : 0;

    // TEMP DEBUG: log how full the session set / IP send-counter are after each
    // decision so we can confirm the per-IP cap is accumulating on staging.
    // try {
    //   const [sidCount, ipCount] = await Promise.all([
    //     redis.scard(`otp:sid:${sid}`),
    //     redis.get(`otp:ipc:${ip}`),
    //   ]);
    //   console.log(
    //     `[OTP][limit] status=${status} (0=ok,1=cd,2=session,3=ip) ` +
    //       `sid=${sidCount}/${sessionMax} ip=${Number(ipCount ?? 0)}/${ipMax} lock=${ttl}s ` +
    //       `ipKey=otp:ipc:${ip}`,
    //   );
    // } catch {
    //   /* logging only */
    // }

    if (status === 0) return { allowed: true, reason: "ok", lockSeconds: ttl };

    const reason =
      status === 1 ? "cooldown" : status === 2 ? "session_cap" : "ip_cap";
    return { allowed: false, reason, lockSeconds: ttl > 0 ? ttl : cooldown };
  } catch (error) {
    LogServerError({ error, type: "redis otpRateLimit failed" }, "/");
    return { allowed: true, reason: "error", lockSeconds: 0 };
  }
}


export async function flushOtpLimitsAction() {
  const redis = getRedis();

  try {
    if (!redis) {
      return { success: false, message: "" };
    }

    let cursor = "0";
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", "otp:*", "COUNT", 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        // حذف المفاتيح التي تم العثور عليها في هذه الدورة
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== "0");


    if (deletedCount === 0) {
      return { success: true, message: "" };
    }

    return {
      success: true,
    };

  } catch (error) {
    console.error("Failed to clear OTP keys:", error);
    return { success: false,};
  }
}
