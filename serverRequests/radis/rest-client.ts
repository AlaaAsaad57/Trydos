/**
 * A stateless Redis driver, for runtimes where a pooled TCP client is illegal.
 *
 * Why this exists: `ioredis` holds an open TCP socket and this app caches that
 * socket at module scope so requests can share it. On Node that is correct and
 * fast. On the Cloudflare Workers runtime it is forbidden -- reusing an I/O
 * object created during one request inside another fails with "Cannot perform
 * I/O on behalf of a different request". There is nothing to tune: a pooled
 * client is the wrong shape there.
 *
 * A REST driver has no connection to share, so the problem disappears. Every
 * command is one HTTPS request, which is also exactly what a Worker is good at.
 *
 * This speaks the Upstash REST protocol: POST a JSON array of the command and
 * its arguments, get back `{ result }` or `{ error }`. Any Redis host exposing
 * that protocol works; nothing here is specific to one vendor beyond the wire
 * format.
 *
 * Only the commands this app actually issues are implemented. If a caller needs
 * a new one, add it here rather than reaching for the raw client -- that keeps
 * both drivers interchangeable.
 */

/**
 * The slice of the Redis client surface this app uses.
 *
 * `serverRequests/radis/index.ts` is written against this, so the ioredis
 * client and the REST client are drop-in substitutes for each other.
 */
export type RedisLike = {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    mode?: string,
    ttl?: number,
  ): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  scan(
    cursor: string,
    ...args: (string | number)[]
  ): Promise<[string, string[]]>;
  eval(
    script: string,
    numKeys: number,
    ...args: (string | number)[]
  ): Promise<unknown>;
};

function restConfig(): { url: string; token: string } | null {
  const url = process.env.REDIS_REST_URL;
  const token = process.env.REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

/** True when this runtime has a REST Redis configured. */
export function hasRestRedis(): boolean {
  return restConfig() !== null;
}

async function command(args: (string | number)[]): Promise<unknown> {
  const config = restConfig();
  if (!config) {
    throw new Error(
      "the Redis REST driver is not configured (REDIS_REST_URL / REDIS_REST_TOKEN)",
    );
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args.map(String)),
  });

  const payload = (await response.json().catch(() => null)) as {
    result?: unknown;
    error?: string;
  } | null;

  if (!response.ok || payload?.error) {
    // Name the command, never the arguments: keys carry phone numbers and
    // session ids in the OTP paths.
    throw new Error(
      `the Redis REST backend refused ${String(args[0])} (${response.status}${
        payload?.error ? `: ${payload.error}` : ""
      })`,
    );
  }

  return payload?.result ?? null;
}

/**
 * A `RedisLike` backed by HTTPS.
 *
 * Cheap to construct -- it holds no connection -- so callers may build one per
 * request without thinking about pooling.
 */
export function createRestRedis(): RedisLike {
  return {
    async get(key) {
      return (await command(["GET", key])) as string | null;
    },

    async set(key, value, mode, ttl) {
      // Mirrors ioredis' `set(key, value, "EX", ttl)` positional form.
      const args: (string | number)[] = ["SET", key, value];
      if (mode && ttl !== undefined) args.push(mode, ttl);
      return command(args);
    },

    async del(...keys) {
      if (keys.length === 0) return 0;
      return (await command(["DEL", ...keys])) as number;
    },

    async keys(pattern) {
      return ((await command(["KEYS", pattern])) ?? []) as string[];
    },

    async incr(key) {
      return (await command(["INCR", key])) as number;
    },

    async expire(key, seconds) {
      return (await command(["EXPIRE", key, seconds])) as number;
    },

    async ttl(key) {
      return (await command(["TTL", key])) as number;
    },

    async scan(cursor, ...args) {
      // Redis answers SCAN with [nextCursor, keys]; the REST layer preserves
      // that shape but may type the cursor as a number.
      const result = (await command(["SCAN", cursor, ...args])) as [
        string | number,
        string[],
      ];
      return [String(result?.[0] ?? "0"), result?.[1] ?? []];
    },

    async eval(script, numKeys, ...args) {
      return command(["EVAL", script, numKeys, ...args]);
    },
  };
}
