import {
  showErrorMessage,
  showSuccessMessage,
} from "components/global/AddToCartMessage";
import Cookies from "js-cookie";
import { _isStoreLastJson, getUserChat, LogError } from "./functions";
import {
  showErrorNotification,
  showSuccessNotification,
} from "store/notifications/reducer";
import auth from "../services/auth";
import {
  COOKIE_NAMES,
  UserData,
  deleteCookie,
  getCookie,
} from "./cookies/cookie-manager";
import { reportError } from "./error-reporter";
// Types
export type ServerType = "chat" | "market" | "stories" | "elastic";

export type FetchMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface FetchDataParams {
  url: string;
  method: FetchMethod;
  body?: object | string | null;
  useCached?: boolean;
  reqTitle?: string;
  server: ServerType;
  retryActionIfUnAuth?: () => void | null;
  signal?: AbortSignal;
}

// Cache structure
const requestCache = new Map<string, any>();
// get base url
const getUrl = (server) => {
  switch (server) {
    case "market":
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    case "elastic":
      return process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL;
    case "chat":
      return process.env.NEXT_PUBLIC_CHAT_BACKEND_URL;
    case "stories":
      return process.env.NEXT_PUBLIC_STORIES_BACKEND_URL;

    default:
      break;
  }
};
// Token fetching functions based on server type
const getChatToken = async (): Promise<string> => {
  const userChat = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
  if (userChat) {
    const parsedUser = userChat;
    if (parsedUser?.access_token) {
      return parsedUser.access_token;
    }
  }
  return "";
};
const getHeader = async () => {
  let local = window.location.pathname.split("/")[1];
  const userChat = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
  const [country, lang] = local.split("-");
  return {
    lang: Cookies.get("lang") || Cookies.get("language") || lang,
    accept: "application/json",
    country: Cookies.get("country") || country,
    current_role_id: userChat?.role_id ? userChat.role_id : "-1",
  };
};
const getMarketToken = async (): Promise<string> => {
  const marketToken = getCookie<string>(COOKIE_NAMES.MARKET_TOKEN);
  const deviceToken = getCookie<string>(COOKIE_NAMES.DEVICE_TOKEN);
  if (marketToken || deviceToken) {
    return marketToken || deviceToken;
  }
  return "";
};

const getStoriesToken = async (): Promise<string> => {
  const userStories = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);
  if (userStories) {
    if (userStories?.access_token) {
      return userStories.access_token;
    }
  }
  return "";
};
const retryableStatusCodes = [502, 503, 504, 429];

// Get token based on server type
const getToken = async (server: ServerType): Promise<string> => {
  switch (server) {
    case "chat":
      return getChatToken();
    case "market":
      return getMarketToken();
    case "stories":
      return getStoriesToken();
    case "elastic":
      return "";
    default:
      throw new Error(`Unknown server type: ${server}`);
  }
};

// Handle unauthorized - refresh tokens based on server type
const handleUnauthorized = async (server: ServerType): Promise<boolean> => {
  console.log(`Handling 401 Unauthorized for ${server} server...`);

  try {
    switch (server) {
      case "elastic":
        return true;
      case "market":
        // For market server, call ExpiredUser to get new token
        const authService = await import("../services/auth");
        await authService.default.ExpiredUser();
        // After ExpiredUser, a new token should be available
        // Return true to indicate retry should happen
        return true;

      case "chat":
      case "stories":
        // For chat/stories servers, show the phone verification widget
        const { useAppStore } = await import("../store");
        const { setShouldAuthinticated } = useAppStore.getState();
        deleteCookie(COOKIE_NAMES.USER_CHAT);
        deleteCookie(COOKIE_NAMES.USER_STORIES);
        deleteCookie(COOKIE_NAMES.CHAT_TOKEN);
        deleteCookie(COOKIE_NAMES.STORIES_TOKEN);
        // Show the verification widget
        setShouldAuthinticated(true);

        // Wait for user to complete verification or close the widget
        // We'll use a promise that resolves when verification is complete
        return new Promise((resolve) => {
          // Poll to check if the widget is still open
          const checkInterval = setInterval(async () => {
            const currentState = useAppStore.getState();
            const hasNewToken =
              server === "chat"
                ? getCookie<UserData>(COOKIE_NAMES.USER_CHAT)?.access_token
                : getCookie<UserData>(COOKIE_NAMES.USER_STORIES)?.access_token;
            console.log({
              shouldAuthintacted: currentState.shouldAuthinticated,
              hasNewToken,
            });
            // Check if widget was closed (shouldAuthinticated is false)
            if (!currentState.shouldAuthinticated) {
              clearInterval(checkInterval);
              // If user closed the widget, the page will reload automatically
              // as configured in ConfirmMobilePhoneWidget
              resolve(false);
            }

            // Check if verification was successful by looking for updated tokens

            if (hasNewToken) {
              clearInterval(checkInterval);
              // Verification successful, allow retry
              resolve(true);
            }
          }, 500); // Check every 500ms

          // Set a timeout to prevent infinite waiting
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve(false);
          }, 300000); // 5 minutes timeout
        });

      default:
        throw new Error(`Unknown server type: ${server}`);
    }
  } catch (error) {
    console.error(`Failed to handle unauthorized for ${server}:`, error);
    return false;
  }
};

// Generate cache key from request configuration
const generateCacheKey = (params: FetchDataParams): string => {
  const { url, method, body, server } = params;
  return JSON.stringify({ url, method, body, server });
};

// Main fetch function
export const fetchData = async <T = any>(
  params: FetchDataParams,
  isRetryAfterUnauthorized = false
): Promise<T> => {
  const ignoredMessages = [
    "Data Got!",
    "تم الحصول على البيانات!",
    "Veri Alındı!",
    "Success",
    "Country and language updated successfully",
    "Product created and view count initialized",
    "View count updated",
    "Subscribed successfully",
    "signal is aborted without reason",
    "Failed to fetch",
    "Too many attempts",
  ];
  const {
    url,
    method,
    body = null,
    useCached = false,
    reqTitle,
    server,
    retryActionIfUnAuth,
  } = params;

  // Check cache first
  const cacheKey = generateCacheKey(params);
  let status;
  if (useCached && !isRetryAfterUnauthorized && requestCache.has(cacheKey)) {
    const cachedData = requestCache.get(cacheKey);
    console.log(
      reqTitle ? `[${reqTitle}] Returning cached data` : "Returning cached data"
    );
    console.log({ isCached: true, data: cachedData, url, method });
    return cachedData;
  }

  let retryCount = 0;
  const maxRetries = 3;

  const attemptFetch = async (): Promise<T> => {
    let responseData;
    try {
      // Get token
      const token = await getToken(server);
      let FULL_URL = getUrl(server) + url;
      // Prepare request options
      const editedHeader = await getHeader();
      const requestOptions: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...editedHeader,
        },
        signal: params.signal,
      };

      // Add Content-Type header only if body is not FormData
      if (body && !(body instanceof FormData)) {
        requestOptions.headers = {
          ...requestOptions.headers,
          "Content-Type": "application/json",
        };
      }

      // Add body for non-GET requests
      if (body && method !== "GET") {
        requestOptions.body = body as BodyInit;
      }

      // Log request if title provided
      if (reqTitle) {
        console.log(`[${reqTitle}] Fetching ${method} ${url}`);
      }

      // Make the request

      const response = await fetch(FULL_URL, requestOptions);
      status = response.status;

      // Handle 401 Unauthorized
      if (response.status === 401 && !isRetryAfterUnauthorized) {
        const shouldRetry = await handleUnauthorized(server);
        // Only retry if handleUnauthorized indicates success
        if (shouldRetry) {
          if (retryActionIfUnAuth) {
            retryActionIfUnAuth();
          }
          return fetchData<T>(params, true);
        }
        // If shouldRetry is false, throw error
        throw new Error("Authentication required");
      }

      // Check if response is ok
      if (!response.ok) {
        console.log(responseData?.message);
        throw new Error(
          `${responseData?.message ?? responseData?.data?.message ?? ""}`
        );
      }
      // Parse response
      responseData = await response.json();

      if (_isStoreLastJson()) {
        localStorage.setItem("LAST_JSON", JSON.stringify(responseData));
      }
      if (
        typeof reqTitle === "string" &&
        reqTitle.includes("Add to cart widget")
      ) {
        showSuccessMessage(
          responseData?.message ?? responseData?.data?.message ?? ""
        );
      } else {
        if (
          !ignoredMessages.includes(
            responseData?.message ?? responseData?.data?.message
          ) &&
          (responseData?.message ?? responseData?.data?.message)?.length > 0
        )
          showSuccessNotification(
            responseData?.message ?? responseData?.data?.message ?? ""
          );
      }

      // Cache the result
      if (useCached) {
        requestCache.set(cacheKey, responseData);
      }
      // console.log({ isCached: false, data: responseData, url, method });
      return responseData;
    } catch (err) {
      // Network error - retry logic
      if (
        (err instanceof TypeError && err.message.includes("fetch")) ||
        retryableStatusCodes.includes(status)
      ) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(
            `Network error, retrying... (${retryCount}/${maxRetries})`
          );
          // Wait a bit before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          );
          return attemptFetch();
        }
      }
      // Re-throw the error for the caller to handle
      if (
        typeof reqTitle === "string" &&
        reqTitle.includes("Add to cart widget")
      ) {
        showErrorMessage(`${err?.message || "Falied"}`);
      } else {
        if (!ignoredMessages.includes(err?.message))
          showErrorNotification(`${err?.message || "Falied"}`);
      }
      let errorObj = {
        type: "backend-exception",
        message: err?.message?.substring(0, 200) || "Falied",
        url: window.location.href,
        user_id: auth.UserID(),
        request_url: url,
        request_method: method,
        request_body: body,
        request_server: server,
        request_token: await getToken(server),
      };
      if (!err?.message?.includes("signal is aborted without reason")) {
        reportError(err, {
          source: "fetchData",
          userId: auth.UserID()?.toString(),
          token: await getToken(server),
          lastJson: responseData,
          page: window.location.href,
          url: url,
          method: method,
          body: body,
        });
        LogError(errorObj);
      }
      // throw err;
      return responseData;
    }
  };

  return attemptFetch();
};

// Utility functions for cache management
export const clearFetchCache = () => {
  requestCache.clear();
};

export const removeCacheEntry = (params: FetchDataParams) => {
  const cacheKey = generateCacheKey(params);
  requestCache.delete(cacheKey);
};

// Helper functions for specific server types
export const fetchMarketData = async <T = any>(
  url: string,
  method: FetchMethod = "GET",
  body?: object | null,
  options?: Partial<FetchDataParams>
): Promise<T> => {
  return fetchData<T>({
    url: process.env.NEXT_PUBLIC_BACKEND_URL + url,
    method,
    body,
    server: "market",
    ...options,
  });
};

export const fetchChatData = async <T = any>(
  url: string,
  method: FetchMethod = "GET",
  body?: object | null,
  options?: Partial<FetchDataParams>
): Promise<T> => {
  return fetchData<T>({
    url: process.env.NEXT_PUBLIC_CHAT_BACKEND_URL + url,
    method,
    body,
    server: "chat",
    ...options,
  });
};

export const fetchStoriesData = async <T = any>(
  url: string,
  method: FetchMethod = "GET",
  body?: object | null,
  options?: Partial<FetchDataParams>
): Promise<T> => {
  return fetchData<T>({
    url: process.env.NEXT_PUBLIC_STORIES_BACKEND_URL + url,
    method,
    body,
    server: "stories",
    ...options,
  });
};
