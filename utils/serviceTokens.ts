// Opaque service identifiers for the /api/proxy wire contract.
//
// Internal code keeps readable service names everywhere (`market`, `chat`, …);
// only the value that crosses the wire is opaque, so the browser never advertises
// which backend service it is addressing. The mapping is applied where the
// x-proxy-server header is set and reversed where the proxy reads it.
//
// This module is deliberately standalone and dependency-free. It must NOT import
// `next/headers` (or anything that transitively does): it is imported from client
// modules, and a server-only import here passes type checking and then fails the
// production build.
//
// The forward map necessarily ships to the browser — the client has to know which
// token to send — so this is obfuscation, not access control. It raises the cost
// of casual reconnaissance; it does not secure the proxy.

export const SERVICE_TOKENS = Object.freeze({
  market: "vv7qsd",
  "market-dashboard": "k2muhz",
  chat: "p9xtrb",
  stories: "dw4nge",
  elastic: "hs6ljc",
  comments: "tn3ykf",
  wallet: "ge8zpm",
} as const);

export type InternalServiceName = keyof typeof SERVICE_TOKENS;

// Reverse direction, built once at module scope: two constant-time object reads
// per request, no hashing or encoding on the hot path.
export const SERVICE_NAMES: Readonly<Record<string, InternalServiceName>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(SERVICE_TOKENS).map(([name, token]) => [token, name]),
    ) as Record<string, InternalServiceName>,
  );

/** Internal service name -> opaque wire token. Returns "" for unknown input. */
export function toServiceToken(name: string): string {
  return (SERVICE_TOKENS as Record<string, string>)[name] ?? "";
}

/** Opaque wire token -> internal service name. Returns "" for unknown input. */
export function fromServiceToken(token: string): string {
  return SERVICE_NAMES[token] ?? "";
}
