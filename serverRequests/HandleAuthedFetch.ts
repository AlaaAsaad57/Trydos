"use server";
import { cookies } from "next/headers";
import { fetchServerData } from "./ServerFetch"; // Adjust path accordingly
import { LogError } from "utils/functions";
import { COOKIE_NAMES as CANONICAL_COOKIE_NAMES } from "utils/cookies/cookie-manager";
import {
  setSecureCookieJSON,
  SECURE_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  isVerifiedMarketUser,
} from "utils/server/tokenManager";
import { refreshMarketSession } from "utils/server/authRefresh";

const COOKIE_NAMES = {
  USER_DATA: "User-Data",
  MARKET_TOKEN: "MARKET-TOKEN",
  MARKET_REFRESH_TOKEN: "MARKET-REFRESH-TOKEN",
};
interface FetchOptions {
  url: string;
  revalidate?: number;
  tags?: string[];
  retryAttempts?: number;
  retryDelay?: number;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  local?: string;
  headers?: Record<string, string>;
  body?: any;
}
const REGISTER_DEVICE_URL = "/auth/register-guest";

/**
 * Utility to handle authenticated fetches with automatic 401 token refreshing.
 */
export const HandleAuthedFetch = async <T = any>(
  options: FetchOptions,
): Promise<any> => {
  const cookieStore = await cookies();
  let token = cookieStore?.get(COOKIE_NAMES?.MARKET_TOKEN)?.value;

  let headers = {
    ...(options?.headers ?? {}),
    ...(token && {
      Authorization: `Bearer ${token}`,
    }),
    Accept: "application/json",
  };
  // 1. Initial Attempt
  let response = await fetchServerData<T>({ ...options, headers });

  // Logout in progress: a logout just cleared the cookies and armed the guard.
  // Do NOT re-register a guest or write any token/identity cookie here, or this
  // late 401 would resurrect the session the user just logged out of. Return the
  // 401 as-is; the post-logout reload registers a fresh guest normally.
  const loggingOut = cookieStore?.get(CANONICAL_COOKIE_NAMES.LOGOUT_GUARD)?.value;

  // 2. If 401 Unauthorized, try refresh-first recovery (Go/Laravel contracts)
  if (response.status === 401 && !loggingOut) {
    try {
      // Cookie-writability probe BEFORE consuming anything single-use: re-set
      // the existing token to its current value. In a pure Server Component
      // render this throws — return the 401 unchanged and let client-side
      // recovery (which CAN persist the rotated pair) own it. Never burn the
      // single-use refresh token in a context that can't store its successor.
      try {
        if (token) {
          cookieStore.set({
            name: COOKIE_NAMES.MARKET_TOKEN,
            value: token,
            ...SECURE_COOKIE_OPTIONS,
          });
        } else {
          // No token to probe with — use a throwaway assignment of the same
          // cookie name to its (empty) value semantics via delete-safe set.
          cookieStore.set({
            name: COOKIE_NAMES.MARKET_TOKEN,
            value: "",
            ...SECURE_COOKIE_OPTIONS,
            maxAge: 0,
          });
        }
      } catch {
        return response;
      }

      // Refresh applies to EVERY market 401, whichever backend served it: the
      // exchange itself is routed by user type inside refreshMarketSession
      // (verified → Laravel, guest → Go). Notably this covers Laravel-served
      // calls made with a guest's Go-issued token (e.g. send_otp), which the
      // previous Go-only gate left as a hard 401.
      const hasRefreshToken = Boolean(
        cookieStore.get(COOKIE_NAMES.MARKET_REFRESH_TOKEN)?.value,
      );

      if (hasRefreshToken) {
        // Single-use rotation: the shared helper single-flights the exchange
        // and persists BOTH cookies. On "invalid" (uniform 401 — dead OR
        // raced) return the 401 to the caller: a per-request snapshot cannot
        // see a concurrent winner's rotation, so the register-guest fallback
        // is reserved for the client path / the no-cookie case below.
        const outcome = await refreshMarketSession();
        if (outcome.status === "refreshed") {
          const newHeaders = {
            ...options.headers,
            Authorization: `Bearer ${outcome.token}`,
            Accept: "application/json",
          };
          return await fetchServerData<T>({ ...options, headers: newHeaders });
        }
        return response;
      }

      // A verified shopper with no refresh cookie (pre-rollout session) must
      // NOT be re-registered as a guest here — that would silently downgrade a
      // logged-in account server-side. Return the 401 and let the client raise
      // the re-verify prompt, which merges them back into their real account.
      if (await isVerifiedMarketUser()) return response;

      // No refresh cookie at all (pre-rollout session / cleared cookies):
      // bodyless register-guest per the contract — no old_guest_user_id, no
      // "user does not exist" retry ladder (the re-issue-by-id path is gone).
      // Guest creation is Go's job, so this stays pinned to GO_BACKEND_URL.
      const regResponse = await fetchServerData({
        url: process.env.GO_BACKEND_URL + REGISTER_DEVICE_URL,
        method: "POST",
        headers: headers,
      });
      const repo = regResponse.data;

      if (repo?.data?.token) {
        // Persist the fresh guest pair — probe above guarantees writability.
        cookieStore.set({
          name: COOKIE_NAMES.MARKET_TOKEN,
          value: repo.data.token,
          ...SECURE_COOKIE_OPTIONS,
        });
        if (repo.data?.refresh_token) {
          cookieStore.set({
            name: COOKIE_NAMES.MARKET_REFRESH_TOKEN,
            value: repo.data.refresh_token,
            ...REFRESH_COOKIE_OPTIONS,
          });
        }
        if (repo.data?.user) {
          await setSecureCookieJSON(COOKIE_NAMES.USER_DATA, {
            ...repo.data.user,
            expired_at: repo.data.expires_at,
          });
        }

        // Retry the original request with the new token
        const newHeaders = {
          ...options.headers,
          Authorization: `Bearer ${repo.data.token}`,
          Accept: "application/json",
        };
        return await fetchServerData<T>({ ...options, headers: newHeaders });
      }
    } catch (error) {
      LogError({
        error: error,
        scenario: "Error In HandleAuthedFetch in HandleAuthedFetch",
      });
      console.error("Auth Refresh Failed:", error);
    }
  }

  return response;
};
