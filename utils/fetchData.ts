import {
  showErrorMessage,
  showSuccessMessage,
} from "components/global/AddToCartMessage";
import { _isStoreLastJson, LogError } from "./functions";
import {
  showErrorNotification,
  showSuccessNotification,
} from "store/notifications/reducer";
import auth from "services/auth";
import { COOKIE_NAMES, getCookie } from "./cookies/cookie-manager";
import { useAppStore } from "store";
import { toServiceToken } from "./serviceTokens";
import { buildProxyGetUrl } from "./proxyGetUrl";

// ---------- Types ----------
export type ServerType =
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
/** Field names that carry a credential. Kept deliberately narrow: `code` is not
 *  here because it is a coupon, a country and a reqTitle field far more often
 *  than a one-time code, and over-redacting leaves a report nobody can act on.
 *  The one-time code's real key is `otp`. Mirrors `sanitizeUserData` in
 *  utils/server/tokenManager.ts. */
const CREDENTIAL_FIELDS = [
  "id_token",
  "otp_id_token",
  "otp",
  "password",
  "token",
  "access_token",
  "refresh_token",
];
const REDACTED = "[redacted]";

/** Strip credentials from a JSON request body before it is attached to an error
 *  report. Sentry keeps what it is sent, so a profile save after a phone change
 *  would otherwise store the one-time token that authorised it. Non-JSON and
 *  unparseable bodies are dropped whole rather than guessed at. */
export const scrubRequestBody = (body: unknown): unknown => {
  if (typeof body !== "string" || body === "") return body;
  let parsed: any;
  try {
    parsed = JSON.parse(body);
  } catch {
    // Not JSON — it cannot be inspected field by field, and it may be a raw
    // token. Reporting nothing is better than reporting a secret.
    return REDACTED;
  }
  if (!parsed || typeof parsed !== "object") return body;
  const safe: any = Array.isArray(parsed) ? [...parsed] : { ...parsed };
  for (const field of CREDENTIAL_FIELDS) {
    if (safe[field] !== undefined) safe[field] = REDACTED;
  }
  return JSON.stringify(safe);
};

/** The one-time code travels in the query string (see `/auth/login?...&otp=`),
 *  so the address is as sensitive as the body and is scrubbed the same way. */
export const scrubRequestUrl = (url: unknown): unknown => {
  if (typeof url !== "string" || !url.includes("=")) return url;
  let out = url;
  for (const field of CREDENTIAL_FIELDS) {
    out = out.replace(
      new RegExp(`([?&]${field}=)[^&#]*`, "gi"),
      `$1${REDACTED}`,
    );
  }
  return out;
};

const LOCAL_AUTEHD_ROUTES = ["/api/auth/login", "/api/ticket"];

// Which HttpOnly cookies a failed sub-service recovery may clear — keyed by the
// service that actually returned the 401. The `chat`/`stories`/`comments`/
// `wallet` arms of `handleUnauthorized` share one exit path (a `switch`
// fall-through), so the list MUST be looked up per server: a hardcoded list
// made a chat/wallet/comments 401 delete the stories pair, which killed the
// stories session (and, once STORIES_REFRESH_TOKEN joined the list, its ability
// to recover) over a failure in an unrelated service.
const STALE_TOKENS_FOR: Partial<Record<ServerType, string[]>> = {
  chat: [COOKIE_NAMES.CHAT_TOKEN, COOKIE_NAMES.CHAT_REFRESH_TOKEN],
  stories: [COOKIE_NAMES.STORIES_TOKEN, COOKIE_NAMES.STORIES_REFRESH_TOKEN],
  comments: [COOKIE_NAMES.USER_ID_HASH, COOKIE_NAMES.COMMENTS_REFRESH_TOKEN],
  wallet: [COOKIE_NAMES.WALLET_TOKEN],
};

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
  /**
   * Address /api/proxy by query string instead of headers (GET only).
   *
   * Use it where the request is worth starting before hydration: a
   * `<link rel="preload">` can only issue a plain GET, so the header contract
   * is unreachable from one. The caller must build the preload address with
   * buildProxyGetUrl() so the two match exactly. Ignored for anything but GET.
   */
  viaProxyGet?: boolean;
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
    country: country || countryCookie || "sy",
    language: lang || languageCookie || "en",
  };
};

const waitUntilRegisteringComplete = async (): Promise<void> => {
  try {
    const { useAppStore } = await import("store");
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
          (server === "local" &&
            LOCAL_AUTEHD_ROUTES.includes(options.url.split("?")[0])) ||
          server === "market-dashboard" ||
          server === "market"
        ) {
          const { useAppStore } = await import("store");
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
            const authService = await import("services/auth");
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

          const authService = await import("services/auth");
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
        // Refresh-first for chat, exactly like market: a single 401 tries the
        // HttpOnly CHAT-REFRESH-TOKEN exchange. On success the proxy's next
        // request picks up the rotated CHAT-TOKEN automatically; on failure
        // (or eligibility false) we fall through to the existing need_auth
        // prompt flow, just like stories/wallet/comments.
        if (authAttempt === 0) {
          const authService = await import("services/auth");
          const refresh = await authService.default.RefreshSession(
            options?.url,
            server,
          );
          await new Promise((resolve) => setTimeout(resolve, 2000)); // let the store update propagate before the retry
          if (refresh.eligible) return true;
        }
      // falls through to the shared sub-service need_auth flow
      case "stories":
        // Refresh-first for stories, using the same backend contract as chat:
        // a single 401 tries the HttpOnly STORIES-REFRESH-TOKEN exchange. On
        // success the proxy's next request picks up the rotated STORIES-TOKEN
        // automatically; on failure we fall through to the existing need_auth
        // prompt flow, like chat/wallet/comments.
        if (authAttempt === 0 && server === "stories") {
          const authService = await import("services/auth");
          const refresh = await authService.default.RefreshSession(
            options?.url,
            server,
          );
          await new Promise((resolve) => setTimeout(resolve, 2000)); // let the store update propagate before the retry
          if (refresh.eligible) return true;
        }
      // falls through to the shared sub-service need_auth flow
      case "comments":
        // Refresh-first for comments, using the comments service own
        // refresh contract: a single 401 tries the HttpOnly
        // COMMENTS-REFRESH-TOKEN exchange. On success the proxy next request
        // picks up the rotated comments token automatically; on failure we
        // fall through to the existing need_auth prompt flow, like wallet.
        if (authAttempt === 0 && server === "comments") {
          const authService = await import("services/auth");
          const refresh = await authService.default.RefreshSession(
            options?.url,
            server,
          );
          await new Promise((resolve) => setTimeout(resolve, 2000)); // let the store update propagate before the retry
          if (refresh.eligible) return true;
        }
      // falls through to the shared sub-service need_auth flow
      case "wallet":
        localStorage.setItem(
          "last_unauthorized_request",
          JSON.stringify({
            ...options,
            date: new Date().toISOString(),
          }),
        );

        // Clear stale tokens server-side (tokens are HttpOnly) — only the ones
        // belonging to the service that failed (see STALE_TOKENS_FOR).
        await fetch("/api/auth/clear-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokens: STALE_TOKENS_FOR[server] ?? [],
          }),
          credentials: "include",
        });

        const { useAppStore } = await import("store");
        const {
          setShouldAuthinticated,
          setReAuthResult,
          shouldAuthinticated: armedFlow,
          reAuthResult: armedResult,
        } = useAppStore.getState();

        // A user-facing re-auth already owns the screen — the session-expired
        // "please login again" prompt ("expired") or the verify widget opened by
        // another flow. Arming the marker here would overwrite it, swapping the
        // prompt for the OTP widget while the user is still choosing (and
        // losing flow markers like "open chat"/"seller"). Wait for whatever is
        // armed to resolve and retry with the token it produces — the same
        // guard the market path above uses.
        if (armedFlow || armedResult === "pending") {
          return await waitForReAuthSuccess();
        }

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
    viaProxyGet = false,
  } = params;
  const { useAppStore } = await import("store");
  // Once a logout has started no authed request may go out — a late 401 would
  // trigger a re-register and resurrect the session. The FCM detach used to be
  // exempt here because it had to run before the cookies were cleared; it now
  // runs server-side inside /api/auth/logout, so nothing is exempt anymore.
  const { LoggingOut } = useAppStore.getState();
  if (LoggingOut) {
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
      const { useAppStore } = await import("store");
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
      } else if (viaProxyGet && method === "GET") {
        // ── EXTERNAL, GET form: /api/proxy?s=…&u=… ──
        //
        // Same proxy, same token injection, addressed by query string instead
        // of headers. Opt-in per call, because this only matters where a
        // `<link rel="preload">` starts the request during HTML parse — and the
        // hint and this fetch must build the address the same way, or the
        // browser makes two requests instead of one.
        //
        // `credentials: "same-origin"` rather than "include": the URL is
        // same-origin, so cookies are sent either way, and it is the mode a
        // `crossOrigin="anonymous"` preload uses. A mismatch there is enough to
        // stop the preload being reused.
        res = await fetch(
          buildProxyGetUrl({ server, url, country, language, sellerId }),
          {
            method: "GET",
            credentials: "same-origin",
            signal: effectiveSignal,
          },
        );
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


      return { ...(responseData || {}), success: true, httpStatus: status };
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
        request_url: scrubRequestUrl(url),
        request_method: method,
        request_body: scrubRequestBody(body),
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
          return { ...(responseData || {}), success: false, httpStatus: status };
        }
        LogError({
          ...errorObj,
          source: "fetchData",
          userId: auth.UserID()?.toString(),
          lastJson: responseData,
          page: window.location.href,
          // Scrubbed, like the copies in errorObj above. These keys are read by
          // utils/errorReported.tsx too, so leaving them raw here would put the
          // credential back into the report the line above just took it out of.
          url: scrubRequestUrl(url),
          method,
          body: scrubRequestBody(body),
          server,
          country,
          language,
        });
      }

      return { ...(responseData || {}), success: false, httpStatus: status };
    }
  };

  const promise = doFetchWithRetry();
  inflightRequests.set(cacheKey, promise);
  promise.finally(() => inflightRequests.delete(cacheKey));
  return promise;
};
