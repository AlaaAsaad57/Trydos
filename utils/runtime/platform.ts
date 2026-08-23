/**
 * Hosting-platform adapters: read the caller's IP and country without binding
 * the app to one host.
 *
 * This module has NO imports on purpose. It is used by `proxy.ts`, which runs
 * as Edge middleware on every request, so anything it pulls in is paid for on
 * every request and must be Edge-safe. It previously imported `ipAddress` from
 * `@vercel/functions`, which ties the request path to a single host.
 *
 * Naming note (CLAUDE.md, "Stack-agnostic naming"): the exported functions are
 * named for the ROLE they play — the caller's IP, the caller's country. The
 * literal header names below are platform-mandated wire values we do not
 * choose, the same exemption `next/*` imports get; they are never exported and
 * never reach the client.
 */

// Wire-format header names. We do not control these strings.
const IP_HEADERS = [
  "cf-connecting-ip", // set by Cloudflare, and authoritative when present
  "x-real-ip", // set by Vercel; what @vercel/functions' ipAddress() reads
] as const;

const COUNTRY_HEADERS = [
  "x-vercel-ip-country", // Vercel geo-IP
  "cf-ipcountry", // Cloudflare geo-IP
] as const;

type HeaderSource = { headers: { get(name: string): string | null } };

/**
 * The end user's IP address, or undefined when no proxy told us.
 *
 * Mirrors what `@vercel/functions`' `ipAddress()` did — a direct header read,
 * `x-forwarded-for` last and only its first entry (the entries after it are the
 * proxies the request passed through, not the client).
 */
export function getClientIp(req: HeaderSource): string | undefined {
  for (const header of IP_HEADERS) {
    const value = req.headers.get(header)?.trim();
    if (value) return value;
  }

  // `x-forwarded-for` is a comma-separated chain: client, proxy1, proxy2...
  const forwarded = req.headers.get("x-forwarded-for");
  const client = forwarded?.split(",")[0]?.trim();
  return client || undefined;
}

/**
 * The end user's country as a lowercase ISO-3166-1 alpha-2 code, or undefined
 * when the platform did not resolve one.
 *
 * Lowercased here because every caller in this app compares against lowercase
 * country slugs (the locale segment in the URL is lowercase).
 */
export function getGeoCountry(req: HeaderSource): string | undefined {
  for (const header of COUNTRY_HEADERS) {
    const value = req.headers.get(header)?.trim();
    if (value) return value.toLowerCase();
  }
  return undefined;
}

/**
 * True when running on the Cloudflare Workers runtime.
 *
 * Workers sets a fixed `navigator.userAgent`; this is the check Cloudflare
 * documents for runtime detection. Used to decide whether a backend client may
 * be cached across requests — see `serverRequests/radis/index.ts`.
 */
export function isWorkerRuntime(): boolean {
  return (
    typeof navigator !== "undefined" &&
    navigator.userAgent === "Cloudflare-Workers"
  );
}
