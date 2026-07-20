"use server";
import { cookies } from "next/headers";
import { fetchServerData } from "./ServerFetch"; // Adjust path accordingly
import { LogError } from "utils/functions";
import { getCookieServer, COOKIE_NAMES as CANONICAL_COOKIE_NAMES } from "utils/cookies/cookie-manager";
import {
  setSecureCookieJSON,
  SECURE_COOKIE_OPTIONS,
} from "utils/server/tokenManager";

// Interfaces based on your snippets
interface UserData {
  id: string;
  name?: string;
}

const COOKIE_NAMES = {
  USER_DATA: "User-Data",
  DEVICE_TOKEN: "DEVICE-TOKEN",
  MARKET_TOKEN: "MARKET-TOKEN",
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
  let token =
    cookieStore?.get(COOKIE_NAMES?.MARKET_TOKEN)?.value ??
    cookieStore?.get(COOKIE_NAMES.DEVICE_TOKEN)?.value;

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

  // 2. If 401 Unauthorized, try to re-register/refresh token
  if (response.status === 401 && !loggingOut) {
    const user = await getCookieServer<UserData>(COOKIE_NAMES.USER_DATA);

    let requestBody = user?.id
      ? { old_guest_user_id: user.id }
      : { old_guest_user_id: null };

    try {
      // Internal helper to perform registration fetch
      const registerUser = async (body: any) => {
        return await fetchServerData({
          url: process.env.GO_BACKEND_URL + REGISTER_DEVICE_URL,
          body: JSON.stringify(body),
          method: "POST",
          headers: headers,
        });
      };

      let regResponse = await registerUser(requestBody);
      let repo = regResponse.data;

      // Handle "User does not exist" retry logic
      if (repo && repo.message === "The user does not exist.") {
        regResponse = await registerUser({ old_guest_user_id: null });
        repo = regResponse.data;
      }

      if (repo?.data?.token) {
        // 3. Try to update cookies - this only works in Server Actions or Route Handlers
        // During Server Component render, cookie modification is not allowed
        try {
          const cookieStoreInner = await cookies();
          cookieStoreInner.set({
            name: COOKIE_NAMES.DEVICE_TOKEN,
            value: repo.data.token,
            ...SECURE_COOKIE_OPTIONS,
          });

          if (repo.data?.user) {
            await setSecureCookieJSON(COOKIE_NAMES.USER_DATA, {
              ...repo.data.user,
              expired_at: repo.data.expires_at,
            });
          }
        } catch (cookieError) {
          // Cookie modification not allowed in this context (Server Component render)
          // The request will still succeed with the new token, but cookies won't be persisted
          console.warn("Cookie update skipped (not in Server Action context)");
        }

        // 4. Retry the original request with the new token
        const newHeaders = {
          ...options.headers,
          Authorization: `Bearer ${repo.data.token}`,
        };

        let res = await fetchServerData<T>({ ...options, headers: newHeaders });

        return res;
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
