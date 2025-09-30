// Utility to store last 4 visited paths in a cookie, SSR/CSR-safe for Next.js App Router

export type LastPaths = string[];

const COOKIE_NAME = "last_paths";
const MAX_PATHS = 4;
// 30 days in seconds
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const isServer = typeof window === "undefined";

const safeParse = (value: string | undefined | null): LastPaths => {
  if (!value) return [];
  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed)
      ? (parsed.filter((p) => typeof p === "string") as string[])
      : [];
  } catch {
    return [];
  }
};

const serialize = (paths: LastPaths): string =>
  encodeURIComponent(JSON.stringify(paths));

const getCookieClient = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const c of cookies) {
    const [k, ...rest] = c.split("=");
    if (k === name) return rest.join("=");
  }
  return undefined;
};

const setCookieClient = (name: string, value: string): void => {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + MAX_AGE_SECONDS * 1000).toUTCString();
  document.cookie = `${name}=${value}; Path=/; Max-Age=${MAX_AGE_SECONDS}; Expires=${expires}; SameSite=Lax`;
};

const getCookieServer = (name: string): string | undefined => {
  try {
    // Lazy import to avoid bundling client with server only code
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { cookies } = require("next/headers");
    const store = cookies();
    return store.get(name)?.value;
  } catch {
    return undefined;
  }
};

const setCookieServer = (name: string, value: string): void => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { cookies } = require("next/headers");
    const store = cookies();
    store.set({
      name,
      value,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });
  } catch {
    // Ignore if cookies store not available (e.g., during some server contexts)
  }
};

const readLastPaths = (): LastPaths => {
  const raw = isServer
    ? getCookieServer(COOKIE_NAME)
    : getCookieClient(COOKIE_NAME);
  return safeParse(raw);
};

const writeLastPaths = (paths: LastPaths): void => {
  const value = serialize(paths);
  if (isServer) {
    setCookieServer(COOKIE_NAME, value);
    return;
  }
  setCookieClient(COOKIE_NAME, value);
};

export const storeLastPaths = (path: string): void => {
  if (!path || typeof path !== "string") return;
  const trimmed = path.trim();
  if (trimmed.length === 0) return;

  const current = readLastPaths();

  // Avoid duplicating consecutive same path
  if (current.length > 0 && current[current.length - 1] === trimmed) {
    return;
  }

  // De-duplicate if exists earlier in history, then push to the end (most recent)
  const without = current.filter((p) => p !== trimmed);
  without.push(trimmed);

  // Keep only the last MAX_PATHS entries
  const next = without.slice(-MAX_PATHS);
  writeLastPaths(next);
};

export const readStoredLastPaths = (): LastPaths => readLastPaths();
