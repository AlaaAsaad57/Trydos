// Reading a request cookie from a module that is stuck in the client graph.
//
// PREFER `./server-cookie-manager`. Reach for this ONLY when the module is
// reachable from a client component, where importing next/headers fails the
// build — statically AND dynamically. Turbopack follows a dynamic import just
// the same; a build proved it.
//
// The `require` below is the one form the bundler does not follow, so
// next/headers never enters the client graph and resolves only on the server.
// Two costs come with it, and both are the reason this is a fallback:
//
//   1. Nothing here can be reached by a test — the runner does not provide that
//      `require`. Tests stand in for THIS module instead.
//   2. If the `require` fails, every value comes back null and says nothing.
//
// That is acceptable for best-effort reporting and nowhere else. Two modules
// need it today, and both are exactly that:
//
//   utils/serverErrorReporter.ts — the server failure report
//   utils/history.ts            — the recent-paths list that report carries
//
// The way out is to stop calling those two from client code, which is a bigger
// change than the one that introduced this file, and its own ticket.

import { currentScopeType, scopeAllowsCookies } from "./server-scope";

/**
 * Read cookies as they were stored — raw, still encoded. Callers decode and
 * parse, because they do not agree on how: one wants JSON, one wants a list.
 *
 * Returns a null for every name when there is no server request to read from,
 * and when the scope running is one that may not read a cookie at all.
 */
export async function readServerCookies(
  names: string[],
): Promise<(string | null)[]> {
  const nothing = names.map(() => null);
  if (typeof window !== "undefined") return nothing;

  // Ask before reading. Inside a `"use cache"` scope the read below does not
  // merely fail — Next drops the route out of caching for that render, so a
  // best-effort log line costs the page its cache. The `try` cannot undo that,
  // which is why this is a check and not a catch. See ./server-scope.
  if (!scopeAllowsCookies(currentScopeType())) return nothing;

  try {
    const { cookies } = require("next/headers");
    const store = await cookies();
    return names.map((name) => store.get(name)?.value ?? null);
  } catch {
    return nothing;
  }
}
