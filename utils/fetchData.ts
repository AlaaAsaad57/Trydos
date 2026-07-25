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
import { useAppStore } from "../store";
import { toServiceToken } from "./serviceTokens";

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

// Aborted as a group the moment a logout starts, so every in-flight authed
// request stops immediately instead of resolving a 401 mid-logout (which is
// what used to let a late response resurrect the just-cleared session). The
// page reloads right after logout, giving a fresh module instance with a fresh
// controller — so there is no need to re-create it here.
let logoutAbortController = new AbortController();

/**
 * Abort all in-flight `fetchData` requests because a logout has started.
 * Call this AFTER any must-finish logout request (e.g. FCM token removal) and
 * before clearing cookies. Bare `fetch` calls (the logout route itself) are
 * unaffected — only `fetchData`-issued requests join this group.
 */
export const abortInFlightForLogout = () => {
  try {
    logoutAbortController.abort();
  } catch {}
};

// Merge the caller's per-request signal with the logout-group signal so a fetch
// aborts if EITHER fires. Done manually (not via `AbortSignal.any`) for broad
// browser support.
const withLogoutSignal = (signal?: AbortSignal): AbortSignal => {
  const controller = new AbortController();
  if (logoutAbortController.signal.aborted || signal?.aborted) {
    controller.abort();
    return controller.signal;
  }
  const onAbort = () => controller.abort();
  logoutAbortController.signal.addEventListener("abort", onAbort, {
    once: true,
  });
  signal?.addEventListener("abort", onAbort, { once: true });
  return controller.signal;
};
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
  "Policies Approved!",
  "firebase device token stored successfully",
  "Firebase settings retrieved successfully",
  "Languages retrieved successfully"
];

// ---------- Helper Functions ----------

// Servers that are on the same origin — direct fetch, cookies sent automatically
const isLocalServer = (server: ServerType) => server === "local";


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

// When a user-facing re-auth (the "verify your number" widget) is already in
// progress, wait for it to resolve instead of starting a parallel recovery.
// Mirrors the poll used by the chat/stories 401 path: resolves `true` once the
// user verifies (reAuthResult === "success"), `false` if the prompt is
// cancelled/dismissed or after the same 5-minute safety timeout.
const waitForReAuthSuccess = (): Promise<boolean> =>
  new Promise((resolve) => {
    const interval = setInterval(() => {
      const state = useAppStore.getState();
      if (state.reAuthResult === "success") {
        clearInterval(interval);
        resolve(true);
      } else if (
        !state.shouldAuthinticated ||
        state.reAuthResult === "cancelled"
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

const handleUnauthorized = async (
  server: ServerType,
  options,
  authAttempt = 0,
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
          const { isRegisteringReady, shouldAuthinticated, reAuthResult } =
            useAppStore.getState();

          // A user-facing verification (the "verify your number" widget) is
          // already in progress — typically triggered by a concurrent
          // chat/stories/need_auth request on the same (expired) page load.
          // Wait for it to finish and retry with the freshly issued token,
          // instead of starting a parallel guest re-register (ExpiredUser),
          // which would delete the just-verified MARKET token and force a
          // second prompt at checkout. Scoped to market(-dashboard) so the
          // /api/auth/login retry path (server === "local") is untouched.
          if (
            (server === "market" || server === "market-dashboard") &&
            (shouldAuthinticated || reAuthResult === "pending")
          ) {
            return await waitForReAuthSuccess();
          }

          // If a registration/expire is already in progress, wait for it
          // instead of starting another one
          if (!isRegisteringReady) {
            await waitUntilRegisteringComplete();
            return true;
          }

          // Refresh-first (Go auth contract): only on the FIRST 401 of this
          // request. Go-eligibility is decided server-side by
          // /api/auth/refresh with the same routing helpers the proxy uses.
          // refreshed → retry with the rotated token; eligible-but-failed →
          // the retry doubles as the jar-retry (the browser jar may already
          // carry a concurrent winner's Set-Cookie). Today's flow (expire /
          // seller widget) runs only on the NEXT 401 (attempt 1) or when the
          // request was Laravel-served ({eligible: false} — FR-8).
          if (
            (server === "market" || server === "market-dashboard") &&
            authAttempt === 0
          ) {
            const authService = await import("../services/auth");
            const refresh = await authService.default.RefreshSession(
              options?.url,
              server,
            );
            if (refresh.eligible) return true;
          }

          // Seller dashboard: don't silently re-register as a guest and bounce.
          // Register the guest (so dismissing still leaves a usable token),
          // then show the session-expired "please login again" prompt and wait.
          // Its Login button re-arms the marker as "seller" (the OTP widget's
          // seller semantics: cancel redirects home instead of reloading); on
          // OTP success the original request retries with the fresh MARKET
          // token. "Continue as Guest" sends the seller to the storefront home.
          const isSeller =
            !!options?.sellerId ||
            (typeof window !== "undefined" &&
              window.location.pathname.includes("/seller"));

          const authService = await import("../services/auth");
          const outcome = await authService.default.ExpiredUser();

          // Expire's last-chance refresh renewed the session (a race loser
          // carrying the winner's rotated cookie — e.g. the boot refresh and a
          // parallel 401 recovery sharing one exchange): the session is alive,
          // so just retry with the renewed cookie. Never nuke/prompt here —
          // this is what bounced sellers to home on dashboard load.
          if (outcome?.renewed) return true;

          if (isSeller) {
            const { setShouldAuthinticated, setReAuthResult } =
              useAppStore.getState();
            setReAuthResult("pending");
            setShouldAuthinticated("expired");

            return waitForReAuthSuccess();
          }

          // The session that just died belonged to a phone-verified shopper:
          // ExpiredUser already armed the session-expired "please login again"
          // prompt, so wait for them to log back in (prompt → OTP) and retry
          // the original request against their restored account instead of
          // silently continuing as the freshly registered guest.
          if (outcome?.wasVerified) return waitForReAuthSuccess();

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
// authAttempt: bounded 401-recovery counter (cap 2). Refresh is attempted only
// on the first 401; attempt 1 = post-refresh retry (or jar-retry when the
// refresh failed — the browser jar may carry a concurrent winner's rotation);
// attempt 2 = post-expire retry; a 401 on attempt 2 surfaces the error.
export const fetchData = async <T = any>(
  params: FetchDataParams,
  authAttempt = 0,
): Promise<T> => {
  const isRetryAfterUnauthorized = authAttempt > 0;
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
  // Mutating writes are NOT idempotent: on a poor network the request can reach
  // the backend and succeed while the response/ACK is lost (socket drop →
  // "Failed to fetch", or a 502/504 from an edge proxy *after* the backend
  // already processed it). Retrying then creates a duplicate (e.g. a review
  // comment written twice in Elasticsearch). Never auto-retry these — the create
  // endpoint has no idempotency key to dedupe on. GETs stay retryable.
  const isMutatingMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(
    String(method || "").toUpperCase(),
  );
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

      // Abort on the caller's signal OR when a logout begins.
      const effectiveSignal = withLogoutSignal(signal);

      if (isUploadStory(server)) {

        res = await fetch(url, {
          method,
          body: body && method !== "GET" ? (body as BodyInit) : undefined,
          credentials: "omit",
          signal: effectiveSignal,
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
          signal: effectiveSignal,
        });
      } else {
        const safeProxyUrl = encodeURI(url);
        // ── EXTERNAL: route through /api/proxy (token injected server-side) ──
        const proxyHeaders: Record<string, string> = {
          "x-proxy-server": toServiceToken(server),
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
          signal: effectiveSignal,
        });
      }

      status = res.status;

      try {
        responseData = await res.json();
      } catch (e) {}
      // if user not linked to seller it should redirect to home page.
      // 401 is excluded: an expired token is handled by the re-auth flow below
      // (confirmMobile widget), not by an immediate bounce to home. Also held
      // back while a re-auth is in progress: mid-recovery a sibling request can
      // briefly 403 against the transitional token — bouncing home then would
      // kill the session-expired prompt before the user can answer it.
      if (status !== 200 && status !== 401 && method === "GET") {
        const { shouldAuthinticated, reAuthResult } = useAppStore.getState();
        const reAuthInProgress =
          Boolean(shouldAuthinticated) || reAuthResult === "pending";
        if (server === "market" && sellerId && !reAuthInProgress) {
          window.location.href = `/`;
        }
      }
      if (status === 401 && authAttempt < 2) {

        const shouldRetry = await handleUnauthorized(
          server,
          {
            url,
            server,
            body,
            status,
            responseData,
            sellerId,
          },
          authAttempt,
        );
        if (shouldRetry) {
          retryActionIfUnAuth?.();
          return fetchData<T>(params, authAttempt + 1);
        }

        throw new Error("Authentication required");
      }

      if (!res.ok) {
        throw new Error(
          responseData?.message ??
            responseData?.data?.message ??
            `Error fetching data for request ${reqTitle?.code} : ${res.status} : ${res.statusText}`,
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


      return { ...(responseData || {}), success: true };
    } catch (err: any) {
      retryCount++;
      if (
        !isMutatingMethod &&
        ((err instanceof TypeError && err.message.includes("fetch")) ||
          retryableStatusCodes.includes(status))
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
