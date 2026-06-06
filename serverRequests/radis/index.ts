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
