// Conditional import to avoid errors in pages directory
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
  [key: string]: any;
}

// Constants for cookie names
export const COOKIE_NAMES = {
  DEVICE_TOKEN: "DEVICE-TOKEN",
  USER_DATA: "User-Data",
  MARKET_TOKEN: "MARKET-TOKEN",
  CHAT_TOKEN: "CHAT-TOKEN",
  STORIES_TOKEN: "STORIES-TOKEN",
  USER_CHAT: "USER-CHAT",
  USER_STORIES: "USER-STORIES",
  COUNTRY: "country",
  LANG: "lang",
} as const;

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
  name: string
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
    return deserialize<T>(cookie.value);
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
  options?: CookieOptions
): void {
  if (isServer()) {
    throw new Error(
      "setCookie can only be used on the client. Use setCookieServer instead."
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
      "deleteCookie can only be used on the client. Use deleteCookieServer instead."
    );
  }

  setCookie(name, "", { maxAge: -1 });
}
