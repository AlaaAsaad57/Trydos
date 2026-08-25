// Faking a backend answer, for the branches staging cannot produce on demand.
//
// Signup with a new number, a wrong OTP, a 429, a 500, an out-of-stock product:
// all real branches, none of them something you can ask a shared staging shop to
// do at a chosen moment. So the browser's own call is intercepted instead.
//
// **Why one interception point covers nearly everything.** Every client-side
// call to a backend goes through `utils/fetchData.ts`, which POSTs to
// `/api/proxy` and names the real target in the `x-proxy-url` header. So one
// route handler sees all of it, and the header says which call it is. Responses
// are plain JSON — `x-need-decode` decodes the target URL, not the body.
//
// **What this cannot do, and it is not a small caveat.** `page.route()` runs in
// the browser. It cannot see a request the Node process made before the HTML
// arrived — anything through `serverRequests/HandleAuthedFetch.ts`, which is the
// first paint of the home page, the listing and the product page. So a scripted
// spec can change what happens after a click, never what the page was rendered
// with. That is also why scripted specs still need staging up, and still cannot
// gate a pull request.

import type { BrowserContext, Page, Route } from "@playwright/test";

import { envValue } from "../harness/env";

export type MockResponse = {
  status?: number;
  /** Serialised as JSON unless it is already a string. */
  body?: unknown;
  headers?: Record<string, string>;
};

/** Backend path (or any distinctive part of one) → the answer to give.
 *
 *  Matched by substring against `x-proxy-url`, so `/auth/verify` matches
 *  `/auth/verify` and `/auth/verify?x=1` alike. Longest key wins, so a specific
 *  route can override a general one. */
export type MockMap = Record<string, MockResponse>;

/** The headers a browser demands before it will read a cross-origin answer.
 *
 *  The media store is a different origin, and the upload carries `x-api-key` and
 *  `X-Upload-Ticket` — custom headers, so the browser sends a preflight first
 *  and then refuses to read the real answer unless it is allowed to.
 *
 *  This matters more than it looks. A fake without these makes `fetch` throw a
 *  CORS error, which is **not** the refusal the case is testing: the case would
 *  go green having proved the browser blocked its own request. */
const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "*",
};

/** What a case asks afterwards to prove its fake was actually used.
 *
 *  Without this there is no way to tell "the branch behaved as expected" from
 *  "the fake matched nothing, the real backend answered, and the case asserted
 *  the opposite of its own name". A fake that matches nothing is the one failure
 *  mode a faked test cannot notice by itself.
 *
 *  **Keys only, never targets.** The target of a faked verify carries the live
 *  one-time code in its query string, and a recorder is something a failure
 *  message prints. */
export type MockRecorder = {
  /** Did any request match this map key? */
  used: (key: string) => boolean;
  /** Every map key that matched, for a message that names what did fire. */
  usedKeys: () => string[];
};

/** The sequence helper's equivalent. "Which key matched" is meaningless there —
 *  it has exactly one endpoint — so what it reports is how far down the list of
 *  answers the app actually got. */
export type SequenceRecorder = {
  consumed: () => number;
  total: () => number;
};

const fulfill = async (
  route: Route,
  mock: MockResponse,
  options: { cors?: boolean } = {},
): Promise<void> => {
  const body =
    typeof mock.body === "string" ? mock.body : JSON.stringify(mock.body ?? {});

  await route.fulfill({
    status: mock.status ?? 200,
    contentType: "application/json",
    headers: options.cors ? { ...CORS_HEADERS, ...mock.headers } : mock.headers,
    body,
  });
};

/** Answer the browser's preflight so the real request is allowed to follow. */
const answerPreflight = async (route: Route): Promise<void> => {
  await route.fulfill({ status: 204, headers: CORS_HEADERS, body: "" });
};

/** Longest key first, so `/auth/verify/resend` beats `/auth/verify`. */
const matchKey = (map: MockMap, target: string): string | undefined =>
  Object.keys(map)
    .sort((a, b) => b.length - a.length)
    .find((key) => target.includes(key));

/** Install a handler that returns a sequence of responses for one endpoint.
 *
 *  Useful when a single real OTP send needs to exercise several verify
 *  branches: wrong code, rate limit, server error, and finally success. Each
 *  request to the named endpoint consumes the next response in the list. Once
 *  the list is exhausted the handler falls through to the real backend. */
export const mockBackendSequence = async (
  page: Page,
  endpoint: string,
  responses: Array<MockResponse>,
): Promise<SequenceRecorder> => {
  let index = 0;

  await page.route("**/api/proxy", async (route) => {
    const target = route.request().headers()["x-proxy-url"] ?? "";
    if (!target.includes(endpoint)) {
      await route.fallback();
      return;
    }
    const mock = responses[index];
    if (!mock) {
      await route.fallback();
      return;
    }
    index += 1;
    await fulfill(route, mock);
  });

  await page.route("**/api/auth/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (!pathname.includes(endpoint)) {
      await route.fallback();
      return;
    }
    const mock = responses[index];
    if (!mock) {
      await route.fallback();
      return;
    }
    index += 1;
    await fulfill(route, mock);
  });

  return { consumed: () => index, total: () => responses.length };
};

/** Install fakes for this page. Anything not named is passed straight through.
 *
 *  Pass-through rather than "fail on an unmocked call" is deliberate: the page
 *  makes dozens of calls it does not care about, and blocking them would break
 *  the render instead of testing the branch. */
export const mockBackend = async (
  page: Page,
  map: MockMap,
): Promise<MockRecorder> => {
  const matched = new Set<string>();

  const answer = async (
    route: Route,
    key: string | undefined,
    options: { cors?: boolean } = {},
  ): Promise<void> => {
    if (!key) {
      await route.fallback();
      return;
    }
    matched.add(key);
    await fulfill(route, map[key], options);
  };

  // Everything the client sends to an external backend.
  await page.route("**/api/proxy", async (route) => {
    const target = route.request().headers()["x-proxy-url"] ?? "";
    await answer(route, matchKey(map, decodeURI(target)));
  });

  // The app's own auth routes, which are same-origin and never go through the
  // proxy — `/api/auth/login`, `/refresh`, `/expire`, `/me`, `/update-user`.
  await page.route("**/api/auth/**", async (route) => {
    await answer(route, matchKey(map, new URL(route.request().url()).pathname));
  });

  // The upload ticket. Same-origin, and minted **before** the upload — so a
  // refusal here means the upload is never attempted, and a case asserting on a
  // refused upload would fail for the wrong reason.
  await page.route("**/api/ticket", async (route) => {
    await answer(route, matchKey(map, "/api/ticket"));
  });

  // The media store itself, which the browser reaches directly rather than
  // through the proxy. Cross-origin and preflighted — see CORS_HEADERS.
  await page.route("**/gated/upload", async (route) => {
    const key = matchKey(map, "/gated/upload");
    if (key && route.request().method() === "OPTIONS") {
      await answerPreflight(route);
      return;
    }
    await answer(route, key, { cors: true });
  });

  return {
    used: (key) => matched.has(key),
    usedKeys: () => [...matched],
  };
};
;

// ---------------------------------------------------------------------------
// Closed mode — a case that fakes answers blocks everything it did not name
//
// The default above is pass-through, and that is right for `auth.scripted`:
// those cases run as a guest and change nothing, so a call nobody thought about
// is harmless. It is the wrong default for a **signed-in** spec writing to a
// shared account, because there a call nobody thought about reaches real
// staging and nobody finds out.
//
// Four review rounds each found one more such call — the cookie mirror, the
// sign-out route, the token-clearing route, the profile read. Listing them was
// never going to converge; this inverts the default instead.
//
// **How it can work at all.** Both helpers above fall back rather than continue,
// so an unmatched call walks down to this handler instead of going to the
// network. A `page.route` outranks a `context.route` by level, whatever the
// registration order — which is exactly why this is a **context** route. Moving
// it to `page.route` would put it in front of the fakes and break every case.
// (Measured, not assumed: see `_specs/.../spike-runtime-facts.md`.)
//
// **What it cannot see.** Only what the browser sends. A server action posts to
// the page URL, and a page render happens in Node — neither is visible here at
// any pattern. That is the same boundary `page.route` already has for
// rendering, not a hole to be closed later.

/** Calls that change something despite being a GET.
 *
 *  A plain "reads may pass" rule is unsafe in this app: signing in is a **GET**
 *  that spends the one-time code and writes the whole cookie set. These are
 *  blocked like any other write. */
const MUTATING_GETS: readonly string[] = [
  "/api/auth/login", // spends the code, writes every cookie
  "/auth/phone/verify_otp", // spends a code
  "/return_requests/store",
  "/return_request_products/cancel",
  "/remove_image",
  "/received", // chat marks a channel read for this account
];

/** Writes that may pass, because they do not leave the browser's own app.
 *
 *  `/api/auth/me` is a POST that only reads, and blocking it makes the app
 *  register a fresh guest before a single assertion runs.
 *
 *  `/api/auth/update-user` is the app's own cookie mirror, which it posts after
 *  every leg **and every rollback leg**. Blocking it would end four cases naming
 *  this guard instead of the branch under test. It writes cookies in the context
 *  under test and reaches no backend, and no scripted case hands its session on,
 *  so what it touches dies with the context. */
const WRITES_THAT_MAY_PASS: readonly string[] = [
  "/api/auth/me",
  "/api/auth/update-user",
];

export type ClosedModeGuard = {
  /** Every route this guard refused, by path only — never a full address, which
   *  would carry the query string and with it the one-time code. */
  blocked: () => string[];
};

/** Refuse any browser call this case did not name, and remember what was refused.
 *
 *  **It aborts and records; it does not throw.** A throw inside a route handler
 *  is swallowed by Playwright and would fail nothing at all. And the assertion
 *  belongs at the **end** of the case, not here: aborting mid-flight pushes the
 *  app down its own error path, so a case that judged immediately could end
 *  green — or red — for a reason other than the one it names.
 *
 *  Install **before** the fakes. */
export const closeUnnamedCalls = async (
  context: BrowserContext,
): Promise<ClosedModeGuard> => {
  const refused: string[] = [];
  const mediaHost = envValue("NEXT_PUBLIC_MEDIA_SERVER_BASE_URL");

  const isGuarded = (url: URL): boolean =>
    url.pathname.startsWith("/api/proxy") ||
    url.pathname.startsWith("/api/auth/") ||
    url.pathname.startsWith("/api/ticket") ||
    (mediaHost !== "" && url.origin === new URL(mediaHost).origin);

  await context.route(isGuarded, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    // For a proxied call the app names its own verb in a header; for anything
    // else the request carries it. A verb that cannot be read is treated as a
    // write — failing closed is the whole point of this handler.
    const proxied = path.startsWith("/api/proxy");
    const target = proxied ? (request.headers()["x-proxy-url"] ?? "") : path;
    const verb = (
      proxied ? (request.headers()["x-proxy-method"] ?? "") : request.method()
    ).toUpperCase();

    const named = [...MUTATING_GETS, ...WRITES_THAT_MAY_PASS].find((entry) =>
      decodeURI(target).includes(entry),
    );

    const allowed =
      WRITES_THAT_MAY_PASS.includes(named ?? "") ||
      (verb === "GET" && named === undefined);

    if (allowed) {
      await route.fallback();
      return;
    }

    // Record the app's own path, not the proxy's, so the message names the call
    // the reader has to go and look at.
    refused.push(proxied ? decodeURI(target).split("?")[0] : path);
    await route.abort();
  });

  return { blocked: () => [...refused] };
};
