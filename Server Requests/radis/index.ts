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
export async function storeProduct(
  product,
  socialDataProduct,
  slug,
  lang,
  country
) {
  if (!redis) {
    throw new Error("Redis is not available in Edge runtime");
  }
  if (!product?.id) {
    throw new Error("Invalid product object, missing ID");
  }

  const start = process.hrtime.bigint();
  const ttl = Number(process.env.PRODUCT_REDIS_TTL_SECONDS) || DEFAULT_TTL;

  // Force everything into safe strings
  const productKey = `product:${String(product.id)}:${String(lang)}:${String(
    country
  )}`;
  const slugKey = `slug:${String(slug)}:${String(lang)}:${String(country)}`;

  try {
    await redis.set(productKey, JSON.stringify(product), "EX", ttl);
    await redis.set(slugKey, String(product.id), "EX", ttl);
    await redis.set(
      `product:${product.id}:social`,
      JSON.stringify(socialDataProduct),
      "EX",
      ttl
    );
    const end = process.hrtime.bigint();
    return { success: true, timeMs: Number(end - start) / 1_000_000 };
  } catch (err) {
    console.error("Redis SET failed", { productKey, slugKey, err });
    throw err;
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
    const end1 = process.hrtime.bigint();

    if (!productId) {
      const end = process.hrtime.bigint();
      return { product: null, timeMs: Number(end - start) / 1_000_000 };
    }

    const productKey = `product:${String(productId)}:${String(lang)}:${String(
      country
    )}`;

    const cachedProduct = await redis.get(productKey);
    const socialDataProduct = await redis.get(`product:${productId}:social`);
    console.debug(
      "Redis get cachedProduct:",
      productKey,
      "time: ",
      Number(end1 - start) / 1_000_000
    );

    const end = process.hrtime.bigint();
    let product = cachedProduct ? JSON.parse(cachedProduct) : null;
    product = {
      ...(product ?? {}),
      ...(socialDataProduct ? JSON.parse(socialDataProduct) : {}),
    };
    if (!product?.comments) {
      return { product: null, timeMs: Number(end - start) / 1_000_000 };
    }
    return {
      product: product,
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
      Number(process.env.PRODUCT_REDIS_TTL_SECONDS)
    );
  } catch (error) {}
}
// Remove product from Redis cache
export async function removeProductFromCache(
  slug: string,
  lang: string,
  country: string
) {
  if (!redis) {
    throw new Error("Redis is not available in Edge runtime");
  }

  const start = process.hrtime.bigint();
  const slugKey = `slug:${String(slug)}:${String(lang)}:${String(country)}`;

  try {
    // First get the product ID from slug
    const productId = await redis.get(slugKey);

    // Remove the slug key
    await redis.del(slugKey);

    if (productId) {
      // If we found a product ID, also remove the product key
      const productKey = `product:${String(productId)}:${String(lang)}:${String(
        country
      )}`;
      await redis.del(productKey);
    }

    const end = process.hrtime.bigint();
    return {
      success: true,
      timeMs: Number(end - start) / 1_000_000,
    };
  } catch (err) {
    console.error("Redis DELETE failed", { slugKey, err });
    throw err;
  }
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
      Number(process.env.PRODUCT_REDIS_TTL_SECONDS)
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
