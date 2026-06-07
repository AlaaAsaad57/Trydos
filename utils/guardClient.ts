// Client-side helper that fetches and caches the short-lived HMAC guard token
// minted by GET /api/guard. The token is attached as the `x-guard` header on
// every /api/proxy request so the gateway can prove the call came from our own
// site (see utils/server/requestGuard.ts).
//
// The token is cached in memory with its expiry and refreshed lazily ~1 min
// before it lapses. On a 419 from the proxy, callers should clear the cache and
// re-fetch (self-heal) — see utils/fetchData.ts.

let cached: { token: string | null; exp: number } | null = null;
let inflight: Promise<string | null> | null = null;

const REFRESH_SKEW_MS = 60_000; // refresh a minute before expiry

export function clearGuardToken(): void {
  cached = null;
}

export async function getGuardToken(force = false): Promise<string | null> {
  if (
    !force &&
    cached &&
    cached.exp - REFRESH_SKEW_MS > Date.now()
  ) {
    return cached.token;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("/api/guard", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        // Don't hammer /api/guard on failure; back off for a minute.
        cached = { token: null, exp: Date.now() + 60_000 };
        return null;
      }
      const data = await res.json();
      cached = {
        token: data?.token ?? null,
        exp: typeof data?.exp === "number" ? data.exp : Date.now() + 5 * 60_000,
      };
      return cached.token;
    } catch {
      cached = { token: null, exp: Date.now() + 60_000 };
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
