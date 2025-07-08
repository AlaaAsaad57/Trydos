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

/**
 * Set cookie value (server-side)
 */
export async function setCookieServer(
  name: string,
  value: any,
  options?: CookieOptions
): Promise<void> {
  if (!isServer()) {
    throw new Error("setCookieServer can only be used on the server");
  }

  if (!cookies) {
    throw new Error(
      "setCookieServer requires next/headers cookies - use setCookieMiddleware for middleware"
    );
  }

  try {
    const cookieStore = await cookies();
    const serializedValue = serialize(value);

    cookieStore.set(name, serializedValue, {
      ...DEFAULT_OPTIONS,
      ...options,
    });
  } catch (error) {
    throw new Error(`Failed to set cookie: ${error.message}`);
  }
}

/**
 * Delete cookie (server-side)
 */
export async function deleteCookieServer(name: string): Promise<void> {
  if (!isServer()) {
    throw new Error("deleteCookieServer can only be used on the server");
  }

  if (!cookies) {
    throw new Error(
      "deleteCookieServer requires next/headers cookies - use deleteCookieMiddleware for middleware"
    );
  }

  try {
    const cookieStore = await cookies();
    cookieStore.delete(name);
  } catch (error) {
    throw new Error(`Failed to delete cookie: ${error.message}`);
  }
}

// ====== MIDDLEWARE METHODS ======

/**
 * Get cookie value from middleware request
 */
export function getCookieMiddleware<T = string>(
  request: any,
  name: string
): T | null {
  try {
    const cookieValue = request.cookies.get(name)?.value;
    if (!cookieValue) return null;
    return deserialize<T>(cookieValue);
  } catch {
    return null;
  }
}

/**
 * Set cookie value in middleware response
 */
export function setCookieMiddleware(
  response: any,
  name: string,
  value: any,
  options?: CookieOptions
): void {
  try {
    const serializedValue = serialize(value);
    const cookieOptions = { ...DEFAULT_OPTIONS, ...options };

    response.cookies.set(name, serializedValue, cookieOptions);
  } catch (error) {
    console.error(`Failed to set cookie in middleware: ${error.message}`);
  }
}

/**
 * Delete cookie in middleware response
 */
export function deleteCookieMiddleware(response: any, name: string): void {
  try {
    response.cookies.set(name, "", { maxAge: -1 });
  } catch (error) {
    console.error(`Failed to delete cookie in middleware: ${error.message}`);
  }
}

// ====== CLIENT-SIDE METHODS ======

/**
 * Get cookie value (client-side)
 */
export function getCookie<T = string>(name: string): T | null {
  if (isServer()) {
    throw new Error(
      "getCookie can only be used on the client. Use getCookieServer instead."
    );
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

// ====== UNIVERSAL METHODS ======

/**
 * Universal cookie getter that works on both client and server
 */
export async function getCookieUniversal<T = string>(
  name: string,
  context?: { cookies?: () => Promise<any> }
): Promise<T | null> {
  if (isServer()) {
    // Use provided context or default to Next.js cookies
    if (context?.cookies) {
      const cookieStore = await context.cookies();
      const cookie = cookieStore.get(name);
      return cookie?.value ? deserialize<T>(cookie.value) : null;
    }
    return getCookieServer<T>(name);
  } else {
    return Promise.resolve(getCookie<T>(name));
  }
}

// ====== MIGRATION HELPERS ======

/**
 * Migrate data from localStorage to cookies
 */
export function migrateFromLocalStorage(
  key: string,
  cookieName?: string
): void {
  if (isServer()) return;

  const targetName = cookieName || key;
  const value = localStorage.getItem(key);

  if (value && !getCookie(targetName)) {
    try {
      const parsed = JSON.parse(value);
      setCookie(targetName, parsed);
    } catch {
      setCookie(targetName, value);
    }
  }
}

/**
 * Get auth tokens from cookies
 */
export async function getAuthTokens() {
  if (isServer()) {
    const [
      deviceToken,
      marketToken,
      userData,
      chatToken,
      storiesToken,
      userChat,
      userStories,
    ] = await Promise.all([
      getCookieServer<string>(COOKIE_NAMES.DEVICE_TOKEN),
      getCookieServer<string>(COOKIE_NAMES.MARKET_TOKEN),
      getCookieServer<UserData>(COOKIE_NAMES.USER_DATA),
      getCookieServer<string>(COOKIE_NAMES.CHAT_TOKEN),
      getCookieServer<string>(COOKIE_NAMES.STORIES_TOKEN),
      getCookieServer<UserData>(COOKIE_NAMES.USER_CHAT),
      getCookieServer<UserData>(COOKIE_NAMES.USER_STORIES),
    ]);

    return {
      deviceToken,
      marketToken: marketToken || deviceToken,
      userData,
      isAuthenticated: !!marketToken,
      isGuest: !marketToken && !!deviceToken,
      chatToken,
      storiesToken,
      userChat,
      userStories,
    };
  } else {
    const deviceToken = getCookie<string>(COOKIE_NAMES.DEVICE_TOKEN);
    const marketToken = getCookie<string>(COOKIE_NAMES.MARKET_TOKEN);
    const userData = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
    const chatToken = getCookie<string>(COOKIE_NAMES.CHAT_TOKEN);
    const storiesToken = getCookie<string>(COOKIE_NAMES.STORIES_TOKEN);
    const userChat = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
    const userStories = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);

    return {
      deviceToken,
      marketToken: marketToken || deviceToken,
      userData,
      isAuthenticated: !!marketToken,
      isGuest: !marketToken && !!deviceToken,
      chatToken,
      storiesToken,
      userChat,
      userStories,
    };
  }
}
