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
import { COOKIE_NAMES, getCookie } from "./cookies/cookie-manager";
import { logRequest } from "./requestLoggerClient";
import { useAppStore } from "../store";

// ---------- Types ----------
type ServerType =
  | "chat"
  | "market"
  | "stories"
  | "elastic"
  | "upload story"
  | "local"
  | "comments"
  | "wallet"
  | "market-dashboard";

type FetchMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface FetchDataParams {
  url: string;
  method: FetchMethod;
  body?: object | string | null;
  useCached?: boolean;
  reqTitle: { reqTitle: string; code: number };
  server: ServerType;
  retryActionIfUnAuth?: () => void | null;
  signal?: AbortSignal;
  noMessage?: boolean;
  sellerId?: string;
}

// ---------- Internal State ----------
const requestCache = new Map<string, any>();
const inflightRequests = new Map<string, Promise<any>>();
const retryableStatusCodes = [502, 504, 429, 503];
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
  "success",
];

// ---------- Helper Functions ----------

// Servers that are on the same origin — direct fetch, cookies sent automatically
const isLocalServer = (server: ServerType) => server === "local";

// "upload story" goes to Cloudinary (cross-origin, no auth, no custom headers)
const isUploadStory = (server: ServerType) => server === "upload story";

const getLocale = () => {
  const [country, lang] = (window.location.pathname.split("/")[1] || "").split(
    "-",
  );
  const languageCookie = getCookie("language");
  const countryCookie = getCookie("country");
  return {
    country: country ?? countryCookie ?? "sy",
    language: lang ?? languageCookie ?? "en",
  };
};

const waitUntilRegisteringComplete = async (): Promise<void> => {
  try {
    const { useAppStore } = await import("../store");
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
  } catch (err) {}
};

const handleUnauthorized = async (
  server: ServerType,
  options,
): Promise<boolean> => {
  const { LoggingOut } = useAppStore.getState();
  if (LoggingOut) return false;

  try {
    switch (server) {
      case "elastic":
        return true;

      case "market":
      case "market-dashboard":
      case "local":
        if (
          (server === "local" && options?.url.includes("/api/auth/login")) ||
          server === "market-dashboard" ||
          server === "market"
        ) {
          const { useAppStore } = await import("../store");
          // If a registration/expire is already in progress, wait for it
          // instead of starting another one
          const { isRegisteringReady } = useAppStore.getState();
          if (!isRegisteringReady) {
            await waitUntilRegisteringComplete();
            return true;
          }

          const authService = await import("../services/auth");
          await authService.default.ExpiredUser();
          return true;
        }
        return false;

      case "chat":
      case "stories":
      case "comments":
      case "wallet":
        localStorage.setItem(
          "last_unauthorized_request",
          JSON.stringify({
            ...options,
            date: new Date().toISOString(),
          }),
        );

        // Clear stale tokens server-side (tokens are HttpOnly)
        await fetch("/api/auth/clear-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokens: [COOKIE_NAMES.CHAT_TOKEN, COOKIE_NAMES.STORIES_TOKEN],
          }),
          credentials: "include",
        });

        const { useAppStore } = await import("../store");
        const { setShouldAuthinticated, setReAuthResult } =
          useAppStore.getState();

        setReAuthResult("pending");
        setShouldAuthinticated(true);

        return new Promise((resolve) => {
          const interval = setInterval(() => {
            const currentState = useAppStore.getState();

            if (currentState.reAuthResult === "success") {
              clearInterval(interval);
              resolve(true);
            } else if (
              !currentState.shouldAuthinticated ||
              currentState.reAuthResult === "cancelled"
            ) {
              clearInterval(interval);
              resolve(false);
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
    return false;
  }
};

const generateCacheKey = (params: FetchDataParams): string => {
  const { url, method, body, server } = params;
  return JSON.stringify({ url, method, body, server });
};

const raceWithSignal = <T>(
  promise: Promise<T>,
  signal?: AbortSignal,
): Promise<T> => {
  if (!signal) return promise;
  if (signal.aborted)
    return Promise.reject(
      new DOMException("The user aborted a request.", "AbortError"),
    );

  return new Promise<T>((resolve, reject) => {
    const onAbort = () =>
      reject(new DOMException("The user aborted a request.", "AbortError"));
    signal.addEventListener("abort", onAbort, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", onAbort));
  });
};

// ---------- Main Function ----------
export const fetchData = async <T = any>(
  params: FetchDataParams,
  isRetryAfterUnauthorized = false,
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
    sellerId,
  } = params;
  const { useAppStore } = await import("../store");
  const { LoggingOut } = useAppStore.getState();
  if (LoggingOut && url !== "/api/v1/firebase_tokens/remove-token") {
    return {} as T;
  }

  const cacheKey = generateCacheKey(params);
  let retryCount = 0;
  let status: number;
  let responseData: any;
  let logObj: Partial<any> = {};

  if (useCached && !isRetryAfterUnauthorized && requestCache.has(cacheKey)) {
    return { ...requestCache.get(cacheKey), success: true };
  }

  // Inflight dedup: if an identical request is already pending, share its promise
  if (!isRetryAfterUnauthorized && inflightRequests.has(cacheKey)) {
    const shared = inflightRequests.get(cacheKey)!.then((r) => ({ ...r }));
    return raceWithSignal(shared, signal) as Promise<T>;
  }

  const doFetchWithRetry = async (): Promise<T> => {
    await waitUntilRegisteringComplete();
    if (url === "/auth/register-guest") {
      const { useAppStore } = await import("../store");
      let { setIsRegisteringReady, LoggingOut } = useAppStore.getState();
      setIsRegisteringReady(false);
    }
    try {
      const { country, language } = getLocale();
      let res: Response;

      if (isUploadStory(server)) {
        // ── UPLOAD STORY: cross-origin Cloudinary, no auth, no custom headers ──
        res = await fetch(url, {
          method,
          body: body && method !== "GET" ? (body as BodyInit) : undefined,
          credentials: "omit",
          signal,
        });
      } else if (isLocalServer(server)) {
        // ── LOCAL: same-origin fetch, HttpOnly cookies sent automatically ──
        const localHeaders: Record<string, string> = {
          "x-country": country,
          "x-language": language,
        };
        if (body && !(body instanceof FormData)) {
          localHeaders["Content-Type"] = "application/json";
        }

        res = await fetch(url, {
          method,
          headers: localHeaders,
          body: body && method !== "GET" ? (body as BodyInit) : undefined,
          credentials: "include",
          signal,
        });
      } else {
        const safeProxyUrl = encodeURI(url);
        // ── EXTERNAL: route through /api/proxy (token injected server-side) ──
        const proxyHeaders: Record<string, string> = {
          "x-proxy-server": server,
          "x-proxy-url": safeProxyUrl,
          "x-proxy-method": method,
          "x-country": country,
          "x-language": language,
          "x-need-decode":"true"
        };

        if (sellerId) {
          proxyHeaders["x-seller-id"] = sellerId;
        }

        let proxyBody: BodyInit | null = null;

        if (body && method !== "GET") {
          if (body instanceof FormData) {
            proxyBody = body;
            // Let browser set multipart boundary
          } else {
            proxyHeaders["Content-Type"] = "application/json";
            proxyBody = typeof body === "string" ? body : JSON.stringify(body);
          }
        }

        res = await fetch("/api/proxy", {
          method: "POST",
          headers: proxyHeaders,
          body: proxyBody,
          credentials: "include", // sends HttpOnly cookies to proxy
          signal,
        });
      }

      status = res.status;
      try {
        responseData = await res.json();
      } catch (e) {}
      // if user not linked to seller it should redirect to home page
      if (status !== 200 && method === "GET") {
        if (server === "market" && sellerId) {
          window.location.href = `/`;
        }
      }
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

        const shouldRetry = await handleUnauthorized(server, {
          url,
          server,
          body,
          status,
          responseData,
        });
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
            `Error fetching data for request ${reqTitle?.code}`,
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
      if (reqTitle?.reqTitle?.includes("Add to cart widget")) {
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
        // Token is HttpOnly — not accessible from JS (secure by design)
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
        const { country, language } = getLocale();
        if (
          (url.includes("cart/update") ||
            reqTitle.reqTitle.includes("Add to cart widget") ||
            reqTitle.reqTitle.includes("cart widget") ||
            reqTitle.reqTitle.includes("apply coupon")) &&
          status === 200
        ) {
          return { ...(responseData || {}), success: false };
        }
        LogError({
          ...errorObj,
          source: "fetchData",
          userId: auth.UserID()?.toString(),
          lastJson: responseData,
          page: window.location.href,
          url,
          method,
          body,
          server,
          country,
          language,
        });
      }

      return { ...(responseData || {}), success: false };
    }
  };

  const promise = doFetchWithRetry();
  inflightRequests.set(cacheKey, promise);
  promise.finally(() => inflightRequests.delete(cacheKey));
  return promise;
};
