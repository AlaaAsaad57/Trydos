// @vitest-environment node

// A best-effort log line must never cost the page its cache.
//
// The chain this guards, seen in a real `next start` server log: a cached
// reader (`getCachedBoutiques`, a `"use cache"` scope) calls the Elasticsearch
// reader; Elasticsearch times out; the reader's `catch` calls `LogServerError`;
// that names the visitor by reading a cookie. Next then prints
//
//   Error: Route /[lang] used `cookies()` inside "use cache".
//   Error: ... code: 'NEXT_STATIC_GEN_BAILOUT'
//
// and the homepage renders dynamically for that request. See utils/cookies/
// server-scope.ts for why a `try` around the read cannot undo it.
//
// WHAT THESE CASES CAN AND CANNOT SEE. The cookie read and the scope read both
// go through a bare `require`, which the runner does not resolve — so no case
// here can watch `cookies()` itself. What they check instead is the whole of
// the decision: the rule that says which scopes may read (a plain function),
// and that the reader actually asks before it reads.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { scopeAllowsCookies } from "utils/cookies/server-scope";

const currentScopeType = vi.fn();

vi.mock("../../utils/cookies/server-scope", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../utils/cookies/server-scope")>()),
  currentScopeType: () => currentScopeType(),
}));

describe("which server scopes may read a request cookie", () => {
  it("allows an ordinary request", () => {
    expect(
      scopeAllowsCookies("request"),
      "an ordinary request was refused, so every error report loses the visitor",
    ).toBe(true);
  });

  it("allows a private cache, which keeps its answer in one browser", () => {
    expect(
      scopeAllowsCookies("private-cache"),
      '"use cache: private" may read cookies — Next\'s own guide says so',
    ).toBe(true);
  });

  it("refuses a shared cache scope", () => {
    expect(
      scopeAllowsCookies("cache"),
      'a "use cache" scope was allowed to read a cookie. Next drops the whole ' +
        "route out of caching when that happens, so an error log turns the " +
        "cached homepage into a dynamic render.",
    ).toBe(false);
  });

  it("refuses an unstable-cache scope", () => {
    expect(
      scopeAllowsCookies("unstable-cache"),
      "an unstable-cache scope was allowed to read a cookie, which bails the route out the same way",
    ).toBe(false);
  });

  it("refuses a prerender scope", () => {
    expect(
      scopeAllowsCookies("prerender"),
      "a prerender scope was allowed to read a cookie, which turns a static route dynamic",
    ).toBe(false);
  });

  it("allows the read when the scope cannot be determined", () => {
    // Best-effort reporting: an unknown scope must not empty every report.
    expect(
      scopeAllowsCookies(null),
      "an unknown scope refused instead of trying, which strips the visitor out of every report",
    ).toBe(true);
  });
});

describe("readServerCookies — does it ask before it reads?", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("asks which scope it is in before touching a cookie", async () => {
    currentScopeType.mockReturnValue("cache");
    const { readServerCookies } = await import(
      "utils/cookies/server-cookie-fallback"
    );

    await readServerCookies(["MARKET-TOKEN"]);

    expect(
      currentScopeType,
      "the cookie reader never asked which scope it was in, so it will read " +
        'inside "use cache" and bail the route out of caching',
    ).toHaveBeenCalled();
  });

  it("gives back a null per name when the scope refuses", async () => {
    currentScopeType.mockReturnValue("cache");
    const { readServerCookies } = await import(
      "utils/cookies/server-cookie-fallback"
    );

    expect(
      await readServerCookies(["MARKET-TOKEN", "User-Data"]),
      "a refused read must still answer one value per name asked for",
    ).toEqual([null, null]);
  });
});
