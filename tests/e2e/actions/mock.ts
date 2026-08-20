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

import type { Page, Route } from "@playwright/test";

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

const fulfill = async (route: Route, mock: MockResponse): Promise<void> => {
  const body =
    typeof mock.body === "string" ? mock.body : JSON.stringify(mock.body ?? {});

  await route.fulfill({
    status: mock.status ?? 200,
    contentType: "application/json",
    headers: mock.headers,
    body,
  });
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
): Promise<void> => {
  let index = 0;

  await page.route("**/api/proxy", async (route) => {
    const target = route.request().headers()["x-proxy-url"] ?? "";
    if (!target.includes(endpoint)) {
      await route.continue();
      return;
    }
    const mock = responses[index];
    if (!mock) {
      await route.continue();
      return;
    }
    index += 1;
    await fulfill(route, mock);
  });

  await page.route("**/api/auth/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (!pathname.includes(endpoint)) {
      await route.continue();
      return;
    }
    const mock = responses[index];
    if (!mock) {
      await route.continue();
      return;
    }
    index += 1;
    await fulfill(route, mock);
  });
};

/** Install fakes for this page. Anything not named is passed straight through.
 *
 *  Pass-through rather than "fail on an unmocked call" is deliberate: the page
 *  makes dozens of calls it does not care about, and blocking them would break
 *  the render instead of testing the branch. */
export const mockBackend = async (page: Page, map: MockMap): Promise<void> => {
  // Everything the client sends to an external backend.
  await page.route("**/api/proxy", async (route) => {
    const target = route.request().headers()["x-proxy-url"] ?? "";
    const key = matchKey(map, decodeURI(target));

    if (!key) {
      await route.continue();
      return;
    }

    await fulfill(route, map[key]);
  });

  // The app's own auth routes, which are same-origin and never go through the
  // proxy — `/api/auth/login`, `/refresh`, `/expire`, `/me`.
  await page.route("**/api/auth/**", async (route) => {
    const key = matchKey(map, new URL(route.request().url()).pathname);

    if (!key) {
      await route.continue();
      return;
    }

    await fulfill(route, map[key]);
  });
};
