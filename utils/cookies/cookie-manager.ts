import jwt from "jsonwebtoken";

let cookies: any;
try {
  if (typeof window === "undefined") {
    cookies = require("next/headers").cookies;
  }
} catch {
  // next/headers not available (e.g., in pages directory)
  cookies = null;
}

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

export interface UserData {
  id: number;
  name: string;
  phone: string;
  is_phone_verified: number;
  expired_at?: string;
  access_token?: string;
  image: string;
  [key: string]: any;
}

// Constants for cookie names
export const COOKIE_NAMES = {
  WALLET_USER: "WALLET_USER",
  WALLET_TOKEN: "WALLET_TOKEN",
  DEVICE_TOKEN: "DEVICE-TOKEN",
  USER_DATA: "User-Data",
  MARKET_TOKEN: "MARKET-TOKEN",
  CHAT_TOKEN: "CHAT-TOKEN",
  STORIES_TOKEN: "STORIES-TOKEN",
  USER_CHAT: "USER-CHAT",
  USER_STORIES: "USER-STORIES",
  COUNTRY: "country",
  LANG: "lang",
  lANGUAGE: "language",
  USER_ID_HASH:
    "x7k9m2p4q8r1s5t3u6v2w9y4z7a1b5c8d2e6f9g3h7j1k4l8m2n5p9q3r6s1t4u7v2w5x8y1z4a7b2c5d8e1f4g7h2j5k8l1m4n7o2p5q8r1s4t7u2v5w8x1y4z7", // Random gibberish name
} as const;

/**
 * Cookie names that are HttpOnly — tokens and user data.
 * Client-side code CANNOT read or write these.
 * Use /api/auth/me to read user data, /api/proxy to make authenticated requests.
 */
export const HTTPONLY_COOKIE_NAMES = new Set([
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
]);

// Default cookie options
const DEFAULT_OPTIONS: CookieOptions = {
  path: "/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 365 * 24 * 60 * 60, // 1 year
  httpOnly: false, // Allow client-side access by default
};

/**
 * Check if code is running on server
 */
function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * Serialize value for cookie storage
 */
function serialize(value: any): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Deserialize value from cookie storage
 */
function deserialize<T = any>(value: string): T {
  if (!value) return null as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

// ====== SERVER-SIDE METHODS ======

/**
 * Get cookie value (server-side)
 */
export async function getCookieServer<T = string>(
  name: string,
): Promise<T | null> {
  if (!isServer()) {
    console.warn("getCookieServer can only be used on the server");
  }

  if (!cookies) {
    console.warn("next/headers cookies not available");
    return null;
  }

  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(name);

    if (!cookie?.value) return null;
    const decoded = decodeURIComponent(cookie.value);
    return deserialize<T>(decoded);
  } catch (error) {
    console.warn("Failed to get cookie from server:", error);
    return null;
  }
}

// ====== MIDDLEWARE METHODS ======

/**
 * Get cookie value from middleware request
 */

/**
 * Set cookie value in middleware response
 */

/**
 * Delete cookie in middleware response
 */

// ====== CLIENT-SIDE METHODS ======

/**
 * Get cookie value (client-side)
 */
export function getCookie<T = string>(name: string): T | null {
  if (isServer()) {
    return null;
  }

  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];

  if (!value) return null;

  try {
    const decoded = decodeURIComponent(value);
    return deserialize<T>(decoded);
  } catch {
    return value as T;
  }
}

/**
 * Set cookie value (client-side)
 */
export function setCookie(
  name: string,
  value: any,
  options?: CookieOptions,
): void {
  if (isServer()) {
    throw new Error(
      "setCookie can only be used on the client. Use setCookieServer instead.",
    );
  }

  const serializedValue = serialize(value);
  const encodedValue = encodeURIComponent(serializedValue);

  const cookieOptions = { ...DEFAULT_OPTIONS, ...options };
  let cookieString = `${name}=${encodedValue}`;

  if (cookieOptions.maxAge) {
    cookieString += `; max-age=${cookieOptions.maxAge}`;
  }

  if (cookieOptions.expires) {
    cookieString += `; expires=${cookieOptions.expires.toUTCString()}`;
  }

  if (cookieOptions.path) {
    cookieString += `; path=${cookieOptions.path}`;
  }

  if (cookieOptions.domain) {
    cookieString += `; domain=${cookieOptions.domain}`;
  }

  if (cookieOptions.secure) {
    cookieString += "; secure";
  }

  if (cookieOptions.sameSite) {
    cookieString += `; samesite=${cookieOptions.sameSite}`;
  }

  document.cookie = cookieString;
}

/**
 * Delete cookie (client-side)
 */
export function deleteCookie(name: string): void {
  if (isServer()) {
    throw new Error(
      "deleteCookie can only be used on the client. Use deleteCookieServer instead.",
    );
  }

  setCookie(name, "", { maxAge: -1 });
}

/**
 * Store hashed user ID in cookie
 * Usage: storeHashedUserId(response.user.id)
 */
export function storeHashedUserId(userId: number | string): void {
  setCookie(COOKIE_NAMES.USER_ID_HASH, userId, {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
}

/**
 * Get and decode hashed user ID from cookie
 * Returns the hashed user ID if found, null otherwise
 * Usage: const hashedUserId = getHashedUserId()
 */
export function getHashedUserId(): string | null {
  const hashedId = getCookie<string>(COOKIE_NAMES.USER_ID_HASH);

  if (!hashedId) {
    return null;
  }

  // Return the full hash string for comparison
  return hashedId;
}

/**
 * Clear hashed user ID from cookie
 * Usage: clearHashedUserId() - typically called on logout
 */
export function clearHashedUserId(): void {
  deleteCookie(COOKIE_NAMES.USER_ID_HASH);
}

export function setLocaizationCookies(country: string, language: string): void {
  if (country) {
    setCookie(COOKIE_NAMES.COUNTRY, country, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: false,
    });
  }
  if (language) {
    setCookie(COOKIE_NAMES.LANG, language, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: false,
    });
    setCookie(COOKIE_NAMES.lANGUAGE, language, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: false,
    });
  }
}
