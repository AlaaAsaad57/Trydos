// Ask again when Cloudflare answers for a backend that fell over.
//
// ---------------------------------------------------------------------------
// What it is for
//
// Every staging backend sits behind Cloudflare. A 52x answer is Cloudflare
// saying the backend itself failed: 520 "the backend sent back no proper
// answer", 521 "the backend is down", 522 "the backend did not answer in
// time", 523 "unreachable", 524 "timed out", 525–527 TLS faults. These come
// and go on staging. CI run 36395039292 lost WISH-06 to a single 520 on
// `POST /checklist` and CMT-02 to a single 520 on a translate call that
// answered 200 when it was asked again an hour later.
//
// So a case asks again, up to three more times inside 60 seconds, and only a
// backend that stays down turns the case red. A case that was rescued says so:
// every retry is written to the case's annotations and to the log, so a flaky
// backend stays visible without failing an unrelated journey.
//
// ---------------------------------------------------------------------------
// The price, decided by the owner on 2026-09-28
//
// **Writes are retried too.** A 520 does not say whether the backend did the
// work before it failed, so a retried write can be applied twice: a second
// order, a checklist toggle undone, a message sent twice. The owner chose that
// over the old rule ("reads may retry, writes never") for a stable suite.
// Read a retried write in the annotations before trusting what it left.
//
// What this cannot reach: calls the Next.js server makes itself while it
// renders a page, and the sign-in route's calls to each service. Those never
// pass through the browser.
//
// This file depends only on `@playwright/test` and `./env` and `./redact`.

import { test, type BrowserContext, type Route } from "@playwright/test";

import { BACKEND_ADDRESS_KEYS, envValue } from "./env";
import { redact } from "./redact";

/** Cloudflare's own answers for a backend that failed. */
const CLOUDFLARE_ORIGIN_ERRORS = new Set([520, 521, 522, 523, 524, 525, 526, 527]);

/** The waits before each retry: three retries, 35 s of waiting at most. */
const RETRY_WAITS_MS = [5_000, 10_000, 20_000];

/** No retry starts later than this after the first try. */
const RETRY_WINDOW_MS = 60_000;

/** The proxy's own 503 is a failed fetch between the app's server and the
 *  backend (`TypeError: fetch failed` — measured three times on 2026-09-27),
 *  the same kind of passing fault, so it is asked again as well. */
const PROXY_FAILED = 503;

/** The two ways the app itself calls its proxy (`utils/fetchData.ts`). */
const APP_CALLS = new Set(["fetch", "xhr"]);

/** Every backend origin the browser may call directly (chat, media, …). */
const backendOrigins = (): Set<string> => {
  const origins = new Set<string>();
  for (const key of [
    ...BACKEND_ADDRESS_KEYS,
    "NEXT_PUBLIC_MEDIA_SERVER_BASE_URL",
  ]) {
    const value = envValue(key);
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // Not an address; nothing to match.
    }
  }
  return origins;
};

/** The call as a person reads it: method and path, never the query string. */
const describe = (route: Route): string => {
  const request = route.request();
  const url = new URL(request.url());
  if (url.pathname === "/api/proxy") {
    const headers = request.headers();
    const target = decodeURI(headers["x-proxy-url"] ?? url.searchParams.get("u") ?? "");
    const method = (headers["x-proxy-method"] ?? request.method()).toUpperCase();
    return `${method} ${target.split("?")[0]} (through the app's proxy)`;
  }
  return `${request.method()} ${url.origin}${url.pathname}`;
};

/** Note a retry on the running case, and in the log. */
const report = (line: string): void => {
  const clean = redact(line);
  console.log(`[e2e] ${clean}`);
  try {
    test.info().annotations.push({ type: "backend retried", description: clean });
  } catch {
    // No case is running (a hook or teardown): the log line is the record.
  }
};

/** Has the page that made this call closed?
 *
 *  A call with no page behind it (a service worker's) cannot be asked, and
 *  answers no: not knowing is not a reason to drop a call. */
const pageIsGone = (route: Route): boolean => {
  try {
    return route.request().frame().page().isClosed();
  } catch {
    return false;
  }
};

/** What Playwright says when the page, its context or the held answer went
 *  away while a call was in hand. */
const GONE = /has been (closed|disposed)|context disposed/i;

/** Hand the answer to the page, unless the page is no longer there.
 *
 *  CI run 36416474747 lost "search finds products" and GUEST-48 here. Each
 *  case had finished and closed its context while a picture request was still
 *  held, and `route.fulfill` threw `Fetch response has been disposed`. An
 *  answer nobody is waiting for is not a failure. Anything else still throws. */
const handOver = async (route: Route, hand: () => Promise<void>): Promise<void> => {
  try {
    await hand();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (pageIsGone(route) || GONE.test(message)) return;
    throw error;
  }
};

/** Retry Cloudflare's backend failures for every call a context makes to a
 *  backend. Install once per context, before any page opens; routes that a
 *  case registers later (fakes, the closed-mode guard) still run first. */
export const retryUnstableBackends = async (
  context: BrowserContext,
): Promise<void> => {
  const origins = backendOrigins();
  const isBackendCall = (url: URL): boolean =>
    url.pathname === "/api/proxy" || origins.has(url.origin);

  await context.route(isBackendCall, async (route) => {
    const isProxy = new URL(route.request().url()).pathname === "/api/proxy";

    // A preload through the proxy is left alone. It is the browser's call, not
    // the app's: the app asks again with its own `fetch`, and that one is
    // retried below. On `127.0.0.1` the proxy refuses every preload with 503
    // (the call says `Origin: http://127.0.0.1:3100`, the app compares it with
    // `http://localhost:3100`), so retrying it held a call for 35 seconds on
    // every page, and the renewal gate waited 20 seconds for it before each
    // navigation of a signed-in page.
    if (isProxy && !APP_CALLS.has(route.request().resourceType())) {
      await handOver(route, () => route.continue());
      return;
    }

    const what = describe(route);
    const firstTryAt = Date.now();

    const unstable = (status: number): boolean =>
      CLOUDFLARE_ORIGIN_ERRORS.has(status) || (isProxy && status === PROXY_FAILED);

    for (let attempt = 0; ; attempt++) {
      const response = await route.fetch({ timeout: 60_000 }).catch(() => null);
      const status = response?.status() ?? 0;

      if (response && !unstable(status)) {
        if (attempt > 0) {
          report(`${what} answered ${status} on try ${attempt + 1}, after the earlier tries failed`);
        }
        await handOver(route, () => route.fulfill({ response }));
        return;
      }

      // The page closed while the call was in hand, which is also why the call
      // got no answer. Asking again would hold the route for up to 35 seconds
      // for nobody.
      if (pageIsGone(route)) {
        await handOver(route, () => route.abort("failed"));
        return;
      }

      const wait = RETRY_WAITS_MS[attempt];
      const late = Date.now() - firstTryAt + (wait ?? 0) > RETRY_WINDOW_MS;
      if (wait === undefined || late) {
        report(`${what} still failed after ${attempt + 1} tries (${status || "no answer"}); the case sees that answer`);
        await handOver(route, () =>
          response ? route.fulfill({ response }) : route.abort("failed"),
        );
        return;
      }

      report(`${what} answered ${status || "no answer"}; asking again in ${wait / 1000} s`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  });
};
