import Redis from "ioredis";

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
  } catch (error) {}
}
export async function StoreCurrency(country, value) {
  try {
    await redis.set(
      `currency-${country}`,
      JSON.stringify(value),
      "EX",
      Number(process.env.PRODUCT_REDIS_TTL_SECONDS),
    );
  } catch (error) {}
}

export async function RedisGet(key) {
  try {
    const cachedProduct = await redis.get(key);
    return cachedProduct ? JSON.parse(cachedProduct) : null;
  } catch (e) {
    return null;
  }
}
export async function RedisSet(key, value, ttl = 86400) {
  try {
    await redis.set(
      key,
      JSON.stringify(value),
      "EX",
      Number(process.env.PRODUCT_REDIS_TTL_SECONDS),
    );
  } catch (error) {}
}
export async function removeRedis(key) {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(error);
    return;
  }
}
export async function getKeys(keyword) {
  try {
    let keys = await redis.keys(keyword);
    return keys;
  } catch (error) {}
}

export async function GetFromRedis(key) {
  let result = await redis.get(key);
  return result;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number,
) {
  const now = Date.now();
  const windowStart = now - windowSec * 1000;

  // Remove old entries outside the window
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count requests in window
  const count = await redis.zcard(key);

  if (count >= limit) {
    return false; // Rate limit exceeded
  }

  // Add current request
  await redis.zadd(key, now, now.toString());
  await redis.expire(key, windowSec + 1);

  return true; // Allowed
}

export async function trackSuspiciousBehavior(ip: string, path: string) {
  const key = `behavior:${ip}`;
  const hits = await redis.incr(key);
  await redis.expire(key, 10); // 10s window

  if (hits > 20) {
    return `Suspicious behavior: ${hits} requests in 10s from IP ${ip} on ${path}`;
  }

  return null;
}

export const sendSecurityAlert = async (message: string) => {};
