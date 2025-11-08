import {
  showErrorMessage,
  showSuccessMessage,
} from "components/global/AddToCartMessage";
import { _isStoreLastJson, LogError } from "./functions";
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
  getHashedUserId,
  setCookie,
} from "./cookies/cookie-manager";
import { logRequest } from "./requestLoggerClient";
import { ReportError } from "./errorReported";
import { useAppStore } from "../store";

// ---------- Types ----------
export type ServerType =
  | "chat"
  | "market"
  | "stories"
  | "elastic"
  | "upload story"
  | "nest-stories"
  | "local"
  | "comments";

export type FetchMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface FetchDataParams {
  url: string;
  method: FetchMethod;
  body?: object | string | null;
  useCached?: boolean;
  reqTitle: { reqTitle: string; code: number };
  server: ServerType;
  retryActionIfUnAuth?: () => void | null;
  signal?: AbortSignal;
  noMessage?: boolean;
}

// ---------- Internal State ----------
const requestCache = new Map<string, any>();
const retryableStatusCodes = [502, 503, 504, 429];
const ignoredMessages = [
  "Data Got!",
  "Data Got",
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
  "Unauthorized",
  "The user aborted a request.",
  "Fetch is aborted",
  "UnAuthentication",
  "Unknown error",
];

// ---------- Helper Functions ----------
const getServerBaseUrl = (server: ServerType) => {
  switch (server) {
    case "market":
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    case "elastic":
      return process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL;
    case "chat":
      return process.env.NEXT_PUBLIC_CHAT_BACKEND_URL;
    case "stories":
      return process.env.NEXT_PUBLIC_STORIES_BACKEND_URL;
    case "comments":
      return process.env.NEXT_PUBLIC_COMMENT_BACKEND_URL;
    case "upload story":
    case "nest-stories":
    case "local":
      return "";
    default:
      throw new Error(`Unknown server type: ${server}`);
  }
};

const getToken = async (server: ServerType): Promise<string> => {
  switch (server) {
    case "comments":
      return getHashedUserId();
    case "local":
      return getHashedUserId();
    case "chat":
      return getCookie<UserData>(COOKIE_NAMES.USER_CHAT)?.access_token || "";
    case "market":
      return (
        getCookie<string>(COOKIE_NAMES.MARKET_TOKEN) ||
        getCookie<string>(COOKIE_NAMES.DEVICE_TOKEN) ||
        ""
      );
    case "stories":
    case "nest-stories":
      return getCookie<UserData>(COOKIE_NAMES.USER_STORIES)?.access_token || "";
    case "upload story":
    case "elastic":
      return "";

    default:
      throw new Error(`Unknown server type: ${server}`);
  }
};

const getHeader = async (server = null) => {
  if (server) return null;
  const [country, lang] = (window.location.pathname.split("/")[1] || "").split(
    "-"
  );
  const userChat = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
  const languageCookie = getCookie("language");
  const countryCookie = getCookie("country");
  return {
    lang: lang ?? languageCookie,
    accept: "application/json",
    country: country ?? countryCookie,
    current_role_id: userChat?.role_id || "-1",
  };
};

// const waitForOnline = (): Promise<void> => {
//   if (typeof window === "undefined" || navigator.onLine) {
//     return Promise.resolve();
//   }

//   return new Promise((resolve) => {
//     const checkOnline = () => {
//       if (navigator.onLine) {
//         cleanup();
//         resolve();
//       }
//     };

//     const onOnline = () => {
//       cleanup();
//       resolve();
//     };

//     const interval = setInterval(checkOnline, 3000);
//     window.addEventListener("online", onOnline);

//     const cleanup = () => {
//       clearInterval(interval);
//       window.removeEventListener("online", onOnline);
//     };
//   });
// };

const waitUntilRegisteringComplete = async (): Promise<void> => {
  try {
    const check = () => useAppStore.getState().isRegisteringReady;
    if (check()) return;

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (check()) {
          clearInterval(interval);
          resolve();
        }
      }, 300);
      setTimeout(() => clearInterval(interval), 300000); // 5 minutes timeout
    });
  } catch (err) {
    console.error("Failed to wait for registration to complete:", err);
  }
};

const handleUnauthorized = async (server: ServerType): Promise<boolean> => {
  let userChat: any = getCookie(COOKIE_NAMES.USER_CHAT);
  let userStories: any = getCookie(COOKIE_NAMES.USER_STORIES);
  let userData: any = getCookie(COOKIE_NAMES.USER_DATA);
  try {
    switch (server) {
      case "elastic":
        return true;
      case "market":
        const authService = await import("../services/auth");
        await authService.default.ExpiredUser();
        return true;
      case "chat":
      case "stories":
      case "comments":
        const { setShouldAuthinticated } = useAppStore.getState();
        if (userChat?.id)
          setCookie(COOKIE_NAMES.USER_CHAT, {
            ...userChat,
            need_auth: true,
          });
        if (userStories?.id)
          setCookie(COOKIE_NAMES.USER_STORIES, {
            ...userStories,
            need_auth: true,
          });
        if (userData) {
          setCookie(COOKIE_NAMES.USER_DATA, {
            ...userData,
            need_auth: true,
            is_phone_verified: 0,
          });
        }
        deleteCookie(COOKIE_NAMES.CHAT_TOKEN);
        deleteCookie(COOKIE_NAMES.STORIES_TOKEN);
        deleteCookie(COOKIE_NAMES.USER_CHAT);
        deleteCookie(COOKIE_NAMES.USER_STORIES);
        setShouldAuthinticated(true);

        return new Promise((resolve) => {
          const interval = setInterval(() => {
            const hasNewToken =
              server === "chat"
                ? getCookie<UserData>(COOKIE_NAMES.USER_CHAT)?.access_token
                : getCookie<UserData>(COOKIE_NAMES.USER_STORIES)?.access_token;

            const currentState = useAppStore.getState();
            if (!currentState.shouldAuthinticated) {
              clearInterval(interval);
              resolve(false);
            } else if (hasNewToken) {
              clearInterval(interval);
              resolve(true);
            }
          }, 500);

          setTimeout(() => {
            clearInterval(interval);
            resolve(false);
          }, 300000); // 5 minutes timeout
        });
      default:
        return false;
    }
  } catch (err) {
    console.error("Error in handleUnauthorized:", err);
    return false;
  }
};

const generateCacheKey = (params: FetchDataParams): string => {
  const { url, method, body, server } = params;
  return JSON.stringify({ url, method, body, server });
};

// ---------- Main Function ----------
export const fetchData = async <T = any>(
  params: FetchDataParams,
  isRetryAfterUnauthorized = false
): Promise<T> => {
  const {
    url,
    method,
    body = null,
    useCached = false,
    reqTitle,
    server,
    retryActionIfUnAuth,
    noMessage,
    signal,
  } = params;
  const { LoggingOut } = useAppStore.getState();
  if (LoggingOut === true) return;
  const cacheKey = generateCacheKey(params);
  let retryCount = 0;
  let status: number;
  let responseData: any;
  let logObj: Partial<any> = {};

  if (useCached && !isRetryAfterUnauthorized && requestCache.has(cacheKey)) {
    return { ...requestCache.get(cacheKey), success: true };
  }

  const doFetchWithRetry = async (): Promise<T> => {
    await waitUntilRegisteringComplete();

    if (url === "/auth/register-guest") {
      let { setIsRegisteringReady } = useAppStore.getState();
      setIsRegisteringReady(false);
    }
    try {
      const token = await getToken(server);
      const headers = await getHeader(server === "upload story");
      const fullUrl = getServerBaseUrl(server) + url;

      const requestOptions: RequestInit = {
        method,
        headers: {
          ...(token?.length > 0 ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        cache: "no-store",
        next: {
          revalidate: 0,
        },
        keepalive: !signal,
        signal,
      };

      if (body && !(body instanceof FormData)) {
        requestOptions.headers = {
          ...requestOptions.headers,
          "Content-Type": "application/json",
        };
      }

      if (body && method !== "GET") {
        requestOptions.body = body as BodyInit;
      }

      const res = await fetch(fullUrl, requestOptions);
      status = res.status;
      try {
        responseData = await res.json();
      } catch (e) {}

      if (status === 401 && !isRetryAfterUnauthorized) {
        logRequest({
          url,
          title: reqTitle.reqTitle,
          status,
          attempts: retryCount + 1,
          response: responseData,
          userId: String(auth.UserID?.() ?? ""),
          method,
          body: body?.toString(),
          timestamp: Date.now(),
        });

        const shouldRetry = await handleUnauthorized(server);
        if (shouldRetry) {
          retryActionIfUnAuth?.();
          return fetchData<T>(params, true);
        }

        throw new Error("Authentication required");
      }

      if (!res.ok) {
        throw new Error(
          responseData?.message ??
            responseData?.data?.message ??
            "Unknown error"
        );
      }

      const msg = responseData?.message ?? responseData?.data?.message ?? "";
      const statusVal = responseData?.data?.status;
      if (reqTitle.reqTitle.includes("apply coupon")) {
        if (statusVal === 1) {
          showSuccessMessage(msg);
        } else {
          showErrorMessage(msg);
          throw new Error(msg);
        }
      }
      if (reqTitle.reqTitle.includes("cart widget")) {
        if (url.includes("/cart/remove") && status === 200) {
          showSuccessMessage(msg);
        } else if (statusVal === 1) {
          showSuccessMessage(msg);
        } else if (!ignoredMessages.includes(msg)) {
          showErrorMessage(msg);
          throw new Error(msg);
        }
      } else if (url.includes("cart/update")) {
        if (statusVal === 0) {
          showErrorMessage(msg);
          throw new Error(msg);
        } else if (
          !ignoredMessages.includes(msg) &&
          msg.length > 0 &&
          !noMessage
        ) {
          showSuccessNotification(msg);
        }
      } else if (
        !ignoredMessages.includes(msg) &&
        msg.length > 0 &&
        !noMessage
      ) {
        showSuccessNotification(msg);
      }

      if (useCached) {
        requestCache.set(cacheKey, responseData);
      }

      logRequest({
        url,
        title: reqTitle.reqTitle,
        status,
        attempts: retryCount + 1,
        response: responseData,
        userId: String(auth.UserID?.() ?? ""),
        method,
        body: body?.toString(),
        timestamp: Date.now(),
      });

      return { ...(responseData || {}), success: true };
    } catch (err: any) {
      retryCount++;
      if (
        (err instanceof TypeError && err.message.includes("fetch")) ||
        retryableStatusCodes.includes(status)
      ) {
        if (retryCount < 3) {
          await new Promise((r) => setTimeout(r, 1000 * retryCount));
          return doFetchWithRetry();
        }
      }

      const message = err?.message || "";
      if (reqTitle.reqTitle.includes("Add to cart widget")) {
        showErrorMessage(message);
      } else if (!ignoredMessages.includes(message) && !noMessage) {
        showErrorNotification(message, 5000, null, null, reqTitle.code);
      }

      const errorObj = {
        type: "backend-exception",
        message: message.substring(0, 200),
        url: window.location.href,
        user_id: auth.UserID(),
        request_url: url,
        request_method: method,
        request_body: body,
        request_server: server,
        request_token: await getToken(server),
      };

      if (
        !message.includes("signal is aborted without reason") &&
        !message.includes("Fetch is aborted")
      ) {
        logRequest({
          url,
          title: reqTitle.reqTitle,
          status: status || 0,
          attempts: retryCount,
          response: undefined,
          userId: String(auth.UserID?.() ?? ""),
          method,
          body: body?.toString(),
          timestamp: Date.now(),
        });
        const [country, lang] = (
          window.location.pathname.split("/")[1] || ""
        ).split("-");
        LogError(errorObj);
        ReportError(err, {
          source: "fetchData",
          userId: auth.UserID()?.toString(),
          token: await getToken(server),
          lastJson: responseData,
          page: window.location.href,
          url,
          method,
          body,
          server,
          country: country,
          language: lang,
        });
      }

      return { ...(responseData || {}), success: false };
    }
  };

  return doFetchWithRetry();
};

// ---------- Cache Utilities ----------
export const clearFetchCache = () => requestCache.clear();

export const removeCacheEntry = (params: FetchDataParams) => {
  const cacheKey = generateCacheKey(params);
  requestCache.delete(cacheKey);
};
