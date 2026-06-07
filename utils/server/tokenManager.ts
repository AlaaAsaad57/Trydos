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

const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
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

// All cookie names that hold sensitive tokens — must be HttpOnly
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
  "/home/currency",
  "/web/home/startingSettings",
  "/checklist",
  "/cart/add",
];
// ---------- Server URL Resolution ----------
const isFromGoApi = (url: string) =>
  GO_APIS.some((endpoint) => url.startsWith(endpoint));
function getServerBaseUrl(server: ProxiedServer, url: string): string {
  console.log(url, isFromGoApi(url));
  switch (server) {
    case "market":
    case "market-dashboard": {
      if (isFromGoApi(url)) return process.env.NEXT_PUBLIC_GO_BACKEND_URL || "";
      return process.env.NEXT_PUBLIC_BACKEND_URL || "";
    }
    case "elastic":
      return process.env.NEXT_PUBLIC_ELASTIC_BACKEND_URL || "";
    case "chat":
      return process.env.NEXT_PUBLIC_CHAT_BACKEND_URL || "";
    case "stories":
      return process.env.NEXT_PUBLIC_STORIES_BACKEND_URL || "";
    case "comments":
      return process.env.NEXT_PUBLIC_COMMENT_BACKEND_URL || "";
    case "wallet":
      return process.env.NEXT_PUBLIC_WALLET_BACKEND_URL || "";
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
    case "chat": {
      // Prefer access_token from USER_CHAT (updated by loginChat re-auth)
      // Fall back to standalone CHAT_TOKEN (set at initial login)
      const chatUser = await getSecureCookie<any>(COOKIE_NAMES.USER_CHAT);
      return (
        chatUser?.access_token ||
        cookieStore.get(COOKIE_NAMES.CHAT_TOKEN)?.value ||
        ""
      );
    }
    case "market":
    case "market-dashboard":
      return (
        cookieStore.get(COOKIE_NAMES.MARKET_TOKEN)?.value ||
        cookieStore.get(COOKIE_NAMES.DEVICE_TOKEN)?.value ||
        ""
      );
    case "stories": {
      // Prefer access_token from USER_STORIES (updated by loginStories re-auth)
      // Fall back to standalone STORIES_TOKEN (set at initial login)
      const storiesUser = await getSecureCookie<any>(COOKIE_NAMES.USER_STORIES);
      return (
        storiesUser?.access_token ||
        cookieStore.get(COOKIE_NAMES.STORIES_TOKEN)?.value ||
        ""
      );
    }
    case "elastic":
      return "";
    default:
      return "";
  }
}

// ---------- Secure Cookie Operations ----------

async function setSecureCookie(name: string, value: string) {
  const cookieStore = await cookies();
  cookieStore.set({ name, value, ...SECURE_COOKIE_OPTIONS });
}

async function setSecureCookieJSON(name: string, value: unknown) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  await setSecureCookie(name, encodeURIComponent(serialized));
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
    walletUser,
    isAuthenticated: Boolean(userData),
    hasDeviceToken: Boolean(cookieStore.get(COOKIE_NAMES.DEVICE_TOKEN)?.value),
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
  SECURE_COOKIE_OPTIONS,
  SECURE_COOKIE_NAMES,
  ALLOWED_SERVERS,
};

export type { ProxiedServer };
