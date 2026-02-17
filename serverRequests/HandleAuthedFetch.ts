"use server";
import { cookies } from "next/headers";
import { fetchServerData } from "./ServerFetch"; // Adjust path accordingly
import { LogError } from "utils/functions";
import { getCookieServer } from "utils/cookies/cookie-manager";

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

  // 2. If 401 Unauthorized, try to re-register/refresh token
  if (response.status === 401) {
    const user = await getCookieServer<UserData>(COOKIE_NAMES.USER_DATA);

    let requestBody = user?.id
      ? { old_guest_user_id: user.id }
      : { old_guest_user_id: null };

    try {
      // Internal helper to perform registration fetch
      const registerUser = async (body: any) => {
        return await fetchServerData({
          url: process.env.NEXT_PUBLIC_BACKEND_URL + REGISTER_DEVICE_URL,
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
        // 3. Update Cookies

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
