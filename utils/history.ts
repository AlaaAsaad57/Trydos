import { readServerCookies } from "./cookies/server-cookie-fallback";

type LastPaths = string[];

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

const readLastPaths = async () => {
  // This module is reachable from client components, so it cannot import the
  // server cookie reader — see ./cookies/server-cookie-fallback for why, and
  // what it costs. It used to hold its own copy of that same workaround.
  const raw = isServer
    ? (await readServerCookies([COOKIE_NAME]))[0]
    : getCookieClient(COOKIE_NAME);
  return safeParse(raw);
};

// Writes only ever happen in the browser: the one caller is PathTracker, and it
// writes from an effect. There used to be a server half here, and it could not
// have worked — it used the request store without awaiting it, so every write
// threw into an empty catch. Removed rather than repaired: nothing on the
// server writes this cookie.
const writeLastPaths = (paths: LastPaths): void => {
  setCookieClient(COOKIE_NAME, serialize(paths));
};

export const storeLastPaths = async (path: string) => {
  if (!path || typeof path !== "string") return;
  const trimmed = path.trim();
  if (trimmed.length === 0) return;

  const current = await readLastPaths();

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

export const readStoredLastPaths = async () => await readLastPaths();
