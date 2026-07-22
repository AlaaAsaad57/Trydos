import { cookies } from "next/headers";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";

// ---------- Types ----------

type ProxiedServer =
  | "chat"
  | "market"
  | "stories"
  | "elastic"
  | "comments"
  | "wallet"
  | "market-dashboard";

// ---------- Constants ----------

// Raw TOKEN cookies (MARKET/DEVICE/CHAT/STORIES/wallet/comments JWTs).
const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  // Token cookie lifetime. Default 48h so the cookie does not outlive its JWT by
  // ~a year (security review F1-04). Override with TOKEN_COOKIE_MAX_AGE (seconds).
  // Applies only to raw token cookies (set via cookiesStore.set spreading this).
  // SECURITY-REVIEW: token/cookie change — verify the 401→refresh/guest-register
  // path bridges expiry before rollout.
  maxAge: Number(process.env.TOKEN_COOKIE_MAX_AGE) || 60 * 60 * 48, // 48h
};

// USER-DATA cookies (USER_DATA/USER_CHAT/USER_STORIES/WALLET_USER JSON blobs).
// Kept at 1 year by decision — these carry profile/session context, not the raw
// short-lived JWT; used by setSecureCookieJSON below.
const SECURE_USER_COOKIE_OPTIONS = {
  ...SECURE_COOKIE_OPTIONS,
  maxAge: 60 * 60 * 24 * 365, // 1 year
};

const ALLOWED_SERVERS: ProxiedServer[] = [
  "chat",
  "market",
  "stories",
  "elastic",
  "comments",
  "wallet",
  "market-dashboard",
];

// All cookie names that hold sensitive tokens — must be HttpOnly.
// DEVICE_TOKEN is legacy (guest JWTs now live in MARKET_TOKEN); it stays in
// this list ONLY so logout still purges the stale cookie from old browsers —
// nothing reads or sets it anymore.
const SECURE_COOKIE_NAMES = [
  COOKIE_NAMES.MARKET_TOKEN,
  COOKIE_NAMES.DEVICE_TOKEN,
  COOKIE_NAMES.CHAT_TOKEN,
  COOKIE_NAMES.STORIES_TOKEN,
  COOKIE_NAMES.WALLET_TOKEN,
  COOKIE_NAMES.USER_ID_HASH,
  COOKIE_NAMES.USER_DATA,
  COOKIE_NAMES.USER_CHAT,
  COOKIE_NAMES.USER_STORIES,
  COOKIE_NAMES.WALLET_USER,
] as const;

const GO_APIS = [
  "/auth/register-guest",
  "/mobile/home/currency",
  "/web/home/startingSettings",
  "/checklist",
  "/firebase_device_tokens/validate_token",
  "/firebase_device_tokens",
  "/cart/add",
  "/cart/update",
  "/cart/remove",
  "/cart/cart_shipping",
  "/cart/cart_overview",
  "/cart/convert_to_old",
  "/old-cart/get_old_cart",
  "/old-cart/hide",
  '/firebase_device_tokens/subscribe_topic',
  '/firebase_device_tokens/unsubscribe_topic',
  "/firebase_device_tokens/my_firebase_settings",
  "/firebase_device_tokens/change_country_language",
  "/firebase_device_tokens/update_whatsapp",
  "/firebase_device_tokens/update_email",
  "/firebase_device_tokens/update_firebase",
  "/firebase_device_tokens/update_notification_frequency",
  "/web/get-colors-and-sizes",
  "/web/notification_types",
  "/web/notification_types/customer-notification-to-choose",
  // ── Customer profile API migration (ClickUp 86ey26atu) ──
  // These four customer operations moved from the Laravel "market" backend to
  // the Go Store Gateway. Rollback: comment out (or remove) this block to route
  // them back to BACKEND_URL (Laravel) — no caller change needed.
  "/customer/info",
  "/customer/update-profile",
  "/customer/update-name",
  "/customer/approve-policies",
];

// Go endpoints whose URL carries a trailing dynamic segment (e.g. a product
// slug), so the full path never `endsWith` a fixed string. Matched by prefix
// instead. Keep the trailing slash so `/globalDetails/` can't match a sibling
// like `/globalDetailsSomethingElse`.
const GO_API_PREFIXES = [
  "/web/product/globalDetails/",
  "/web/product/qtyPriceDetails/",
  "/web/product/product-meta/",
];
// ---------- Server URL Resolution ----------
export const isFromGoApi = (url: string) =>{
  let normalizedUrl=url.split('?')?.[0];
  if(url.startsWith('/checklist')) return true;
  if(GO_API_PREFIXES.some((prefix) => normalizedUrl.includes(prefix))) return true;
 return GO_APIS.some((endpoint) => normalizedUrl.endsWith(endpoint))};

// ---------- Verified-user routing (market only) ----------

// "Verified" = the User-Data profile carries a valid phone. Placeholder values
// written by guest flows are explicitly NOT valid. Single source of truth for
// the whole app — never re-implement this check at a call site.
export const hasValidPhone = (userData: any): boolean => {
  const phone = userData?.phone;
  if (phone === undefined || phone === null || phone === 0 || phone === "0")
    return false;
  return String(phone).trim() !== "";
};

// Evaluated fresh on EVERY request from the current User-Data cookie — no
// caching, no session stickiness. The whole read (including cookies()) sits
// inside the try/catch so contexts without request cookies (build/static
// render) and malformed cookies fail open to guest routing instead of
// throwing. Routing is a load-steering decision, never an authorization
// decision — authz stays with the backends' JWT checks.
export async function isVerifiedMarketUser(): Promise<boolean> {
  try {
    const userData = await getSecureCookie<any>(COOKIE_NAMES.USER_DATA);
    return hasValidPhone(userData);
  } catch {
    return false;
  }
}

// Base URL for the server-side market fetchers that used to hardcode
// GO_BACKEND_URL. Deliberately does NOT consult isFromGoApi: likesDetails is
// hardcoded-to-Go today while NOT allow-listed, so consulting the list would
// flip guests to Laravel and change guest behavior. Verified → Laravel;
// guest/tokenless → Go (exactly today's behavior).
export async function getMarketFetchBase(): Promise<string> {
  const verified = await isVerifiedMarketUser();
  if (process.env.NODE_ENV !== "production")
    console.log("[MarketRouting]", {
      source: "server-fetch",
      verified,
      backend: verified ? "laravel" : "go",
    });
  if (verified) return process.env.BACKEND_URL || "";
  return process.env.GO_BACKEND_URL || "";
}

async function getServerBaseUrl(
  server: ProxiedServer,
  url: string,
): Promise<string> {

  switch (server) {
    case "market": {
      // Verified users (valid phone in User-Data) are served ENTIRELY by
      // Laravel — the Go allow-list is bypassed for them. Guests/tokenless
      // visitors keep the URL-only routing below.
      const verified = await isVerifiedMarketUser();
      const useGo = !verified && isFromGoApi(url);
      if (process.env.NODE_ENV !== "production")
        console.log("[MarketRouting]", {
          source: "proxy",
          url,
          verified,
          backend: useGo ? "go" : "laravel",
        });
      if (useGo) return process.env.GO_BACKEND_URL || "";
      return process.env.BACKEND_URL || "";
    }
    case "market-dashboard": {
      // URL-only routing, unchanged — the user-based rule is market-only.
      if (isFromGoApi(url)) return process.env.GO_BACKEND_URL || "";
      return process.env.BACKEND_URL || "";
    }
    case "elastic":
      return process.env.ELASTIC_BACKEND_URL || "";
    case "chat":
      return process.env.NEXT_PUBLIC_CHAT_BACKEND_URL || "";
    case "stories":
      return process.env.STORIES_BACKEND_URL || "";
    case "comments":
      return process.env.COMMENT_BACKEND_URL || "";
    case "wallet":
      return process.env.WALLET_BACKEND_URL || "";
    default:
      throw new Error(`Unknown server type: ${server}`);
  }
}

// ---------- Token Resolution ----------

async function getTokenForServer(server: ProxiedServer): Promise<string> {
  const cookieStore = await cookies();

  switch (server) {
    case "wallet":
      return cookieStore.get(COOKIE_NAMES.WALLET_TOKEN)?.value || "";
    case "comments":
      return cookieStore.get(COOKIE_NAMES.USER_ID_HASH)?.value || "";
    case "chat":
      // Auth from the dedicated CHAT_TOKEN cookie (48h). It is refreshed on
      // re-auth by /api/auth/update-user; USER_CHAT holds profile data only.
      return cookieStore.get(COOKIE_NAMES.CHAT_TOKEN)?.value || "";
    case "market":
    case "market-dashboard":
      // Single auth cookie: MARKET_TOKEN holds the guest OR logged-in JWT.
      // DEVICE_TOKEN is legacy and is never read (kept only in the cleanup lists).
      return cookieStore.get(COOKIE_NAMES.MARKET_TOKEN)?.value || "";
    case "stories":
      // Auth from the dedicated STORIES_TOKEN cookie (48h). Refreshed on re-auth
      // by /api/auth/update-user; USER_STORIES holds profile data only.
      return cookieStore.get(COOKIE_NAMES.STORIES_TOKEN)?.value || "";
    case "elastic":
      return "";
    default:
      return "";
  }
}

// ---------- Secure Cookie Operations ----------

async function setSecureCookie(
  name: string,
  value: string,
  options: typeof SECURE_COOKIE_OPTIONS = SECURE_COOKIE_OPTIONS,
) {
  const cookieStore = await cookies();
  cookieStore.set({ name, value, ...options });
}

async function setSecureCookieJSON(name: string, value: unknown) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  // User-data cookies stay 1 year (SECURE_USER_COOKIE_OPTIONS), not the 48h token TTL.
  await setSecureCookie(
    name,
    encodeURIComponent(serialized),
    SECURE_USER_COOKIE_OPTIONS,
  );
}

async function deleteSecureCookie(name: string) {
  const cookieStore = await cookies();
  cookieStore.delete(name);
}

async function getSecureCookie<T = string>(name: string): Promise<T | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(name)?.value;
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    return JSON.parse(decoded) as T;
  } catch {
    return raw as T;
  }
}

// ---------- User Data (sanitized for client) ----------

async function getCurrentUser() {
  const cookieStore = await cookies();
  const [userData, userChat, userStories, walletUser] = await Promise.all([
    getSecureCookie(COOKIE_NAMES.USER_DATA),
    getSecureCookie(COOKIE_NAMES.USER_CHAT),
    getSecureCookie(COOKIE_NAMES.USER_STORIES),
    getSecureCookie(COOKIE_NAMES.WALLET_USER),
  ]);

  return {
    user: sanitizeUserData(userData),
    chatUser: sanitizeServiceUser(userChat),
    storiesUser: sanitizeServiceUser(userStories),
    walletUser: sanitizeWalletUser(walletUser),
    isAuthenticated: Boolean(userData),
    hasMarketToken: Boolean(cookieStore.get(COOKIE_NAMES.MARKET_TOKEN)?.value),
  };
}

// Strip tokens and sensitive fields before sending to client
function sanitizeUserData(data: any) {
  if (!data) return null;
  const { token, access_token, id_token, ...safe } = data;
  return safe;
}

function sanitizeServiceUser(data: any) {
  if (!data) return null;
  const { access_token, token, ...safe } = data;
  return safe;
}

// Strip internal / PII wallet fields before exposing walletUser to the client
// (or persisting it in the WALLET_USER cookie). Denylist rather than allowlist:
// keeps functional fields (id, names, phone, balance/currency) working while
// removing the sensitive internals flagged in the security review — the only
// live client read on this object is `id` (checkWallet). SECURITY-REVIEW: this
// is a cookie/response-shape change; confirm no client feature needs these.
function sanitizeWalletUser(data: any) {
  if (!data) return null;
  const {
    email,
    isBlocked,
    isTwoFactorEnabled,
    kycVerification,
    kycStatus,
    sessionId,
    ...safe
  } = data;
  return safe;
}

// ---------- Proxy Headers ----------

async function buildProxyHeaders(
  server: ProxiedServer,
  country: string,
  language: string,
  sellerId?: string,
): Promise<Record<string, string>> {
  const token = await getTokenForServer(server);
  const userChat = await getSecureCookie<any>(COOKIE_NAMES.USER_CHAT);

  const headers: Record<string, string> = {
    accept: "application/json",
    lang: language,
    "Accept-Language": language,
    "x-lang": language,
    country: country,
    countryCode: country?.toUpperCase(),
    current_role_id: userChat?.role_id || "-1",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (sellerId) {
    headers["X-Seller-ID"] = sellerId;
  }

  return headers;
}

// ---------- Logging (Token-safe) ----------

function maskToken(token: string): string {
  if (!token || token.length < 12) return "***";
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

async function logSecureRequest(info: {
  server: string;
  url: string;
  method: string;
  status: number;
  error?: unknown;
}) {
  const { server, url, method, status, error } = info;
  const token = await getTokenForServer(server as ProxiedServer).catch(
    () => "",
  );

  const logEntry = {
    type: "proxy-request",
    server,
    url,
    method,
    status,
    tokenPresent: Boolean(token),
    tokenHint: maskToken(token),
    timestamp: new Date().toISOString(),
  };

  if (error) {
    await LogServerError({ ...logEntry, error });
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[Proxy]", JSON.stringify(logEntry));
  }
}

// ---------- Validation ----------

function isAllowedServer(server: string): server is ProxiedServer {
  return ALLOWED_SERVERS.includes(server as ProxiedServer);
}

// ---------- Exports ----------

export {
  getTokenForServer,
  getServerBaseUrl,
  setSecureCookie,
  setSecureCookieJSON,
  deleteSecureCookie,
  getSecureCookie,
  getCurrentUser,
  buildProxyHeaders,
  logSecureRequest,
  isAllowedServer,
  maskToken,
  sanitizeUserData,
  sanitizeServiceUser,
  sanitizeWalletUser,
  SECURE_COOKIE_OPTIONS,
  SECURE_COOKIE_NAMES,
  ALLOWED_SERVERS,
};

export type { ProxiedServer };
