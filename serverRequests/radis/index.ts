import Redis from "ioredis";
import { LogServerError } from "utils/serverErrorReporter";

declare global {
  // Ensure global redis persists between hot reloads in dev
  // @ts-ignore
  var _redis: Redis | undefined;
}

const DEFAULT_TTL = 1800;
let redis: Redis | null = null;

if (process.env.NEXT_RUNTIME !== "edge") {
  // Only init Redis in Node runtime
  // @ts-ignore
  redis =
    global._redis ??
    new Redis({
      host: process.env.REDIS_URL,
      port: 6379,
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASS,
    });
  if (process.env.NODE_ENV !== "production") {
    // @ts-ignore
    global._redis = redis;
  }
}

// Store product in Redis
export async function storeProduct(product, slug, lang, country) {
  if (!redis) {
    throw new Error("Redis is not available in Edge runtime");
  }
  if (!product?.id || !product?.name || !product.images) {
    throw new Error("Invalid product object, missing product data");
  }

  const start = process.hrtime.bigint();
  const ttl = Number(process.env.PRODUCT_REDIS_TTL_SECONDS) || DEFAULT_TTL;

  // Force everything into safe strings
  const productKey = `product:${String(product.id)}:${String(lang)}:${String(
    country,
  )}`;
  const slugKey = `slug:${String(slug)}:${String(lang)}:${String(country)}`;

  try {
    await redis.set(productKey, JSON.stringify(product), "EX", ttl);
    await redis.set(slugKey, String(product.id), "EX", ttl);

    const end = process.hrtime.bigint();
    return { success: true, timeMs: Number(end - start) / 1_000_000 };
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
  if (!redis) {
    throw new Error("Redis is not available in Edge runtime");
  }
  const start = process.hrtime.bigint();
  const slugKey = `slug:${String(slug)}:${String(lang)}:${String(country)}`;

  try {
    const productId = await redis.get(slugKey);

    if (!productId) {
      const end = process.hrtime.bigint();
      return { product: null, timeMs: Number(end - start) / 1_000_000 };
    }

    const productKey = `product:${String(productId)}:${String(lang)}:${String(
      country,
    )}`;

    const cachedProduct = await redis.get(productKey);

    const end = process.hrtime.bigint();
    let product = cachedProduct ? JSON.parse(cachedProduct) : null;

    return {
      product: { ...product, redis: true },
      timeMs: Number(end - start) / 1_000_000,
    };
  } catch (err) {
    console.error("Redis GET failed", { slugKey, err });
    LogServerError({ error: err, type: "redis getProductFromCache failed", slugKey }, "/");
    throw err;
  }
}
// Get Currency from Redis
export async function getCurrencyFromCache(country) {
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
  try {
    const cachedProduct = await redis.get(key);
    return cachedProduct ? JSON.parse(cachedProduct) : null;
  } catch (e) {
    LogServerError({ error: e, type: "redis RedisGet failed", key }, "/");
    return null;
  }
}
export async function RedisSet(key, value, ttl?: number) {
  try {
    const effectiveTtl =
      ttl ?? Number(process.env.PRODUCT_REDIS_TTL_SECONDS) ?? 86400;
    await redis.set(key, JSON.stringify(value), "EX", effectiveTtl);
  } catch (error) {
    LogServerError({ error, type: "redis RedisSet failed", key }, "/");
  }
}
export async function removeRedis(key) {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(error);
    LogServerError({ error, type: "redis removeRedis failed", key }, "/");
    return;
  }
}
export async function getKeys(keyword) {
  try {
    let keys = await redis.keys(keyword);
    return keys;
  } catch (error) {
    LogServerError({ error, type: "redis getKeys failed", keyword }, "/");
  }
}

export async function GetFromRedis(key) {
  try {
    let result = await redis.get(key);
    return result;
  } catch (error) {
    LogServerError({ error, type: "redis GetFromRedis failed", key }, "/");
    throw error;
  }
}

// ---------------------------------------------------------------------------
// OTP abuse protection
// ---------------------------------------------------------------------------
// Atomic, single-round-trip rate limiter for the "send OTP" flow. Enforces
// three independent rules in one Lua script (no check-then-act race):
//   1. Per-number cooldown  — one OTP per number per `cooldownSeconds`.
//   2. Per-session cap       — at most `sessionMax` DISTINCT numbers per
//                              session (device/market token) within `windowSeconds`.
//   3. Per-IP cap            — at most `ipMax` DISTINCT numbers per IP within the
//                              same window (defeats cookie-clear session resets,
//                              i.e. the "1000 random numbers" attack).
// Return status: 0 allowed, 1 cooldown, 2 session cap hit, 3 ip cap hit.
const OTP_RATE_LIMIT_SCRIPT = `
local cd = redis.call('TTL', KEYS[3])
if cd and cd > 0 then
  return {1, cd}
end
if redis.call('SISMEMBER', KEYS[1], ARGV[1]) == 0 then
  if redis.call('SCARD', KEYS[1]) >= tonumber(ARGV[2]) then
    local t = redis.call('TTL', KEYS[1])
    return {2, t}
  end
end
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 0 then
  if redis.call('SCARD', KEYS[2]) >= tonumber(ARGV[3]) then
    local t = redis.call('TTL', KEYS[2])
    return {3, t}
  end
end
redis.call('SADD', KEYS[1], ARGV[1])
redis.call('EXPIRE', KEYS[1], tonumber(ARGV[4]))
redis.call('SADD', KEYS[2], ARGV[1])
redis.call('EXPIRE', KEYS[2], tonumber(ARGV[4]))
redis.call('SET', KEYS[3], '1', 'EX', tonumber(ARGV[5]))
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
    const ipMax = Number(params.ipMax ?? process.env.OTP_IP_MAX ?? 5);
    const windowSeconds = Number(
      params.windowSeconds ?? process.env.OTP_WINDOW_SECONDS ?? 3600,
    );

    const res = (await redis.eval(
      OTP_RATE_LIMIT_SCRIPT,
      3,
      `otp:sid:${sid}`,
      `otp:ip:${ip}`,
      `otp:cd:${phone}`,
      phone,
      String(sessionMax),
      String(ipMax),
      String(windowSeconds),
      String(cooldown),
    )) as [number, number];

    const status = Array.isArray(res) ? Number(res[0]) : 0;
    const ttl = Array.isArray(res) ? Number(res[1]) : 0;

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