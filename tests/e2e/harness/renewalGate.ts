// Do not leave a page while it is renewing its own credential.
//
// ---------------------------------------------------------------------------
// What goes wrong without this
//
// Access tokens on staging live 60 seconds; refresh tokens live two days and
// are **single-use**. So a signed-in page that is more than a minute old meets
// a 401 on its next call, and the app recovers it on its own: `fetchData` posts
// `/api/auth/refresh`, the backend rotates the pair, and the answer's
// `Set-Cookie` puts the new pair in the jar.
//
// The backend spends the old refresh token **before** the browser has the new
// one. If the page navigates in that gap, the browser cancels the fetch, the
// `Set-Cookie` never lands, and the jar keeps a refresh token the backend has
// already spent. The next page load gets a 401, its exchange is refused, and the
// app registers a guest — which deletes every sub-service cookie.
//
// CI run 35795729846 did exactly that. `CMT-07` passed at 23:16:43.99 while its
// page was still inside an exchange (the backend answered it at 44.27), and
// `CMT-08` sent the same page to the product address straight away. From then
// on the shopper was a guest, and `CMT-08` reported the comments delete going
// out "with no comments token".
//
// A shopper does not click a link within milliseconds of a page settling, so
// the suite waits for what a person waits for without thinking about it: the
// page's own renewal to finish. The app is not changed and nothing is hidden —
// a renewal that never finishes still fails, and names itself.
//
// This file depends only on `@playwright/test`, like the rest of `harness/`.

import { test, type BrowserContext, type Page, type Request } from "@playwright/test";

/** The same-origin routes that rotate or replace the credential. */
const RENEWAL_ROUTES = new Set(["/api/auth/refresh", "/api/auth/expire"]);

/** How long the page must stay quiet after a renewal ends or a call is refused.
 *
 *  A refused call starts its renewal a few milliseconds later, after
 *  `fetchData` has read the answer. One second covers that gap on a loaded CI
 *  runner many times over. */
const QUIET_MS = 1_000;

/** How long a renewal may run before the wait gives up and says so. */
const RENEWAL_MS = 20_000;

/** How long after a page loads before the page counts as started.
 *
 *  **A renewal cannot be waited for before it has begun.** A page opened from
 *  a saved session whose access token has aged out meets its first 401 only
 *  when the app, started in the browser, sends its first authed call. Until
 *  then nothing is open and nothing was refused, so a gate that only asked
 *  "is a renewal running?" said no and let the case navigate.
 *
 *  CI run 36395039292 did exactly that. `SCRIPT-26` opened the QA seller's
 *  saved session on `/about` and went straight to the dashboard. The app's
 *  first calls were refused 0.4 s after the first proxied answer, its refresh
 *  got 200 from the backend 2 s later, and the navigation had already
 *  cancelled that answer. The old refresh token was spent, the browser never
 *  got the new pair, the next refresh was refused, and Shopper B became a
 *  guest — for every later case that opened the same saved session (the
 *  seller dashboard, the seller stories, the chat's B side). */
const STARTED_MS = 1_500;

type RenewalState = {
  open: Set<Request>;
  /** When the last renewal ended, or a proxied call answered 401. */
  lastActivityAt: number;
  /** Calls to `/api/proxy` still in flight. A refused one is where a renewal
   *  begins, so none may be in the air when the page is left. */
  proxied: Set<Request>;
  /** When a proxied call last started or ended. */
  lastProxiedAt: number;
  /** When a page of this context last finished loading. */
  lastLoadAt: number;
};

const renewals = new WeakMap<BrowserContext, RenewalState>();

/** When each watched request started. */
const startedAt = new WeakMap<Request, number>();

/** The page a request came from, or `null` for one with no page behind it (a
 *  service worker's). */
const pageOf = (request: Request): Page | null => {
  try {
    return request.frame().page();
  } catch {
    return null;
  }
};

/** Say a renewal was cut off, in the log and on the running case. */
const reportCancelled = (line: string): void => {
  console.log(`[e2e] ${line}`);
  try {
    test.info().annotations.push({ type: "renewal cancelled", description: line });
  } catch {
    // No case is running (a hook or teardown): the log line is the record.
  }
};

const pathOf = (request: Request): string => {
  try {
    return new URL(request.url()).pathname;
  } catch {
    return "";
  }
};

/** Start watching. Called once, by `newLiveContext`, before any page exists. */
export const watchRenewals = (context: BrowserContext): void => {
  const state: RenewalState = {
    open: new Set(),
    lastActivityAt: 0,
    proxied: new Set(),
    lastProxiedAt: 0,
    lastLoadAt: 0,
  };
  renewals.set(context, state);

  // When each page last started loading a new document.
  const navigationStartedAt = new WeakMap<Page, number>();

  context.on("request", (request) => {
    const path = pathOf(request);
    startedAt.set(request, Date.now());
    if (RENEWAL_ROUTES.has(path)) state.open.add(request);
    if (path === "/api/proxy") {
      state.proxied.add(request);
      state.lastProxiedAt = Date.now();
    }
    if (request.isNavigationRequest() && request.frame().parentFrame() === null) {
      const page = pageOf(request);
      if (page) navigationStartedAt.set(page, Date.now());
    }
  });

  // **A new document ends every call the old one had in flight, and Playwright
  // does not say so.** Measured on 2026-09-29: a `fetch` to `/api/auth/refresh`
  // cut off by `page.reload()` or `page.goto()` gets neither `requestfinished`
  // nor `requestfailed`. So it stayed in `open` for good, and the next wait on
  // that page spent 20 s and blamed a renewal that was no longer running (CI
  // run 36620489226, CMT-07). The calls are dropped when the new document has
  // loaded, and only those that started before its navigation did — a
  // client-side navigation (`pushState`) loads no document and ends nothing.
  //
  // A dropped renewal is written down: if the backend had already exchanged
  // the token, the new pair never reached the jar, and the shopper is about to
  // become a guest. The step that navigated is the one to fix.
  const dropCallsOfOldDocument = (page: Page): void => {
    const since = navigationStartedAt.get(page);
    if (since === undefined) return;
    const older = (request: Request): boolean =>
      pageOf(request) === page && (startedAt.get(request) ?? 0) < since;
    for (const request of [...state.open]) {
      if (!older(request)) continue;
      state.open.delete(request);
      state.lastActivityAt = Date.now();
      reportCancelled(
        `a page load cut off ${pathOf(request)} while it was in flight ` +
          `(it started ${since - (startedAt.get(request) ?? since)} ms before the navigation). ` +
          "If the backend had already exchanged the token, the new pair never " +
          "reached the jar and the session will end as a guest — the step that " +
          "navigated did not wait for the renewal (waitForRenewalSettled).",
      );
    }
    for (const request of [...state.proxied]) {
      if (older(request)) state.proxied.delete(request);
    }
  };

  context.on("page", (page) => {
    page.on("domcontentloaded", () => dropCallsOfOldDocument(page));
    page.on("load", () => {
      state.lastLoadAt = Date.now();
    });
  });

  const ended = (request: Request): void => {
    if (state.proxied.delete(request)) state.lastProxiedAt = Date.now();
    if (!state.open.delete(request)) return;
    state.lastActivityAt = Date.now();
  };
  context.on("requestfinished", ended);
  context.on("requestfailed", ended);

  // A refused proxied call is where a renewal begins. It is noted so the quiet
  // window starts from the refusal, not from before it.
  context.on("response", (response) => {
    if (response.status() !== 401) return;
    if (pathOf(response.request()) !== "/api/proxy") return;
    state.lastActivityAt = Date.now();
  });
};

/** Wait until the page is not renewing its credential, then return.
 *
 *  Call it before a `page.goto` on a page that has already been signed in and
 *  has been showing the app. It returns once the page has been loaded for
 *  `STARTED_MS`, no renewal and no proxied call is in flight, and nothing has
 *  happened for `QUIET_MS`. Throws — naming the route — if a renewal is still
 *  running after `RENEWAL_MS`, because leaving then would spend the session. */
export const waitForRenewalSettled = async (page: Page): Promise<void> => {
  const state = renewals.get(page.context());
  // A context not built by `newLiveContext` has nothing recorded, so there is
  // nothing to wait for.
  if (!state) return;

  const deadline = Date.now() + RENEWAL_MS;
  while (Date.now() < deadline) {
    const now = Date.now();
    const quietFor = now - Math.max(state.lastActivityAt, state.lastProxiedAt);
    const started = now - state.lastLoadAt >= STARTED_MS;
    if (
      started &&
      state.open.size === 0 &&
      state.proxied.size === 0 &&
      quietFor >= QUIET_MS
    ) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (state.open.size > 0) {
    const routes = [...state.open].map(pathOf).join(", ");
    throw new Error(
      `the page was still renewing its credential (${routes}) ` +
        `${RENEWAL_MS / 1000} s later. Leaving now would cancel the answer ` +
        "that carries the new token pair, after the backend has already spent " +
        "the old refresh token, so the session would end as a guest. The " +
        "renewal itself is what hangs — look at /api/auth/refresh on the " +
        "market backend",
    );
  }
  // Only the quiet window was never reached: calls kept being made or refused
  // for the whole wait, or one proxied call is simply slow. No renewal is in
  // flight to lose, so the case goes on and reports whatever those calls break.
};
