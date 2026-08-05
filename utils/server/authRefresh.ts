import { cookies } from "next/headers";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { REFRESH_TOKEN_ENDPOINT, CHAT_REFRESH_TOKEN_ENDPOINT } from "utils/fetch/Endpoints";
import {
  SECURE_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  setSecureCookieJSON,
  isVerifiedMarketUser,
} from "utils/server/tokenManager";
import { LogServerError } from "utils/serverErrorReporter";

/**
 * Shared refresh-token exchange helpers (market: Go + Laravel auth contracts;
 * chat: dedicated chat backend contract).
 *
 * Design rules (tickets go-refresh-token, laravel-refresh-token):
 * - Refresh tokens are SINGLE-USE: never call this from a context that cannot
 *   persist cookies (callers probe writability first — HandleAuthedFetch — or
 *   are route handlers).
 * - Races resolve toward the browser jar: an upstream 401 ("invalid") NEVER
 *   deletes the refresh cookie here — a per-request snapshot cannot know
 *   whether a concurrent winner already rotated it. Deletion happens only on
 *   the expire route's nuke path, after its own last-chance attempt failed.
 * - The exchange goes to the backend that SERVES this user — the same routing
 *   rule as getMarketFetchBase/getServerBaseUrl (verified → Laravel, guest →
 *   Go). Go and Laravel share one DB, so a pair minted by either validates on
 *   both; each user simply refreshes where they are served.
 * - 5xx/timeout is never retried ("unavailable") — callers fail straight
 *   through to the existing fallback flow.
 * - Token values are never logged.
 */

export type RefreshOutcome =
  | { status: "refreshed"; token: string }
  | { status: "no-token" } // no refresh cookie stored (e.g. pre-rollout session)
  | { status: "invalid" } // upstream 401 — dead or raced; caller decides
  | { status: "ineligible" } // logout in progress — never mint mid-logout
  | { status: "unavailable" }; // 5xx / network / malformed — fail through

// Per-backend adapter registry (NFR-4 / AC-16). Both backends expose the same
// endpoint path and the same envelope; they differ only in base URL and in the
// fields their refresh response carries (see `laravel` below).
const REFRESH_BACKENDS = {
  go: {
    baseUrl: () => process.env.GO_BACKEND_URL || "",
    endpoint: REFRESH_TOKEN_ENDPOINT,
    buildBody: (refreshToken: string) =>
      JSON.stringify({ refresh_token: refreshToken }),
    // Response envelope: { isSuccessful, code, ..., data: { token,
    // expires_at, refresh_token, user } }
    parse: (json: any) => ({
      token: json?.data?.token as string | undefined,
      refreshToken: json?.data?.refresh_token as string | undefined,
      expiresAt: json?.data?.expires_at as string | undefined,
      user: json?.data?.user,
    }),
  },
  laravel: {
    baseUrl: () => process.env.BACKEND_URL || "",
    endpoint: REFRESH_TOKEN_ENDPOINT, // same path on both backends
    buildBody: (refreshToken: string) =>
      JSON.stringify({ refresh_token: refreshToken }),
    // Same envelope, two differences from Go: no `user` (the account is
    // unchanged by a refresh) and an extra `refresh_expires_at` we don't use.
    // The absent `user` is deliberate — doRefresh only writes User-Data when
    // the response carries one, so a rotation can never downgrade a verified
    // shopper's profile. Dates are `dd/mm/yyyy HH:MM:SS` here vs RFC3339 on
    // Go; harmless, `expires_at` is only stored, never parsed — token expiry
    // never drives a refresh (reactive-only: exchanges happen on a real 401).
    parse: (json: any) => ({
      token: json?.data?.token as string | undefined,
      refreshToken: json?.data?.refresh_token as string | undefined,
      expiresAt: json?.data?.expires_at as string | undefined,
      user: json?.data?.user,
    }),
  },
} as const;

// Module-scope single-flight: parallel 401s inside one server instance share
// one exchange instead of burning the single-use token N times (NFR-1).
let inflight: Promise<RefreshOutcome> | null = null;

export async function refreshMarketSession(): Promise<RefreshOutcome> {
  if (inflight) return inflight;
  inflight = doRefresh().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function doRefresh(): Promise<RefreshOutcome> {
  try {
    const cookieStore = await cookies();

    // Logout in progress: never mint or rotate credentials mid-logout.
    if (cookieStore.get(COOKIE_NAMES.LOGOUT_GUARD)?.value) {
      return { status: "ineligible" };
    }

    const refreshToken = cookieStore.get(
      COOKIE_NAMES.MARKET_REFRESH_TOKEN,
    )?.value;
    if (!refreshToken) return { status: "no-token" };

    // Backend selection — the SAME rule as getMarketFetchBase/getServerBaseUrl:
    // verified users (valid phone in User-Data) are served entirely by Laravel,
    // guests by Go. Never re-implement this check here; it stays one source of
    // truth. Routing only — authorization stays with the backends.
    const backend = (await isVerifiedMarketUser())
      ? REFRESH_BACKENDS.laravel
      : REFRESH_BACKENDS.go;
    const local = cookieStore.get(COOKIE_NAMES.LOCAL)?.value || "gb-en";
    const [country, language] = local.split("-");

    let response: Response;
    try {
      response = await fetch(backend.baseUrl() + backend.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // Contract: Lang/Country update the stored locale on refresh —
          // send the shopper's current locale so it isn't reset to defaults.
          Lang: language || "en",
          Country: country || "gb",
        },
        body: backend.buildBody(refreshToken),
        credentials: "omit",
      });
    } catch (error) {
      LogServerError({ error, type: "refresh-token network failure" });
      return { status: "unavailable" };
    }

    if (response.status === 401) {
      // Uniform 401 (dead OR raced). Do NOT delete the cookie here — see
      // header comment. Callers route to client-side recovery / expire.
      return { status: "invalid" };
    }

    const json = await response.json().catch(() => null);
    if (!response.ok || !json) {
      LogServerError({
        error: { status: response.status, message: json?.message },
        type: "refresh-token exchange failed",
      });
      return { status: "unavailable" };
    }

    const parsed = backend.parse(json);
    if (!parsed.token || !parsed.refreshToken) {
      LogServerError({
        error: { message: "refresh response missing token pair" },
        type: "refresh-token exchange failed",
      });
      return { status: "unavailable" };
    }

    // Persist the rotated pair — ALWAYS both together (AC-4/AC-13). Callers
    // guarantee a persistable context; a failure here is logged loudly
    // because it means a consumed single-use token could not be stored.
    try {
      cookieStore.set({
        name: COOKIE_NAMES.MARKET_TOKEN,
        value: parsed.token,
        ...SECURE_COOKIE_OPTIONS,
      });
      cookieStore.set({
        name: COOKIE_NAMES.MARKET_REFRESH_TOKEN,
        value: parsed.refreshToken,
        ...REFRESH_COOKIE_OPTIONS, // 30d, renewed on every rotation (AC-14)
      });
      if (parsed.user) {
        await setSecureCookieJSON(COOKIE_NAMES.USER_DATA, {
          ...parsed.user,
          expired_at: parsed.expiresAt,
        });
      }
    } catch (error) {
      LogServerError({
        error,
        type: "refresh-token rotated pair could not be persisted (caller violated writability contract)",
      });
    }

    return { status: "refreshed", token: parsed.token };
  } catch (error) {
    LogServerError({ error, type: "refresh-token unexpected failure" });
    return { status: "unavailable" };
  }
}

// Per-backend adapter for the chat service (single backend, dedicated token pair).
// Same contract as the market helper: single-use rotation, both cookies replaced,
// races resolve toward the browser jar, never delete the refresh cookie here.
const CHAT_REFRESH_BACKEND = {
  baseUrl: () => process.env.NEXT_PUBLIC_CHAT_BACKEND_URL || "",
  endpoint: CHAT_REFRESH_TOKEN_ENDPOINT,
  buildBody: (refreshToken: string) =>
    JSON.stringify({ refresh_token: refreshToken }),
  // Response envelope mirrors the chat login response:
  // { data: { access_token, refresh_token, ... } }
  parse: (json: any) => ({
    token: json?.data?.access_token as string | undefined,
    refreshToken: json?.data?.refresh_token as string | undefined,
  }),
};

let chatInflight: Promise<RefreshOutcome> | null = null;

export async function refreshChatSession(): Promise<RefreshOutcome> {
  if (chatInflight) return chatInflight;
  chatInflight = doRefreshChat().finally(() => {
    chatInflight = null;
  });
  return chatInflight;
}

async function doRefreshChat(): Promise<RefreshOutcome> {
  try {
    const cookieStore = await cookies();

    // Logout in progress: never mint or rotate credentials mid-logout.
    if (cookieStore.get(COOKIE_NAMES.LOGOUT_GUARD)?.value) {
      return { status: "ineligible" };
    }

    const refreshToken = cookieStore.get(COOKIE_NAMES.CHAT_REFRESH_TOKEN)?.value;
    if (!refreshToken) return { status: "no-token" };

    const backend = CHAT_REFRESH_BACKEND;
    const local = cookieStore.get(COOKIE_NAMES.LOCAL)?.value || "gb-en";
    const [country, language] = local.split("-");

    let response: Response;
    try {
      response = await fetch(backend.baseUrl() + backend.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Lang: language || "en",
          Country: country || "gb",
        },
        body: backend.buildBody(refreshToken),
        credentials: "omit",
      });
    } catch (error) {
      LogServerError({ error, type: "chat refresh-token network failure" });
      return { status: "unavailable" };
    }

    if (response.status === 401) {
      // Uniform 401 (dead OR raced). Do NOT delete the refresh cookie here —
      // a concurrent winner may have rotated it; the jar-retry inherits it.
      return { status: "invalid" };
    }

    const json = await response.json().catch(() => null);
    if (!response.ok || !json) {
      LogServerError({
        error: { status: response.status, message: json?.message },
        type: "chat refresh-token exchange failed",
      });
      return { status: "unavailable" };
    }

    const parsed = backend.parse(json);
    if (!parsed.token || !parsed.refreshToken) {
      LogServerError({
        error: { message: "chat refresh response missing token pair" },
        type: "chat refresh-token exchange failed",
      });
      return { status: "unavailable" };
    }
    console.log(parsed);

    try {
      cookieStore.set({
        name: COOKIE_NAMES.CHAT_TOKEN,
        value: parsed.token,
        ...SECURE_COOKIE_OPTIONS,
      });
      cookieStore.set({
        name: COOKIE_NAMES.CHAT_REFRESH_TOKEN,
        value: parsed.refreshToken,
        ...REFRESH_COOKIE_OPTIONS,
      });
    } catch (error) {
      LogServerError({
        error,
        type: "chat refresh-token rotated pair could not be persisted (caller violated writability contract)",
      });
    }

    return { status: "refreshed", token: parsed.token };
  } catch (error) {
    LogServerError({ error, type: "chat refresh-token unexpected failure" });
    return { status: "unavailable" };
  }
}
