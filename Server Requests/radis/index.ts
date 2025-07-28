// import Redis from "ioredis";

// declare global {

//   var _redis: Redis | undefined;
// }

// const redis =
//   global._redis ?? new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// if (process.env.NODE_ENV !== "production") {
//   global._redis = redis;
// }

/**
 * Set a value in Redis
 * @param key - Redis key
 * @param value - Value to store (auto-stringified if object)
 * @param ttl - Optional TTL in seconds
 */
export async function setRedis<T>(
  key: string,
  value: T,
  ttl?: number
): Promise<void> {
  return;
  //   const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  //   if (ttl) {
  //     await redis.set(key, stringValue, "EX", ttl);
  //   } else {
  //     await redis.set(key, stringValue);
  //   }
}

/**
 * Get a value from Redis
 * @param key - Redis key
 */
export async function getRedis<T = any>(key: string): Promise<T | null> {
  return;
  //   const value = await redis.get(key);
  //   if (!value) return null;

  //   try {
  //     return JSON.parse(value) as T;
  //   } catch {
  //     return value as T;
  //   }
}

/**
 * Remove a value from Redis
 * @param key - Redis key
 */
export async function removeRedis(key: string): Promise<void> {
  return;
  //   await redis.del(key);
}

// export default redis;
