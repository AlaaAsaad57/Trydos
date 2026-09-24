// Which kind of server scope is running right now, and whether it may read a
// request cookie.
//
// WHY THIS EXISTS
//
// Under Cache Components, calling `cookies()` inside a `"use cache"` scope is
// not a harmless failure that a `try` can absorb. Next records the violation,
// prints `used \`cookies()\` inside "use cache"` and drops the route out of
// caching for that render (`NEXT_STATIC_GEN_BAILOUT`). The value never arrives
// AND the page loses its cache.
//
// That is reached on an error path, not a happy one. A cached reader such as
// `getCachedBoutiques` calls the Elasticsearch reader; when Elasticsearch is
// slow the reader's own `catch` calls `LogServerError`; that reports who the
// visitor was, which reads a cookie. So one slow search answer silently turns
// the cached homepage back into a dynamic render.
//
// `next build` does not catch it. The Next guide is explicit — see
// node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md:
// "the restriction follows the call stack: a helper the cached function calls
// that reads one of these fails the same way … On a dynamically rendered route
// this surfaces when the route runs, so it can pass `next build` and fail under
// `next start`."
//
// Catching the throw is therefore too late. The read has to not happen.

/** The scope kinds Next runs server work in, as far as this file cares.
 *
 *  `request` is an ordinary request. `private-cache` is `"use cache: private"`,
 *  which the same guide says MAY read cookies because its answer is kept only
 *  in that one browser. Everything else — `cache`, `unstable-cache`,
 *  `generate-static-params` and the prerender kinds — must not. */
const SCOPES_THAT_MAY_READ_COOKIES = ["request", "private-cache"];

/**
 * Whether a scope of this kind may read a request cookie.
 *
 * `null` means "could not tell", and answers yes on purpose. Both callers are
 * best-effort reporting; refusing whenever the scope is unknown would quietly
 * strip the visitor out of every error report, which is a worse bug than the
 * one this guards.
 */
export function scopeAllowsCookies(scopeType: string | null): boolean {
  if (!scopeType) return true;
  return SCOPES_THAT_MAY_READ_COOKIES.includes(scopeType);
}

/**
 * The kind of server scope running now, or `null` when it cannot be read.
 *
 * Reached by a bare `require`, for the same reason as the `next/headers` read
 * in ./server-cookie-fallback: the callers also live in the client graph, and a
 * static import of a `next/dist` path fails that build. Turbopack does not
 * follow this form, so it resolves on the server only.
 *
 * Nothing here can be reached by a test — the runner does not resolve that
 * path. `scopeAllowsCookies` above holds the whole decision for that reason,
 * and is a plain function of its argument.
 */
export function currentScopeType(): string | null {
  if (typeof window !== "undefined") return null;

  try {
    const { workUnitAsyncStorage } = require(
      "next/dist/server/app-render/work-unit-async-storage.external.js",
    );
    return workUnitAsyncStorage?.getStore?.()?.type ?? null;
  } catch {
    return null;
  }
}
