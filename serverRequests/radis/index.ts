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
      ttl ?? Number(process.env.PRODUCT_REDIS_TTL_SECONDS) ?? 120;
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
